-- Méthode 2 anti-triche: sessions de partie signées
-- Chaque score doit provenir d'une session créée au démarrage de la partie.

create table if not exists public.game_sessions (
  id uuid primary key,
  pseudo text not null,
  started_at timestamptz not null,
  nonce text not null,
  consumed boolean not null default false,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_pseudo on public.game_sessions (pseudo);
create index if not exists idx_game_sessions_started_at on public.game_sessions (started_at desc);

alter table public.game_sessions enable row level security;

-- Aucune policy anon: cette table est manipulée uniquement côté serveur (service_role)
drop policy if exists "Game sessions read anon" on public.game_sessions;
drop policy if exists "Game sessions write anon" on public.game_sessions;

