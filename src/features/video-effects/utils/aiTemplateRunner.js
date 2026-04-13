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
    const n1 = 7.5625;
    const d1 = 2.75;
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
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
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

function buildCompilerError(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function sanitizeRenderCode(renderCode = '') {
  let next = String(renderCode || '');
  const notes = [];

  const fenced = next.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    next = fenced[1].trim();
    notes.push('코드 블록 마크다운 제거');
  }

  const firstCodeIndex = ['function render', 'const render', 'let render', 'var render']
    .map(token => next.indexOf(token))
    .filter(index => index >= 0)
    .sort((a, b) => a - b)[0];
  if (firstCodeIndex > 0) {
    next = next.slice(firstCodeIndex);
    notes.push('코드 앞 설명 문구 제거');
  }

  const replacements = [
    [/export\s+default\s+function\s+render\s*\(/g, 'function render('],
    [/export\s+function\s+render\s*\(/g, 'function render('],
    [/export\s+default\s+render\s*;?/g, ''],
    [/return\s+function\s+render\s*\(/g, 'function render('],
  ];

  replacements.forEach(([pattern, replacement]) => {
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement);
      notes.push(`자동 보정 적용: ${pattern}`);
    }
  });

  next = next.trim();

  const hasRenderDeclaration = /(function\s+render\s*\()|((const|let|var)\s+render\s*=)/.test(next);
  if (!hasRenderDeclaration && next) {
    next = `function render(ctx, t, v, W, H) {\n${next}\n}`;
    notes.push('자동 보정 적용: render 함수 선언이 없어 함수 본문으로 감싸기');
  }

  return {
    original: String(renderCode || ''),
    sanitized: next,
    notes,
  };
}

export function createRenderFn(renderCode) {
  const sanitizedResult = sanitizeRenderCode(renderCode);

  if (!sanitizedResult.sanitized) {
    throw buildCompilerError('AI가 renderCode를 비워서 반환했습니다.', {
      stage: 'empty-render-code',
      originalRenderCode: sanitizedResult.original,
      sanitizedRenderCode: sanitizedResult.sanitized,
      sanitizerNotes: sanitizedResult.notes,
    });
  }

  for (const kw of FORBIDDEN) {
    if (sanitizedResult.sanitized.includes(kw)) {
      throw buildCompilerError(`허용되지 않는 코드가 포함되어 있습니다: "${kw}"`, {
        stage: 'forbidden-check',
        offendingKeyword: kw,
        originalRenderCode: sanitizedResult.original,
        sanitizedRenderCode: sanitizedResult.sanitized,
        sanitizerNotes: sanitizedResult.notes,
      });
    }
  }

  let rawFn;
  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function(
      ...UTIL_NAMES,
      `"use strict";\n${sanitizedResult.sanitized}\nif (typeof render !== 'function') throw new Error('render 함수를 찾을 수 없습니다');\nreturn render;`
    );
    rawFn = factory(...UTIL_VALUES);
  } catch (e) {
    throw buildCompilerError(`코드 컴파일 오류: ${e.message}`, {
      stage: 'compile',
      compilerMessage: e.message,
      originalRenderCode: sanitizedResult.original,
      sanitizedRenderCode: sanitizedResult.sanitized,
      sanitizerNotes: sanitizedResult.notes,
    });
  }

  return {
    sanitizedRenderCode: sanitizedResult.sanitized,
    sanitizerNotes: sanitizedResult.notes,
    render: (ctx, t, v, W, H) => {
      ctx.save();
      try {
        rawFn(ctx, t, v, W, H);
      } catch (e) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff4757';
        ctx.font = `${Math.round(H * 0.04)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`렌더 오류: ${e.message}`, W / 2, H / 2);
      } finally {
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    },
  };
}

export function buildGeneratedTemplate(raw, originalPrompt = '') {
  try {
    const compiled = createRenderFn(raw.renderCode);
    return {
      id: `ai-gen-${Date.now()}`,
      name: raw.name,
      type: raw.type,
      duration: Math.max(1000, Math.min(12000, raw.duration || 3000)),
      fields: raw.fields || [],
      render: compiled.render,
      isAIGenerated: true,
      renderCode: raw.renderCode,
      sanitizedRenderCode: compiled.sanitizedRenderCode,
      sanitizerNotes: compiled.sanitizerNotes,
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
  } catch (error) {
    if (error?.details) {
      error.details = {
        ...error.details,
        templateName: raw?.name || null,
        requestedModel: raw?.requestedModel || null,
        resolvedModel: raw?.resolvedModel || null,
        resolvedProvider: raw?.resolvedProviderLabel || raw?.resolvedProvider || null,
      };
    }
    throw error;
  }
}

export function serializeTemplate(template) {
  const { render: _render, ...rest } = template;
  return rest;
}

export function deserializeTemplate(saved) {
  const compiled = createRenderFn(saved.renderCode);
  return {
    ...saved,
    render: compiled.render,
    sanitizedRenderCode: saved.sanitizedRenderCode || compiled.sanitizedRenderCode,
    sanitizerNotes: saved.sanitizerNotes || compiled.sanitizerNotes,
  };
}

const STORAGE_KEY = 'trendtube_ai_templates';

export function loadSavedTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list
      .map(item => {
        try {
          return deserializeTemplate(item);
        } catch {
          return null;
        }
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
