-- ===========================================================================
-- 002_rls_policies
-- 全テーブルで RLS 有効化、自分のデータのみ操作可能
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.simulation_results enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "profiles_select_own"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "profiles_update_own"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "profiles_insert_self"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

-- scenarios
create policy "scenarios_select_own"
on public.scenarios for select to authenticated
using (user_id = (select auth.uid()));

create policy "scenarios_insert_own"
on public.scenarios for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "scenarios_update_own"
on public.scenarios for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "scenarios_delete_own"
on public.scenarios for delete to authenticated
using (user_id = (select auth.uid()));

-- simulation_results
create policy "results_select_own"
on public.simulation_results for select to authenticated
using (user_id = (select auth.uid()));

create policy "results_insert_own"
on public.simulation_results for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.scenarios s
    where s.id = scenario_id and s.user_id = (select auth.uid())
  )
);

create policy "results_delete_own"
on public.simulation_results for delete to authenticated
using (user_id = (select auth.uid()));

-- audit_log はポリシーを作成しない（デフォルト拒否）
-- service_role のみが書き込み可
