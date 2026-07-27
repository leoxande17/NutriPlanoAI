-- ==========================================================
-- NutriPlano AI — schema inicial
-- ==========================================================

-- Extensões necessárias
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------
create type public.goal_type as enum (
  'emagrecimento',
  'hipertrofia',
  'recomposicao',
  'manutencao'
);

create type public.activity_level as enum (
  'sedentario',
  'leve',
  'moderado',
  'intenso',
  'atleta'
);

create type public.payment_status as enum (
  'pending',
  'approved',
  'rejected',
  'refunded',
  'expired'
);

-- ----------------------------------------------------------
-- PROFILES
-- Espelha auth.users com dados públicos da aplicação
-- ----------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cria o profile automaticamente quando um usuário se cadastra
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------
-- ANAMNESIS
-- Respostas do questionário de anamnese (profundidade intermediária)
-- ----------------------------------------------------------
create table public.anamnesis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Dados corporais
  weight_kg numeric(5,2) not null,
  height_cm numeric(5,2) not null,
  age int not null,
  gender text not null, -- 'masculino' | 'feminino' | 'outro'

  -- Objetivo e atividade
  goal public.goal_type not null,
  activity_level public.activity_level not null,

  -- Rotina de treino
  trains boolean not null default false,
  training_days_per_week int,
  training_time text,        -- ex: '17:20'
  training_type text,        -- ex: 'musculação', 'corrida', 'crossfit'

  -- Refeições e preferências
  meals_per_day int not null default 5,
  food_preferences text,      -- alimentos que gosta / culinária preferida
  disliked_foods text,        -- alimentos que não quer no plano
  allergies text[],           -- lista de alergias
  dietary_restrictions text[],-- ex: vegetariano, low carb, sem lactose
  medical_conditions text,    -- condições relevantes (opcional, texto livre)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index anamnesis_user_id_idx on public.anamnesis(user_id);

-- ----------------------------------------------------------
-- PAYMENTS
-- Registro de pagamentos únicos via Mercado Pago
-- ----------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anamnesis_id uuid not null references public.anamnesis(id) on delete restrict,

  mp_payment_id text unique,       -- id retornado pelo Mercado Pago
  mp_preference_id text,           -- id da preference/checkout
  status public.payment_status not null default 'pending',
  amount numeric(10,2) not null,

  -- Janela de regenerações/ajustes liberada após aprovação (15 dias)
  approved_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments(user_id);
create index payments_mp_payment_id_idx on public.payments(mp_payment_id);

-- ----------------------------------------------------------
-- MEAL_PLANS
-- Planos alimentares gerados pela IA (Claude), com versionamento
-- ----------------------------------------------------------
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  anamnesis_id uuid not null references public.anamnesis(id) on delete restrict,

  version int not null default 1,       -- 1 = original, 2+ = regenerações/ajustes
  adjustment_note text,                 -- pedido de ajuste que gerou esta versão (se houver)
  content jsonb not null,               -- estrutura completa do plano retornada pela IA
  pdf_path text,                        -- caminho no Supabase Storage do PDF gerado

  created_at timestamptz not null default now()
);

create index meal_plans_user_id_idx on public.meal_plans(user_id);
create index meal_plans_payment_id_idx on public.meal_plans(payment_id);

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.anamnesis enable row level security;
alter table public.payments enable row level security;
alter table public.meal_plans enable row level security;

-- PROFILES: usuário só vê/edita o próprio registro
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ANAMNESIS: usuário só vê/gerencia os próprios registros
create policy "anamnesis_select_own" on public.anamnesis
  for select using (auth.uid() = user_id);
create policy "anamnesis_insert_own" on public.anamnesis
  for insert with check (auth.uid() = user_id);
create policy "anamnesis_update_own" on public.anamnesis
  for update using (auth.uid() = user_id);

-- PAYMENTS: usuário só vê os próprios pagamentos.
-- Inserção/atualização de status é feita pela Edge Function (service role),
-- por isso não há policy de insert/update para o usuário autenticado.
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

-- MEAL_PLANS: usuário só vê os próprios planos.
-- Criação/atualização acontece via Edge Function (service role).
create policy "meal_plans_select_own" on public.meal_plans
  for select using (auth.uid() = user_id);

-- ----------------------------------------------------------
-- Trigger genérica para manter updated_at em dia
-- ----------------------------------------------------------
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at_anamnesis before update on public.anamnesis
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at_payments before update on public.payments
  for each row execute procedure public.set_updated_at();
