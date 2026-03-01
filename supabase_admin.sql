-- Table des paramètres du jeu (maintenance, message)
-- Une seule ligne (id=1). Lecture publique, écriture réservée au service_role via l'API admin.

create table if not exists public.parametres_jeu (
  id integer primary key default 1 check (id = 1),
  maintenance boolean not null default false,
  message_maintenance text not null default 'Le jeu est temporairement indisponible. Merci de réessayer plus tard.',
  updated_at timestamptz not null default now()
);

-- Ligne par défaut (une seule, id=1) — n'écrase pas si elle existe déjà
insert into public.parametres_jeu (id, maintenance, message_maintenance)
values (1, false, 'Le jeu est temporairement indisponible. Merci de réessayer plus tard.')
on conflict (id) do nothing;

alter table public.parametres_jeu enable row level security;

-- Tout le monde peut LIRE (le jeu doit vérifier l'état)
create policy "Parametres : lecture publique"
  on public.parametres_jeu for select to anon using (true);

-- Aucune policy INSERT/UPDATE pour anon = seul le service_role (API admin) peut modifier
