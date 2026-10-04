-- Student email identity migration
-- Applied to production Supabase on 2026-10-04.
-- Students use email as an identity field without password/OTP.
-- Supabase Anonymous Auth still provides the session used by RLS/RPC.

alter table public.students add column if not exists email text;
create unique index if not exists idx_students_class_email_unique
  on public.students (class_id, lower(email))
  where email is not null and btrim(email) <> '';

drop function if exists public.join_class_by_code(text,text,text,text,text);

create or replace function public.join_class_by_code(
  p_code text,
  p_name text,
  p_class_label text,
  p_group_name text,
  p_email text
)
returns table(student_id uuid, class_id uuid, class_name text, class_code text, student_email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes%rowtype;
  v_student public.students%rowtype;
  v_email text := lower(trim(p_email));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_email is null or v_email = '' then raise exception 'EMAIL_REQUIRED'; end if;

  select * into v_class from public.classes where code = upper(trim(p_code));
  if not found then raise exception 'KODE_KELAS_TIDAK_DITEMUKAN'; end if;

  select * into v_student
  from public.students
  where class_id = v_class.id and lower(email) = v_email
  order by joined_at asc
  limit 1;

  if found then
    update public.students
    set user_id=auth.uid(), name=trim(p_name), class_label=trim(p_class_label),
        group_name=trim(p_group_name), email=v_email
    where id=v_student.id
    returning * into v_student;
  else
    select * into v_student
    from public.students
    where user_id=auth.uid() and class_id=v_class.id
    limit 1;

    if found then
      update public.students
      set name=trim(p_name), class_label=trim(p_class_label),
          group_name=trim(p_group_name), email=v_email
      where id=v_student.id
      returning * into v_student;
    else
      insert into public.students(user_id, class_id, name, class_label, group_name, email)
      values(auth.uid(), v_class.id, trim(p_name), trim(p_class_label), trim(p_group_name), v_email)
      returning * into v_student;
    end if;
  end if;

  return query
    select v_student.id, v_class.id, v_class.name, v_class.code, v_student.email;
end;
$$;

grant execute on function public.join_class_by_code(text,text,text,text,text) to authenticated;
