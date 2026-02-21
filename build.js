/**
 * Build pour production : obfuscation du JS (rend le code difficile à lire dans le navigateur).
 * Usage : npm install && npm run build
 * Déploie ensuite le dossier dist/ (ou son contenu) sur ton hébergeur.
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

// Lire et obfusquer jeu.js
const jeuPath = path.join(ROOT, 'jeu.js');
let code = fs.readFileSync(jeuPath, 'utf8');

const obfuscated = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: false,  // évite de casser le jeu
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
});

fs.writeFileSync(path.join(DIST, 'jeu.js'), obfuscated.getObfuscatedCode(), 'utf8');
console.log('✓ dist/jeu.js (obfusqué)');

// Copier les fichiers nécessaires
const toCopy = ['index.html', 'style.css', 'supabaseConfig.js'];
toCopy.forEach((file) => {
  const src = path.join(ROOT, file);
  const dest = path.join(DIST, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('✓ dist/' + file);
  }
});

console.log('\n→ Déploie le contenu du dossier dist/ pour partager le jeu (code illisible dans le navigateur).');
