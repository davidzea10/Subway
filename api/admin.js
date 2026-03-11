/**
 * API Admin Mboka Runner
 * Protégée par ADMIN_PASSWORD. Nécessite SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
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

  const { password, action, maintenance, message_maintenance, limit, offset, id } = req.body || {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, erreur: 'Mot de passe incorrect' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      ok: false,
      erreur: 'Variables Vercel manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (clé service_role, pas anon)',
    });
  }

  const baseHeaders = {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    if (action === 'set_maintenance') {
      // UPSERT : crée la ligne si elle n'existe pas, sinon met à jour
      const payload = {
        id: 1,
        maintenance: !!maintenance,
        message_maintenance: message_maintenance || 'Le jeu est temporairement indisponible.',
        updated_at: new Date().toISOString(),
      };
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/parametres_jeu?on_conflict=id`, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      });
      const errTxt = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(errTxt || `Supabase erreur ${resSupa.status}`);
      }
      return res.status(200).json({
        ok: true,
        message: maintenance ? 'Jeu arrêté.' : 'Jeu reparti.',
      });
    }

    if (action === 'reset_classement') {
      // DELETE tous les scores (filtre : id non nul = toutes les lignes)
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/scores?id=not.is.null`, {
        method: 'DELETE',
        headers: { ...baseHeaders, Prefer: 'return=minimal' },
      });
      const errTxt = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(errTxt || `Supabase erreur ${resSupa.status}`);
      }
      return res.status(200).json({ ok: true, message: 'Classement réinitialisé.' });
    }

    if (action === 'get_status') {
      const resSupa = await fetch(
        `${supabaseUrl}/rest/v1/parametres_jeu?id=eq.1&select=maintenance,message_maintenance`,
        {
          method: 'GET',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        }
      );
      const body = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(body || `Supabase erreur ${resSupa.status}`);
      }
      const data = JSON.parse(body || '[]');
      const row = data && data[0];
      return res.status(200).json({
        ok: true,
        maintenance: row?.maintenance ?? false,
        message_maintenance: row?.message_maintenance ?? 'Le jeu est temporairement indisponible.',
      });
    }

    if (action === 'get_classement') {
      const lim = Math.max(1, Math.min(200, Number.isFinite(+limit) ? +limit : 50));
      const resSupa = await fetch(
        `${supabaseUrl}/rest/v1/scores?select=pseudo,score,victoire,created_at&order=score.desc,created_at.asc&limit=${lim}`,
        {
          method: 'GET',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        }
      );
      const body = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(body || `Supabase erreur ${resSupa.status}`);
      }
      const data = JSON.parse(body || '[]');
      return res.status(200).json({ ok: true, data });
    }

    if (action === 'get_commentaires') {
      const lim = Math.max(1, Math.min(100, Number.isFinite(+limit) ? +limit : 20));
      const off = Math.max(0, Number.isFinite(+offset) ? +offset : 0);
      const resSupa = await fetch(
        `${supabaseUrl}/rest/v1/commentaires?select=id,pseudo,texte,created_at&order=created_at.desc&limit=${lim}&offset=${off}`,
        {
          method: 'GET',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        }
      );
      const body = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(body || `Supabase erreur ${resSupa.status}`);
      }
      const data = JSON.parse(body || '[]');
      return res.status(200).json({ ok: true, data });
    }

    if (action === 'get_remarques') {
      const lim = Math.max(1, Math.min(100, Number.isFinite(+limit) ? +limit : 20));
      const off = Math.max(0, Number.isFinite(+offset) ? +offset : 0);

      const resSupa = await fetch(
        `${supabaseUrl}/rest/v1/remarques?select=id,pseudo,texte,created_at&order=created_at.desc&limit=${lim}&offset=${off}`,
        { method: 'GET', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      const body = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(body || `Supabase erreur ${resSupa.status}`);
      }
      const data = JSON.parse(body || '[]');
      return res.status(200).json({ ok: true, data });
    }

    if (action === 'delete_remarque') {
      if (!id) return res.status(400).json({ ok: false, erreur: 'id manquant' });
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/remarques?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...baseHeaders, Prefer: 'return=minimal' },
      });
      const body = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(body || `Supabase erreur ${resSupa.status}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'delete_commentaire') {
      if (!id) return res.status(400).json({ ok: false, erreur: 'id manquant' });
      const resSupa = await fetch(`${supabaseUrl}/rest/v1/commentaires?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...baseHeaders, Prefer: 'return=minimal' },
      });
      const body = await resSupa.text();
      if (!resSupa.ok) {
        throw new Error(body || `Supabase erreur ${resSupa.status}`);
      }
      return res.status(200).json({ ok: true });
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
