import { useState, useEffect, useRef } from 'react';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';
import { buildGeneratedTemplate, loadSavedTemplates, saveTemplatesToStorage } from '../utils/aiTemplateRunner';
import { renderVideoEffectFrame } from '../utils/videoEffectsTextObjects';

const AI_MODELS = [
  {
    value: 'anthropic/claude-sonnet-4-6',
    label: 'Claude Sonnet',
    provider: 'Anthropic',
    badge: '추천',
    badgeColor: 'bg-orange-500',
    icon: '🟠',
  },
  {
    value: 'deepseek/deepseek-v3.2',
    label: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    badge: '가성비',
    badgeColor: 'bg-blue-500',
    icon: '🔵',
  },
  {
    value: 'qwen/qwen-2.5-coder-32b-instruct',
    label: 'Qwen 2.5 Coder',
    provider: 'Alibaba',
    badge: '코드특화',
    badgeColor: 'bg-purple-500',
    icon: '🟣',
  },
  {
    value: 'nvidia/nemotron-3-super-120b-a12b:free',
    label: 'Nemotron Super',
    provider: 'NVIDIA',
    badge: '무료',
    badgeColor: 'bg-green-500',
    icon: '🟢',
  },
  {
    value: 'minimax/minimax-m2.7',
    label: 'MiniMax M2.7',
    provider: 'MiniMax',
    badge: '$0.30',
    badgeColor: 'bg-sky-500',
    icon: '🔷',
  },
  {
    value: 'moonshotai/kimi-k2.5',
    label: 'Kimi K2.5',
    provider: 'MoonshotAI',
    badge: '$0.38',
    badgeColor: 'bg-indigo-500',
    icon: '🌙',
  },
];

const TYPE_OPTIONS = [
  { value: 'auto', label: '자동 감지' },
  { value: 'intro', label: '인트로' },
  { value: 'outro', label: '아웃트로' },
  { value: 'section-title', label: '섹션 타이틀' },
  { value: 'transition', label: '트랜지션' },
  { value: 'lower-third', label: '로워서드' },
  { value: 'caption', label: '자막/강조' },
];

const RECOMMENDATION_CATEGORIES = [
  { value: 'intro', label: '인트로' },
  { value: 'outro', label: '아웃트로' },
  { value: 'section-title', label: '섹션 타이틀' },
];

const SCRIPT_STYLE_OPTIONS = ['정보형', '감성형', '다큐형', '쇼츠형', '브랜드형'];
const BRAND_TONE_OPTIONS = ['깔끔함', '강렬함', '프리미엄', '밝음', '신뢰감'];

const EXAMPLE_PROMPTS = [
  '빨간 파티클이 흩날리며 채널명이 등장하는 인트로',
  '글리치 효과로 화면이 깨지며 전환되는 트랜지션',
  '형광펜이 그어지며 강조 텍스트가 나타나는 자막',
  '시네마틱 레터박스와 함께 에피소드 제목이 공개되는 인트로',
  '소셜 미디어 아이콘이 튀어나오는 아웃트로',
];

function getModelLabel(modelId) {
  return AI_MODELS.find(model => model.value === modelId)?.label || modelId;
}

function formatTime(ms) {
  const diff = Date.now() - ms;
  if (diff < 60000) return '방금';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  return `${Math.floor(diff / 3600000)}시간 전`;
}

function ModelExecutionMeta({ template }) {
  if (!template?.resolvedModel && !template?.requestedModel) return null;

  const requestedLabel = template.requestedModel ? getModelLabel(template.requestedModel) : null;
  const resolvedLabel = template.resolvedModel ? getModelLabel(template.resolvedModel) : null;
  const providerLabel = template.resolvedProviderLabel || template.resolvedProvider || null;

  return (
    <div className="space-y-1 rounded-xl bg-white/70 dark:bg-gray-900/30 border border-white/80 dark:border-gray-800 px-3 py-2">
      <p className="text-[10px] text-gray-500 dark:text-gray-400">
        요청 모델: <span className="font-semibold text-gray-700 dark:text-gray-200">{requestedLabel || '-'}</span>
      </p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">
        실제 실행: <span className="font-semibold text-gray-700 dark:text-gray-200">{resolvedLabel || requestedLabel || '-'}</span>
        {providerLabel ? ` · ${providerLabel}` : ''}
      </p>
      {template.fallbackApplied && (
        <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
          fallback 적용됨{template.fallbackReason ? ` (${template.fallbackReason})` : ''}
        </p>
      )}
    </div>
  );
}

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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [template]);

  return <canvas ref={canvasRef} width={240} height={135} className="w-full rounded-lg bg-black" />;
}

function PromptViewer({ title, promptMap }) {
  if (!promptMap) return null;

  return (
    <details className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-[10px] text-gray-400">펼쳐서 보기</span>
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {Object.entries(promptMap).map(([key, value]) => {
          if (!value) return null;
          return (
            <div key={key} className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{key}</div>
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-3 text-gray-700 dark:text-gray-200 overflow-x-auto">{value}</pre>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export function AITemplateGenerator() {
  const { addGeneratedTemplate, removeGeneratedTemplate, generatedTemplates } = useVideoEffectsStore();

  const [mode, setMode] = useState('direct');
  const [prompt, setPrompt] = useState('');
  const [effectType, setEffectType] = useState('auto');
  const [aiModel, setAiModel] = useState('anthropic/claude-sonnet-4-6');
  const [generating, setGenerating] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [scriptText, setScriptText] = useState('');
  const [videoStyle, setVideoStyle] = useState('정보형');
  const [brandTone, setBrandTone] = useState('깔끔함');
  const [recommendationCount, setRecommendationCount] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState(['intro', 'outro', 'section-title']);
  const [recommendationResult, setRecommendationResult] = useState(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(null);

  useEffect(() => {
    const saved = loadSavedTemplates();
    saved.forEach(t => addGeneratedTemplate(t, false));
  }, [addGeneratedTemplate]);

  useEffect(() => {
    saveTemplatesToStorage(generatedTemplates);
  }, [generatedTemplates]);

  async function requestJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(res.status === 504 ? 'AI 응답 시간이 초과됐습니다 (50초).' : `서버 오류 (${res.status}): ${text.slice(0, 120)}`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '요청 실패');
    return data;
  }

  async function generateTemplateFromPrompt(promptText, forcedType = effectType) {
    const data = await requestJson('/api/ai-template-gen', {
      prompt: promptText.trim(),
      effectType: forcedType,
      model: aiModel,
    });

    const template = buildGeneratedTemplate(data, promptText.trim());
    addGeneratedTemplate(template);
    setLastGenerated(template);
    return template;
  }

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setLastGenerated(null);

    try {
      await generateTemplateFromPrompt(prompt, effectType);
      setPrompt('');
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRecommend() {
    if (!scriptText.trim() || recommending) return;
    setRecommending(true);
    setError(null);
    setRecommendationResult(null);
    setSelectedRecommendationId(null);

    try {
      const data = await requestJson('/api/script-style-recommend', {
        script: scriptText.trim(),
        model: aiModel,
        videoStyle,
        brandTone,
        recommendationCount,
        recommendationTypes: selectedCategories,
      });
      setRecommendationResult(data);
      setSelectedRecommendationId(data.recommendations?.[0]?.id || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setRecommending(false);
    }
  }

  async function handleGenerateFromRecommendation(recommendation) {
    if (!recommendation?.prompt || generating) return;
    setGenerating(true);
    setError(null);
    setLastGenerated(null);

    try {
      await generateTemplateFromPrompt(recommendation.prompt, recommendation.category);
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

  function toggleCategory(category) {
    setSelectedCategories(current => {
      if (current.includes(category)) {
        if (current.length === 1) return current;
        return current.filter(item => item !== category);
      }
      return [...current, category];
    });
  }

  const selectedRecommendation = recommendationResult?.recommendations?.find(item => item.id === selectedRecommendationId) || null;
  const groupedRecommendations = recommendationResult?.recommendations?.reduce((acc, item) => {
    const list = acc[item.category] || [];
    list.push(item);
    acc[item.category] = list;
    return acc;
  }, {});

  const directPromptPreview = {
    목적: '직접 설명한 효과를 바로 Canvas 템플릿으로 생성',
    타입: effectType,
    모델: `${getModelLabel(aiModel)} (${aiModel})`,
    사용자프롬프트: prompt.trim() || '입력 전',
  };

  const recommendationPromptPreview = recommendationResult?.promptPack
    ? {
        분석프롬프트: recommendationResult.promptPack.analysisPrompt,
        추천프롬프트: recommendationResult.promptPack.recommendationPrompt,
        생성가이드: recommendationResult.promptPack.generationGuide,
        선택추천프롬프트: selectedRecommendation?.prompt || '',
      }
    : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <section className="space-y-4">
        <div className="px-1 space-y-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI 생성</h4>
          <p className="text-[11px] text-gray-400">직접 설명해서 만들거나, 대본을 분석해 인트로/아웃트로/섹션 타이틀 추천을 받은 뒤 생성할 수 있습니다.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'direct', label: '직접 생성', desc: '효과 설명을 바로 템플릿으로 생성' },
            { id: 'script', label: '대본 기반 추천', desc: '대본을 읽고 추천안을 먼저 제안' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${mode === item.id ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}
            >
              <div className={`text-sm font-semibold ${mode === item.id ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{item.label}</div>
              <div className="mt-1 text-[10px] text-gray-400">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">AI 모델</span>
          <div className="grid grid-cols-2 gap-1.5">
            {AI_MODELS.map(m => (
              <button
                key={m.value}
                onClick={() => setAiModel(m.value)}
                disabled={generating || recommending}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all disabled:opacity-50 ${aiModel === m.value ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}
              >
                <span className="text-sm">{m.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold truncate ${aiModel === m.value ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>{m.label}</span>
                    <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full text-white font-bold ${m.badgeColor}`}>{m.badge}</span>
                  </div>
                  <span className="text-[9px] text-gray-400">{m.provider}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {mode === 'direct' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setEffectType(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${effectType === opt.value ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

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

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generating}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {generating ? 'AI가 코드를 작성 중...' : `${getModelLabel(aiModel)}로 효과 생성`}
            </button>

            <PromptViewer title="프롬프트 구조 보기" promptMap={directPromptPreview} />
          </div>
        )}

        {mode === 'script' && (
          <div className="space-y-4">
            <textarea
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              placeholder="대본 전체 또는 핵심 부분을 붙여넣으세요. AI가 주제, 톤, 챕터 구조를 읽고 인트로/아웃트로/섹션 타이틀을 추천합니다."
              rows={8}
              disabled={recommending}
              className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-y transition-all disabled:opacity-50"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">영상 스타일</span>
                <select value={videoStyle} onChange={e => setVideoStyle(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
                  {SCRIPT_STYLE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">브랜드 톤</span>
                <select value={brandTone} onChange={e => setBrandTone(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
                  {BRAND_TONE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">추천 개수</span>
                <select value={recommendationCount} onChange={e => setRecommendationCount(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
                  <option value={2}>2개</option>
                  <option value={3}>3개</option>
                </select>
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">추천할 종류</span>
              <div className="flex gap-2 flex-wrap">
                {RECOMMENDATION_CATEGORIES.map(item => (
                  <button
                    key={item.value}
                    onClick={() => toggleCategory(item.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategories.includes(item.value) ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRecommend}
              disabled={!scriptText.trim() || recommending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {recommending ? '대본을 분석하고 추천 생성 중...' : '대본 기반 추천 받기'}
            </button>

            <PromptViewer title="추천용 프롬프트 구조 보기" promptMap={recommendationPromptPreview} />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {mode === 'script' && recommendationResult && (
          <div className="space-y-5 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">대본 분석 결과</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/30 space-y-2">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{recommendationResult.analysis?.topic}</div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{recommendationResult.analysis?.summary}</p>
                  <p className="text-[11px] text-gray-400">톤: {recommendationResult.analysis?.tone}</p>
                  <p className="text-[11px] text-gray-400">대상: {recommendationResult.analysis?.audience}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/30 space-y-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">예상 섹션 구조</div>
                  <div className="flex flex-wrap gap-2">
                    {recommendationResult.analysis?.structure?.map(item => <span key={item} className="px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-300">{item}</span>)}
                  </div>
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pt-2">추천 연출 방향</div>
                  <ul className="space-y-1">
                    {recommendationResult.analysis?.styleDirections?.map(item => <li key={item} className="text-[11px] text-gray-500 dark:text-gray-400">• {item}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {RECOMMENDATION_CATEGORIES.filter(category => groupedRecommendations?.[category.value]?.length).map(category => (
                <div key={category.value} className="space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category.label}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedRecommendations[category.value].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedRecommendationId(item.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${selectedRecommendationId === item.id ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</div>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500">{category.label}</span>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.concept}</p>
                        <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">왜 어울리나: {item.whyItFits}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedRecommendation && (
              <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-green-800 dark:text-green-300">선택된 추천: {selectedRecommendation.name}</div>
                    <div className="text-[11px] text-green-600 dark:text-green-400">{selectedRecommendation.category}</div>
                  </div>
                  <button
                    onClick={() => handleGenerateFromRecommendation(selectedRecommendation)}
                    disabled={generating}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-bold transition-colors"
                  >
                    {generating ? '생성 중...' : '이 추천으로 템플릿 생성'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="rounded-xl bg-white/70 dark:bg-gray-900/30 border border-white/70 dark:border-gray-800 p-3">
                    <div className="font-bold text-gray-500 uppercase tracking-wider mb-1">비주얼 방향</div>
                    <div className="text-gray-700 dark:text-gray-200">{selectedRecommendation.visualDirection}</div>
                  </div>
                  <div className="rounded-xl bg-white/70 dark:bg-gray-900/30 border border-white/70 dark:border-gray-800 p-3">
                    <div className="font-bold text-gray-500 uppercase tracking-wider mb-1">모션 방향</div>
                    <div className="text-gray-700 dark:text-gray-200">{selectedRecommendation.motionDirection}</div>
                  </div>
                </div>
                <PromptViewer title="선택한 추천 프롬프트 보기" promptMap={{ 생성프롬프트: selectedRecommendation.prompt }} />
              </div>
            )}
          </div>
        )}

        {lastGenerated && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 dark:text-green-400">생성 완료: {lastGenerated.name}</span>
            </div>
            <ModelExecutionMeta template={lastGenerated} />
            <MiniPreview template={lastGenerated} />
            <button onClick={() => handleApply(lastGenerated)} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors">이 템플릿 적용하기</button>
          </div>
        )}
      </section>

      {generatedTemplates.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">생성 히스토리 ({generatedTemplates.length})</h4>
          </div>

          <div className="space-y-3">
            {[...generatedTemplates].reverse().map(template => (
              <div key={template.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/50 shadow-sm">
                <MiniPreview template={template} />
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{template.name}</span>
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold">AI</span>
                      </div>
                      {template.prompt && <p className="text-[10px] text-gray-400 truncate mt-0.5">{template.prompt}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{(template.duration / 1000).toFixed(1)}초 · {formatTime(template.createdAt)}</p>
                    </div>
                    <button onClick={() => handleDelete(template.id)} className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors" title="삭제">삭제</button>
                  </div>
                  <ModelExecutionMeta template={template} />
                  <button onClick={() => handleApply(template)} className="w-full py-1.5 border border-red-400 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded-xl transition-all">적용</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {generatedTemplates.length === 0 && !lastGenerated && !recommendationResult && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm font-medium">아직 생성된 효과가 없습니다</p>
          <p className="text-xs mt-1">직접 설명하거나 대본 분석 기반 추천을 받아 보세요</p>
        </div>
      )}
    </div>
  );
}
