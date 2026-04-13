import { TEMPLATES } from '../data/videoEffectTemplates';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { useMediaExport } from '../hooks/useMediaExport';

export function ExportPanel() {
  const {
    selectedTemplateId,
    fieldValues,
    textObjects,
    motionBlurEnabled,
    setMotionBlurEnabled,
    backgroundMusic,
  } = useVideoEffectsStore();

  const template = TEMPLATES.find(t => t.id === selectedTemplateId);

  const {
    exporting,
    exportProgress,
    resolution,
    setResolution,
    exportVideo,
    cancelExport,
    lastError,
    statusText,
    EXPORT_RESOLUTIONS,
  } = useMediaExport();

  const renderValues = { ...fieldValues, textObjects };

  function handleExport() {
    exportVideo(template, { ...renderValues, motionBlur: motionBlurEnabled }, 30);
  }

  if (!template) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      {/* 1. 고급 렌더링 옵션 */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">렌더링 설정</h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">모션 블러 (Motion Blur)</div>
              <p className="text-xs text-gray-500 mt-0.5">움직이는 객체에 부드러운 잔상을 추가합니다.</p>
            </div>
            <button
              onClick={() => setMotionBlurEnabled(!motionBlurEnabled)}
              disabled={exporting}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                motionBlurEnabled ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
              } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                motionBlurEnabled ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. 해상도 선택 */}
      <section className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">출력 해상도</h4>
        <div className="flex flex-wrap gap-3">
          {Object.keys(EXPORT_RESOLUTIONS).map(res => {
            const { width, height } = EXPORT_RESOLUTIONS[res];
            const isSelected = resolution === res;
            return (
              <button
                key={res}
                onClick={() => setResolution(res)}
                disabled={exporting}
                className={`flex-1 min-w-[100px] p-3 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-gray-200'
                } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-sm font-bold">{res}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{width}×{height}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 내보내기 실행 및 진행 상태 */}
      <section className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
        {exporting ? (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {statusText || '프로세싱 중...'}
              </span>
              <span className="font-mono text-red-500">
                {!statusText.includes('변환') && `${Math.round(exportProgress * 100)}%`}
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-red-500 transition-all duration-300 ${statusText.includes('변환') ? 'animate-pulse w-full' : ''}`}
                style={{ width: statusText.includes('변환') ? '100%' : `${exportProgress * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {statusText.includes('변환')
                  ? '프리미어 호환용 H.264 인코딩을 수행 중입니다.'
                  : '화면 캡처 중에는 브라우저 탭을 이동하지 마세요.'}
              </p>
              <button
                onClick={cancelExport}
                className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={!template}
            className="w-full group relative flex items-center justify-center gap-3 py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            고품질 MP4 내보내기
          </button>
        )}

        <div className="flex items-center justify-center gap-2 py-2">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {backgroundMusic
              ? `H.264 + AAC · 🎵 ${backgroundMusic.name}`
              : 'Adobe Premiere Pro 호환 (H.264 / 오디오 없음)'}
          </span>
        </div>
      </section>

      {/* 에러 메시지 */}
      {lastError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
          <p className="text-[11px] text-red-600 dark:text-red-400 text-center font-medium">{lastError}</p>
        </div>
      )}
    </div>
  );
}
