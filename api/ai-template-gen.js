// Vercel API Route — AI 템플릿 생성
import { callClaudeTool } from './_claudeTool.js';
import { callOpenRouterTool } from './_openrouterTool.js';

const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    name:     { type: 'string', description: '템플릿 이름 (한국어, 15자 이내)' },
    type:     { type: 'string', enum: ['intro', 'outro', 'section-title', 'transition', 'lower-third', 'caption'] },
    duration: { type: 'integer', description: '애니메이션 길이 (밀리초, 2000~10000)' },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:      { type: 'string' },
          label:   { type: 'string' },
          type:    { type: 'string', enum: ['text', 'color', 'number'] },
          default: { type: 'string' },
        },
        required: ['id', 'label', 'type', 'default'],
      },
    },
    renderCode: { type: 'string', description: 'function render(ctx, t, v, W, H) { ... } 형태의 전체 코드' },
  },
  required: ['name', 'type', 'duration', 'fields', 'renderCode'],
};

const SYSTEM_PROMPT = `You are a Canvas 2D animation expert. You generate video effect templates for a YouTube content creator tool.

## Render Function Signature
function render(ctx, t, v, W, H) { ... }

- ctx: CanvasRenderingContext2D
- t: 0~1 (normalized animation time; 0=start, 1=end)
- v: object (user-editable values, keyed by field id — e.g. v.bgColor, v.title)
- W: canvas width (640 in preview, up to 1920 on export)
- H: canvas height (360 in preview, up to 1080 on export)

## Utility Functions (already in scope — do NOT redefine)
- ease(t): easeInOut quadratic
- easeOut(t): cubic ease out
- easeIn(t): cubic ease in
- elasticOut(t): elastic spring
- bounceOut(t): bounce
- progress(t, start, end): 0~1 for t within [start,end], clamped
- clamp(v, min, max): clamp value
- seededRand(t, seed): deterministic pseudo-random (useful for glitch)
- wrapText(ctx, text, maxWidth): returns string[] of wrapped lines

## CRITICAL RULES
1. First line MUST be: ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
2. ALWAYS end with: ctx.globalAlpha = 1;
3. After ctx.shadowBlur, reset: ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
4. Font sizes MUST be relative: Math.round(H * 0.08) — never absolute px
5. Font family MUST include: 'Pretendard','Noto Sans KR',sans-serif
6. FORBIDDEN: document, window, fetch, XMLHttpRequest, localStorage, eval, import, require
7. No infinite loops, no recursion

## Standard Animation Pattern
const p = easeOut(progress(t, 0.0, 0.35));
ctx.globalAlpha = p;
// ... draw ...
const fo = progress(t, 0.85, 1.0);
if (fo > 0) { ctx.globalAlpha = fo; ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H); }
ctx.globalAlpha = 1;

## Example
function render(ctx, t, v, W, H) {
  ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
  const lineP = easeOut(progress(t, 0.05, 0.4));
  ctx.fillStyle = v.accentColor;
  ctx.fillRect((W - W*0.5*lineP)/2, H/2-2, W*0.5*lineP, 4);
  const p = easeOut(progress(t, 0.25, 0.6));
  ctx.globalAlpha = p; ctx.fillStyle = v.textColor;
  ctx.font = \`bold \${Math.round(H*0.1)}px 'Pretendard','Noto Sans KR',sans-serif\`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(v.title, W/2, H/2-H*0.08);
  const fo = progress(t, 0.85, 1.0);
  if (fo > 0) { ctx.globalAlpha = fo; ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H); }
  ctx.globalAlpha = 1;
}

Generate a render function matching the user's description. Be creative and visually impressive.`;

const DEFAULT_MODEL_ID = 'anthropic/claude-sonnet-4-6';
const INVALID_OPENROUTER_MODEL_PATTERN = /not a valid model id/i;

const OPENROUTER_SUPPORTED_API_MODELS = new Set([
  'deepseek/deepseek-v3.2',
  'qwen/qwen-2.5-coder-32b-instruct',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'minimax/minimax-m2.7',
  'moonshotai/kimi-k2.5',
]);

const MODEL_REGISTRY = {
  'anthropic/claude-sonnet-4-6': {
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    apiModel: 'claude-sonnet-4-5-20250929',
    fallbackModelId: null,
    timeoutMs: 55000,
    retryOnParseFailure: false,
    fallbackOnParseError: false,
    experimental: false,
  },
  'deepseek/deepseek-v3.2': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'deepseek/deepseek-v3.2',
    fallbackModelId: DEFAULT_MODEL_ID,
    timeoutMs: 55000,
    retryOnParseFailure: false,
    fallbackOnParseError: true,
    experimental: false,
  },
  'qwen/qwen-2.5-coder-32b-instruct': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'qwen/qwen-2.5-coder-32b-instruct',
    fallbackModelId: DEFAULT_MODEL_ID,
    timeoutMs: 55000,
    retryOnParseFailure: false,
    fallbackOnParseError: true,
    experimental: false,
  },
  'nvidia/nemotron-3-super-120b-a12b:free': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    fallbackModelId: DEFAULT_MODEL_ID,
    timeoutMs: 95000,
    retryOnParseFailure: false,
    fallbackOnParseError: true,
    experimental: true,
  },
  'minimax/minimax-m2.7': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'minimax/minimax-m2.7',
    fallbackModelId: DEFAULT_MODEL_ID,
    timeoutMs: 55000,
    retryOnParseFailure: false,
    fallbackOnParseError: true,
    experimental: false,
  },
  'moonshotai/kimi-k2.5': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'moonshotai/kimi-k2.5',
    fallbackModelId: DEFAULT_MODEL_ID,
    timeoutMs: 55000,
    retryOnParseFailure: true,
    fallbackOnParseError: true,
    experimental: true,
  },
};

function createHttpError(statusCode, message, extras = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extras);
  return error;
}

function isTransientProviderError(error) {
  return error?.statusCode === 429 || (error?.statusCode >= 500 && error?.statusCode < 600);
}

function isInvalidOpenRouterModelError(error) {
  return error?.statusCode === 400 && INVALID_OPENROUTER_MODEL_PATTERN.test(error?.message || '');
}

function isParseError(error) {
  return error?.code === 'openrouter_parse_error';
}

function validateModelMapping(modelId, modelConfig) {
  if (!modelConfig.apiModel) {
    throw createHttpError(500, `apiModel is not configured for ${modelId}`, {
      code: 'invalid_model_mapping',
    });
  }

  if (
    modelConfig.provider === 'openrouter' &&
    !OPENROUTER_SUPPORTED_API_MODELS.has(modelConfig.apiModel)
  ) {
    throw createHttpError(500, `apiModel mapping is invalid for ${modelId}: ${modelConfig.apiModel}`, {
      code: 'invalid_model_mapping',
    });
  }
}

function getProviderCredentials(provider, env) {
  if (provider === 'anthropic') {
    return {
      apiKey: env.ANTHROPIC_API_KEY,
      missingKeyMessage: 'ANTHROPIC_API_KEY not configured',
    };
  }

  if (provider === 'openrouter') {
    return {
      apiKey: env.OPENROUTER_API_KEY,
      missingKeyMessage: 'OPENROUTER_API_KEY not configured',
    };
  }

  throw createHttpError(500, `Unsupported provider: ${provider}`);
}

async function executeModelRequest(modelConfig, apiKey, prompt) {
  const payload = {
    model: modelConfig.apiModel,
    max_tokens: 2500,
    temperature: 0,
    timeoutMs: modelConfig.timeoutMs ?? 55000,
    toolName: 'generate_video_effect',
    toolDescription: 'Canvas 2D 애니메이션 영상 효과 템플릿 생성',
    inputSchema: TOOL_SCHEMA,
    prompt,
  };

  if (modelConfig.provider === 'anthropic') {
    return callClaudeTool(apiKey, payload);
  }

  if (modelConfig.provider === 'openrouter') {
    return callOpenRouterTool(apiKey, {
      ...payload,
      retryOnParseFailure: modelConfig.retryOnParseFailure === true,
    });
  }

  throw createHttpError(500, `Unsupported provider: ${modelConfig.provider}`);
}

async function generateTemplateWithRouting({ requestedModelId, prompt, env }) {
  const requestedConfig = MODEL_REGISTRY[requestedModelId];
  if (!requestedConfig) {
    throw createHttpError(400, `지원하지 않는 모델입니다: ${requestedModelId}`);
  }

  const attemptedModels = [];

  async function runWithModel(modelId, fallbackReason = null) {
    const modelConfig = MODEL_REGISTRY[modelId];
    const { apiKey, missingKeyMessage } = getProviderCredentials(modelConfig.provider, env);

    attemptedModels.push({
      requestedModel: requestedModelId,
      resolvedModel: modelId,
      resolvedProvider: modelConfig.provider,
      resolvedApiModel: modelConfig.apiModel,
      fallbackReason,
    });

    try {
      validateModelMapping(modelId, modelConfig);
    } catch (error) {
      if (
        fallbackReason == null &&
        modelConfig.fallbackModelId &&
        modelConfig.fallbackModelId !== modelId
      ) {
        console.error('[ai-template-gen] invalid model mapping, retrying with fallback', {
          requestedModel: requestedModelId,
          failedModel: modelId,
          failedProvider: modelConfig.provider,
          failedApiModel: modelConfig.apiModel || null,
          message: error.message,
          fallbackModel: modelConfig.fallbackModelId,
        });
        return runWithModel(modelConfig.fallbackModelId, 'invalid_model_mapping');
      }

      throw error;
    }

    if (!apiKey) {
      if (
        fallbackReason == null &&
        modelConfig.fallbackModelId &&
        modelConfig.fallbackModelId !== modelId
      ) {
        console.warn('[ai-template-gen] provider key missing, retrying with fallback', {
          requestedModel: requestedModelId,
          failedModel: modelId,
          failedProvider: modelConfig.provider,
          fallbackModel: modelConfig.fallbackModelId,
        });
        return runWithModel(modelConfig.fallbackModelId, 'missing_provider_key');
      }

      throw createHttpError(500, missingKeyMessage, { code: 'missing_provider_key' });
    }

    try {
      const template = await executeModelRequest(modelConfig, apiKey, prompt);
      return {
        template,
        requestedModelId,
        resolvedModelId: modelId,
        resolvedProvider: modelConfig.provider,
        resolvedProviderLabel: modelConfig.providerLabel,
        resolvedApiModel: modelConfig.apiModel,
        fallbackApplied: fallbackReason != null,
        fallbackReason,
        attemptedModels,
      };
    } catch (error) {
      if (
        fallbackReason == null &&
        modelConfig.fallbackModelId &&
        modelConfig.fallbackModelId !== modelId &&
        (
          isTransientProviderError(error) ||
          isInvalidOpenRouterModelError(error) ||
          (modelConfig.fallbackOnParseError === true && isParseError(error))
        )
      ) {
        console.warn('[ai-template-gen] provider error, retrying with fallback', {
          requestedModel: requestedModelId,
          failedModel: modelId,
          failedProvider: modelConfig.provider,
          failedApiModel: modelConfig.apiModel,
          statusCode: error.statusCode || null,
          errorCode: error.code || null,
          message: error.message,
          fallbackModel: modelConfig.fallbackModelId,
        });
        return runWithModel(
          modelConfig.fallbackModelId,
          isInvalidOpenRouterModelError(error)
            ? 'invalid_provider_model_id'
            : isParseError(error)
              ? 'parse_error'
              : `transient_error:${error.statusCode || 'unknown'}`
        );
      }

      throw error;
    }
  }

  return runWithModel(requestedModelId);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { prompt, effectType, model: requestedModelId = DEFAULT_MODEL_ID } = body;
  if (!prompt?.trim()) return res.status(400).json({ error: '프롬프트를 입력해주세요' });

  if (!MODEL_REGISTRY[requestedModelId]) {
    return res.status(400).json({
      error: `지원하지 않는 모델입니다: ${requestedModelId}`,
      supportedModels: Object.keys(MODEL_REGISTRY),
    });
  }

  const typeHint = effectType && effectType !== 'auto'
    ? `\n\n효과 유형을 반드시 "${effectType}"으로 설정하세요.`
    : '';
  const userPrompt = `${SYSTEM_PROMPT}\n\n---\n사용자 요청: ${prompt.trim()}${typeHint}`;

  try {
    const result = await generateTemplateWithRouting({
      requestedModelId,
      prompt: userPrompt,
      env: process.env,
    });

    console.info('[ai-template-gen] template generated', {
      requestedModel: result.requestedModelId,
      resolvedProvider: result.resolvedProvider,
      resolvedModel: result.resolvedModelId,
      resolvedApiModel: result.resolvedApiModel,
      fallbackApplied: result.fallbackApplied,
      fallbackReason: result.fallbackReason,
    });

    return res.status(200).json({
      ...result.template,
      requestedModel: result.requestedModelId,
      resolvedProvider: result.resolvedProvider,
      resolvedProviderLabel: result.resolvedProviderLabel,
      resolvedModel: result.resolvedModelId,
      resolvedApiModel: result.resolvedApiModel,
      fallbackApplied: result.fallbackApplied,
      fallbackReason: result.fallbackReason,
      attemptedModels: result.attemptedModels,
    });
  } catch (error) {
    console.error('[ai-template-gen] generation failed', {
      requestedModel: requestedModelId,
      resolvedProvider: MODEL_REGISTRY[requestedModelId]?.provider || null,
      resolvedModel: MODEL_REGISTRY[requestedModelId]?.apiModel || null,
      statusCode: error.statusCode || 500,
      message: error.message,
    });
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}
