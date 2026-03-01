/**
 * API publique - état du jeu (maintenance)
 * Pas d'authentification. Le jeu peut l'utiliser si Supabase est indisponible.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET') {
    return res.status(405).json({ maintenance: false, message: '' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({
      maintenance: false,
      message: 'Le jeu est temporairement indisponible.',
    });
  }

  try {
    const resSupa = await fetch(
      `${supabaseUrl}/rest/v1/parametres_jeu?id=eq.1&select=maintenance,message_maintenance`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      }
    );
    if (!resSupa.ok) {
      return res.status(200).json({ maintenance: false, message: '' });
    }
    const data = await resSupa.json();
    const row = data && data[0];
    return res.status(200).json({
      maintenance: !!row?.maintenance,
      message: row?.message_maintenance || 'Le jeu est temporairement indisponible.',
    });
  } catch (e) {
    return res.status(200).json({ maintenance: false, message: '' });
  }
}
