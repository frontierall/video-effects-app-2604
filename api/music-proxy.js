// Vercel API Route — Pixabay 오디오 파일 프록시 (CORS 우회용)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  // Pixabay CDN URL만 허용 (보안)
  if (!url || !url.startsWith('https://cdn.pixabay.com/')) {
    return res.status(400).json({ error: '허용되지 않은 URL입니다.' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`오디오 로드 실패: ${response.status}`);

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
