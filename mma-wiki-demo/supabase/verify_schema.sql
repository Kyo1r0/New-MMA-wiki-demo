-- MMA Wiki / スキーマ検証SQL
-- 実行場所: Supabase Dashboard > SQL Editor

-- 1) テーブル存在確認
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'pages')
order by table_name;

-- 2) 必須カラム確認
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in ('id', 'role', 'created_at', 'updated_at'))
    or
    (table_name = 'pages' and column_name in ('id', 'title', 'slug', 'content', 'excerpt', 'is_published', 'author_id', 'created_at', 'updated_at'))
  )
order by table_name, column_name;

-- 3) RLS有効確認
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'pages')
order by tablename;

-- 4) ポリシー確認
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'pages')
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