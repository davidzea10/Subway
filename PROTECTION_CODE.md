# Protection du code (Subway Runner DBZ)

## Limite importante

**On ne peut pas empêcher à 100 % qu’un visiteur voie le code.**  
Pour que le jeu fonctionne, le navigateur doit recevoir le HTML, le CSS et le JavaScript. Dès que ce code est sur l’appareil du visiteur, quelqu’un de déterminé peut l’inspecter (DevTools, « Afficher le code source », etc.). Aucune technique côté client ne « bloque » définitivement l’inspection.

Ce qu’on peut faire : **rendre le code très difficile à lire** pour un utilisateur lambda, afin qu’il ne soit pas facilement copiable ou compréhensible.

---

## Solution mise en place : obfuscation

Un script de build **obfusque** `jeu.js` : les noms de variables/fonctions sont transformés, les chaînes sont encodées, la structure est compactée. Le jeu fonctionne pareil, mais le code affiché dans l’inspecteur est illisible.

### Étapes

1. **Installer les outils (une fois)**  
   Dans le dossier `Subway`, en ligne de commande :
   ```bash
   npm install
   ```

2. **Générer la version « production »**  
   ```bash
   npm run build
   ```
   Cela crée le dossier **`dist/`** avec :
   - `jeu.js` (version obfusquée)
   - `index.html`, `style.css`, `supabaseConfig.js` (copiés tels quels)

3. **Partager / héberger**  
   Envoie ou déploie **le contenu du dossier `dist/`** (par ex. sur Netlify, Vercel, GitHub Pages, ou ton hébergeur).  
   Utilise l’URL de la page qui charge `index.html` de ce dossier (ex. `https://ton-site.com/` ou `https://ton-site.com/index.html`).

En ouvrant « Afficher le code source » ou l’inspecteur sur cette version, les visiteurs verront un JavaScript obfusqué, pas ton code lisible.

---

## Ce qui reste visible

- **`supabaseConfig.js`** : contient l’URL Supabase et la clé **anon**. Cette clé est faite pour être publique (elle est protégée par les règles RLS en base). Ne mets **jamais** une clé secrète (service_role) dans le front.
- **HTML et CSS** : structure et styles restent lisibles ; on n’obfusque que le JS du jeu. Si tu veux, tu peux aussi minifier le CSS pour la prod.

---

## En résumé

| Objectif                         | Possible ? |
|----------------------------------|------------|
| Bloquer totalement l’inspection   | Non        |
| Rendre le code illisible (obfusqué) | Oui (script de build) |
| Protéger la logique sensible     | Oui, en la mettant côté serveur (ex. Supabase, RPC) |

Pour ton cas : **partager le lien** en hébergeant le contenu de **`dist/`** après `npm run build` suffit pour que le code du jeu ne soit pas open source lisible dans le navigateur.
