import { useState, useEffect, useRef } from 'react';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { buildGeneratedTemplate, loadSavedTemplates, saveTemplatesToStorage } from '../utils/aiTemplateRunner';
import { renderVideoEffectFrame } from '../utils/videoEffectsTextObjects';

const TYPE_OPTIONS = [
  { value: 'auto',          label: '자동 감지' },
  { value: 'intro',         label: '인트로' },
  { value: 'outro',         label: '아웃트로' },
  { value: 'section-title', label: '섹션 타이틀' },
  { value: 'transition',    label: '트랜지션' },
  { value: 'lower-third',   label: '로워서드' },
  { value: 'caption',       label: '자막/강조' },
];

const EXAMPLE_PROMPTS = [
  '빨간 파티클이 흩날리며 채널명이 등장하는 인트로',
  '글리치 효과로 화면이 깨지며 전환되는 트랜지션',
  '형광펜이 그어지며 강조 텍스트가 나타나는 자막',
  '시네마틱 레터박스와 함께 에피소드 제목이 공개되는 인트로',
  '소셜 미디어 아이콘이 튀어나오는 아웃트로',
];

// 미니 Canvas 미리보기 (history 카드용)
function MiniPreview({ template }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!template) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const duration = template.duration;
    const values = Object.fromEntries(template.fields.map(f => [f.id, f.default]));

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const t = (elapsed % duration) / duration;
      ctx.clearRect(0, 0, W, H);
      try {
        renderVideoEffectFrame(ctx, template, t, values, W, H);
      } catch {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [template]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={135}
      className="w-full rounded-lg bg-black"
    />
  );
}

export function AITemplateGenerator() {
  const { addGeneratedTemplate, removeGeneratedTemplate, generatedTemplates } = useVideoEffectsStore();

  const [prompt, setPrompt] = useState('');
  const [effectType, setEffectType] = useState('auto');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null); // 방금 생성된 템플릿

  // 마운트 시 localStorage에서 복원
  useEffect(() => {
    const saved = loadSavedTemplates();
    saved.forEach(t => addGeneratedTemplate(t, false)); // silent=true: 스토리지 재저장 방지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // generatedTemplates 변경 시 localStorage 동기화
  useEffect(() => {
    saveTemplatesToStorage(generatedTemplates);
  }, [generatedTemplates]);

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setLastGenerated(null);

    try {
      const res = await fetch('/api/ai-template-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), effectType }),
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // HTML 오류 페이지(504 등) 대응
        const text = await res.text();
        throw new Error(
          res.status === 504
            ? 'AI 응답 시간이 초과됐습니다 (50초). 더 짧은 설명으로 다시 시도해 주세요.'
            : `서버 오류 (${res.status}): ${text.slice(0, 120)}`
        );
      }

      if (!res.ok) throw new Error(data.error || '생성 실패');

      const template = buildGeneratedTemplate(data, prompt.trim());
      addGeneratedTemplate(template);
      setLastGenerated(template);
      setPrompt('');
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleApply(template) {
    useVideoEffectsStore.getState().selectGeneratedTemplate(template.id);
  }

  function handleDelete(id) {
    removeGeneratedTemplate(id);
    if (lastGenerated?.id === id) setLastGenerated(null);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
  }

  const formatTime = (ms) => {
    const diff = Date.now() - ms;
    if (diff < 60000) return '방금';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    return `${Math.floor(diff / 3600000)}시간 전`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

      {/* 1. 입력 섹션 */}
      <section className="space-y-4">
        <div className="px-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">효과 설명</h4>
          <p className="text-[11px] text-gray-400 mt-1">원하는 영상 효과를 자연어로 설명하면 AI가 Canvas 애니메이션 코드를 생성합니다.</p>
        </div>

        {/* 타입 선택 */}
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEffectType(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                effectType === opt.value
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 프롬프트 입력 */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예) 빨간 파티클이 흩날리며 채널명이 등장하는 인트로"
            rows={3}
            disabled={generating}
            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none transition-all disabled:opacity-50"
          />
          <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">⌘↵ 생성</span>
        </div>

        {/* 예시 프롬프트 */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">예시</span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map(ex => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                disabled={generating}
                className="px-2.5 py-1 text-[11px] bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-40"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI가 코드를 작성 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI로 효과 생성
            </>
          )}
        </button>

        {/* 오류 */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* 방금 생성된 템플릿 */}
        {lastGenerated && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                생성 완료: {lastGenerated.name}
              </span>
            </div>
            <MiniPreview template={lastGenerated} />
            <button
              onClick={() => handleApply(lastGenerated)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              이 템플릿 적용하기
            </button>
          </div>
        )}
      </section>

      {/* 2. 생성 히스토리 */}
      {generatedTemplates.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              생성 히스토리 ({generatedTemplates.length})
            </h4>
          </div>

          <div className="space-y-3">
            {[...generatedTemplates].reverse().map(template => (
              <div
                key={template.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/50 shadow-sm"
              >
                <MiniPreview template={template} />
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {template.name}
                        </span>
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold">
                          AI
                        </span>
                      </div>
                      {template.prompt && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{template.prompt}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {(template.duration / 1000).toFixed(1)}초 · {formatTime(template.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleApply(template)}
                    className="w-full py-1.5 border border-red-400 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    적용
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {generatedTemplates.length === 0 && !lastGenerated && (
        <div className="text-center py-10 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm font-medium">아직 생성된 효과가 없습니다</p>
          <p className="text-xs mt-1">위에서 원하는 효과를 설명해 보세요</p>
        </div>
      )}
    </div>
  );
}
