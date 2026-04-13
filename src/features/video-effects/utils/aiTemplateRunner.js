// AI가 생성한 renderCode 문자열을 실제 render 함수로 변환하고
// 기존 템플릿 시스템과 동일한 형태의 객체를 반환한다.

const UTIL_FNS = {
  ease: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeIn: (t) => t * t * t,
  clamp: (v, min, max) => Math.min(Math.max(v, min), max),
  progress: (t, start, end) => Math.min(Math.max((t - start) / (end - start), 0), 1),
  elasticOut: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
  },
  bounceOut: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  seededRand: (t, seed = 1) => {
    const x = Math.sin(t * 9301 + seed * 49297) * 233280;
    return x - Math.floor(x);
  },
  wrapText: (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  },
};

const UTIL_NAMES = Object.keys(UTIL_FNS);
const UTIL_VALUES = Object.values(UTIL_FNS);

const FORBIDDEN = [
  'document', 'window', 'fetch', 'XMLHttpRequest',
  'localStorage', 'sessionStorage', 'indexedDB',
  'navigator', 'location', 'history',
  'Worker', 'SharedWorker', 'ServiceWorker',
  'eval(', 'Function(', 'import(', 'require(',
  'setTimeout', 'setInterval',
  '__proto__', 'prototype',
];

export function createRenderFn(renderCode) {
  for (const kw of FORBIDDEN) {
    if (renderCode.includes(kw)) {
      throw new Error(`허용되지 않는 코드가 포함되어 있습니다: "${kw}"`);
    }
  }

  let rawFn;
  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function(
      ...UTIL_NAMES,
      `"use strict";\n${renderCode}\nif (typeof render !== 'function') throw new Error('render 함수를 찾을 수 없습니다');\nreturn render;`
    );
    rawFn = factory(...UTIL_VALUES);
  } catch (e) {
    throw new Error(`코드 컴파일 오류: ${e.message}`);
  }

  // ctx 상태 누수 방지를 위해 save/restore로 감싼다
  return (ctx, t, v, W, H) => {
    ctx.save();
    try {
      rawFn(ctx, t, v, W, H);
    } catch (e) {
      // 렌더 오류 시 배경만 채움
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff4757';
      ctx.font = `${Math.round(H * 0.04)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('렌더 오류: ' + e.message, W / 2, H / 2);
    } finally {
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };
}

export function buildGeneratedTemplate(raw, originalPrompt = '') {
  const renderFn = createRenderFn(raw.renderCode);
  return {
    id: `ai-gen-${Date.now()}`,
    name: raw.name,
    type: raw.type,
    duration: Math.max(1000, Math.min(12000, raw.duration || 3000)),
    fields: raw.fields || [],
    render: renderFn,
    isAIGenerated: true,
    renderCode: raw.renderCode,
    prompt: originalPrompt,
    requestedModel: raw.requestedModel || null,
    resolvedProvider: raw.resolvedProvider || null,
    resolvedProviderLabel: raw.resolvedProviderLabel || null,
    resolvedModel: raw.resolvedModel || null,
    resolvedApiModel: raw.resolvedApiModel || null,
    fallbackApplied: raw.fallbackApplied === true,
    fallbackReason: raw.fallbackReason || null,
    attemptedModels: Array.isArray(raw.attemptedModels) ? raw.attemptedModels : [],
    createdAt: Date.now(),
  };
}

// localStorage 저장용 직렬화 (render 함수 제외)
export function serializeTemplate(template) {
  const { render: _render, ...rest } = template;
  return rest;
}

// localStorage에서 불러올 때 render 함수 복원
export function deserializeTemplate(saved) {
  const renderFn = createRenderFn(saved.renderCode);
  return { ...saved, render: renderFn };
}

const STORAGE_KEY = 'trendtube_ai_templates';

export function loadSavedTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list
      .map(item => {
        try { return deserializeTemplate(item); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function saveTemplatesToStorage(templates) {
  try {
    const serialized = templates.map(serializeTemplate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // 스토리지 한도 초과 등 무시
  }
}
