-- ===========================================================================
-- 004_security_hardening
-- Supabase Database Linter の警告に対応
-- ===========================================================================

-- set_updated_at: search_path を固定（既に 001 で適用済みだが再現性のため記載）
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user は SECURITY DEFINER なので、anon / authenticated から呼び出せないように EXECUTE 権限を剥奪
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_new_user() from public;
