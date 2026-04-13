import { useEffect, useRef } from 'react';
import { TEMPLATE_TYPE_LABELS } from '../data/videoEffectTemplates';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { renderVideoEffectFrame } from '../utils/videoEffectsTextObjects';
import { getAllTemplates } from '../utils/templateLibrary';


const TYPE_FILTERS = ['all', 'intro', 'outro', 'section-title', 'transition', 'lower-third', 'caption'];

// 템플릿 썸네일: 미니 Canvas에 t=0.4 시점 렌더
function TemplateThumbnail({ template }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const values = Object.fromEntries(template.fields.map(f => [f.id, f.default]));
    ctx.clearRect(0, 0, W, H);
    try {
      renderVideoEffectFrame(ctx, template, 0.4, values, W, H);
    } catch (e) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
    }
  }, [template]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={158}
      className="w-full rounded-lg"
    />
  );
}

export function TemplateSelector() {
  const {
    selectedTemplateId,
    typeFilter,
    setTypeFilter,
    selectTemplate,
    selectGeneratedTemplate,
    generatedTemplates,
    favoriteTemplateIds,
    toggleFavoriteTemplate,
  } = useVideoEffectsStore();

  const allTemplates = getAllTemplates(generatedTemplates);
  const filtered = typeFilter === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.type === typeFilter);
  const favorites = filtered.filter(template => favoriteTemplateIds.includes(template.id));
  const nonFavorites = filtered.filter(template => !favoriteTemplateIds.includes(template.id));

  function renderTemplateCard(template) {
    const isFavorite = favoriteTemplateIds.includes(template.id);
    const isSelected = selectedTemplateId === template.id;

    return (
      <div
        key={template.id}
        onClick={() => template.isAIGenerated ? selectGeneratedTemplate(template.id) : selectTemplate(template.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            template.isAIGenerated ? selectGeneratedTemplate(template.id) : selectTemplate(template.id);
          }
        }}
        role="button"
        tabIndex={0}
        className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
          isSelected
            ? 'border-red-500 shadow-md shadow-red-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="relative">
          <TemplateThumbnail template={template} />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavoriteTemplate(template.id);
            }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center transition-colors ${
              isFavorite
                ? 'bg-amber-400/90 text-white'
                : 'bg-black/30 text-white hover:bg-black/45'
            }`}
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.96c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.785.57-1.84-.196-1.541-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.98 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.369-3.96z" />
            </svg>
          </button>
        </div>
        <div className="px-3 py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
              {template.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {template.isAIGenerated && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold">
                  AI
                </span>
              )}
              {isFavorite && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold dark:bg-amber-500/20 dark:text-amber-300">
                  즐겨찾기
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {TEMPLATE_TYPE_LABELS[template.type]}
              </span>
            </div>
          </div>
          <div className="mt-1">
            <span className="text-[11px] text-gray-400">
              {(template.duration / 1000).toFixed(0)}초
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 타입 필터 */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              typeFilter === f
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f === 'all' ? '전체' : TEMPLATE_TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {favorites.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">즐겨찾기</h4>
            <span className="text-[10px] text-gray-400">{favorites.length}개</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {favorites.map(renderTemplateCard)}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">전체 템플릿</h4>
          <span className="text-[10px] text-gray-400">{filtered.length}개</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {nonFavorites.map(renderTemplateCard)}
        </div>
      </section>
    </div>
  );
}
