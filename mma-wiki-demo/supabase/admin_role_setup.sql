-- MMA Wiki / admin ロール運用SQL
-- 実行場所: Supabase Dashboard > SQL Editor
-- 注意: 本番運用では必ず2名以上の admin を維持してください

-- 1) 現在のロール一覧
select id, display_name, role, created_at
from public.profiles
order by created_at asc;

-- 2) admin 候補を昇格（idは置換）
-- update public.profiles
-- set role = 'admin', updated_at = now()
-- where id = '00000000-0000-0000-0000-000000000000';

-- 3) admin から member へ降格（idは置換）
-- 先に次のクエリで admin が2人以上いることを確認してから実行
-- update public.profiles
-- set role = 'member', updated_at = now()
-- where id = '00000000-0000-0000-0000-000000000000';

-- 4) 最低1人の admin 維持チェック
select count(*) as admin_count
from public.profiles
where role = 'admin';

-- 5) guest 一括昇格（必要時のみ）
-- update public.profiles
-- set role = 'member', updated_at = now()
-- where role = 'guest';
