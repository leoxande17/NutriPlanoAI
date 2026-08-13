-- ==========================================================
-- NutriPlano AI — evolução do usuário (peso + medidas corporais)
-- ==========================================================

create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  recorded_at date not null default current_date,

  weight_kg numeric(5,2) not null,

  -- Medidas corporais (todas opcionais — nem todo mundo mede tudo sempre)
  waist_cm numeric(5,2),      -- cintura
  hip_cm numeric(5,2),        -- quadril
  chest_cm numeric(5,2),      -- peitoral
  arm_cm numeric(5,2),        -- braço
  thigh_cm numeric(5,2),      -- coxa
  body_fat_pct numeric(4,1),  -- % de gordura corporal

  notes text,

  created_at timestamptz not null default now()
);

create index progress_entries_user_id_recorded_at_idx
  on public.progress_entries(user_id, recorded_at desc);

alter table public.progress_entries enable row level security;

create policy "progress_entries_select_own" on public.progress_entries
  for select using (auth.uid() = user_id);
create policy "progress_entries_insert_own" on public.progress_entries
  for insert with check (auth.uid() = user_id);
create policy "progress_entries_update_own" on public.progress_entries
  for update using (auth.uid() = user_id);
create policy "progress_entries_delete_own" on public.progress_entries
  for delete using (auth.uid() = user_id);
