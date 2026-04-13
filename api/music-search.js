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
    audiodlformat: 'mp32',
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

    const results = (data.results || []).map(track => ({
      id: track.id,
      name: track.name,
      duration: track.duration,
      artist_name: track.artist_name,
      album_name: track.album_name,
      image: track.image,
      audio: track.audio,
      audiodownload: track.audiodownload || '',
      audiodownload_allowed: track.audiodownload_allowed === true,
      previewUrl: track.audio
        ? `/api/music-proxy?provider=jamendo&mode=preview&url=${encodeURIComponent(track.audio)}`
        : '',
      exportUrl: track.audiodownload_allowed && track.audiodownload
        ? `/api/music-proxy?provider=jamendo&mode=export&url=${encodeURIComponent(track.audiodownload)}`
        : '',
      canExport: track.audiodownload_allowed === true && Boolean(track.audiodownload),
      provider: 'jamendo',
    }));

    res.status(200).json({
      headers: data.headers,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
