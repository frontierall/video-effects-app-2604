function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function createTextObject(index = 0, color = '#ffffff') {
  return {
    id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: `추가 텍스트 ${index + 1}`,
    color,
    size: 0.05,
  };
}

export function renderExtraTextObjects(ctx, textObjects = [], W, H) {
  if (!Array.isArray(textObjects) || textObjects.length === 0) return;

  const safeObjects = textObjects.filter((item) => item?.text?.trim());
  if (safeObjects.length === 0) return;

  const baseY = H * 0.78;
  const stepY = H * 0.1;

  safeObjects.forEach((item, index) => {
    const sizeRatio = clamp(Number(item.size) || 0.05, 0.02, 0.16);
    const fontSize = Math.round(H * sizeRatio);

    ctx.save();
    ctx.fillStyle = item.color || '#ffffff';
    ctx.font = `700 ${fontSize}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = Math.max(6, Math.round(fontSize * 0.16));
    ctx.fillText(item.text, W / 2, baseY + index * stepY);
    ctx.restore();
  });
}

/**
 * 비디오 효과 프레임 렌더링 (모션 블러 및 글로우 지원)
 */
export function renderVideoEffectFrame(ctx, template, t, values, W, H) {
  if (!template?.render) return;

  const useMotionBlur = values.motionBlur === true;
  const samples = useMotionBlur ? 4 : 1; // 모션 블러 시 4개 프레임 합성
  const frameDuration = 0.015; // 샘플 간의 시간 간격

  if (samples > 1) {
    // 모션 블러용 누적 렌더링
    ctx.save();
    for (let i = 0; i < samples; i++) {
      const sampleT = Math.max(0, t - (i * frameDuration) / (template.duration / 1000));
      ctx.globalAlpha = (samples - i) / (samples * 1.5); // 잔상 효과를 위해 뒤로 갈수록 투명하게
      
      // 실제 렌더링
      template.render(ctx, sampleT, values, W, H);
      
      // 텍스트 객체도 블러 처리
      renderExtraTextObjects(ctx, values?.textObjects, W, H);
    }
    ctx.restore();
  } else {
    // 일반 렌더링
    template.render(ctx, t, values, W, H);
    renderExtraTextObjects(ctx, values?.textObjects, W, H);
  }
}
