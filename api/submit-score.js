/**
 * Endpoint sécurisé d'envoi de score.
 * Le client ne doit plus écrire directement dans la table scores.
 */
import crypto from 'crypto';

function signerSession(secret, sessionId, pseudo, startedAtIso, nonce) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}.${pseudo}.${startedAtIso}.${nonce}`)
    .digest('hex');
}

function safeEquals(a, b) {
  try {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erreur: 'Méthode non autorisée' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sessionSecret = process.env.SESSION_SIGNING_SECRET;
  if (!supabaseUrl || !serviceKey || !sessionSecret) {
    return res.status(500).json({ ok: false, erreur: 'Configuration serveur manquante.' });
  }

  const { pseudo, score, victoire, session_id, session_token } = req.body || {};
  const nom = (pseudo && String(pseudo).trim()) ? String(pseudo).trim() : 'Joueur';
  const points = Number(score);
  const isVictoire = !!victoire;

  // Validations de base
  if (!Number.isFinite(points) || points < 0 || points > 5000) {
    return res.status(400).json({ ok: false, erreur: 'Score invalide.' });
  }
  if (nom.length < 1 || nom.length > 20) {
    return res.status(400).json({ ok: false, erreur: 'Pseudo invalide.' });
  }
  if (!session_id || !session_token) {
    return res.status(400).json({ ok: false, erreur: 'Session de partie manquante.' });
  }

  try {
    // 1) Valider la session de partie (token signé + non consommée)
    const sessRes = await fetch(
      `${supabaseUrl}/rest/v1/game_sessions?id=eq.${encodeURIComponent(session_id)}&select=id,pseudo,started_at,nonce,consumed,consumed_at&limit=1`,
      {
        method: 'GET',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }
    );
    const sessBody = await sessRes.text();
    if (!sessRes.ok) {
      throw new Error(sessBody || `Erreur lecture session (${sessRes.status})`);
    }
    const sessions = JSON.parse(sessBody || '[]');
    const session = sessions && sessions[0];
    if (!session) return res.status(400).json({ ok: false, erreur: 'Session inconnue.' });
    if (session.consumed) return res.status(400).json({ ok: false, erreur: 'Session déjà utilisée.' });

    const attendu = signerSession(sessionSecret, session.id, session.pseudo, session.started_at, session.nonce);
    if (!safeEquals(attendu, session_token)) {
      return res.status(400).json({ ok: false, erreur: 'Token session invalide.' });
    }
    if (String(session.pseudo || '').toLowerCase() !== nom.toLowerCase()) {
      return res.status(400).json({ ok: false, erreur: 'Pseudo session invalide.' });
    }

    // 2) Validation score basé sur durée réelle de session
    const elapsedSec = Math.max(1, Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000));
    if (elapsedSec < 5) {
      return res.status(400).json({ ok: false, erreur: 'Partie trop courte, score rejeté.' });
    }
    if (elapsedSec > 2 * 60 * 60) {
      return res.status(400).json({ ok: false, erreur: 'Session expirée, score rejeté.' });
    }
    const maxPossibleScore = Math.floor(elapsedSec * 25 + 400); // marge selon rythme du jeu
    if (points > maxPossibleScore) {
      return res.status(400).json({
        ok: false,
        erreur: 'Score rejeté (incohérent avec la durée de la partie).',
      });
    }

    // 3) Ecriture score
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/insert_or_update_score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        p_pseudo: nom,
        p_score: points,
        p_victoire: isVictoire,
      }),
    });
    const rpcBody = await rpcRes.text();
    if (!rpcRes.ok) {
      throw new Error(rpcBody || `Erreur écriture score (${rpcRes.status})`);
    }

    // 4) Marquer session consommée pour empêcher la réutilisation
    const updRes = await fetch(`${supabaseUrl}/rest/v1/game_sessions?id=eq.${encodeURIComponent(session.id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        consumed: true,
        consumed_at: new Date().toISOString(),
      }),
    });
    const updBody = await updRes.text();
    if (!updRes.ok) {
      throw new Error(updBody || `Erreur clôture session (${updRes.status})`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('submit-score:', e);
    return res.status(500).json({ ok: false, erreur: e.message || 'Erreur serveur.' });
  }
}

