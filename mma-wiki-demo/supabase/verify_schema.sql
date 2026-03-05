-- MMA Wiki / スキーマ検証SQL
-- 実行場所: Supabase Dashboard > SQL Editor

-- 1) テーブル存在確認
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'pages', 'page_permissions')
order by table_name;

-- 2) 必須カラム確認
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in ('id', 'role', 'created_at', 'updated_at'))
    or
    (table_name = 'profiles' and column_name in ('display_name'))
    or
    (table_name = 'pages' and column_name in ('id', 'title', 'slug', 'content', 'excerpt', 'is_published', 'internal_write_all', 'author_id', 'created_at', 'updated_at'))
    or
    (table_name = 'page_permissions' and column_name in ('id', 'page_id', 'user_id', 'can_read', 'can_write', 'granted_by', 'created_at', 'updated_at'))
  )
order by table_name, column_name;

-- 3) RLS有効確認
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'pages', 'page_permissions')
order by tablename;

-- 4) ポリシー確認
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'pages', 'page_permissions')
order by tablename, policyname;

-- 5) 新規ユーザー作成時のprofiles自動生成トリガー確認
select t.tgname as trigger_name, n.nspname as schema_name, c.relname as table_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where t.tgisinternal = false
  and t.tgname = 'trg_auth_user_created_profile'
  and n.nspname = 'auth'
  and c.relname = 'users';

-- 6) アプリ側で使う最小クエリ（失敗しないこと）
select id, role from public.profiles limit 1;
select id, title from public.pages limit 1;
select page_id, user_id, can_read, can_write from public.page_permissions limit 1;

-- 7) 投稿失敗の原因になりやすい列定義の確認（internal_write_all）
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'pages'
  and column_name = 'internal_write_all';

-- 8) slug一意制約の確認（重複投稿エラー切り分け）
select
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'pages'
  and con.contype = 'u'
order by con.conname;