-- pages / page_permissions のRLS循環参照を解消するホットフィックス
-- 実行場所: Supabase Dashboard > SQL Editor

begin;

drop policy if exists page_permissions_select_visible on public.page_permissions;
drop policy if exists page_permissions_insert_owner_or_admin on public.page_permissions;
drop policy if exists page_permissions_update_owner_or_admin on public.page_permissions;
drop policy if exists page_permissions_delete_owner_or_admin on public.page_permissions;

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

commit;
