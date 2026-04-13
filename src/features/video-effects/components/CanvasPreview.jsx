import { useEffect } from 'react';
import { TEMPLATES } from '../data/videoEffectTemplates';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';

export function CanvasPreview() {
  const {
    selectedTemplateId,
    fieldValues,
    textObjects,
    motionBlurEnabled,
    durationOverride,
    setDurationOverride,
    generatedTemplates,
  } = useVideoEffectsStore();
  const template =
    TEMPLATES.find(t => t.id === selectedTemplateId) ||
    generatedTemplates.find(t => t.id === selectedTemplateId);
  const renderValues = { ...fieldValues, textObjects, motionBlur: motionBlurEnabled };
  const effectiveDuration = durationOverride ?? template?.duration ?? 3000;
  const defaultDurationSec = Math.round((template?.duration ?? 3000) / 1000);

  const {
    canvasRef,
    playing,
    progress,
    play,
    pause,
    restart,
    seekTo,
    PREVIEW_W,
    PREVIEW_H,
  } = useCanvasRenderer(template, renderValues, false);

  const elapsed = Math.round((progress * effectiveDuration) / 1000);
  const total = (effectiveDuration / 1000).toFixed(1);

  function handleSeek(e) {
    const ratio = parseFloat(e.target.value);
    seekTo(ratio);
  }

  useEffect(() => {
    if (template) {
      restart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">미리보기</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">재생 시간</label>
          <input
            type="number"
            min={1}
            max={60}
            step={0.5}
            value={(effectiveDuration / 1000).toFixed(1)}
            onChange={(e) => {
              const sec = parseFloat(e.target.value);
              if (!isNaN(sec) && sec >= 1 && sec <= 60) {
                setDurationOverride(Math.round(sec * 1000));
              }
            }}
            className="w-20 px-2 py-1 text-xs text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400/50"
          />
          <span className="text-xs text-gray-400">초</span>
          {durationOverride !== null && (
            <button
              onClick={() => setDurationOverride(null)}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors font-medium"
              title={`기본값으로 복원 (${defaultDurationSec}초)`}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <canvas
          ref={canvasRef}
          width={PREVIEW_W}
          height={PREVIEW_H}
          className="w-full h-full"
        />
        {/* 재생 오버레이 (일시정지 상태에서만) */}
        {!playing && progress < 1 && progress > 0 && (
          <button
            onClick={play}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
        {/* 재생 완료 오버레이 */}
        {progress >= 1 && (
          <button
            onClick={restart}
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="space-y-2">
        {/* 시크바 */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 appearance-none bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer accent-red-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 tabular-nums">
            {elapsed}s / {total}s
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title="처음부터"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            <button
              onClick={playing ? pause : play}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {playing ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  일시정지
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  재생
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
