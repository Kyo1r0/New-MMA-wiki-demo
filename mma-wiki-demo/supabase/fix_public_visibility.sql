-- Public visibility support hotfix
-- Run this in Supabase SQL editor when "public" selection does not persist.

begin;

alter table public.pages
  add column if not exists is_public boolean not null default false,
  add column if not exists internal_read_all boolean not null default true,
  add column if not exists internal_write_all boolean not null default false;

-- Ensure anon users can read only public pages
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pages'
      and policyname = 'anon_can_select_public_pages'
  ) then
    create policy "anon_can_select_public_pages"
      on public.pages
      for select
      to anon
      using (is_public = true);
  end if;
end $$;

commit;
