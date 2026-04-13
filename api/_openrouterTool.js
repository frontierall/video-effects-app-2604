// OpenRouter (OpenAI-compatible) Function Calling 헬퍼 (Vercel API Routes용 — ESM)
import { jsonrepair } from 'jsonrepair';

function createError(message, extras = {}) {
  const error = new Error(message);
  Object.assign(error, extras);
  return error;
}

function tryParseStructuredOutput(rawValue) {
  if (!rawValue) return null;

  if (typeof rawValue === 'object') {
    return rawValue;
  }

  if (typeof rawValue !== 'string') {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {}

  try {
    return JSON.parse(jsonrepair(rawValue));
  } catch {}

  return null;
}

function extractJsonFromText(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}

function isToolUseUnsupportedError(error) {
  return /No endpoints found that support tool use/i.test(error?.message || '');
}

export async function callOpenRouterTool(apiKey, {
  model,
  max_tokens = 3000,
  temperature,
  toolName,
  toolDescription,
  inputSchema,
  prompt,
  timeoutMs = 55000,
  retryOnParseFailure = false,
}) {
  async function makeRequest(requestPrompt, mode = 'tool_call') {
    const reqBody = {
      model,
      max_tokens,
      messages: [{ role: 'user', content: requestPrompt }],
    };
    if (temperature != null) reqBody.temperature = temperature;

    if (mode === 'tool_call') {
      reqBody.tools = [{
        type: 'function',
        function: {
          name: toolName,
          description: toolDescription,
          parameters: inputSchema,
        },
      }];
      reqBody.tool_choice = { type: 'function', function: { name: toolName } };
    }

    let res;
    try {
      res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://video-effects-studio.vercel.app',
          'X-Title': 'Video Effects Studio',
        },
        body: JSON.stringify(reqBody),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error?.name === 'TimeoutError') {
        const timeoutError = createError(`AI 응답 시간 초과 (${Math.round(timeoutMs / 1000)}초)`, {
          statusCode: 504,
          code: 'openrouter_timeout',
        });
        throw timeoutError;
      }
      throw error;
    }

    const data = await res.json();
    if (!res.ok) {
      const apiError = createError(data.error?.message || 'OpenRouter API 오류', {
        statusCode: res.status,
        code: 'openrouter_api_error',
      });
      throw apiError;
    }

    return data;
  }

  let firstPass;

  try {
    firstPass = await makeRequest(prompt, 'tool_call');
  } catch (error) {
    if (isToolUseUnsupportedError(error)) {
      const fallbackPrompt = `${prompt}

Return only a valid JSON object.
Do not use markdown fences.
Do not add explanations before or after the JSON.
The JSON must match the requested function schema exactly.`;
      const textOnlyPass = await makeRequest(fallbackPrompt, 'text_json');
      const textOnlyContent = textOnlyPass.choices?.[0]?.message?.content || '';
      const parsedTextOnly = tryParseStructuredOutput(extractJsonFromText(textOnlyContent));
      if (parsedTextOnly) return parsedTextOnly;

      throw createError('AI 응답을 파싱할 수 없습니다.', {
        statusCode: 500,
        code: 'openrouter_parse_error',
      });
    }
    throw error;
  }

  const toolCall = firstPass.choices?.[0]?.message?.tool_calls?.[0];
  const parsedToolCall = tryParseStructuredOutput(toolCall?.function?.arguments);
  if (parsedToolCall) {
    return parsedToolCall;
  }

  const firstText = firstPass.choices?.[0]?.message?.content || '';
  const parsedText = tryParseStructuredOutput(extractJsonFromText(firstText));
  if (parsedText) {
    return parsedText;
  }

  if (!retryOnParseFailure) {
    throw createError('AI 응답을 파싱할 수 없습니다.', {
      statusCode: 500,
      code: 'openrouter_parse_error',
    });
  }

  const retryPrompt = `${prompt}

Return only a valid JSON object.
Do not use markdown fences.
Do not add explanations before or after the JSON.
The JSON must match the requested function schema exactly.`;

  const retryPass = await makeRequest(retryPrompt, 'text_json');
  const retryText = retryPass.choices?.[0]?.message?.content || '';
  const parsedRetryText = tryParseStructuredOutput(extractJsonFromText(retryText));
  if (parsedRetryText) {
    return parsedRetryText;
  }

  throw createError('AI 응답을 파싱할 수 없습니다.', {
    statusCode: 500,
    code: 'openrouter_parse_error',
  });
}
