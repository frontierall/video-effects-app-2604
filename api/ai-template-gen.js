// Vercel API Route — AI 템플릿 생성
import { callClaudeTool } from './_claudeTool.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  // vercel dev 환경에서 body가 string으로 오는 경우 대비
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { prompt, effectType } = body;
  if (!prompt?.trim()) return res.status(400).json({ error: '프롬프트를 입력해주세요' });

  const typeHint = effectType && effectType !== 'auto'
    ? `\n\n효과 유형을 반드시 "${effectType}"으로 설정하세요.`
    : '';
  const userPrompt = `${SYSTEM_PROMPT}\n\n---\n사용자 요청: ${prompt.trim()}${typeHint}`;

  try {
    const result = await callClaudeTool(ANTHROPIC_API_KEY, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      temperature: 0,
      timeoutMs: 55000,
      toolName: 'generate_video_effect',
      toolDescription: 'Canvas 2D 애니메이션 영상 효과 템플릿 생성',
      inputSchema: TOOL_SCHEMA,
      prompt: userPrompt,
    });
    return res.status(200).json(result);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ error: e.message });
  }
}
