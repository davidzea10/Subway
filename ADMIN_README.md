# Administration Mboka Runner

## Fonctionnalités

- **Arrêter / Reprendre le jeu** : Quand arrêté, les visiteurs voient un message et ne peuvent pas jouer.
- **Réinitialiser le classement** : Vide les scores pour lancer une nouvelle partie/saison.
- **Message personnalisable** : Texte affiché aux joueurs pendant la maintenance.

## Configuration

### 1. Créer la table Supabase

Dans le **SQL Editor** de ton projet Supabase, exécute le fichier `supabase_admin.sql` :

```sql
-- (contenu du fichier supabase_admin.sql)
```

### 2. Variables d'environnement Vercel

Va dans ton projet Vercel → Settings → Environment Variables et ajoute :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `ADMIN_PASSWORD` | *(ton mot de passe secret)* | Mot de passe pour accéder à l'admin |
| `SUPABASE_URL` | `https://wvwfrejojfktrdfkxvpj.supabase.co` | URL de ton projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | *(clé service_role)* | Dans Supabase : Settings → API → **service_role** (secret) |

> ⚠️ **Important :** Utilise la clé **service_role**, PAS la clé **anon**. La service_role est plus longue et commence souvent par `eyJ...`.  
> ⚠️ Ne jamais exposer la clé `service_role` côté frontend. Elle contourne les règles RLS.

**Si ça ne marche pas :** Ouvre la console du navigateur (F12) sur la page admin, clique sur « Arrêter le jeu », et regarde le message d’erreur affiché.

### 3. Accès à l'admin

- **URL** : `https://ton-site.vercel.app/admin.html`
- **Protection** : Seul quelqu’un connaissant l’URL et le mot de passe peut accéder.
- Pas de lien vers l’admin depuis le jeu, l’URL reste privée.

## Utilisation

1. Ouvre `https://ton-site.vercel.app/admin.html`
2. Entre le mot de passe
3. **Arrêter le jeu** : Clique sur « Arrêter le jeu » — les visiteurs voient le message et ne peuvent pas jouer.
4. **Reprendre** : Clique sur « Reprendre le jeu »
5. **Réinitialiser le classement** : Clique sur « Réinitialiser le classement » (demande une confirmation)

## Sécurité anti-triche (scores)

Le score ne doit plus être envoyé directement à Supabase depuis le navigateur.

### Ce qui a été ajouté

- API serveur: `api/submit-score.js`
- API serveur: `api/start-session.js`
- Le jeu appelle maintenant `/api/submit-score` au lieu de `supabase.rpc(...)` en direct.
- Garde-fous anti-triche minimaux (plafond score + progression trop rapide).
- Session de partie signée (token HMAC) : une session créée au démarrage, consommée une seule fois à la fin.

### Action obligatoire côté Supabase

Exécute `supabase_security_scores.sql` dans le SQL Editor pour:

- supprimer les policies d'écriture `anon` sur `scores`,
- garder uniquement la lecture publique du classement.

Exécute aussi `supabase_security_sessions.sql` pour créer la table `game_sessions` utilisée par l'anti-triche de session.

### Variables Vercel nécessaires

`api/submit-score.js` utilise:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SIGNING_SECRET` (secret aléatoire long, ex: 32+ caractères)

Assure-toi qu'elles sont bien définies dans Vercel, puis redeploy.
