# Commentaires en temps réel — Supabase

Exécute ce script dans le **SQL Editor** de Supabase pour activer les commentaires :

```sql
-- Table des commentaires (lecture/écriture publique, temps réel)
create table if not exists public.commentaires (
  id uuid primary key default gen_random_uuid(),
  pseudo text,
  texte text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_commentaires_created_at on public.commentaires (created_at desc);

alter table public.commentaires enable row level security;

create policy "Commentaires : insertion anonyme"
  on public.commentaires for insert to anon with check (true);

create policy "Commentaires : lecture publique"
  on public.commentaires for select to anon using (true);

-- Table des réactions (like, dislike, mort de rire, etc.) — 1 réaction par pseudo par commentaire
create table if not exists public.commentaire_reactions (
  id uuid primary key default gen_random_uuid(),
  commentaire_id uuid not null references public.commentaires(id) on delete cascade,
  pseudo text not null,
  type text not null check (type in ('like','dislike','coeur','coeur_brise','mort_de_rire')),
  created_at timestamptz not null default now(),
  unique(commentaire_id, pseudo)
);

create index if not exists idx_reactions_commentaire on public.commentaire_reactions(commentaire_id);

alter table public.commentaire_reactions enable row level security;

create policy "Reactions : insert" on public.commentaire_reactions for insert to anon with check (true);
create policy "Reactions : select" on public.commentaire_reactions for select to anon using (true);
create policy "Reactions : update" on public.commentaire_reactions for update to anon using (true) with check (true);
create policy "Reactions : delete" on public.commentaire_reactions for delete to anon using (true);
```

Ensuite : **Database → Replication** → ajoute la table `commentaires` à la publication Realtime.
