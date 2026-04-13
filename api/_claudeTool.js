// Claude Tool Use 공통 헬퍼 (Vercel API Routes용 — ESM)
import { jsonrepair } from 'jsonrepair';

export async function callClaudeTool(apiKey, {
  model = 'claude-haiku-4-5-20251001',
  max_tokens = 3000,
  temperature,
  toolName,
  toolDescription,
  inputSchema,
  prompt,
  timeoutMs = 55000,
}) {
  const reqBody = {
    model,
    max_tokens,
    tools: [{ name: toolName, description: toolDescription, input_schema: inputSchema }],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: prompt }],
  };
  if (temperature != null) reqBody.temperature = temperature;

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      const timeoutError = new Error(`Claude 응답 시간 초과 (${Math.round(timeoutMs / 1000)}초)`);
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  }

  const data = await res.json();
  if (!res.ok) {
    const apiError = new Error(data.error?.message || 'Claude API 오류');
    apiError.statusCode = res.status;
    throw apiError;
  }

  const toolUse = data.content?.find(c => c.type === 'tool_use');
  if (toolUse?.input) return toolUse.input;

  const text = data.content?.find(c => c.type === 'text')?.text || '';
  if (!text) throw new Error('Claude 응답 없음');

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : cleaned;
  try { return JSON.parse(jsonStr); } catch {}
  try { return JSON.parse(jsonrepair(jsonStr)); } catch {}
  throw new Error('AI 응답을 파싱할 수 없습니다.');
}
