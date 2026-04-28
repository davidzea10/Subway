-- Durcissement sécurité scores:
-- 1) Bloquer les écritures directes anonymes sur `scores`
-- 2) Garder la lecture publique pour le classement
-- 3) Conserver la RPC insert_or_update_score, mais appelée côté serveur uniquement

alter table public.scores enable row level security;

-- Supprimer les anciennes policies d'écriture anon si elles existent
drop policy if exists "Scores : insertion anonyme" on public.scores;
drop policy if exists "Scores : mise à jour anonyme" on public.scores;

-- Conserver uniquement la lecture publique
drop policy if exists "Scores : lecture publique" on public.scores;
create policy "Scores : lecture publique"
  on public.scores for select to anon using (true);

-- Important:
-- L'API serveur utilise SUPABASE_SERVICE_ROLE_KEY et contourne RLS proprement côté backend.
-- Le frontend ne doit plus appeler directement insert_or_update_score.

