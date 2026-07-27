-- ==========================================================
-- NutriPlano AI — integração Mercado Pago (API de Orders)
-- ==========================================================

-- Guarda o ID da order do Mercado Pago (ex: "ORD01...").
-- mp_payment_id passa a guardar o ID da transação de pagamento (ex: "PAY01...").
alter table public.payments
  add column mp_order_id text unique;

create index payments_mp_order_id_idx on public.payments(mp_order_id);

-- Valor fixo do plano (pagamento único). Mantido como default para
-- facilitar consultas, mas sempre gravado explicitamente na criação da order.
alter table public.payments
  alter column amount set default 29.90;
