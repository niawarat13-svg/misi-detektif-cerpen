-- Teacher approval workflow for Misi Detektif Cerpen.
-- Preserve anonymous student authentication; restrict only teacher-side access.

create table if not exists public.teacher_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_owner boolean not null default false,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.teacher_access enable row level security;

create or replace function public.is_approved_teacher()
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.teacher_access ta
    where ta.user_id = auth.uid()
      and ta.status = 'approved'
  );
$$;

create or replace function public.is_site_owner()
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.teacher_access ta
    where ta.user_id = auth.uid()
      and ta.is_owner = true
      and ta.status = 'approved'
  );
$$;

create or replace function public.ensure_teacher_access_request()
returns table(status text, is_owner boolean)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_name text := coalesce(auth.jwt() -> 'user_metadata' ->> 'name', auth.jwt() -> 'user_metadata' ->> 'display_name', '');
begin
  if v_uid is null then
    raise exception 'Anda harus login terlebih dahulu.';
  end if;

  insert into public.teacher_access(user_id, email, display_name, status)
  values (v_uid, v_email, v_name, 'pending')
  on conflict (user_id) do update
    set email = excluded.email,
        display_name = case when excluded.display_name <> '' then excluded.display_name else teacher_access.display_name end;

  return query
    select ta.status, ta.is_owner
    from public.teacher_access ta
    where ta.user_id = v_uid;
end;
$$;

create or replace function public.list_teacher_access_requests()
returns table(user_id uuid, email text, display_name text, requested_at timestamptz)
language plpgsql security definer
set search_path = public, auth
as $$
begin
  if not public.is_site_owner() then
    raise exception 'Hanya pemilik website yang dapat melihat permintaan akun guru.';
  end if;

  return query
    select ta.user_id, ta.email, ta.display_name, ta.requested_at
    from public.teacher_access ta
    where ta.status = 'pending' and ta.is_owner = false
    order by ta.requested_at asc;
end;
$$;

create or replace function public.review_teacher_access_request(p_user_id uuid, p_status text)
returns void
language plpgsql security definer
set search_path = public, auth
as $$
begin
  if not public.is_site_owner() then
    raise exception 'Hanya pemilik website yang dapat menyetujui akun guru.';
  end if;
  if p_status not in ('approved','rejected') then
    raise exception 'Status harus approved atau rejected.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Akun pemilik tidak dapat diubah melalui proses ini.';
  end if;

  update public.teacher_access
  set status = p_status, reviewed_at = now()
  where user_id = p_user_id and is_owner = false and status = 'pending';

  if not found then
    raise exception 'Permintaan tidak ditemukan atau sudah diproses.';
  end if;
end;
$$;

revoke all on function public.ensure_teacher_access_request() from public;
revoke all on function public.list_teacher_access_requests() from public;
revoke all on function public.review_teacher_access_request(uuid,text) from public;
grant execute on function public.ensure_teacher_access_request() to authenticated;
grant execute on function public.list_teacher_access_requests() to authenticated;
grant execute on function public.review_teacher_access_request(uuid,text) to authenticated;

drop policy if exists teacher_access_self_select on public.teacher_access;
create policy teacher_access_self_select on public.teacher_access
for select to authenticated
using (user_id = auth.uid() or public.is_site_owner());

-- Existing owner and current teacher are retained as approved accounts.
insert into public.teacher_access(user_id,email,display_name,status,is_owner)
select id, email, coalesce(raw_user_meta_data->>'name',''), 'approved',
       (email = 'niawarat13@gmail.com')
from auth.users
where email in ('niawarat13@gmail.com','mirulewansamy@gmail.com')
on conflict (user_id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    status = 'approved',
    is_owner = excluded.is_owner;

-- Transfer the four classes owned by the previous account to the selected owner.
update public.classes
set teacher_id = (select id from auth.users where email = 'niawarat13@gmail.com' limit 1)
where teacher_id = (select id from auth.users where email = 'mirulewansamy@gmail.com' limit 1);

-- Enforce approved-teacher status at the database boundary.
drop policy if exists classes_teacher_insert on public.classes;
drop policy if exists classes_teacher_select on public.classes;
drop policy if exists classes_teacher_update on public.classes;
create policy classes_teacher_insert on public.classes
for insert to authenticated
with check (teacher_id = auth.uid() and public.is_approved_teacher());
create policy classes_teacher_select on public.classes
for select to authenticated
using (teacher_id = auth.uid() and public.is_approved_teacher());
create policy classes_teacher_update on public.classes
for update to authenticated
using (teacher_id = auth.uid() and public.is_approved_teacher())
with check (teacher_id = auth.uid() and public.is_approved_teacher());

drop policy if exists answers_teacher_select on public.answers;
create policy answers_teacher_select on public.answers
for select to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = answers.class_id and c.teacher_id = auth.uid()
));

drop policy if exists products_teacher_select on public.products;
create policy products_teacher_select on public.products
for select to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = products.class_id and c.teacher_id = auth.uid()
));

drop policy if exists reflections_teacher_select on public.reflections;
create policy reflections_teacher_select on public.reflections
for select to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = reflections.class_id and c.teacher_id = auth.uid()
));

drop policy if exists students_teacher_select on public.students;
create policy students_teacher_select on public.students
for select to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = students.class_id and c.teacher_id = auth.uid()
));

drop policy if exists materials_teacher_delete on public.materials;
drop policy if exists materials_teacher_insert on public.materials;
drop policy if exists materials_teacher_select on public.materials;
drop policy if exists materials_teacher_update on public.materials;
create policy materials_teacher_delete on public.materials
for delete to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = materials.class_id and c.teacher_id = auth.uid()
));
create policy materials_teacher_insert on public.materials
for insert to authenticated
with check (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = materials.class_id and c.teacher_id = auth.uid()
));
create policy materials_teacher_select on public.materials
for select to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = materials.class_id and c.teacher_id = auth.uid()
));
create policy materials_teacher_update on public.materials
for update to authenticated
using (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = materials.class_id and c.teacher_id = auth.uid()
))
with check (public.is_approved_teacher() and exists (
  select 1 from public.classes c where c.id = materials.class_id and c.teacher_id = auth.uid()
));
