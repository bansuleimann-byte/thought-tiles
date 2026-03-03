create table if not exists public.thought_images (
  id bigserial primary key,
  thought_id bigint not null references public.thoughts(id) on delete cascade,
  path text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.thought_images enable row level security;

-- Public can read images (so the public site can render them)
create policy "Public read thought_images"
on public.thought_images
for select
to anon, authenticated
using (true);

-- Only authenticated can write (admin uploads)
create policy "Authenticated insert thought_images"
on public.thought_images
for insert
to authenticated
with check (true);

create policy "Authenticated delete thought_images"
on public.thought_images
for delete
to authenticated
using (true);
