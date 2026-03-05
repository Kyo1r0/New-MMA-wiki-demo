-- MMA Wiki / Supabase 初期スキーマ
-- 実行場所: Supabase Dashboard > SQL Editor
-- このSQLは再実行できるように IF NOT EXISTS / DROP POLICY IF EXISTS を使用

create extension if not exists pgcrypto;

-- =====================================================
-- 1) profiles: auth.users を拡張するプロフィールテーブル
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('guest', 'member', 'admin'))
);

alter table public.profiles
  add column if not exists display_name text;

comment on table public.profiles is 'ユーザー拡張情報と権限ロール';
comment on column public.profiles.display_name is '表示名（任意）';
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
  is_public boolean not null default false,
  internal_read_all boolean not null default true,
  internal_write_all boolean not null default false,
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_title_not_empty check (char_length(title) > 0),
  constraint pages_slug_not_empty check (char_length(slug) > 0)
);

alter table public.pages
  add column if not exists is_public boolean not null default false;

alter table public.pages
  add column if not exists internal_read_all boolean not null default true;

alter table public.pages
  add column if not exists internal_write_all boolean not null default false;

comment on table public.pages is 'Wiki/ブログ記事テーブル';
comment on column public.pages.title is '記事タイトル';
comment on column public.pages.slug is 'URLスラッグ';
comment on column public.pages.is_published is '公開状態';
comment on column public.pages.is_public is 'true の場合、未ログインを含む全ユーザーが閲覧可';
comment on column public.pages.internal_read_all is 'true の場合、member/admin は全員閲覧可';
comment on column public.pages.internal_write_all is 'true の場合、member/admin は全員編集可';

create index if not exists idx_pages_author_id on public.pages(author_id);
create index if not exists idx_pages_is_published on public.pages(is_published);
create index if not exists idx_pages_created_at_desc on public.pages(created_at desc);
create index if not exists idx_pages_slug on public.pages(slug);

-- =====================================================
-- 2.5) page_permissions: ページ単位のACL
-- =====================================================
create table if not exists public.page_permissions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_read boolean not null default true,
  can_write boolean not null default false,
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint page_permissions_unique_page_user unique (page_id, user_id),
  constraint page_permissions_write_requires_read check (can_write = false or can_read = true)
);

comment on table public.page_permissions is 'ページ単位ACL（read/write権限）';
comment on column public.page_permissions.can_read is '閲覧可否';
comment on column public.page_permissions.can_write is '編集可否（trueの場合はcan_readもtrue）';

create index if not exists idx_page_permissions_page_id on public.page_permissions(page_id);
create index if not exists idx_page_permissions_user_id on public.page_permissions(user_id);

alter table public.pages enable row level security;
alter table public.page_permissions enable row level security;

-- 再実行可能にするため一旦削除
drop policy if exists pages_select_published_or_own on public.pages;
drop policy if exists pages_insert_member_or_admin on public.pages;
drop policy if exists pages_update_own_or_admin on public.pages;
drop policy if exists pages_delete_admin_only on public.pages;
drop policy if exists page_permissions_select_visible on public.page_permissions;
drop policy if exists page_permissions_insert_owner_or_admin on public.page_permissions;
drop policy if exists page_permissions_update_owner_or_admin on public.page_permissions;
drop policy if exists page_permissions_delete_owner_or_admin on public.page_permissions;

-- 閲覧可否:
-- 1) 公開記事 (is_public=true かつ is_published=true) は未ログイン含め全員
-- 2) それ以外は著者 / admin / 指定メンバー / (internal_read_all=true かつ member/admin)
create policy pages_select_published_or_own
on public.pages
for select
to anon, authenticated
using (
  (is_published = true and is_public = true)
  or auth.uid() = author_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
  or exists (
    select 1
    from public.page_permissions pp
    where pp.page_id = pages.id
      and pp.user_id = auth.uid()
      and pp.can_read = true
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and pages.internal_read_all = true
      and p.role in ('member', 'admin')
  )
);

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
  or (
    internal_write_all = true
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('member', 'admin')
    )
  )
  or exists (
    select 1
    from public.page_permissions pp
    where pp.page_id = pages.id
      and pp.user_id = auth.uid()
      and pp.can_write = true
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.uid() = author_id
  or (
    internal_write_all = true
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('member', 'admin')
    )
  )
  or exists (
    select 1
    from public.page_permissions pp
    where pp.page_id = pages.id
      and pp.user_id = auth.uid()
      and pp.can_write = true
  )
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

-- ACL参照可否: 権限本人 / 付与者 / admin
create policy page_permissions_select_visible
on public.page_permissions
for select
to authenticated
using (
  auth.uid() = user_id
  or auth.uid() = granted_by
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- ACL作成: 付与者本人 or admin（循環参照回避）
create policy page_permissions_insert_owner_or_admin
on public.page_permissions
for insert
to authenticated
with check (
  (can_write = false or can_read = true)
  and exists (
    select 1
    from public.profiles p2
    where p2.id = page_permissions.user_id
      and p2.role in ('member', 'admin')
  )
  and granted_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('member', 'admin')
  )
);

-- ACL更新: 付与者本人 or admin（循環参照回避）
create policy page_permissions_update_owner_or_admin
on public.page_permissions
for update
to authenticated
using (
  auth.uid() = granted_by
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  (can_write = false or can_read = true)
  and exists (
    select 1
    from public.profiles p2
    where p2.id = page_permissions.user_id
      and p2.role in ('member', 'admin')
  )
  and (
    auth.uid() = granted_by
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);

-- ACL削除: 付与者本人 or admin（循環参照回避）
create policy page_permissions_delete_owner_or_admin
on public.page_permissions
for delete
to authenticated
using (
  auth.uid() = granted_by
  or exists (
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

drop trigger if exists trg_page_permissions_set_updated_at on public.page_permissions;
create trigger trg_page_permissions_set_updated_at
before update on public.page_permissions
for each row
execute function public.set_updated_at();

-- =====================================================
-- 4) auth.users 追加時の profiles 自動初期化
-- =====================================================
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data ->> 'display_name', 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created_profile on auth.users;
create trigger trg_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

-- =====================================================
-- 5) フェーズ1用の最小確認クエリ
-- =====================================================
-- select title, slug, is_published from public.pages order by created_at desc limit 5;
-- select id, role from public.profiles limit 5;
-- select page_id, user_id, can_read, can_write from public.page_permissions limit 5;
