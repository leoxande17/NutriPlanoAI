-- ==========================================================
-- NutriPlano AI — hardening de segurança (advisor do Supabase)
-- ==========================================================

-- 1) set_updated_at tinha search_path mutável (risco de search_path hijacking)
alter function public.set_updated_at() set search_path = public;

-- 2) handle_new_user estava exposta como RPC pública em /rest/v1/rpc/handle_new_user.
-- Deve rodar apenas via trigger (on_auth_user_created), nunca ser chamada diretamente.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
