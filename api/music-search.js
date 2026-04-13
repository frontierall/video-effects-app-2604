// Vercel API Route — Pixabay Music 검색 프록시
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY가 설정되지 않았습니다.' });
  }

  const { genre = '', q = '', per_page = '20' } = req.query;

  const params = new URLSearchParams({ key, per_page });
  if (genre) params.set('genre', genre);
  if (q) params.set('q', q);

  try {
    const response = await fetch(`https://pixabay.com/api/music/?${params}`);
    if (!response.ok) {
      throw new Error(`Pixabay API 오류: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
