-- Add role and blocked columns to profiles
alter table public.profiles
add column if not exists role text not null default 'user'
check (role in ('user', 'admin', 'super_admin'));

alter table public.profiles
add column if not exists is_blocked boolean not null default false;

-- Drop existing policies that need to be replaced
drop policy if exists "Aggiorna profilo personale" on public.profiles;
drop policy if exists "Elimina commento" on public.comments;
drop policy if exists "Leggi segnalazioni" on public.reports;
drop policy if exists "Modifica proposta personale" on public.proposals;

-- Profile policies
create policy "Aggiorna profilo personale" on public.profiles for update
using (auth.uid() = id);

create policy "Admin aggiorna profili" on public.profiles for update
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')));

-- Proposal policies
create policy "Admin aggiorna proposte" on public.proposals for update
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

create policy "Admin elimina proposte" on public.proposals for delete
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- Comment policies
create policy "Elimina commento" on public.comments for delete
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

-- Reports: admin can read all
create policy "Leggi segnalazioni" on public.reports for select
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);
