-- ===========================================================================
-- 001_initial_schema
-- profiles / scenarios / simulation_results / audit_log のテーブル定義
-- ===========================================================================

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferences jsonb not null default '{}'::jsonb,
  default_scenario_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'ユーザープロフィール。auth.users.id を主キーとして参照';

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  version int not null default 1,
  inputs jsonb not null default '{}'::jsonb,
  extra_settings jsonb not null default '{}'::jsonb,
  parent_scenario_id uuid references public.scenarios(id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scenarios_user_id_idx on public.scenarios(user_id);
create index scenarios_parent_idx on public.scenarios(parent_scenario_id);
comment on table public.scenarios is 'ユーザーのライフプラン・シナリオ。inputs に全スライダー値を jsonb で保持';

create table public.simulation_results (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  result_type text not null,
  summary jsonb not null default '{}'::jsonb,
  time_series jsonb not null default '[]'::jsonb,
  engine_version text not null,
  computed_at timestamptz not null default now()
);
create index sim_results_scenario_idx on public.simulation_results(scenario_id);
create index sim_results_user_idx on public.simulation_results(user_id);
comment on table public.simulation_results is 'シミュレーション結果。result_type で cashflow/asset/loan などを区別';

create table public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index audit_log_user_idx on public.audit_log(user_id, created_at desc);
comment on table public.audit_log is '監査ログ。service_role からのみ書き込み';

alter table public.profiles
  add constraint profiles_default_scenario_fk
  foreign key (default_scenario_id) references public.scenarios(id) on delete set null;

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

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger scenarios_set_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();
