import { callClaudeTool } from './_claudeTool.js';
import { callOpenRouterTool } from './_openrouterTool.js';

const DEFAULT_MODEL_ID = 'anthropic/claude-sonnet-4-6';
const INVALID_OPENROUTER_MODEL_PATTERN = /not a valid model id/i;

const OPENROUTER_SUPPORTED_API_MODELS = new Set([
  'anthropic/claude-sonnet-4-6',
  'deepseek/deepseek-v3.2',
  'qwen/qwen-2.5-coder-32b-instruct',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'minimax/minimax-m2.7',
  'moonshotai/kimi-k2.5',
]);

const MODEL_REGISTRY = {
  'anthropic/claude-sonnet-4-6': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'anthropic/claude-sonnet-4-6',
    fallbackModelId: null,
  },
  'deepseek/deepseek-v3.2': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'deepseek/deepseek-v3.2',
    fallbackModelId: DEFAULT_MODEL_ID,
  },
  'qwen/qwen-2.5-coder-32b-instruct': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'qwen/qwen-2.5-coder-32b-instruct',
    fallbackModelId: DEFAULT_MODEL_ID,
  },
  'nvidia/nemotron-3-super-120b-a12b:free': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    fallbackModelId: DEFAULT_MODEL_ID,
  },
  'minimax/minimax-m2.7': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'minimax/minimax-m2.7',
    fallbackModelId: DEFAULT_MODEL_ID,
  },
  'moonshotai/kimi-k2.5': {
    provider: 'openrouter',
    providerLabel: 'OpenRouter',
    apiModel: 'moonshotai/kimi-k2.5',
    fallbackModelId: DEFAULT_MODEL_ID,
  },
};

const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    analysis: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        tone: { type: 'string' },
        audience: { type: 'string' },
        summary: { type: 'string' },
        structure: { type: 'array', items: { type: 'string' } },
        styleDirections: { type: 'array', items: { type: 'string' } },
      },
      required: ['topic', 'tone', 'audience', 'summary', 'structure', 'styleDirections'],
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category: { type: 'string', enum: ['intro', 'outro', 'section-title'] },
          name: { type: 'string' },
          concept: { type: 'string' },
          whyItFits: { type: 'string' },
          visualDirection: { type: 'string' },
          motionDirection: { type: 'string' },
          prompt: { type: 'string' },
        },
        required: ['id', 'category', 'name', 'concept', 'whyItFits', 'visualDirection', 'motionDirection', 'prompt'],
      },
    },
    promptPack: {
      type: 'object',
      properties: {
        analysisPrompt: { type: 'string' },
        recommendationPrompt: { type: 'string' },
        generationGuide: { type: 'string' },
      },
      required: ['analysisPrompt', 'recommendationPrompt', 'generationGuide'],
    },
  },
  required: ['analysis', 'recommendations', 'promptPack'],
};

const SYSTEM_PROMPT = `You are a creative director for a video motion graphics tool.

Your task:
1. Analyze the user's script.
2. Summarize topic, tone, audience, likely section structure, and fitting visual directions.
3. Recommend 2 to 3 options for each requested category among intro, outro, and section-title.
4. Each recommendation must include a final prompt string that can be sent directly to a Canvas animation generator.

Rules:
- Recommendations must be practical for short motion graphics templates.
- Keep naming concise and user-friendly.
- "prompt" must be written in Korean and be ready to send to a template generation model.
- "prompt" must describe the motion, typography, mood, colors, and intended use case clearly.
- section-title recommendations should be useful for chapter transitions inside a main video.
- Avoid vague wording like "cool" or "nice".
- Return valid JSON only.`;

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

function validateModelMapping(modelId, modelConfig) {
  if (!modelConfig.apiModel) {
    throw createHttpError(500, `apiModel is not configured for ${modelId}`);
  }

  if (
    modelConfig.provider === 'openrouter' &&
    !OPENROUTER_SUPPORTED_API_MODELS.has(modelConfig.apiModel)
  ) {
    throw createHttpError(500, `apiModel mapping is invalid for ${modelId}: ${modelConfig.apiModel}`);
  }
}

function getProviderCredentials(provider, env) {
  if (provider === 'anthropic') {
    return { apiKey: env.ANTHROPIC_API_KEY, missingKeyMessage: 'ANTHROPIC_API_KEY not configured' };
  }

  if (provider === 'openrouter') {
    return { apiKey: env.OPENROUTER_API_KEY, missingKeyMessage: 'OPENROUTER_API_KEY not configured' };
  }

  throw createHttpError(500, `Unsupported provider: ${provider}`);
}

function toClientErrorMessage(error, provider) {
  if (error?.code === 'missing_provider_key' || /not configured/i.test(error?.message || '')) {
    if (provider === 'OpenRouter') {
      return 'OPENROUTER_API_KEY가 없거나 API 서버가 최신 .env를 다시 읽지 못했습니다. .env 확인 후 npm run dev:api를 재시작해 주세요.';
    }
    if (provider === 'Anthropic') {
      return 'ANTHROPIC_API_KEY가 없거나 API 서버가 최신 .env를 다시 읽지 못했습니다. .env 확인 후 npm run dev:api를 재시작해 주세요.';
    }
  }

  if (error?.statusCode === 401 || error?.statusCode === 403) {
    return `${provider} 인증에 실패했습니다. API 키가 만료되었거나 잘못되었는지 확인해 주세요.`;
  }

  if (error?.statusCode === 429) {
    return `${provider} 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.`;
  }

  if (error?.statusCode === 504 || /시간 초과/.test(error?.message || '')) {
    return `${provider} 응답 시간이 초과되었습니다. 잠시 후 다시 시도하거나 다른 모델을 선택해 주세요.`;
  }

  return error?.message || 'AI 요청 처리 중 오류가 발생했습니다.';
}

async function executeModelRequest(modelConfig, apiKey, prompt) {
  const payload = {
    model: modelConfig.apiModel,
    max_tokens: 3200,
    temperature: 0.2,
    timeoutMs: 55000,
    toolName: 'recommend_video_motion_styles',
    toolDescription: '대본 분석을 바탕으로 영상 인트로/아웃트로/섹션 타이틀 추천 생성',
    inputSchema: TOOL_SCHEMA,
    prompt,
  };

  if (modelConfig.provider === 'anthropic') return callClaudeTool(apiKey, payload);
  if (modelConfig.provider === 'openrouter') return callOpenRouterTool(apiKey, payload);
  throw createHttpError(500, `Unsupported provider: ${modelConfig.provider}`);
}

async function generateWithRouting({ requestedModelId, prompt, env }) {
  async function runWithModel(modelId, fallbackReason = null) {
    const modelConfig = MODEL_REGISTRY[modelId];
    const { apiKey, missingKeyMessage } = getProviderCredentials(modelConfig.provider, env);

    validateModelMapping(modelId, modelConfig);

    if (!apiKey) {
      if (fallbackReason == null && modelConfig.fallbackModelId && modelConfig.fallbackModelId !== modelId) {
        return runWithModel(modelConfig.fallbackModelId, 'missing_provider_key');
      }
      throw createHttpError(500, missingKeyMessage);
    }

    try {
      const data = await executeModelRequest(modelConfig, apiKey, prompt);
      return {
        ...data,
        requestedModel: requestedModelId,
        resolvedModel: modelId,
        resolvedProvider: modelConfig.provider,
        resolvedProviderLabel: modelConfig.providerLabel,
        resolvedApiModel: modelConfig.apiModel,
        fallbackApplied: fallbackReason != null,
        fallbackReason,
      };
    } catch (error) {
      if (
        fallbackReason == null &&
        modelConfig.fallbackModelId &&
        modelConfig.fallbackModelId !== modelId &&
        (isTransientProviderError(error) || isInvalidOpenRouterModelError(error))
      ) {
        return runWithModel(
          modelConfig.fallbackModelId,
          isInvalidOpenRouterModelError(error)
            ? 'invalid_provider_model_id'
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
  const {
    script,
    model: requestedModelId = DEFAULT_MODEL_ID,
    videoStyle = '정보형',
    brandTone = '깔끔함',
    recommendationCount = 3,
    recommendationTypes = ['intro', 'outro', 'section-title'],
  } = body;

  if (!script?.trim()) {
    return res.status(400).json({ error: '대본을 입력해주세요' });
  }

  if (!MODEL_REGISTRY[requestedModelId]) {
    return res.status(400).json({
      error: `지원하지 않는 모델입니다: ${requestedModelId}`,
      supportedModels: Object.keys(MODEL_REGISTRY),
    });
  }

  const safeCount = Math.max(2, Math.min(3, Number(recommendationCount) || 3));
  const safeTypes = Array.isArray(recommendationTypes) && recommendationTypes.length > 0
    ? recommendationTypes.filter(type => ['intro', 'outro', 'section-title'].includes(type))
    : ['intro', 'outro', 'section-title'];

  const analysisPrompt = [
    '다음 대본을 분석해 주세요.',
    `영상 스타일: ${videoStyle}`,
    `브랜드 톤: ${brandTone}`,
    `추천 개수: 각 카테고리당 ${safeCount}개`,
    `필수 카테고리: ${safeTypes.join(', ')}`,
    '',
    '[대본 시작]',
    script.trim(),
    '[대본 끝]',
  ].join('\n');

  const recommendationPrompt = [
    '위 분석 결과를 토대로 영상 모션 그래픽 추천안을 만듭니다.',
    `각 카테고리(${safeTypes.join(', ')})마다 ${safeCount}개의 옵션을 제안해 주세요.`,
    '각 옵션은 이름, 콘셉트, 왜 어울리는지, 비주얼 방향, 모션 방향, 실제 생성용 프롬프트를 포함해야 합니다.',
  ].join('\n');

  const generationGuide = [
    '최종 프롬프트는 Canvas 기반 템플릿 생성 모델에 바로 전달됩니다.',
    '반드시 타이포그래피, 색감, 움직임, 사용 장면, 분위기를 포함합니다.',
    '인트로/아웃트로/섹션 타이틀 각각의 목적에 맞게 다른 연출을 제안합니다.',
  ].join('\n');

  const prompt = [
    SYSTEM_PROMPT,
    '',
    '---',
    analysisPrompt,
    '',
    recommendationPrompt,
    '',
    generationGuide,
  ].join('\n');

  try {
    const result = await generateWithRouting({
      requestedModelId,
      prompt,
      env: process.env,
    });

    return res.status(200).json({
      ...result,
      promptPack: {
        analysisPrompt,
        recommendationPrompt,
        generationGuide,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: toClientErrorMessage(error, MODEL_REGISTRY[requestedModelId]?.providerLabel || 'AI'),
      rawError: error.message,
    });
  }
}
