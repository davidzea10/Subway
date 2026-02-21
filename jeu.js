/**
 * Subway Runner - Logique du jeu
 * TP2 Programmation Jeux Vidéo
 * Les obstacles tombent du haut ; le personnage peut aller gauche, droite, avant, arrière.
 */

// ============== RÉFÉRENCES DOM ==============
const zoneJeu = document.getElementById('zone-jeu');
const ecranAccueil = document.getElementById('ecran-accueil');
const ecranChoixPersonnage = document.getElementById('ecran-choix-personnage');
const ecranGameOver = document.getElementById('ecran-game-over');
const boutonJouer = document.getElementById('bouton-jouer');
const boutonContinuer = document.getElementById('bouton-continuer');
const boutonRejouer = document.getElementById('bouton-rejouer');
const inputNom = document.getElementById('input-nom');
const texteJoueur = document.getElementById('texte-joueur');
const valeurScore = document.getElementById('valeur-score');
const valeurVies = document.getElementById('valeur-vies');
const valeurEtape = document.getElementById('valeur-etape');
const scoreFinal = document.getElementById('score-final');
const ecranVictoire = document.getElementById('ecran-victoire');
const scoreVictoire = document.getElementById('score-victoire');
const boutonRejouerVictoire = document.getElementById('bouton-rejouer-victoire');
const pageAide = document.getElementById('page-aide');
const pageHistorique = document.getElementById('page-historique');
const pageApropos = document.getElementById('page-apropos');
const listeHistorique = document.getElementById('liste-historique');
const ecranPause = document.getElementById('ecran-pause');
const boutonPause = document.getElementById('bouton-pause');
const boutonReprendre = document.getElementById('bouton-reprendre');
const boutonQuitter = document.getElementById('bouton-quitter');
const CLE_STOCKAGE_HISTORIQUE = 'subwayRunnerHistorique';

// Contexte du canvas pour dessiner
const ctx = zoneJeu.getContext('2d');

// ============== CONFIGURATION DU JEU ==============
const config = {
  largeurZone: 0,
  hauteurZone: 0,
  nombreLignes: 5,       // 5 colonnes (gauche-droite)
  nombreRangs: 6,       // 6 lignes (avant-arrière)
  scoreParEtape: 300,    // 300 points par étape → victoire à 1500
  nombreEtapes: 5,
  viesInitiales: 3,
  viesMax: 5,
};

// Paramètres par étape : vitesse haute, dernier niveau invivable
const parametresEtapes = [
  { vitesse: 6, intervalle: 65, fond: '#0d0d1a', secondaire: '#1a1a2e' },   // Étape 1
  { vitesse: 9, intervalle: 48, fond: '#1a0d1a', secondaire: '#2e1a2e' },   // Étape 2
  { vitesse: 12, intervalle: 36, fond: '#0d1a1a', secondaire: '#1a2e2e' }, // Étape 3
  { vitesse: 15, intervalle: 28, fond: '#1a1a0d', secondaire: '#2e2e1a' }, // Étape 4
  { vitesse: 20, intervalle: 20, fond: '#0d1a0d', secondaire: '#1a2e1a' }, // Étape 5 : invivable
];

// ============== ÉTAT DU JEU ==============
let enCours = false;
let enPause = false;
let score = 0;
let vies = config.viesInitiales;
let frameActuelle = 0;

// Position du personnage : colonne (0 à nombreLignes-1), rang (0 à nombreRangs-1)
// Rang 0 = en bas au milieu au démarrage
let colonnePersonnage = Math.floor(config.nombreLignes / 2);
let rangPersonnage = 0;

// Nom du joueur et personnage choisi (0 à 3)
let nomJoueur = '';
let personnageChoisi = 0;

// Dimensions d'une cellule (couloir / rang) en pixels
let largeurCellule = 0;
let hauteurCellule = 0;

// Liste des obstacles : chacun a { colonne, rang, type, decalageY }
// type = couleur normale ou 'parasite' (rouge, -2 vies)
let listeObstacles = [];

// Liste des étoiles qui descendent : { colonne, rang, decalageY }
let listeEtoiles = [];

// Compteur d'étoiles déjà apparues dans l'étape courante (étape 1 : max 2, autres : max 1)
let etoilesApparuesCetteEtape = 0;
let scoreAuDernierSpawnEtoile = -999;

// ============== INITIALISATION CANVAS ==============
function redimensionnerCanvas() {
  const rect = zoneJeu.getBoundingClientRect();
  const scale = Math.min(rect.width, rect.height);
  zoneJeu.width = config.largeurZone = Math.floor(scale);
  zoneJeu.height = config.hauteurZone = Math.floor(scale);
  largeurCellule = config.largeurZone / config.nombreLignes;
  hauteurCellule = config.hauteurZone / config.nombreRangs;
}

// ============== PERSONNAGE (4 styles distincts) ==============
function dessinerPersonnage() {
  const x = colonnePersonnage * largeurCellule + largeurCellule / 2;
  const y = (config.nombreRangs - 1 - rangPersonnage) * hauteurCellule + hauteurCellule / 2;
  const rayon = Math.min(largeurCellule, hauteurCellule) * 0.28;
  const contexte = ctx;

  switch (personnageChoisi) {
    case 0:
      // Héros bleu : cercle avec yeux ronds
      contexte.fillStyle = '#00d4ff';
      contexte.beginPath();
      contexte.arc(x, y, rayon, 0, Math.PI * 2);
      contexte.fill();
      contexte.strokeStyle = '#0099cc';
      contexte.lineWidth = 2;
      contexte.stroke();
      const tailleOeil = rayon * 0.25;
      contexte.fillStyle = '#fff';
      contexte.beginPath();
      contexte.arc(x - rayon * 0.3, y - rayon * 0.2, tailleOeil, 0, Math.PI * 2);
      contexte.arc(x + rayon * 0.3, y - rayon * 0.2, tailleOeil, 0, Math.PI * 2);
      contexte.fill();
      contexte.fillStyle = '#111';
      contexte.beginPath();
      contexte.arc(x - rayon * 0.3, y - rayon * 0.2, tailleOeil * 0.5, 0, Math.PI * 2);
      contexte.arc(x + rayon * 0.3, y - rayon * 0.2, tailleOeil * 0.5, 0, Math.PI * 2);
      contexte.fill();
      break;
    case 1:
      // Explorateur vert : carré avec chapeau (triangle)
      const cote = rayon * 1.6;
      contexte.fillStyle = '#00b894';
      contexte.fillRect(x - cote / 2, y - cote / 2, cote, cote);
      contexte.strokeStyle = '#009975';
      contexte.lineWidth = 2;
      contexte.strokeRect(x - cote / 2, y - cote / 2, cote, cote);
      contexte.fillStyle = '#2d3436';
      contexte.beginPath();
      contexte.moveTo(x, y - cote / 2 - rayon * 0.5);
      contexte.lineTo(x - rayon * 0.8, y - cote / 2);
      contexte.lineTo(x + rayon * 0.8, y - cote / 2);
      contexte.closePath();
      contexte.fill();
      contexte.strokeStyle = '#1e272e';
      contexte.stroke();
      contexte.fillStyle = '#fff';
      contexte.beginPath();
      contexte.arc(x - rayon * 0.25, y - rayon * 0.1, rayon * 0.2, 0, Math.PI * 2);
      contexte.arc(x + rayon * 0.25, y - rayon * 0.1, rayon * 0.2, 0, Math.PI * 2);
      contexte.fill();
      break;
    case 2:
      // Savant orange : cercle avec lunettes (cercles + trait)
      contexte.fillStyle = '#e17055';
      contexte.beginPath();
      contexte.arc(x, y, rayon, 0, Math.PI * 2);
      contexte.fill();
      contexte.strokeStyle = '#d63031';
      contexte.lineWidth = 2;
      contexte.stroke();
      const rLunette = rayon * 0.35;
      contexte.strokeStyle = '#2d3436';
      contexte.lineWidth = 3;
      contexte.beginPath();
      contexte.arc(x - rayon * 0.35, y - rayon * 0.15, rLunette, 0, Math.PI * 2);
      contexte.arc(x + rayon * 0.35, y - rayon * 0.15, rLunette, 0, Math.PI * 2);
      contexte.moveTo(x - rayon * 0.35 + rLunette, y - rayon * 0.15);
      contexte.lineTo(x + rayon * 0.35 - rLunette, y - rayon * 0.15);
      contexte.stroke();
      contexte.fillStyle = '#111';
      contexte.beginPath();
      contexte.arc(x - rayon * 0.35, y - rayon * 0.15, rayon * 0.12, 0, Math.PI * 2);
      contexte.arc(x + rayon * 0.35, y - rayon * 0.15, rayon * 0.12, 0, Math.PI * 2);
      contexte.fill();
      break;
    case 3:
      // Fantôme violet : forme ovale + yeux en amande
      contexte.fillStyle = '#a29bfe';
      contexte.beginPath();
      contexte.ellipse(x, y, rayon * 0.9, rayon * 1.1, 0, 0, Math.PI * 2);
      contexte.fill();
      contexte.strokeStyle = '#6c5ce7';
      contexte.lineWidth = 2;
      contexte.stroke();
      contexte.fillStyle = '#2d3436';
      contexte.beginPath();
      contexte.ellipse(x - rayon * 0.3, y - rayon * 0.2, rayon * 0.2, rayon * 0.35, 0, 0, Math.PI * 2);
      contexte.ellipse(x + rayon * 0.3, y - rayon * 0.2, rayon * 0.2, rayon * 0.35, 0, 0, Math.PI * 2);
      contexte.fill();
      break;
  }
}

// Dessin d'un aperçu du personnage dans un petit canvas (pour l'écran de choix)
function dessinerApercuPersonnage(canvas, indexPerso) {
  const c = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const x = w / 2;
  const y = h / 2;
  const rayon = Math.min(w, h) * 0.35;
  c.fillStyle = '#0d0d1a';
  c.fillRect(0, 0, w, h);
  if (indexPerso === 0) {
    c.fillStyle = '#00d4ff';
    c.beginPath();
    c.arc(x, y, rayon, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#0099cc';
    c.stroke();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(x - rayon * 0.3, y - rayon * 0.2, rayon * 0.25, 0, Math.PI * 2);
    c.arc(x + rayon * 0.3, y - rayon * 0.2, rayon * 0.25, 0, Math.PI * 2);
    c.fill();
  } else if (indexPerso === 1) {
    const cote = rayon * 1.6;
    c.fillStyle = '#00b894';
    c.fillRect(x - cote / 2, y - cote / 2, cote, cote);
    c.fillStyle = '#2d3436';
    c.beginPath();
    c.moveTo(x, y - cote / 2 - rayon * 0.5);
    c.lineTo(x - rayon * 0.8, y - cote / 2);
    c.lineTo(x + rayon * 0.8, y - cote / 2);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(x - rayon * 0.25, y - rayon * 0.1, rayon * 0.2, 0, Math.PI * 2);
    c.arc(x + rayon * 0.25, y - rayon * 0.1, rayon * 0.2, 0, Math.PI * 2);
    c.fill();
  } else if (indexPerso === 2) {
    c.fillStyle = '#e17055';
    c.beginPath();
    c.arc(x, y, rayon, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2d3436';
    c.lineWidth = 2;
    const rL = rayon * 0.35;
    c.beginPath();
    c.arc(x - rayon * 0.35, y - rayon * 0.15, rL, 0, Math.PI * 2);
    c.arc(x + rayon * 0.35, y - rayon * 0.15, rL, 0, Math.PI * 2);
    c.moveTo(x - rayon * 0.35 + rL, y - rayon * 0.15);
    c.lineTo(x + rayon * 0.35 - rL, y - rayon * 0.15);
    c.stroke();
  } else {
    c.fillStyle = '#a29bfe';
    c.beginPath();
    c.ellipse(x, y, rayon * 0.9, rayon * 1.1, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#2d3436';
    c.beginPath();
    c.ellipse(x - rayon * 0.3, y - rayon * 0.2, rayon * 0.2, rayon * 0.35, 0, 0, Math.PI * 2);
    c.ellipse(x + rayon * 0.3, y - rayon * 0.2, rayon * 0.2, rayon * 0.35, 0, 0, Math.PI * 2);
    c.fill();
  }
}

// ============== ÉTAPE ACTUELLE (déduite du score) ==============
function obtenirEtapeActuelle() {
  return Math.min(config.nombreEtapes, 1 + Math.floor(score / config.scoreParEtape));
}

// ============== OBSTACLES ==============
// Types normaux (couleurs) ; parasite = rouge, enlève 2 vies
const typesObstaclesNormaux = ['#ffa502', '#7b2cbf', '#00b894'];
const COULEUR_PARASITE = '#cc0000';

function spawnObstacle() {
  const colonne = Math.floor(Math.random() * config.nombreLignes);
  const etape = obtenirEtapeActuelle();
  const parametres = parametresEtapes[etape - 1];
  // À partir de l'étape 2, possibilité de spawn un parasite (rouge)
  const estParasite = etape >= 2 && Math.random() < 0.25;
  const type = estParasite ? 'parasite' : typesObstaclesNormaux[Math.floor(Math.random() * typesObstaclesNormaux.length)];
  listeObstacles.push({
    colonne,
    rang: 0,
    type,
    decalageY: 0,
  });
}

function dessinerObstacles() {
  const marge = 4;
  const largeurObs = largeurCellule - marge * 2;
  const hauteurObs = hauteurCellule - marge * 2;

  listeObstacles.forEach((obs) => {
    const x = obs.colonne * largeurCellule + marge;
    const y = obs.rang * hauteurCellule + obs.decalageY + marge;
    const couleur = obs.type === 'parasite' ? COULEUR_PARASITE : obs.type;
    ctx.fillStyle = couleur;
    ctx.fillRect(x, y, largeurObs, hauteurObs);
    ctx.strokeStyle = obs.type === 'parasite' ? '#ff4444' : 'rgba(0,0,0,0.4)';
    ctx.lineWidth = obs.type === 'parasite' ? 3 : 2;
    ctx.strokeRect(x, y, largeurObs, hauteurObs);
  });
}

function mettreAJourObstacles() {
  const etape = obtenirEtapeActuelle();
  const vitesse = parametresEtapes[etape - 1].vitesse;
  for (let i = listeObstacles.length - 1; i >= 0; i--) {
    const obs = listeObstacles[i];
    obs.decalageY += vitesse;
    if (obs.decalageY >= hauteurCellule) {
      obs.decalageY -= hauteurCellule;
      obs.rang += 1;
    }
    if (obs.rang >= config.nombreRangs && obs.decalageY >= 0) {
      listeObstacles.splice(i, 1);
      score += 10;
    }
  }
}

// ============== ÉTOILES (récompense +1 vie, max 5) ==============
function spawnEtoile() {
  const colonne = Math.floor(Math.random() * config.nombreLignes);
  listeEtoiles.push({ colonne, rang: 0, decalageY: 0 });
  etoilesApparuesCetteEtape++;
  scoreAuDernierSpawnEtoile = score;
}

function mettreAJourEtoiles() {
  const etape = obtenirEtapeActuelle();
  const vitesse = parametresEtapes[etape - 1].vitesse + 0.5; // Légèrement plus rapide que les obstacles
  for (let i = listeEtoiles.length - 1; i >= 0; i--) {
    const etoile = listeEtoiles[i];
    etoile.decalageY += vitesse;
    if (etoile.decalageY >= hauteurCellule) {
      etoile.decalageY -= hauteurCellule;
      etoile.rang += 1;
    }
    if (etoile.rang >= config.nombreRangs && etoile.decalageY >= 0) {
      listeEtoiles.splice(i, 1);
    }
  }
}

function dessinerEtoiles() {
  const marge = 6;
  listeEtoiles.forEach((etoile) => {
    const cx = etoile.colonne * largeurCellule + largeurCellule / 2;
    const cy = etoile.rang * hauteurCellule + etoile.decalageY + hauteurCellule / 2;
    const rayon = Math.min(largeurCellule, hauteurCellule) * 0.2;
    // Dessin étoile 5 branches (polygone)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? rayon : rayon * 0.4;
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function collisionPersonnageEtoile() {
  const marge = 4;
  const hautCellulePerso = (config.nombreRangs - 1 - rangPersonnage) * hauteurCellule;
  const basCellulePerso = hautCellulePerso + hauteurCellule;
  for (let i = listeEtoiles.length - 1; i >= 0; i--) {
    const etoile = listeEtoiles[i];
    if (etoile.colonne !== colonnePersonnage) continue;
    const hautEtoile = etoile.rang * hauteurCellule + etoile.decalageY;
    const basEtoile = hautEtoile + hauteurCellule;
    const chevauchement = basCellulePerso >= hautEtoile && hautCellulePerso <= basEtoile;
    if (chevauchement) {
      vies = Math.min(config.viesMax, vies + 1);
      valeurVies.textContent = vies;
      listeEtoiles.splice(i, 1);
      return;
    }
  }
}

// ============== DÉTECTION DE COLLISION ==============
const margeCollision = 4;

function obtenirCellulePerso() {
  const haut = (config.nombreRangs - 1 - rangPersonnage) * hauteurCellule;
  return { haut, bas: haut + hauteurCellule };
}

function collisionPersonnageObstacle() {
  const { haut: hautCellulePerso, bas: basCellulePerso } = obtenirCellulePerso();
  for (const obs of listeObstacles) {
    if (obs.colonne !== colonnePersonnage) continue;
    const hautObs = obs.rang * hauteurCellule + obs.decalageY + margeCollision;
    const basObs = hautObs + hauteurCellule - margeCollision * 2;
    const chevauchement = basCellulePerso >= hautObs && hautCellulePerso <= basObs;
    if (chevauchement) return obs;
  }
  return null;
}

// ============== DÉPLACEMENT DU PERSONNAGE ==============
// Déplace d'exactement une case dans la direction donnée (appelé une fois par appui touche)
function deplacerUneCase(direction) {
  switch (direction) {
    case 'gauche':
      colonnePersonnage = Math.max(0, colonnePersonnage - 1);
      break;
    case 'droite':
      colonnePersonnage = Math.min(config.nombreLignes - 1, colonnePersonnage + 1);
      break;
    case 'avant':
      rangPersonnage = Math.min(config.nombreRangs - 1, rangPersonnage + 1);
      break;
    case 'arriere':
      rangPersonnage = Math.max(0, rangPersonnage - 1);
      break;
  }
}

// ============== BOUCLE PRINCIPALE ==============
let etapePrecedente = 1;

function dessinerGrille() {
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= config.nombreLignes; c++) {
    ctx.beginPath();
    ctx.moveTo(c * largeurCellule, 0);
    ctx.lineTo(c * largeurCellule, config.hauteurZone);
    ctx.stroke();
  }
  for (let r = 0; r <= config.nombreRangs; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * hauteurCellule);
    ctx.lineTo(config.largeurZone, r * hauteurCellule);
    ctx.stroke();
  }
}

function dessinerFondEtape() {
  const etape = obtenirEtapeActuelle();
  const params = parametresEtapes[etape - 1];
  const gradient = ctx.createLinearGradient(0, 0, 0, config.hauteurZone);
  gradient.addColorStop(0, params.secondaire);
  gradient.addColorStop(1, params.fond);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.largeurZone, config.hauteurZone);
}

function boucleJeu() {
  if (!enCours) return;
  if (enPause) {
    requestAnimationFrame(boucleJeu);
    return;
  }

  frameActuelle++;
  const etape = obtenirEtapeActuelle();
  const parametres = parametresEtapes[etape - 1];

  // Nouvelle étape : réinitialiser le compteur d'étoiles pour cette étape
  if (etape > etapePrecedente) {
    etoilesApparuesCetteEtape = 0;
    scoreAuDernierSpawnEtoile = score;
    etapePrecedente = etape;
  }

  // Spawn obstacles selon l'intervalle de l'étape
  if (frameActuelle % parametres.intervalle === 0) {
    spawnObstacle();
  }

  // Spawn étoiles : étape 1 = 2 étoiles max, étapes 2-5 = 1 étoile (quand la vitesse s'accélère)
  const maxEtoilesEtape = etape === 1 ? 2 : 1;
  const scoreMinimumPourEtoile = 40;
  const scoreEntreEtoiles = 70;
  if (
    etoilesApparuesCetteEtape < maxEtoilesEtape &&
    score >= scoreMinimumPourEtoile &&
    score - scoreAuDernierSpawnEtoile >= scoreEntreEtoiles
  ) {
    spawnEtoile();
  }

  mettreAJourObstacles();
  mettreAJourEtoiles();
  collisionPersonnageEtoile();

  // Collision obstacle : normal -1 vie, parasite -2 vies
  const obsTouche = collisionPersonnageObstacle();
  if (obsTouche) {
    const degats = obsTouche.type === 'parasite' ? 2 : 1;
    vies = Math.max(0, vies - degats);
    valeurVies.textContent = vies;
    const { haut: hautCellulePerso, bas: basCellulePerso } = obtenirCellulePerso();
    listeObstacles = listeObstacles.filter((obs) => {
      if (obs.colonne !== colonnePersonnage) return true;
      const hautObs = obs.rang * hauteurCellule + obs.decalageY + margeCollision;
      const basObs = hautObs + hauteurCellule - margeCollision * 2;
      const chevauchement = basCellulePerso >= hautObs && hautCellulePerso <= basObs;
      return !chevauchement;
    });
    if (vies <= 0) {
      finPartie();
      return;
    }
  }

  // Victoire : 5 étapes complétées (score >= 1000)
  if (score >= config.nombreEtapes * config.scoreParEtape) {
    finVictoire();
    return;
  }

  valeurScore.textContent = score;
  valeurEtape.textContent = etape;

  dessinerFondEtape();
  dessinerGrille();
  dessinerObstacles();
  dessinerEtoiles();
  dessinerPersonnage();

  requestAnimationFrame(boucleJeu);
}

// ============== DÉMARRAGE ET FIN DE PARTIE ==============
function demarrerPartie() {
  enCours = true;
  score = 0;
  vies = config.viesInitiales;
  frameActuelle = 0;
  etapePrecedente = 1;
  listeObstacles = [];
  listeEtoiles = [];
  etoilesApparuesCetteEtape = 0;
  scoreAuDernierSpawnEtoile = -999;
  colonnePersonnage = Math.floor(config.nombreLignes / 2);
  rangPersonnage = 0;

  valeurScore.textContent = score;
  valeurVies.textContent = vies;
  valeurEtape.textContent = 1;
  enPause = false;
  ecranAccueil.classList.add('cache');
  ecranChoixPersonnage.classList.add('cache');
  ecranGameOver.classList.add('cache');
  ecranVictoire.classList.add('cache');
  ecranPause.classList.add('cache');
  document.getElementById('interface-jeu').classList.remove('cache');
  document.getElementById('boutons-jeu').classList.remove('cache');

  requestAnimationFrame(boucleJeu);
}

function mettreEnPause() {
  enPause = true;
  ecranPause.classList.remove('cache');
}

function reprendrePartie() {
  enPause = false;
  ecranPause.classList.add('cache');
}

function quitterPartie() {
  enCours = false;
  enPause = false;
  document.getElementById('interface-jeu').classList.add('cache');
  document.getElementById('boutons-jeu').classList.add('cache');
  ecranPause.classList.add('cache');
  ecranAccueil.classList.remove('cache');
}

function finPartie() {
  enCours = false;
  scoreFinal.textContent = score;
  enregistrerDansHistorique(nomJoueur, score, false);
  document.getElementById('interface-jeu').classList.add('cache');
  document.getElementById('boutons-jeu').classList.add('cache');
  ecranGameOver.classList.remove('cache');
}

function finVictoire() {
  enCours = false;
  scoreVictoire.textContent = score;
  enregistrerDansHistorique(nomJoueur, score, true);
  document.getElementById('interface-jeu').classList.add('cache');
  document.getElementById('boutons-jeu').classList.add('cache');
  ecranVictoire.classList.remove('cache');
}

function rejouer() {
  ecranGameOver.classList.add('cache');
  ecranVictoire.classList.add('cache');
  demarrerPartie();
}

// ============== ÉVÉNEMENTS CLAVIER ==============
// Un appui = une case. On ignore la répétition (e.repeat) pour ne pas sauter de cases.
document.addEventListener('keydown', (e) => {
  if (!enCours) return;
  if (e.repeat) return; // Touche maintenue : ne pas déplacer encore
  e.preventDefault();

  switch (e.key) {
    case 'ArrowLeft':
    case 'q':
    case 'Q':
      deplacerUneCase('gauche');
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      deplacerUneCase('droite');
      break;
    case 'ArrowUp':
    case 'z':
    case 'Z':
      deplacerUneCase('avant');
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      deplacerUneCase('arriere');
      break;
  }
});

// ============== CONTRÔLES TACTILES (mobile) ==============
// Glisser le doigt sur l'écran = un déplacement (comme Subway Surfers). Un geste = une case.
const SEUIL_SWIPE_PX = 40; // Déplacement minimum en pixels pour compter comme un swipe
let touchStartX = 0;
let touchStartY = 0;

function installerControlesSwipe() {
  zoneJeu.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: false });

  zoneJeu.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!enCours || !e.changedTouches || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < SEUIL_SWIPE_PX && absY < SEUIL_SWIPE_PX) return;
    if (absX > absY) {
      deplacerUneCase(deltaX > 0 ? 'droite' : 'gauche');
    } else {
      deplacerUneCase(deltaY > 0 ? 'arriere' : 'avant');
    }
  }, { passive: false });
}
installerControlesSwipe();

// ============== HISTORIQUE (localStorage) ==============
function enregistrerDansHistorique(nom, points, victoire) {
  const nomAffichage = nom && nom.trim() ? nom.trim() : 'Joueur';
  try {
    const historique = JSON.parse(localStorage.getItem(CLE_STOCKAGE_HISTORIQUE) || '[]');
    historique.unshift({
      nom: nomAffichage,
      score: points,
      victoire: !!victoire,
      date: new Date().toLocaleString('fr-FR'),
    });
    localStorage.setItem(CLE_STOCKAGE_HISTORIQUE, JSON.stringify(historique.slice(0, 50)));
  } catch (e) {}
}

function afficherHistorique() {
  try {
    const historique = JSON.parse(localStorage.getItem(CLE_STOCKAGE_HISTORIQUE) || '[]');
    listeHistorique.innerHTML = historique.length
      ? historique.map((e) => `<li>${e.nom} — <span class="score-histo">${e.score}</span> pts${e.victoire ? ' ✓ Victoire' : ''} — ${e.date}</li>`).join('')
      : '<li>Aucune partie enregistrée.</li>';
  } catch (e) {
    listeHistorique.innerHTML = '<li>Erreur chargement.</li>';
  }
}

// ============== ACCUEIL : Aide, Historique, Continuer, Choix personnage ==============
document.getElementById('bouton-aide').addEventListener('click', () => {
  pageAide.classList.remove('cache');
});
document.getElementById('fermer-aide').addEventListener('click', () => {
  pageAide.classList.add('cache');
});

document.getElementById('bouton-historique').addEventListener('click', () => {
  afficherHistorique();
  pageHistorique.classList.remove('cache');
});
document.getElementById('fermer-historique').addEventListener('click', () => {
  pageHistorique.classList.add('cache');
});

document.getElementById('bouton-apropos').addEventListener('click', () => {
  pageApropos.classList.remove('cache');
});
document.getElementById('fermer-apropos').addEventListener('click', () => {
  pageApropos.classList.add('cache');
});

boutonContinuer.addEventListener('click', () => {
  const nom = (inputNom.value || '').trim();
  if (!nom) {
    alert('Entre ton pseudo pour continuer.');
    return;
  }
  nomJoueur = nom;
  texteJoueur.textContent = nom + ', choisis ton personnage :';
  ecranAccueil.classList.add('cache');
  ecranChoixPersonnage.classList.remove('cache');
  document.querySelectorAll('.choix-perso').forEach((b) => b.classList.remove('selectionne'));
  document.querySelector(`.choix-perso[data-perso="${personnageChoisi}"]`).classList.add('selectionne');
});

document.querySelectorAll('.choix-perso').forEach((btn) => {
  btn.addEventListener('click', () => {
    personnageChoisi = parseInt(btn.getAttribute('data-perso'), 10);
    document.querySelectorAll('.choix-perso').forEach((b) => b.classList.remove('selectionne'));
    btn.classList.add('selectionne');
  });
});

boutonJouer.addEventListener('click', () => {
  ecranChoixPersonnage.classList.add('cache');
  demarrerPartie();
});

boutonPause.addEventListener('click', mettreEnPause);
boutonReprendre.addEventListener('click', reprendrePartie);
boutonQuitter.addEventListener('click', quitterPartie);

// Aperçus des personnages sur l'écran de choix
document.querySelectorAll('.apercu-perso').forEach((canvas, i) => {
  dessinerApercuPersonnage(canvas, i);
});

// ============== BOUTONS ET REDIMENSIONNEMENT ==============
boutonRejouer.addEventListener('click', rejouer);
boutonRejouerVictoire.addEventListener('click', rejouer);

window.addEventListener('resize', () => {
  redimensionnerCanvas();
  if (enCours) ctx.fillRect(0, 0, config.largeurZone, config.hauteurZone);
});

// Premier redimensionnement au chargement
redimensionnerCanvas();
