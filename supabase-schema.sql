-- ============================================================
-- Misi Detektif Unsur Intrinsik Cerpen - Supabase Production DB
-- ============================================================
-- Run this file in Supabase SQL Editor.
-- Then enable Anonymous Sign-Ins in Authentication settings.
-- Teacher uses email/password. Students use anonymous auth + class code.

create extension if not exists pgcrypto;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  class_label text,
  group_name text,
  joined_at timestamptz not null default now(),
  status text not null default 'active',
  unique(user_id, class_id)
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  mission_no int not null check (mission_no between 1 and 7),
  mission_title text not null,
  answer text not null,
  evidence text not null,
  reason text not null,
  hint_used boolean not null default false,
  score int check (score between 0 and 5),
  feedback text not null default '',
  status text not null default 'submitted',
  updated_at timestamptz not null default now(),
  unique(student_id, mission_no)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  url text not null,
  note text not null default '',
  status text not null default 'submitted',
  score int check (score between 0 and 100),
  submitted_at timestamptz not null default now(),
  unique(student_id)
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  r1 text default '', r2 text default '', r3 text default '',
  r4 text default '', r5 text default '', r6 text default '',
  updated_at timestamptz not null default now(),
  unique(student_id)
);

create index if not exists idx_classes_teacher on public.classes(teacher_id);
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_students_user on public.students(user_id);
create index if not exists idx_answers_class on public.answers(class_id);
create index if not exists idx_answers_student on public.answers(student_id);
create index if not exists idx_products_class on public.products(class_id);
create index if not exists idx_reflections_class on public.reflections(class_id);

-- Enable RLS everywhere. Supabase recommends RLS on exposed tables. 
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.answers enable row level security;
alter table public.products enable row level security;
alter table public.reflections enable row level security;

-- ---------- Helper functions ----------
create or replace function public.join_class_by_code(
  p_code text,
  p_name text,
  p_class_label text,
  p_group_name text
)
returns table(student_id uuid, class_id uuid, class_name text, class_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class public.classes%rowtype;
  v_student public.students%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_class from public.classes where code = upper(trim(p_code));
  if not found then raise exception 'KODE_KELAS_TIDAK_DITEMUKAN'; end if;

  insert into public.students(user_id, class_id, name, class_label, group_name)
  values (auth.uid(), v_class.id, trim(p_name), trim(p_class_label), trim(p_group_name))
  on conflict (user_id, class_id)
  do update set name=excluded.name, class_label=excluded.class_label, group_name=excluded.group_name
  returning * into v_student;

  return query select v_student.id, v_class.id, v_class.name, v_class.code;
end;
$$;

grant execute on function public.join_class_by_code(text,text,text,text) to authenticated;

create or replace function public.submit_answer(
  p_mission_no int,
  p_mission_title text,
  p_answer text,
  p_evidence text,
  p_reason text,
  p_hint_used boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_student public.students%rowtype; v_id uuid;
begin
  select * into v_student from public.students where user_id=auth.uid() order by joined_at desc limit 1;
  if not found then raise exception 'STUDENT_NOT_FOUND'; end if;
  insert into public.answers(class_id,student_id,mission_no,mission_title,answer,evidence,reason,hint_used,status,updated_at)
  values(v_student.class_id,v_student.id,p_mission_no,p_mission_title,trim(p_answer),trim(p_evidence),trim(p_reason),coalesce(p_hint_used,false),'submitted',now())
  on conflict(student_id,mission_no) do update set mission_title=excluded.mission_title,answer=excluded.answer,evidence=excluded.evidence,reason=excluded.reason,hint_used=excluded.hint_used,status='submitted',updated_at=now()
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.submit_answer(int,text,text,text,text,boolean) to authenticated;

create or replace function public.review_answer(
  p_answer_id uuid,
  p_score int,
  p_feedback text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  update public.answers a set score=p_score, feedback=coalesce(p_feedback,''), status='reviewed', updated_at=now()
  where a.id=p_answer_id and exists(select 1 from public.classes c where c.id=a.class_id and c.teacher_id=auth.uid());
  if not found then raise exception 'NOT_ALLOWED'; end if;
  return p_answer_id;
end;
$$;
grant execute on function public.review_answer(uuid,int,text) to authenticated;

create or replace function public.submit_product(
  p_title text,
  p_url text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_student public.students%rowtype; v_id uuid;
begin
  select * into v_student from public.students where user_id=auth.uid() order by joined_at desc limit 1;
  if not found then raise exception 'STUDENT_NOT_FOUND'; end if;
  insert into public.products(class_id,student_id,title,url,note,status,submitted_at)
  values(v_student.class_id,v_student.id,trim(p_title),trim(p_url),coalesce(p_note,''),'submitted',now())
  on conflict(student_id) do update set title=excluded.title,url=excluded.url,note=excluded.note,status='submitted',submitted_at=now()
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.submit_product(text,text,text) to authenticated;

create or replace function public.submit_reflection(
  r1 text default '', r2 text default '', r3 text default '', r4 text default '', r5 text default '', r6 text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_student public.students%rowtype; v_id uuid;
begin
  select * into v_student from public.students where user_id=auth.uid() order by joined_at desc limit 1;
  if not found then raise exception 'STUDENT_NOT_FOUND'; end if;
  insert into public.reflections(class_id,student_id,r1,r2,r3,r4,r5,r6,updated_at)
  values(v_student.class_id,v_student.id,r1,r2,r3,r4,r5,r6,now())
  on conflict(student_id) do update set r1=excluded.r1,r2=excluded.r2,r3=excluded.r3,r4=excluded.r4,r5=excluded.r5,r6=excluded.r6,updated_at=now()
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.submit_reflection(text,text,text,text,text,text) to authenticated;

-- ---------- RLS policies ----------
-- Clean up known policy names if re-running this script.
do $$
begin
  execute 'drop policy if exists classes_teacher_select on public.classes';
  execute 'drop policy if exists classes_teacher_insert on public.classes';
  execute 'drop policy if exists classes_teacher_update on public.classes';
  execute 'drop policy if exists students_self_select on public.students';
  execute 'drop policy if exists students_teacher_select on public.students';
  execute 'drop policy if exists answers_self_select on public.answers';
  execute 'drop policy if exists answers_teacher_select on public.answers';
  execute 'drop policy if exists products_self_select on public.products';
  execute 'drop policy if exists products_teacher_select on public.products';
  execute 'drop policy if exists reflections_self_select on public.reflections';
  execute 'drop policy if exists reflections_teacher_select on public.reflections';
exception when others then null;
end $$;

create policy classes_teacher_select on public.classes for select to authenticated using (teacher_id=auth.uid());
create policy classes_teacher_insert on public.classes for insert to authenticated with check (teacher_id=auth.uid());
create policy classes_teacher_update on public.classes for update to authenticated using (teacher_id=auth.uid()) with check (teacher_id=auth.uid());

create policy students_self_select on public.students for select to authenticated using (user_id=auth.uid());
create policy students_teacher_select on public.students for select to authenticated using (exists(select 1 from public.classes c where c.id=students.class_id and c.teacher_id=auth.uid()));

create policy answers_self_select on public.answers for select to authenticated using (exists(select 1 from public.students s where s.id=answers.student_id and s.user_id=auth.uid()));
create policy answers_teacher_select on public.answers for select to authenticated using (exists(select 1 from public.classes c where c.id=answers.class_id and c.teacher_id=auth.uid()));

create policy products_self_select on public.products for select to authenticated using (exists(select 1 from public.students s where s.id=products.student_id and s.user_id=auth.uid()));
create policy products_teacher_select on public.products for select to authenticated using (exists(select 1 from public.classes c where c.id=products.class_id and c.teacher_id=auth.uid()));

create policy reflections_self_select on public.reflections for select to authenticated using (exists(select 1 from public.students s where s.id=reflections.student_id and s.user_id=auth.uid()));
create policy reflections_teacher_select on public.reflections for select to authenticated using (exists(select 1 from public.classes c where c.id=reflections.class_id and c.teacher_id=auth.uid()));

-- Direct INSERT/UPDATE/DELETE on protected tables are intentionally not granted here.
-- Student writes happen through security-definer RPCs.
-- Teacher reviews answers through the review_answer RPC.

-- ---------- Materials / Kelola Materi ----------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text not null default '',
  content text not null default '',
  material_type text not null default 'text' check (material_type in ('text','image','video','pdf','link')),
  media_url text not null default '',
  order_number int not null default 1,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_materials_class on public.materials(class_id);
create index if not exists idx_materials_order on public.materials(class_id,order_number);
alter table public.materials enable row level security;

do $$
begin
  execute 'drop policy if exists materials_teacher_select on public.materials';
  execute 'drop policy if exists materials_teacher_insert on public.materials';
  execute 'drop policy if exists materials_teacher_update on public.materials';
  execute 'drop policy if exists materials_teacher_delete on public.materials';
  execute 'drop policy if exists materials_student_select on public.materials';
exception when others then null;
end $$;

create policy materials_teacher_select on public.materials
for select to authenticated
using (exists(select 1 from public.classes c where c.id=materials.class_id and c.teacher_id=auth.uid()));

create policy materials_teacher_insert on public.materials
for insert to authenticated
with check (exists(select 1 from public.classes c where c.id=materials.class_id and c.teacher_id=auth.uid()));

create policy materials_teacher_update on public.materials
for update to authenticated
using (exists(select 1 from public.classes c where c.id=materials.class_id and c.teacher_id=auth.uid()))
with check (exists(select 1 from public.classes c where c.id=materials.class_id and c.teacher_id=auth.uid()));

create policy materials_teacher_delete on public.materials
for delete to authenticated
using (exists(select 1 from public.classes c where c.id=materials.class_id and c.teacher_id=auth.uid()));

create policy materials_student_select on public.materials
for select to authenticated
using (
  is_published=true and
  exists(select 1 from public.students s where s.class_id=materials.class_id and s.user_id=auth.uid())
);
