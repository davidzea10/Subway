# Subway Runner — Intégration Supabase (3 étapes)

Inscription **pseudo seul** (pas d’email ni mot de passe). Tout le monde peut jouer et envoyer des scores / remarques.

---

## Étape 1 : Créer le projet et les tables Supabase

**Un pseudo = une seule ligne** : chaque joueur (pseudo) a **une seule entrée** dans le classement. Si le même pseudo envoie un nouveau score, le **meilleur score** remplace l’ancien (pas de doublon, pas de conflit de nom : un nom = une ligne).

1. Va sur [supabase.com](https://supabase.com), crée un compte si besoin, puis **New project**.
2. Note l’**URL du projet** et la clé **anon public** (Settings → API).
3. Dans le **SQL Editor** de Supabase, exécute le script suivant :

```sql
-- Table des scores : UNIQUE(pseudo) = une ligne par joueur, meilleur score conservé
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  pseudo text not null unique,
  score integer not null check (score >= 0),
  victoire boolean not null default false,
  created_at timestamptz not null default now()
);

-- Si la table existait déjà sans unique, supprimer les doublons puis ajouter la contrainte :
-- (décommenter et exécuter une seule fois si besoin)
-- delete from public.scores a using public.scores b where a.pseudo = b.pseudo and a.id < b.id;
-- alter table public.scores add constraint scores_pseudo_key unique (pseudo);

create index if not exists idx_scores_score_desc on public.scores (score desc);
create index if not exists idx_scores_created_at on public.scores (created_at desc);

alter table public.scores enable row level security;

create policy "Scores : insertion anonyme"
  on public.scores for insert to anon with check (true);

create policy "Scores : mise à jour anonyme"
  on public.scores for update to anon using (true) with check (true);

create policy "Scores : lecture publique"
  on public.scores for select to anon using (true);

-- Fonction : insère ou met à jour (un pseudo = une ligne, on garde le meilleur score)
create or replace function public.insert_or_update_score(
  p_pseudo text,
  p_score integer,
  p_victoire boolean
)
returns void language plpgsql security definer as $$
begin
  insert into public.scores (pseudo, score, victoire)
  values (p_pseudo, p_score, p_victoire)
  on conflict (pseudo) do update set
    score = greatest(scores.score, excluded.score),
    victoire = scores.victoire or excluded.victoire,
    created_at = case when excluded.score >= scores.score then now() else scores.created_at end;
end;
$$;

grant execute on function public.insert_or_update_score(text, integer, boolean) to anon;

-- Table des remarques (lecture réservée au dev dans le dashboard)
create table if not exists public.remarques (
  id uuid primary key default gen_random_uuid(),
  pseudo text,
  texte text not null,
  created_at timestamptz not null default now()
);

alter table public.remarques enable row level security;

create policy "Remarques : insertion anonyme"
  on public.remarques for insert to anon with check (true);
```

**Projet déjà créé (table scores sans UNIQUE) ?** Exécute d’abord ceci dans le SQL Editor pour garder une seule ligne par pseudo (meilleur score) puis ajouter la contrainte et la fonction :

```sql
-- Garder une ligne par pseudo (meilleur score)
delete from public.scores a using public.scores b
where a.pseudo = b.pseudo and a.score < b.score;

delete from public.scores a using public.scores b
where a.pseudo = b.pseudo and a.id < b.id;

alter table public.scores add constraint scores_pseudo_key unique (pseudo);

create or replace function public.insert_or_update_score(p_pseudo text, p_score integer, p_victoire boolean)
returns void language plpgsql security definer as $$
begin
  insert into public.scores (pseudo, score, victoire)
  values (p_pseudo, p_score, p_victoire)
  on conflict (pseudo) do update set
    score = greatest(scores.score, excluded.score),
    victoire = scores.victoire or excluded.victoire,
    created_at = case when excluded.score >= scores.score then now() else scores.created_at end;
end;
$$;

grant execute on function public.insert_or_update_score(text, integer, boolean) to anon;
```

Puis crée la policy "Scores : mise à jour anonyme" si pas déjà faite (voir bloc principal ci‑dessus).

4. Dans le dossier du jeu, crée le fichier **`supabaseConfig.js`** (déjà fourni) et remplace les valeurs par ton **URL** et ta clé **anon** :

```js
window.SUPABASE_URL = 'https://wvwfrejojfktrdfkxvpj.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2d2ZyZWpvamZrdHJkZmt4dnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjgzOTIsImV4cCI6MjA4NzI0NDM5Mn0.KI1RERH_mq-4cJhkdHBf-9dh5APWgyxulEAu9QQH-8w';
```

---

## Étape 2 : Envoyer les scores et afficher le classement

- **Envoi** : à chaque fin de partie (game over ou victoire), le jeu envoie `{ pseudo, score, victoire }` vers la table `scores` (en plus du stockage local).
- **Classement** : une page/overlay « Classement » affiche les scores depuis Supabase. Chaque ligne = **une partie** (pseudo + score + victoire + date/heure de la partie). Filtres :
  - **Dernière heure** / **Aujourd’hui** / **Cette semaine** / **Ce mois**
  - **Tous** (par score) / **Meilleur par pseudo** / **Victoires uniquement**

L’historique local (localStorage) reste inchangé pour l’affichage « Mes parties » sur ce navigateur.

---

## Étape 3 : Fenêtre « Remarques » (toi seul peux lire)

- **Dans le jeu** : bouton « Envoyer une remarque » qui ouvre une modale avec : 
  - champ **Pseudo** (optionnel),
  - **Message** (obligatoire),
  - bouton **Envoyer**.
- **En base** : chaque envoi crée une ligne dans `remarques` (pseudo, texte, date).
- **Lecture** : uniquement toi, dans le **dashboard Supabase** → Table Editor → table `remarques`. Aucun utilisateur du jeu ne peut lire ces messages (RLS sans policy SELECT pour `anon`).

---

## Résumé

| Élément        | Table      | Qui écrit        | Qui lit              |
|----------------|------------|------------------|----------------------|
| Scores         | `scores`   | Tout le monde    | Tout le monde (classement) |
| Remarques      | `remarques`| Tout le monde    | Toi (dashboard seul) |

Pas d’authentification : tout se fait avec la clé **anon** côté front.
