import crypto from 'crypto';

function signerSession(secret, sessionId, pseudo, startedAtIso, nonce) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}.${pseudo}.${startedAtIso}.${nonce}`)
    .digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, erreur: 'Méthode non autorisée' });

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sessionSecret = process.env.SESSION_SIGNING_SECRET;
  if (!supabaseUrl || !serviceKey || !sessionSecret) {
    return res.status(500).json({ ok: false, erreur: 'Config serveur manquante (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SIGNING_SECRET).' });
  }

  const pseudo = (req.body?.pseudo && String(req.body.pseudo).trim()) ? String(req.body.pseudo).trim() : 'Joueur';
  if (pseudo.length < 1 || pseudo.length > 20) {
    return res.status(400).json({ ok: false, erreur: 'Pseudo invalide.' });
  }

  const sessionId = crypto.randomUUID();
  const nonce = crypto.randomBytes(12).toString('hex');
  const startedAtIso = new Date().toISOString();
  const token = signerSession(sessionSecret, sessionId, pseudo, startedAtIso, nonce);

  try {
    const insRes = await fetch(`${supabaseUrl}/rest/v1/game_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id: sessionId,
        pseudo,
        started_at: startedAtIso,
        nonce,
        consumed: false,
      }),
    });
    const body = await insRes.text();
    if (!insRes.ok) throw new Error(body || `Erreur insertion session (${insRes.status})`);

    return res.status(200).json({
      ok: true,
      session_id: sessionId,
      session_token: token,
      started_at: startedAtIso,
    });
  } catch (e) {
    console.error('start-session:', e);
    return res.status(500).json({ ok: false, erreur: e.message || 'Erreur serveur.' });
  }
}

