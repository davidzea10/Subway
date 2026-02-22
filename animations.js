/**
 * Mboka Runner - Animations et effets visuels
 * Effets : dernière vie, collision obstacle (vertige), récupération étoile (bénédiction)
 */

(function (global) {
  'use strict';

  const conteneurJeu = document.getElementById('conteneur-jeu');
  if (!conteneurJeu) return;

  // ============== ALERTE DERNIÈRE VIE (1 vie restante) ==============
  function alerteDerniereVie() {
    conteneurJeu.classList.add('effet-derniere-vie');
    const el = document.getElementById('alerte-vies');
    if (el) {
      el.classList.remove('cache');
      el.textContent = '⚠️ Dernière vie !';
      setTimeout(() => el.classList.add('cache'), 2500);
    }
    setTimeout(() => conteneurJeu.classList.remove('effet-derniere-vie'), 2500);
  }

  // ============== VERTIGE (obstacle frappe) ==============
  function effetVertige(dureeMs = 1200) {
    conteneurJeu.classList.add('effet-vertige');
    setTimeout(() => conteneurJeu.classList.remove('effet-vertige'), dureeMs);
  }

  // ============== BÉNÉDICTION (réception étoile) ==============
  function effetBenefiction() {
    conteneurJeu.classList.add('effet-benefiction');
    setTimeout(() => conteneurJeu.classList.remove('effet-benefiction'), 800);
  }

  // Exposer l'API pour jeu.js
  global.AnimationsMboka = {
    alerteDerniereVie,
    effetVertige,
    effetBenefiction,
  };
})(typeof window !== 'undefined' ? window : this);
