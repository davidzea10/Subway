/**
 * API Admin Mboka Runner
 * Protégée par ADMIN_PASSWORD (variable d'environnement Vercel).
 * Nécessite SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
 */

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

  const { password, action, maintenance, message_maintenance } = req.body || {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, erreur: 'Mot de passe incorrect' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      ok: false,
      erreur: 'Configuration Supabase manquante (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)',
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Prefer: 'return=minimal',
  };

  try {
    if (action === 'set_maintenance') {
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/parametres_jeu?id=eq.1`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          maintenance: !!maintenance,
          message_maintenance: message_maintenance || 'Le jeu est temporairement indisponible.',
          updated_at: new Date().toISOString(),
        }),
      });
      if (!resSupa.ok) {
        const txt = await resSupa.text();
        throw new Error(txt || 'Erreur Supabase');
      }
      return res.status(200).json({
        ok: true,
        message: maintenance ? 'Jeu arrêté.' : 'Jeu reparti.',
      });
    }

    if (action === 'reset_classement') {
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/scores?id=neq.00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers,
      });
      if (!resSupa.ok) {
        const txt = await resSupa.text();
        throw new Error(txt || 'Erreur Supabase');
      }
      return res.status(200).json({ ok: true, message: 'Classement réinitialisé.' });
    }

    if (action === 'get_status') {
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/parametres_jeu?id=eq.1&select=maintenance,message_maintenance`, {
        method: 'GET',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (!resSupa.ok) {
        const txt = await resSupa.text();
        throw new Error(txt || 'Erreur Supabase');
      }
      const data = await resSupa.json();
      const row = data && data[0];
      return res.status(200).json({
        ok: true,
        maintenance: row?.maintenance ?? false,
        message_maintenance: row?.message_maintenance ?? 'Le jeu est temporairement indisponible.',
      });
    }

    return res.status(400).json({ ok: false, erreur: 'Action inconnue' });
  } catch (err) {
    console.error('Admin API:', err);
    return res.status(500).json({
      ok: false,
      erreur: err.message || 'Erreur serveur',
    });
  }
}
