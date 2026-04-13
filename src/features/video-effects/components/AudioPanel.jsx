import { useState, useRef } from 'react';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';

const GENRES = [
  { value: '',           label: '전체' },
  { value: 'ambient',    label: 'Ambient' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'cinematic',  label: 'Cinematic' },
  { value: 'jazz',       label: 'Jazz' },
  { value: 'classical',  label: 'Classical' },
  { value: 'pop',        label: 'Pop' },
  { value: 'rock',       label: 'Rock' },
  { value: 'hip-hop',    label: 'Hip-Hop' },
  { value: 'folk',       label: 'Folk' },
];

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function AudioPanel() {
  const { backgroundMusic, setBackgroundMusic, setMusicVolume, clearBackgroundMusic } =
    useVideoEffectsStore();

  const [source, setSource] = useState('upload'); // 'upload' | 'library'
  const [genre, setGenre] = useState('');
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [previewingUrl, setPreviewingUrl] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── 파일 업로드 ──────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setBackgroundMusic({
      name: file.name.replace(/\.[^.]+$/, ''),
      previewUrl: blobUrl,
      exportUrl: blobUrl,
      volume: 0.8,
      isExternal: false,
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const blobUrl = URL.createObjectURL(file);
      setBackgroundMusic({
        name: file.name.replace(/\.[^.]+$/, ''),
        previewUrl: blobUrl,
        exportUrl: blobUrl,
        volume: 0.8,
        isExternal: false,
      });
    }
  }

  // ── Pixabay 검색 ──────────────────────────────────────
  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setTracks([]);
    try {
      const params = new URLSearchParams({ per_page: '15' });
      if (genre) params.set('genre', genre);
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/music-search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '검색 실패');
      setTracks(data.hits || []);
      if ((data.hits || []).length === 0) setSearchError('검색 결과가 없습니다.');
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }

  // ── 트랙 미리듣기 ──────────────────────────────────────
  function handlePreview(track) {
    if (previewingUrl === track.audio_url) {
      previewAudioRef.current?.pause();
      setPreviewingUrl(null);
      return;
    }
    setPreviewingUrl(track.audio_url);
    if (previewAudioRef.current) {
      previewAudioRef.current.src = track.audio_url;
      previewAudioRef.current.play().catch(() => {});
    }
  }

  // ── 트랙 선택 (proxy URL로 export 경로 설정) ──────────────
  async function handleSelectTrack(track) {
    setLoadingId(track.id);
    try {
      setBackgroundMusic({
        name: track.title || `Track #${track.id}`,
        previewUrl: track.audio_url,
        exportUrl: `/api/music-proxy?url=${encodeURIComponent(track.audio_url)}`,
        volume: 0.8,
        isExternal: true,
      });
      // 미리듣기 정지
      previewAudioRef.current?.pause();
      setPreviewingUrl(null);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* 숨긴 오디오 (라이브러리 미리듣기용) */}
      <audio ref={previewAudioRef} onEnded={() => setPreviewingUrl(null)} />

      {/* 현재 선택된 음악 */}
      {backgroundMusic ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-green-600 dark:text-green-400 text-lg">🎵</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-800 dark:text-green-300 truncate">
                  {backgroundMusic.name}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-500">
                  {backgroundMusic.isExternal ? 'Pixabay' : '업로드된 파일'}
                </p>
              </div>
            </div>
            <button
              onClick={clearBackgroundMusic}
              className="shrink-0 p-1 text-green-500 hover:text-red-500 transition-colors"
              title="음악 제거"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 볼륨 슬라이더 */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">🔊 볼륨</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={backgroundMusic.volume}
              onChange={e => setMusicVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 appearance-none bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer accent-green-500"
            />
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(backgroundMusic.volume * 100)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-center">
          <p className="text-xs text-gray-400">선택된 음악 없음 — 아래에서 추가하세요</p>
        </div>
      )}

      {/* 소스 탭 */}
      <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {[
          { id: 'upload',  label: '📁 내 파일 업로드' },
          { id: 'library', label: '🔍 Pixabay 라이브러리' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSource(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              source === tab.id
                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 파일 업로드 섹션 ── */}
      {source === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-red-400 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-all"
        >
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              드래그하거나 클릭해서 업로드
            </p>
            <p className="text-xs text-gray-400 mt-1">MP3 · WAV · OGG · M4A</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Pixabay 라이브러리 섹션 ── */}
      {source === 'library' && (
        <div className="space-y-4">
          {/* 장르 + 검색 */}
          <div className="flex gap-2">
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400/50"
            >
              {GENRES.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="키워드 검색..."
              className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              {searching ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : '검색'}
            </button>
          </div>

          {/* 에러 */}
          {searchError && (
            <p className="text-xs text-red-500 text-center py-2">{searchError}</p>
          )}

          {/* 트랙 목록 */}
          {tracks.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {tracks.map(track => {
                const isSelected = backgroundMusic?.previewUrl === track.audio_url;
                const isPreviewing = previewingUrl === track.audio_url;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {/* 미리듣기 버튼 */}
                    <button
                      onClick={() => handlePreview(track)}
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isPreviewing
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {isPreviewing ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    {/* 트랙 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {track.title || `Track #${track.id}`}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {track.user} · {formatDuration(track.duration)}
                      </p>
                    </div>

                    {/* 선택 버튼 */}
                    {isSelected ? (
                      <span className="shrink-0 text-[10px] font-bold text-green-600 dark:text-green-400">
                        ✓ 선택됨
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelectTrack(track)}
                        disabled={loadingId === track.id}
                        className="shrink-0 px-3 py-1 text-[11px] font-bold text-red-500 border border-red-300 hover:bg-red-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                      >
                        {loadingId === track.id ? '...' : '사용'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 초기 안내 */}
          {tracks.length === 0 && !searchError && !searching && (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-xs">장르를 선택하거나 키워드를 입력 후 검색하세요</p>
              <p className="text-[10px] mt-1 text-gray-300">Pixabay 로열티프리 음악 제공</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
