-- デモ用アカウント（8文字以上パスワード）
-- 実行場所: Supabase Dashboard > SQL Editor
-- 注意: auth.users へのユーザー作成自体は Dashboard か Admin API で行うこと。
--       このSQLは「既存Authユーザーを guest ロール化」するためのもの。

-- 0) 旧スキーマ対策: profiles に必要カラムが無ければ追加
alter table if exists public.profiles
  add column if not exists role text not null default 'member';

alter table if exists public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- 1) デモ用リスト（確認用）
with demo_accounts as (
  select *
  from (values
    ('a', 'a@a.com', '123456aa'),
    ('b', 'b@a.com', '123456bb'),
    ('c', 'c@a.com', '123456cc'),
    ('d', 'd@a.com', '123456dd')
  ) as t(username, email, password)
)
select * from demo_accounts;

-- 2) auth.users に存在するものを profiles=guest として upsert
with demo_accounts as (
  select *
  from (values
    ('a', 'a@a.com', '123456aa'),
    ('b', 'b@a.com', '123456bb'),
    ('c', 'c@a.com', '123456cc'),
    ('d', 'd@a.com', '123456dd')
  ) as t(username, email, password)
), existing_auth_users as (
  select u.id, u.email
  from auth.users u
  join demo_accounts d on d.email = u.email
)
insert into public.profiles (id, role)
select e.id, 'guest'
from existing_auth_users e
on conflict (id) do update
set role = excluded.role,
    updated_at = now();

-- 3) auth.users に未作成のメールを表示（先に Users で作る）
with demo_accounts as (
  select *
  from (values
    ('a', 'a@a.com', '123456aa'),
    ('b', 'b@a.com', '123456bb'),
    ('c', 'c@a.com', '123456cc'),
    ('d', 'd@a.com', '123456dd')
  ) as t(username, email, password)
)
select d.username, d.email
from demo_accounts d
left join auth.users u on u.email = d.email
where u.id is null
order by d.username;

-- 4) 最終確認
select u.email, p.role
from auth.users u
left join public.profiles p on p.id = u.id
where u.email in ('a@a.com', 'b@a.com', 'c@a.com', 'd@a.com')
order by u.email;
