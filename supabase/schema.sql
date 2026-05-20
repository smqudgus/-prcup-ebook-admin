-- 1) Supabase SQL Editor에서 아래 전체 실행

create table if not exists public.ebook_pages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('cover', 'page')),
  title text not null default '',
  image_url text not null,
  storage_path text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ebook_pages enable row level security;

-- 공개 E-Book 페이지는 누구나 볼 수 있게 읽기 허용
create policy "Public can read visible ebook pages"
on public.ebook_pages
for select
using (visible = true or auth.role() = 'authenticated');

-- 로그인한 관리자만 추가/수정/삭제 가능
create policy "Authenticated can insert ebook pages"
on public.ebook_pages
for insert
to authenticated
with check (true);

create policy "Authenticated can update ebook pages"
on public.ebook_pages
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete ebook pages"
on public.ebook_pages
for delete
to authenticated
using (true);

-- 2) Storage에서 bucket 이름을 ebook-pages 로 생성 후 Public bucket 체크
-- 또는 아래 SQL을 실행해도 됩니다.
insert into storage.buckets (id, name, public)
values ('ebook-pages', 'ebook-pages', true)
on conflict (id) do update set public = true;

create policy "Public can read ebook images"
on storage.objects
for select
using (bucket_id = 'ebook-pages');

create policy "Authenticated can upload ebook images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'ebook-pages');

create policy "Authenticated can update ebook images"
on storage.objects
for update
to authenticated
using (bucket_id = 'ebook-pages')
with check (bucket_id = 'ebook-pages');

create policy "Authenticated can delete ebook images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ebook-pages');

-- 3) Auth > Users에서 관리자 이메일을 직접 추가하거나,
-- 앱에서 회원가입 후 Supabase에서 해당 유저만 사용하면 됩니다.
