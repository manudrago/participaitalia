-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  badge text check (badge in ('top_contributor')),
  proposal_count int default 0,
  created_at timestamptz default now()
);

-- Proposals table
create table if not exists public.proposals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null check (length(title) >= 10 and length(title) <= 200),
  problem text not null check (length(problem) >= 50),
  solution text not null check (length(solution) >= 50),
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'flagged', 'removed')),
  upvotes int not null default 0,
  downvotes int not null default 0,
  vote_score int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Votes table
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(user_id, proposal_id)
);

-- Comments table
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  proposal_id uuid references public.proposals(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (length(content) >= 3 and length(content) <= 2000),
  vote_score int not null default 0,
  created_at timestamptz default now()
);

-- Comment votes
create table if not exists public.comment_votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz default now(),
  unique(user_id, comment_id)
);

-- Reports table
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid not null,
  target_type text not null check (target_type in ('proposal', 'comment')),
  reason text not null,
  created_at timestamptz default now(),
  unique(user_id, target_id, target_type)
);

-- Update vote_score and counts on vote insert/update/delete
create or replace function update_proposal_votes()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    update public.proposals set
      upvotes = (select count(*) from public.votes where proposal_id = OLD.proposal_id and value = 1),
      downvotes = (select count(*) from public.votes where proposal_id = OLD.proposal_id and value = -1),
      vote_score = (select coalesce(sum(value), 0) from public.votes where proposal_id = OLD.proposal_id),
      updated_at = now()
    where id = OLD.proposal_id;
    return OLD;
  else
    update public.proposals set
      upvotes = (select count(*) from public.votes where proposal_id = NEW.proposal_id and value = 1),
      downvotes = (select count(*) from public.votes where proposal_id = NEW.proposal_id and value = -1),
      vote_score = (select coalesce(sum(value), 0) from public.votes where proposal_id = NEW.proposal_id),
      updated_at = now()
    where id = NEW.proposal_id;
    return NEW;
  end if;
end;
$$;

create trigger on_vote_change
  after insert or update or delete on public.votes
  for each row execute function update_proposal_votes();

-- Update comment count
create or replace function update_comment_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    update public.proposals set
      comment_count = (select count(*) from public.comments where proposal_id = OLD.proposal_id),
      updated_at = now()
    where id = OLD.proposal_id;
    return OLD;
  else
    update public.proposals set
      comment_count = (select count(*) from public.comments where proposal_id = NEW.proposal_id),
      updated_at = now()
    where id = NEW.proposal_id;
    return NEW;
  end if;
end;
$$;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function update_comment_count();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Update proposal_count and badge for top contributors
create or replace function update_proposal_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    update public.profiles set
      proposal_count = (select count(*) from public.proposals where user_id = OLD.user_id),
      badge = case when (select count(*) from public.proposals where user_id = OLD.user_id) >= 5 then 'top_contributor' else null end
    where id = OLD.user_id;
    return OLD;
  else
    update public.profiles set
      proposal_count = (select count(*) from public.proposals where user_id = NEW.user_id),
      badge = case when (select count(*) from public.proposals where user_id = NEW.user_id) >= 5 then 'top_contributor' else null end
    where id = NEW.user_id;
    return NEW;
  end if;
end;
$$;

create trigger on_proposal_change
  after insert or delete on public.proposals
  for each row execute function update_proposal_count();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.proposals enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.reports enable row level security;

-- Profiles: public read, own write
create policy "Profili pubblici" on public.profiles for select using (true);
create policy "Aggiorna profilo personale" on public.profiles for update using (auth.uid() = id);

-- Proposals: public read, authenticated create/update own
create policy "Proposte pubbliche" on public.proposals for select using (status != 'removed');
create policy "Crea proposta" on public.proposals for insert with check (auth.uid() = user_id);
create policy "Modifica proposta personale" on public.proposals for update using (auth.uid() = user_id);

-- Votes: authenticated only
create policy "Leggi voti" on public.votes for select using (true);
create policy "Vota" on public.votes for insert with check (auth.uid() = user_id);
create policy "Cambia voto" on public.votes for update using (auth.uid() = user_id);
create policy "Rimuovi voto" on public.votes for delete using (auth.uid() = user_id);

-- Comments: public read, authenticated write
create policy "Commenti pubblici" on public.comments for select using (true);
create policy "Scrivi commento" on public.comments for insert with check (auth.uid() = user_id);
create policy "Modifica commento" on public.comments for update using (auth.uid() = user_id);
create policy "Elimina commento" on public.comments for delete using (auth.uid() = user_id);

-- Comment votes
create policy "Leggi voti commenti" on public.comment_votes for select using (true);
create policy "Vota commento" on public.comment_votes for insert with check (auth.uid() = user_id);
create policy "Cambia voto commento" on public.comment_votes for update using (auth.uid() = user_id);
create policy "Rimuovi voto commento" on public.comment_votes for delete using (auth.uid() = user_id);

-- Reports: authenticated
create policy "Segnala" on public.reports for insert with check (auth.uid() = user_id);
create policy "Leggi segnalazioni" on public.reports for select using (auth.uid() = user_id);
