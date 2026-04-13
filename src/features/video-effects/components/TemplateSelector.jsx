import { useEffect, useRef } from 'react';
import { TEMPLATES, TEMPLATE_TYPE_LABELS } from '../data/videoEffectTemplates';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { renderVideoEffectFrame } from '../utils/videoEffectsTextObjects';


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
  const { selectedTemplateId, typeFilter, setTypeFilter, selectTemplate, selectGeneratedTemplate, generatedTemplates } = useVideoEffectsStore();

  const allTemplates = [...TEMPLATES, ...generatedTemplates];
  const filtered = typeFilter === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.type === typeFilter);

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

      {/* 템플릿 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(template => (
          <button
            key={template.id}
            onClick={() => template.isAIGenerated ? selectGeneratedTemplate(template.id) : selectTemplate(template.id)}
            className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
              selectedTemplateId === template.id
                ? 'border-red-500 shadow-md shadow-red-500/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <TemplateThumbnail template={template} />
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
          </button>
        ))}
      </div>
    </div>
  );
}
