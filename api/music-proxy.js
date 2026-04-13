// Vercel API Route — 외부 오디오 파일 프록시 (Jamendo 전용)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, provider = '', mode = 'preview' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'url 파라미터가 필요합니다.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: '잘못된 URL입니다.' });
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isJamendoHost =
    hostname === 'api.jamendo.com' ||
    hostname.endsWith('.jamendo.com') ||
    hostname.endsWith('.jamen.do');

  if (provider !== 'jamendo' || !isJamendoHost) {
    return res.status(400).json({ error: '허용되지 않은 URL입니다.' });
  }

  if (!['preview', 'export'].includes(mode)) {
    return res.status(400).json({ error: '허용되지 않은 mode입니다.' });
  }

  try {
    const response = await fetch(parsedUrl.toString());
    if (!response.ok) throw new Error(`오디오 로드 실패: ${response.status}`);

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control', mode === 'preview' ? 'public, max-age=3600' : 'public, max-age=86400');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
