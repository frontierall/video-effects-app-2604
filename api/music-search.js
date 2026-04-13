// Vercel API Route — Jamendo Music 검색 프록시
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client_id = process.env.JAMENDO_CLIENT_ID;
  if (!client_id) {
    return res.status(500).json({ error: 'JAMENDO_CLIENT_ID가 설정되지 않았습니다.' });
  }

  const { tags = '', q = '', per_page = '20' } = req.query;

  const params = new URLSearchParams({
    client_id,
    format: 'json',
    limit: per_page,
    audioformat: 'mp32',
    include: 'musicinfo',
  });
  if (tags) params.set('tags', tags);
  if (q) params.set('search', q);

  try {
    const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
    if (!response.ok) {
      throw new Error(`Jamendo API 오류: ${response.status}`);
    }
    const data = await response.json();
    if (data.headers?.code !== 0) {
      throw new Error(data.headers?.error_message || 'Jamendo API 오류');
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
