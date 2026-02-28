-- MMA Wiki / Supabase 初期スキーマ
-- 実行場所: Supabase Dashboard > SQL Editor
-- このSQLは再実行できるように IF NOT EXISTS / DROP POLICY IF EXISTS を使用

create extension if not exists pgcrypto;

-- =====================================================
-- 1) profiles: auth.users を拡張するプロフィールテーブル
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('guest', 'member', 'admin'))
);

comment on table public.profiles is 'ユーザー拡張情報と権限ロール';
comment on column public.profiles.role is 'guest/member/admin';

alter table public.profiles enable row level security;

-- 再実行可能にするため一旦削除
drop policy if exists profiles_select_all on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

-- 認証済みならプロフィール参照可（最低限）
create policy profiles_select_all
on public.profiles
for select
to authenticated
using (true);

-- 自分のプロフィールのみ作成可
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- 自分のプロフィールのみ更新可
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- =====================================================
-- 2) pages: ブログ/記事テーブル
-- =====================================================
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  slug varchar(255) not null unique,
  content text not null default '',
  excerpt varchar(500),
  is_published boolean not null default false,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_title_not_empty check (char_length(title) > 0),
  constraint pages_slug_not_empty check (char_length(slug) > 0)
);

comment on table public.pages is 'Wiki/ブログ記事テーブル';
comment on column public.pages.title is '記事タイトル';
comment on column public.pages.slug is 'URLスラッグ';
comment on column public.pages.is_published is '公開状態';

create index if not exists idx_pages_author_id on public.pages(author_id);
create index if not exists idx_pages_is_published on public.pages(is_published);
create index if not exists idx_pages_created_at_desc on public.pages(created_at desc);
create index if not exists idx_pages_slug on public.pages(slug);

alter table public.pages enable row level security;

-- 再実行可能にするため一旦削除
drop policy if exists pages_select_published_or_own on public.pages;
drop policy if exists pages_insert_member_or_admin on public.pages;
drop policy if exists pages_update_own_or_admin on public.pages;
drop policy if exists pages_delete_admin_only on public.pages;

-- 公開記事は誰でも参照可、非公開は自分の記事のみ参照可
create policy pages_select_published_or_own
on public.pages
for select
to anon, authenticated
using (is_published = true or auth.uid() = author_id);

-- member/admin のみ記事作成可
create policy pages_insert_member_or_admin
on public.pages
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('member', 'admin')
  )
);

-- 著者または admin が更新可
create policy pages_update_own_or_admin
on public.pages
for update
to authenticated
using (
  auth.uid() = author_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.uid() = author_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- 削除は admin のみ
create policy pages_delete_admin_only
on public.pages
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- =====================================================
-- 3) updated_at 自動更新トリガー
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_pages_set_updated_at on public.pages;
create trigger trg_pages_set_updated_at
before update on public.pages
for each row
execute function public.set_updated_at();

-- =====================================================
-- 4) フェーズ1用の最小確認クエリ
-- =====================================================
-- select title, slug, is_published from public.pages order by created_at desc limit 5;
-- select id, role from public.profiles limit 5;
