// ─────────────────────────────────────────────
// 공통 유틸
// ─────────────────────────────────────────────
function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { return t * t * t; }
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function progress(t, start, end) { return clamp((t - start) / (end - start), 0, 1); }
function elasticOut(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}
function bounceOut(t) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1/d1) return n1*t*t;
  if (t < 2/d1) return n1*(t-=1.5/d1)*t+0.75;
  if (t < 2.5/d1) return n1*(t-=2.25/d1)*t+0.9375;
  return n1*(t-=2.625/d1)*t+0.984375;
}
// t 기반 의사 랜덤 (글리치용 — 같은 t는 항상 같은 값)
function seededRand(t, seed = 1) {
  const x = Math.sin(t * 9301 + seed * 49297) * 233280;
  return x - Math.floor(x);
}
function wrapText(ctx, text, maxWidth) {
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
}

// ═══════════════════════════════════════════════
// ① 인트로 (5개)
// ═══════════════════════════════════════════════

const introFade = {
  id: 'intro-fade-01', name: '페이드인 인트로', type: 'intro', duration: 4000,
  fields: [
    { id: 'title',       label: '채널명',   type: 'text',  default: '내 채널' },
    { id: 'slogan',      label: '슬로건',   type: 'text',  default: '매일 새로운 콘텐츠' },
    { id: 'bgColor',     label: '배경색',   type: 'color', default: '#1a1a2e' },
    { id: 'accentColor', label: '포인트색', type: 'color', default: '#e94560' },
    { id: 'textColor',   label: '텍스트색', type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
    const lineP = easeOut(progress(t, 0.1, 0.4));
    const lineW = W * 0.6 * lineP;
    ctx.fillStyle = v.accentColor; ctx.fillRect((W-lineW)/2, H/2-2, lineW, 4);
    const titleP = easeOut(progress(t, 0.25, 0.6));
    const titleScale = 0.7 + 0.3 * titleP;
    ctx.globalAlpha = titleP; ctx.save(); ctx.translate(W/2, H/2-60); ctx.scale(titleScale, titleScale);
    ctx.fillStyle = v.textColor; ctx.font = `bold ${Math.round(H*0.1)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v.title, 0, 0); ctx.restore();
    const sloganP = easeOut(progress(t, 0.45, 0.75));
    ctx.globalAlpha = sloganP; ctx.fillStyle = v.accentColor;
    ctx.font = `${Math.round(H*0.04)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v.slogan, W/2, H/2+50);
    const fadeOut = progress(t, 0.85, 1.0);
    if (fadeOut > 0) { ctx.globalAlpha = fadeOut; ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H); }
    ctx.globalAlpha = 1;
  },
};

const introSlide = {
  id: 'intro-slide-02', name: '슬라이드인 인트로', type: 'intro', duration: 3500,
  fields: [
    { id: 'title',     label: '채널명',   type: 'text',  default: '내 채널' },
    { id: 'subtitle',  label: '부제목',   type: 'text',  default: 'YouTube Creator' },
    { id: 'bgColor',   label: '배경색',   type: 'color', default: '#0f0f0f' },
    { id: 'barColor',  label: '바 색상',  type: 'color', default: '#ff0000' },
    { id: 'textColor', label: '텍스트색', type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
    
    // 로고 렌더링 (왼쪽 상단)
    if (v.uploadedImageElement) {
      const logoP = easeOut(progress(t, 0.1, 0.4));
      const logoSize = H * 0.12;
      ctx.globalAlpha = logoP;
      ctx.drawImage(v.uploadedImageElement, W * 0.12, H * 0.15 - (1 - logoP) * 10, logoSize, logoSize);
    }

    const barP = easeOut(progress(t, 0.0, 0.35));
    ctx.fillStyle = v.barColor; 
    ctx.shadowBlur = 12; ctx.shadowColor = v.barColor;
    ctx.fillRect(W*0.12, (H-H*barP)/2, W*0.012, H*barP);
    ctx.shadowBlur = 0;
    const titleP = easeOut(progress(t, 0.2, 0.55));
    ctx.globalAlpha = titleP; ctx.fillStyle = v.textColor;
    ctx.font = `bold ${Math.round(H*0.1)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(v.title, W*0.16 + (1-titleP)*W*0.15, H/2-35);
    const subP = easeOut(progress(t, 0.35, 0.65));
    ctx.globalAlpha = subP; ctx.fillStyle = v.barColor;
    ctx.font = `${Math.round(H*0.038)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.subtitle, W*0.16 + (1-subP)*W*0.15, H/2+45);
    const fo = progress(t, 0.82, 1.0);
    if (fo>0) { ctx.globalAlpha=fo; ctx.fillStyle=v.bgColor; ctx.fillRect(0,0,W,H); }
    ctx.globalAlpha = 1;
  },
};

const introTyping = {
  id: 'intro-typing-06', name: '타이포그래피 인트로', type: 'intro', duration: 4500,
  fields: [
    { id: 'title',       label: '타이핑 텍스트', type: 'text',  default: '안녕하세요, 내 채널입니다' },
    { id: 'subtitle',    label: '서브 텍스트',   type: 'text',  default: 'Welcome to My Channel' },
    { id: 'bgColor',     label: '배경색',         type: 'color', default: '#0d0d0d' },
    { id: 'textColor',   label: '텍스트색',       type: 'color', default: '#00ff88' },
    { id: 'cursorColor', label: '커서색',         type: 'color', default: '#00ff88' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
    const typingP = progress(t, 0.08, 0.65);
    const chars = Math.floor(easeOut(typingP) * v.title.length);
    const displayText = v.title.slice(0, chars);
    const cursorOn = Math.sin(t * 25) > 0;
    ctx.fillStyle = v.textColor;
    ctx.font = `bold ${Math.round(H*0.085)}px 'Courier New',monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const titleY = H/2 - H*0.07;
    ctx.fillText(displayText + (cursorOn && typingP < 1 ? '|' : ''), W/2, titleY);
    // 커서 깜빡임 (타이핑 완료 후 0.5초간)
    if (typingP >= 1 && progress(t, 0.65, 0.75) < 1 && cursorOn) {
      const tw = ctx.measureText(v.title).width;
      ctx.fillStyle = v.cursorColor;
      ctx.fillRect(W/2 + tw/2 + 4, titleY - H*0.04, 3, H*0.08);
    }
    // 서브타이틀
    const subP = easeOut(progress(t, 0.68, 0.85));
    ctx.globalAlpha = subP; ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `${Math.round(H*0.035)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.subtitle, W/2, H/2 + H*0.06);
    // 언더라인
    ctx.globalAlpha = subP * 0.4; ctx.fillStyle = v.textColor;
    ctx.fillRect(W*0.2, H/2-2, W*0.6, 1);
    const fo = progress(t, 0.88, 1.0);
    if (fo>0) { ctx.globalAlpha=fo; ctx.fillStyle=v.bgColor; ctx.fillRect(0,0,W,H); }
    ctx.globalAlpha = 1;
  },
};

const introCinematic = {
  id: 'intro-cinematic-07', name: '시네마틱 인트로', type: 'intro', duration: 5000,
  fields: [
    { id: 'title',     label: '영상 제목',  type: 'text',  default: 'EPISODE 1' },
    { id: 'subtitle',  label: '부제목',     type: 'text',  default: '새로운 시작' },
    { id: 'bgColor',   label: '배경색',     type: 'color', default: '#000000' },
    { id: 'textColor', label: '텍스트색',   type: 'color', default: '#ffffff' },
    { id: 'barColor',  label: '레터박스색', type: 'color', default: '#000000' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
    // 배경 그라디언트 (약간의 깊이감)
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
    grad.addColorStop(0, 'rgba(40,40,40,1)'); grad.addColorStop(1, v.bgColor);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    // 텍스트 reveal (좌→우 클리핑)
    const revealP = easeOut(progress(t, 0.25, 0.7));
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W * revealP, H); ctx.clip();
    ctx.fillStyle = v.textColor;
    ctx.font = `900 ${Math.round(H*0.115)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.letterSpacing = '0.15em';
    ctx.fillText(v.title, W/2, H/2 - H*0.04);
    ctx.restore();
    // 서브타이틀
    const subP = easeOut(progress(t, 0.55, 0.8));
    ctx.globalAlpha = subP; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `300 ${Math.round(H*0.036)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.subtitle, W/2, H/2 + H*0.07);
    ctx.globalAlpha = 1;
    // 레터박스 (위아래 검정 바)
    const lbP = easeOut(progress(t, 0.0, 0.2));
    const lbH = H * 0.14 * lbP;
    ctx.fillStyle = v.barColor;
    ctx.fillRect(0, 0, W, lbH); ctx.fillRect(0, H-lbH, W, lbH);
    const fo = progress(t, 0.88, 1.0);
    if (fo>0) { ctx.globalAlpha=fo; ctx.fillStyle=v.bgColor; ctx.fillRect(0,0,W,H); }
    ctx.globalAlpha = 1;
  },
};

const introZoomOut = {
  id: 'intro-zoomout-08', name: '줌아웃 인트로', type: 'intro', duration: 3500,
  fields: [
    { id: 'title',       label: '채널명',   type: 'text',  default: '내 채널' },
    { id: 'bgColor',     label: '배경색',   type: 'color', default: '#111111' },
    { id: 'textColor',   label: '텍스트색', type: 'color', default: '#ffffff' },
    { id: 'accentColor', label: '포인트색', type: 'color', default: '#ff4757' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
    const zoomP = easeOut(progress(t, 0.0, 0.55));
    const scale = 3.0 - 2.0 * zoomP;
    const alpha = zoomP;
    // 블러 시뮬레이션: 스케일 차이가 큰 초반에 여러 겹 그리기
    const layers = scale > 1.5 ? 5 : 2;
    for (let i = layers; i >= 0; i--) {
      const ls = scale + i * 0.12 * (1 - zoomP);
      ctx.globalAlpha = alpha * (1 / (layers + 1));
      ctx.save(); ctx.translate(W/2, H/2); ctx.scale(ls, ls); ctx.translate(-W/2, -H/2);
      ctx.fillStyle = v.textColor;
      ctx.font = `900 ${Math.round(H*0.12)}px 'Pretendard','Noto Sans KR',sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(v.title, W/2, H/2);
      ctx.restore();
    }
    // 선명한 레이어
    ctx.globalAlpha = Math.min(alpha * 1.5, 1);
    ctx.save(); ctx.translate(W/2, H/2); ctx.scale(scale, scale); ctx.translate(-W/2, -H/2);
    ctx.fillStyle = v.textColor;
    ctx.font = `900 ${Math.round(H*0.12)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.title, W/2, H/2);
    ctx.restore();
    // 포인트 원
    const circleP = easeOut(progress(t, 0.5, 0.8));
    if (circleP > 0) {
      ctx.globalAlpha = circleP * 0.3;
      ctx.strokeStyle = v.accentColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(W/2, H/2, W*0.25*circleP, 0, Math.PI*2); ctx.stroke();
    }
    const fo = progress(t, 0.85, 1.0);
    if (fo>0) { ctx.globalAlpha=fo; ctx.fillStyle=v.bgColor; ctx.fillRect(0,0,W,H); }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  },
};

// ═══════════════════════════════════════════════
// ② 아웃트로 (5개)
// ═══════════════════════════════════════════════

const outroYouTube = {
  id: 'outro-youtube-03', name: '유튜브 스타일 아웃트로', type: 'outro', duration: 12000,
  fields: [
    { id: 'channelName', label: '채널명',           type: 'text',  default: '내 채널' },
    { id: 'video1',      label: '영상 박스 1 텍스트', type: 'text', default: '다음 영상' },
    { id: 'video2',      label: '영상 박스 2 텍스트', type: 'text', default: '추천 영상' },
    { id: 'bgColor',     label: '배경색',            type: 'color', default: '#0f0f0f' },
    { id: 'accentColor', label: '포인트색',           type: 'color', default: '#ff0000' },
    { id: 'textColor',   label: '텍스트색',           type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0, 0, W, H);
    const p = easeOut(progress(t, 0.0, 0.2));
    ctx.globalAlpha = p;
    ctx.fillStyle = v.textColor;
    ctx.font = `bold ${Math.round(H*0.055)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.channelName, W/2, H*0.18);
    const btnW=W*0.18, btnH=H*0.07, btnX=W/2-W*0.09, btnY=H*0.26;
    ctx.fillStyle = v.accentColor;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, btnH/2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(H*0.035)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText('구독', W/2, btnY+btnH/2);
    ctx.fillStyle = v.textColor;
    ctx.font = `${Math.round(H*0.025)}px 'Pretendard',sans-serif`;
    ctx.fillText('🔔 알림 설정도 잊지 마세요!', W/2, btnY+btnH+H*0.035);
    const boxW=W*0.3, boxH=H*0.28, boxY=H*0.55;
    const boxP = easeOut(progress(t, 0.1, 0.35));
    ctx.globalAlpha = p*boxP;
    [W*0.12, W*0.58].forEach((bx, idx) => {
      ctx.fillStyle = '#333333'; ctx.beginPath(); ctx.roundRect(bx, boxY, boxW, boxH, 8); ctx.fill();
      ctx.strokeStyle = v.accentColor; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = v.textColor;
      ctx.font = `bold ${Math.round(H*0.032)}px 'Pretendard','Noto Sans KR',sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(idx===0?v.video1:v.video2, bx+boxW/2, boxY+boxH/2);
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(bx+boxW/2, boxY+boxH*0.35, H*0.04, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffffff'; ctx.beginPath();
      const px=bx+boxW/2-H*0.012, py=boxY+boxH*0.35, pr=H*0.025;
      ctx.moveTo(px, py-pr); ctx.lineTo(px+pr*1.5, py); ctx.lineTo(px, py+pr); ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha=1; ctx.lineWidth=1;
  },
};

const outroSimple = {
  id: 'outro-simple-04', name: '심플 아웃트로', type: 'outro', duration: 8000,
  fields: [
    { id: 'message',   label: '감사 메시지', type: 'text',  default: '시청해 주셔서 감사합니다' },
    { id: 'cta',       label: '구독 유도',   type: 'text',  default: '구독과 좋아요는 큰 힘이 됩니다 🙏' },
    { id: 'bgColor',   label: '배경색',      type: 'color', default: '#16213e' },
    { id: 'lineColor', label: '라인색',      type: 'color', default: '#0f3460' },
    { id: 'textColor', label: '텍스트색',    type: 'color', default: '#e0e0e0' },
    { id: 'ctaColor',  label: 'CTA 색상',    type: 'color', default: '#e94560' },
  ],
  render(ctx, t, v, W, H) {
    const grad = ctx.createLinearGradient(0,0,W,H);
    grad.addColorStop(0, v.bgColor); grad.addColorStop(1, v.lineColor);
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=0.15; ctx.fillStyle=v.ctaColor;
    ctx.beginPath(); ctx.arc(W*0.85,H*0.2,H*0.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.1,H*0.85,H*0.3,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    const msgP = easeOut(progress(t, 0.05, 0.4));
    ctx.globalAlpha=msgP; ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(H*0.085)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const lines = wrapText(ctx, v.message, W*0.75);
    lines.forEach((line,i) => ctx.fillText(line, W/2, H/2 - (lines.length-1)*H*0.05 + i*H*0.1 - 40));
    const ctaP = easeOut(progress(t, 0.35, 0.65));
    ctx.globalAlpha=ctaP; ctx.fillStyle=v.ctaColor;
    ctx.font=`${Math.round(H*0.038)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.cta, W/2, H*0.68);
    const lp=easeOut(progress(t,0.5,0.8)); const lw=W*0.5*lp;
    ctx.globalAlpha=lp*0.6; ctx.fillStyle=v.ctaColor; ctx.fillRect((W-lw)/2,H*0.77,lw,2);
    ctx.globalAlpha=1;
  },
};

const outroSocial = {
  id: 'outro-social-09', name: '소셜 링크 아웃트로', type: 'outro', duration: 10000,
  fields: [
    { id: 'channelName', label: '채널명',       type: 'text',  default: '내 채널' },
    { id: 'youtube',     label: 'YouTube',       type: 'text',  default: '@mychannel' },
    { id: 'instagram',   label: 'Instagram',     type: 'text',  default: '@mychannel' },
    { id: 'twitter',     label: 'Twitter/X',     type: 'text',  default: '@mychannel' },
    { id: 'bgColor',     label: '배경색',         type: 'color', default: '#111111' },
    { id: 'textColor',   label: '텍스트색',       type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    // 채널명
    const titleP = easeOut(progress(t,0.05,0.3));
    ctx.globalAlpha=titleP; ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(H*0.072)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.channelName, W/2, H*0.25);
    // 구분선
    const lineP=easeOut(progress(t,0.25,0.45));
    ctx.globalAlpha=lineP*0.4; ctx.fillStyle=v.textColor;
    ctx.fillRect((W-W*0.4*lineP)/2, H*0.37, W*0.4*lineP, 1);
    // SNS 아이콘 3개 (순서대로 fade+slide up)
    const items = [
      { label: 'YouTube',    color: '#ff0000', handle: v.youtube,   icon: 'YT' },
      { label: 'Instagram',  color: '#e1306c', handle: v.instagram, icon: 'IG' },
      { label: 'Twitter/X',  color: '#1da1f2', handle: v.twitter,   icon: 'TW' },
    ];
    items.forEach((item, i) => {
      const p = easeOut(progress(t, 0.35 + i*0.1, 0.6 + i*0.1));
      const baseX = W/2 - W*0.28 + i*W*0.28;
      const baseY = H*0.58 + (1-p)*H*0.06;
      ctx.globalAlpha = p;
      // 원형 아이콘 배경
      ctx.fillStyle = item.color;
      ctx.beginPath(); ctx.arc(baseX, baseY, H*0.06, 0, Math.PI*2); ctx.fill();
      // 아이콘 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(H*0.038)}px 'Courier New',monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(item.icon, baseX, baseY);
      // 핸들 텍스트
      ctx.fillStyle = v.textColor;
      ctx.font = `${Math.round(H*0.028)}px 'Pretendard','Noto Sans KR',sans-serif`;
      ctx.fillText(item.handle, baseX, baseY + H*0.1);
    });
    ctx.globalAlpha=1;
  },
};

const outroNextEp = {
  id: 'outro-nextep-10', name: '다음 에피소드 예고', type: 'outro', duration: 8000,
  fields: [
    { id: 'teaser',    label: '"다음 편에서는..." 텍스트', type: 'text',  default: '다음 편에서는...' },
    { id: 'hint',      label: '힌트/예고 내용',           type: 'text',  default: '공개 예정 😎' },
    { id: 'bgColor',   label: '배경색',                   type: 'color', default: '#1a1a2e' },
    { id: 'boxColor',  label: '박스 색상',                type: 'color', default: '#16213e' },
    { id: 'accentColor', label: '포인트색',               type: 'color', default: '#e94560' },
    { id: 'textColor', label: '텍스트색',                 type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const teaserP = easeOut(progress(t,0.05,0.35));
    ctx.globalAlpha=teaserP; ctx.fillStyle=v.accentColor;
    ctx.font=`bold ${Math.round(H*0.065)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.teaser, W/2, H*0.3);
    // 물음표 박스 (점선 테두리)
    const boxP = easeOut(progress(t,0.3,0.6));
    const bx=W*0.25, by=H*0.43, bw=W*0.5, bh=H*0.25;
    ctx.globalAlpha=boxP;
    ctx.fillStyle = v.boxColor;
    ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,12); ctx.fill();
    ctx.strokeStyle=v.accentColor; ctx.lineWidth=2; ctx.setLineDash([8,6]);
    ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,12); ctx.stroke();
    ctx.setLineDash([]);
    // 힌트 텍스트 또는 ?
    const hintP = easeOut(progress(t,0.5,0.75));
    ctx.globalAlpha=hintP; ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(H*0.05)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.hint, W/2, by+bh/2);
    ctx.globalAlpha=1; ctx.lineWidth=1;
  },
};

const outroMinimal = {
  id: 'outro-minimal-11', name: '미니멀 감사 아웃트로', type: 'outro', duration: 6000,
  fields: [
    { id: 'message',   label: '메인 메시지', type: 'text',  default: 'Thank You' },
    { id: 'sub',       label: '서브 메시지', type: 'text',  default: '구독해 주셔서 감사합니다' },
    { id: 'bgColor',   label: '배경색',      type: 'color', default: '#ffffff' },
    { id: 'textColor', label: '텍스트색',    type: 'color', default: '#111111' },
    { id: 'lineColor', label: '라인색',      type: 'color', default: '#111111' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    // 상단 라인
    const topLP = easeOut(progress(t,0.05,0.3));
    const lw=W*0.45*topLP;
    ctx.fillStyle=v.lineColor; ctx.globalAlpha=0.25;
    ctx.fillRect((W-lw)/2, H*0.32, lw, 1.5);
    // 메인 텍스트
    const msgP = easeOut(progress(t,0.2,0.5));
    ctx.globalAlpha=msgP; ctx.fillStyle=v.textColor;
    ctx.font=`300 ${Math.round(H*0.1)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.message, W/2, H*0.5);
    // 하단 라인
    const botLP = easeOut(progress(t,0.4,0.65));
    ctx.globalAlpha=0.25*botLP; ctx.fillStyle=v.lineColor;
    ctx.fillRect((W-W*0.45*botLP)/2, H*0.62, W*0.45*botLP, 1.5);
    // 서브 텍스트
    const subP = easeOut(progress(t,0.55,0.8));
    ctx.globalAlpha=subP*0.6; ctx.fillStyle=v.textColor;
    ctx.font=`${Math.round(H*0.033)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.sub, W/2, H*0.7);
    ctx.globalAlpha=1;
  },
};

// ═══════════════════════════════════════════════
// ③ 섹션 타이틀 (6개) — 단원 구분 삽입용
// ═══════════════════════════════════════════════

const sectionChapter = {
  id: 'section-chapter-12', name: '챕터 카운터', type: 'section-title', duration: 3000,
  fields: [
    { id: 'chapterNum',  label: '챕터 번호', type: 'number', default: '1', min: 1, max: 99 },
    { id: 'chapterTitle', label: '챕터 제목', type: 'text',  default: '시작하기' },
    { id: 'bgColor',     label: '배경색',     type: 'color', default: '#0d0d0d' },
    { id: 'numColor',    label: '숫자 색상',  type: 'color', default: '#ff4757' },
    { id: 'textColor',   label: '텍스트색',   type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const num = parseInt(v.chapterNum) || 1;
    const countP = easeOut(progress(t,0.0,0.35));
    const displayNum = Math.floor(countP * num);
    // "CHAPTER" 라벨
    const labelP = easeOut(progress(t,0.0,0.25));
    ctx.globalAlpha=labelP*0.5; ctx.fillStyle=v.textColor;
    ctx.font=`600 ${Math.round(H*0.04)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('CHAPTER', W/2, H*0.33);
    // 큰 숫자
    ctx.globalAlpha=countP; ctx.fillStyle=v.numColor;
    ctx.font=`900 ${Math.round(H*0.28)}px 'Pretendard',sans-serif`;
    ctx.fillText(displayNum.toString().padStart(2,'0'), W/2, H*0.55);
    // 포인트 라인
    const lineP = easeOut(progress(t,0.3,0.55));
    ctx.globalAlpha=lineP; ctx.fillStyle=v.numColor;
    ctx.fillRect((W-W*0.35*lineP)/2, H*0.72, W*0.35*lineP, 3);
    // 챕터 제목
    const titleP = easeOut(progress(t,0.5,0.75));
    ctx.globalAlpha=titleP; ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(H*0.048)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.chapterTitle, W/2, H*0.82);
    const fo=progress(t,0.88,1.0);
    if(fo>0){ctx.globalAlpha=fo;ctx.fillStyle=v.bgColor;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  },
};

const sectionWipe = {
  id: 'section-wipe-13', name: '사이드 와이프 섹션', type: 'section-title', duration: 2500,
  fields: [
    { id: 'title',       label: '섹션 제목', type: 'text',  default: '섹션 2' },
    { id: 'subtitle',    label: '서브 제목', type: 'text',  default: '본론으로 들어가겠습니다' },
    { id: 'bgColor',     label: '배경색',    type: 'color', default: '#111827' },
    { id: 'panelColor',  label: '패널색',    type: 'color', default: '#1f2937' },
    { id: 'accentColor', label: '포인트색',  type: 'color', default: '#3b82f6' },
    { id: 'textColor',   label: '텍스트색',  type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    // 패널이 오른쪽에서 슬라이드 인
    const inP = easeOut(progress(t,0.0,0.35));
    const outP = easeIn(progress(t,0.75,1.0));
    const offsetX = W*(1-inP) - W*outP;
    ctx.save(); ctx.translate(offsetX, 0);
    // 패널 배경
    ctx.fillStyle=v.panelColor; ctx.fillRect(0,0,W,H);
    // 왼쪽 포인트 바
    const barH=H*easeOut(progress(t-0.05,0.0,0.3));
    ctx.fillStyle=v.accentColor; ctx.fillRect(W*0.07, (H-barH)/2, W*0.012, barH);
    // 제목
    ctx.fillStyle=v.textColor;
    ctx.font=`900 ${Math.round(H*0.1)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(v.title, W*0.12, H/2-H*0.04);
    // 서브
    ctx.fillStyle=v.accentColor;
    ctx.font=`${Math.round(H*0.037)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.subtitle, W*0.12, H/2+H*0.07);
    ctx.restore();
  },
};

const sectionPoint = {
  id: 'section-point-14', name: '포인트 섹션 타이틀', type: 'section-title', duration: 3000,
  fields: [
    { id: 'num',         label: '번호',      type: 'number', default: '1', min:1, max:99 },
    { id: 'title',       label: '섹션 제목', type: 'text',   default: '첫 번째 포인트' },
    { id: 'subtitle',    label: '서브 설명', type: 'text',   default: '자세한 내용을 알아봅시다' },
    { id: 'bgColor',     label: '배경색',    type: 'color',  default: '#f8f9fa' },
    { id: 'numColor',    label: '번호 색상', type: 'color',  default: '#dc3545' },
    { id: 'textColor',   label: '텍스트색',  type: 'color',  default: '#212529' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const num = parseInt(v.num)||1;
    // 번호 scale-up
    const numP = easeOut(progress(t,0.0,0.3));
    const numScale = 0.5 + 0.5*numP;
    ctx.globalAlpha=numP; ctx.save();
    ctx.translate(W*0.22, H/2); ctx.scale(numScale, numScale);
    ctx.fillStyle=v.numColor;
    ctx.font=`900 ${Math.round(H*0.22)}px 'Pretendard',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(num.toString(), 0, 0);
    ctx.restore();
    // 수직 구분선 extend
    const lineP = easeOut(progress(t,0.2,0.45));
    const lh = H*0.45*lineP;
    ctx.globalAlpha=lineP; ctx.fillStyle=v.numColor;
    ctx.fillRect(W*0.36, (H-lh)/2, 4, lh);
    // 제목
    const titleP = easeOut(progress(t,0.35,0.6));
    ctx.globalAlpha=titleP; ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(H*0.075)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(v.title, W*0.4, H/2-H*0.035);
    // 서브
    const subP = easeOut(progress(t,0.5,0.75));
    ctx.globalAlpha=subP*0.6; ctx.fillStyle=v.textColor;
    ctx.font=`${Math.round(H*0.033)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.subtitle, W*0.4, H/2+H*0.065);
    const fo=progress(t,0.88,1.0);
    if(fo>0){ctx.globalAlpha=fo;ctx.fillStyle=v.bgColor;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  },
};

const sectionHighlight = {
  id: 'section-highlight-15', name: '하이라이트 박스', type: 'section-title', duration: 3500,
  fields: [
    { id: 'title',          label: '강조 텍스트',  type: 'text',  default: '핵심 포인트!' },
    { id: 'bgColor',        label: '배경색',        type: 'color', default: '#ffffff' },
    { id: 'highlightColor', label: '형광펜 색상',   type: 'color', default: '#ffd93d' },
    { id: 'textColor',      label: '텍스트색',      type: 'color', default: '#111111' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    ctx.font=`900 ${Math.round(H*0.115)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const tw = ctx.measureText(v.title).width;
    const tx = W/2, ty = H/2;
    const padX=W*0.04, padY=H*0.025;
    // 형광펜 sweep (왼→오 확장)
    const hlP = easeOut(progress(t,0.15,0.6));
    const hlW = (tw + padX*2) * hlP;
    ctx.fillStyle = v.highlightColor;
    ctx.globalAlpha = 0.75;
    // 약간 기울어진 사각형 (수작업 느낌)
    ctx.save(); ctx.translate(tx - tw/2 - padX, ty - padY*2.2);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(hlW, H*0.005);
    ctx.lineTo(hlW + W*0.003, H*0.075); ctx.lineTo(-W*0.003, H*0.075);
    ctx.closePath(); ctx.fill(); ctx.restore();
    // 텍스트
    const textP = easeOut(progress(t,0.05,0.35));
    ctx.globalAlpha=textP; ctx.fillStyle=v.textColor;
    ctx.fillText(v.title, tx, ty);
    const fo=progress(t,0.88,1.0);
    if(fo>0){ctx.globalAlpha=fo;ctx.fillStyle=v.bgColor;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  },
};

const sectionStamp = {
  id: 'section-stamp-16', name: '스탬프 효과', type: 'section-title', duration: 3000,
  fields: [
    { id: 'title',       label: '메인 텍스트', type: 'text',  default: '중요!' },
    { id: 'subtitle',    label: '서브 텍스트', type: 'text',  default: '꼭 기억하세요' },
    { id: 'bgColor',     label: '배경색',      type: 'color', default: '#f0f0f0' },
    { id: 'stampColor',  label: '스탬프 색상', type: 'color', default: '#cc0000' },
    { id: 'textColor',   label: '텍스트색',    type: 'color', default: '#cc0000' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const dropP = progress(t, 0.0, 0.18);
    const bounceP = easeOut(progress(t, 0.18, 0.32));
    // y 위치: 위에서 내려와 바운스
    let scale = 1;
    if (dropP < 1) {
      scale = 0.1 + 0.9 * easeIn(dropP);
    } else {
      scale = 1 + 0.15 * Math.sin(bounceOut(progress(t,0.18,0.55)) * Math.PI);
    }
    // 회전 약간
    const rot = (1-easeOut(progress(t,0.0,0.25))) * 0.12;
    ctx.save(); ctx.translate(W/2, H/2); ctx.rotate(rot); ctx.scale(scale, scale);
    // 스탬프 테두리
    const bw=W*0.55, bh=H*0.42;
    ctx.strokeStyle=v.stampColor; ctx.lineWidth=H*0.018;
    ctx.beginPath(); ctx.roundRect(-bw/2,-bh/2,bw,bh,8); ctx.stroke();
    // 스탬프 내부 이중 테두리
    ctx.lineWidth=H*0.006; ctx.globalAlpha=0.4;
    ctx.beginPath(); ctx.roundRect(-bw/2+H*0.015,-bh/2+H*0.015,bw-H*0.03,bh-H*0.03,6); ctx.stroke();
    ctx.globalAlpha=1;
    // 텍스트
    ctx.fillStyle=v.textColor;
    ctx.font=`900 ${Math.round(H*0.12)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.title, 0, -H*0.04);
    ctx.fillStyle=v.stampColor; ctx.globalAlpha=0.7;
    ctx.font=`600 ${Math.round(H*0.032)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.subtitle, 0, H*0.09);
    ctx.restore();
    const fo=progress(t,0.88,1.0);
    if(fo>0){ctx.globalAlpha=fo;ctx.fillStyle=v.bgColor;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1; ctx.lineWidth=1;
  },
};

const sectionStep = {
  id: 'section-step-17', name: '숫자 스텝 표시', type: 'section-title', duration: 3000,
  fields: [
    { id: 'stepNum',   label: '현재 스텝',  type: 'number', default: '2', min:1, max:9 },
    { id: 'totalStep', label: '전체 스텝',  type: 'number', default: '5', min:2, max:9 },
    { id: 'stepTitle', label: '스텝 제목',  type: 'text',   default: '핵심 분석' },
    { id: 'bgColor',   label: '배경색',     type: 'color',  default: '#0f172a' },
    { id: 'activeColor', label: '활성 색상', type: 'color', default: '#38bdf8' },
    { id: 'textColor', label: '텍스트색',   type: 'color',  default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const cur = parseInt(v.stepNum)||1;
    const tot = Math.max(parseInt(v.totalStep)||5, cur);
    // STEP 텍스트
    const labelP = easeOut(progress(t,0.0,0.25));
    ctx.globalAlpha=labelP*0.5; ctx.fillStyle=v.textColor;
    ctx.font=`600 ${Math.round(H*0.04)}px 'Pretendard',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('STEP', W/2, H*0.28);
    // 큰 숫자
    const numP = easeOut(progress(t,0.08,0.4));
    ctx.globalAlpha=numP; ctx.fillStyle=v.activeColor;
    ctx.font=`900 ${Math.round(H*0.22)}px 'Pretendard',sans-serif`;
    ctx.fillText(`${cur}`, W/2 - W*0.04, H*0.52);
    ctx.fillStyle=v.textColor; ctx.globalAlpha=numP*0.3;
    ctx.font=`300 ${Math.round(H*0.1)}px 'Pretendard',sans-serif`;
    ctx.fillText(`/${tot}`, W/2 + W*0.07, H*0.52);
    // 스텝 타이틀
    const titleP = easeOut(progress(t,0.35,0.65));
    ctx.globalAlpha=titleP; ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(H*0.05)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.fillText(v.stepTitle, W/2, H*0.72);
    // 진행 도트
    const dotP = easeOut(progress(t,0.55,0.8));
    ctx.globalAlpha=dotP;
    const dotR=H*0.018, spacing=dotR*3.2, totalW=(tot-1)*spacing;
    for(let i=0; i<tot; i++){
      const dx = W/2 - totalW/2 + i*spacing;
      const dy = H*0.86;
      ctx.fillStyle = i < cur ? v.activeColor : 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.arc(dx, dy, i===cur-1 ? dotR*1.4 : dotR, 0, Math.PI*2); ctx.fill();
    }
    const fo=progress(t,0.88,1.0);
    if(fo>0){ctx.globalAlpha=fo;ctx.fillStyle=v.bgColor;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  },
};

// ═══════════════════════════════════════════════
// ④ 트랜지션 (4개)
// ═══════════════════════════════════════════════

const transFlash = {
  id: 'trans-flash-18', name: '화이트 플래시', type: 'transition', duration: 1500,
  fields: [
    { id: 'flashColor', label: '플래시 색상', type: 'color', default: '#ffffff' },
    { id: 'bgColor',    label: '배경색',      type: 'color', default: '#000000' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    // 0→0.3: 빠르게 밝아짐, 0.3→0.5: 유지, 0.5→1.0: 서서히 어두워짐
    let alpha;
    if (t < 0.3) alpha = easeIn(t/0.3);
    else if (t < 0.5) alpha = 1;
    else alpha = 1 - easeOut((t-0.5)/0.5);
    ctx.globalAlpha=alpha; ctx.fillStyle=v.flashColor; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
  },
};

const transZoomBlur = {
  id: 'trans-zoomblur-19', name: '줌 블러', type: 'transition', duration: 1500,
  fields: [
    { id: 'color1',  label: '시작 색상', type: 'color', default: '#1a1a2e' },
    { id: 'color2',  label: '종료 색상', type: 'color', default: '#16213e' },
    { id: 'textColor', label: '텍스트색', type: 'color', default: '#ffffff' },
    { id: 'label',   label: '전환 텍스트', type: 'text', default: '계속...' },
  ],
  render(ctx, t, v, W, H) {
    const flashP = progress(t, 0.35, 0.65);
    const flashAlpha = Math.sin(flashP * Math.PI);
    // 배경
    ctx.fillStyle = t < 0.5 ? v.color1 : v.color2; ctx.fillRect(0,0,W,H);
    // 줌 블러: 여러 겹 동심 사각형
    const zoomT = t < 0.5 ? t/0.5 : (1-t)/0.5;
    const layers = 7;
    for(let i=1; i<=layers; i++){
      const s = 1 + (i/layers) * zoomT * 1.8;
      ctx.globalAlpha = (1/layers) * zoomT * 0.7;
      ctx.fillStyle = t < 0.5 ? v.color1 : v.color2;
      ctx.save(); ctx.translate(W/2,H/2); ctx.scale(s,s); ctx.translate(-W/2,-H/2);
      ctx.fillRect(0,0,W,H); ctx.restore();
    }
    // 화이트 플래시
    ctx.globalAlpha=flashAlpha*0.85; ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
    // 텍스트
    if(flashAlpha < 0.5){
      ctx.globalAlpha=0.4*(1-flashAlpha*2); ctx.fillStyle=v.textColor;
      ctx.font=`300 ${Math.round(H*0.04)}px 'Pretendard','Noto Sans KR',sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(v.label, W/2, H*0.88);
    }
    ctx.globalAlpha=1;
  },
};

const transGlitch = {
  id: 'trans-glitch-20', name: '글리치', type: 'transition', duration: 2000,
  fields: [
    { id: 'bgColor',    label: '배경색',  type: 'color', default: '#000000' },
    { id: 'color1',     label: '색상 1',  type: 'color', default: '#ff0055' },
    { id: 'color2',     label: '색상 2',  type: 'color', default: '#00ffff' },
    { id: 'label',      label: '텍스트',  type: 'text',  default: 'GLITCH' },
    { id: 'textColor',  label: '텍스트색', type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const glitchIntensity = t < 0.15 ? 0
      : t < 0.65 ? easeIn(progress(t,0.15,0.5)) * (0.5 + 0.5*Math.sin(t*80))
      : easeOut(1 - progress(t,0.65,0.9));
    // 노이즈 밴드
    const numBands = Math.floor(glitchIntensity * 12);
    for(let i=0; i<numBands; i++){
      const bY = seededRand(t*60+i, i*13) * H;
      const bH = seededRand(t*60+i, i*7+1) * H*0.06 + 2;
      const bX = (seededRand(t*60+i, i*3+2) - 0.5) * W * 0.15;
      ctx.fillStyle = i%3===0 ? v.color1 : i%3===1 ? v.color2 : v.bgColor;
      ctx.globalAlpha = 0.6 * glitchIntensity;
      ctx.fillRect(bX, bY, W, bH);
    }
    ctx.globalAlpha=1;
    // 텍스트 (R/G/B 채널 분리)
    const offset = glitchIntensity * W*0.012;
    ctx.font=`900 ${Math.round(H*0.14)}px 'Pretendard',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    [v.color1, v.color2, v.textColor].forEach((col, i) => {
      ctx.globalAlpha = i===2 ? 1 : 0.6*glitchIntensity;
      ctx.fillStyle = col;
      const ox = i===0 ? -offset : i===1 ? offset : 0;
      const oy = i===0 ? offset*0.5 : i===1 ? -offset*0.5 : 0;
      ctx.fillText(v.label, W/2+ox, H/2+oy);
    });
    // 플래시
    const flashP = progress(t, 0.58, 0.68);
    if(flashP>0){ ctx.globalAlpha=flashP*0.9; ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H); }
    ctx.globalAlpha=1;
  },
};

const transCircle = {
  id: 'trans-circle-21', name: '원형 확장', type: 'transition', duration: 1500,
  fields: [
    { id: 'color1',    label: '원 색상',  type: 'color', default: '#ff4757' },
    { id: 'bgColor',   label: '배경색',   type: 'color', default: '#2f3542' },
    { id: 'label',     label: '전환 텍스트', type: 'text', default: 'NEXT' },
    { id: 'textColor', label: '텍스트색', type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle = v.bgColor; ctx.fillRect(0,0,W,H);
    const maxR = Math.sqrt(W*W + H*H) / 2 * 1.1;
    // 0~0.5: 원이 커지며 덮음, 0.5~1.0: 다시 줄어듦
    const r = t < 0.5
      ? easeIn(t/0.5) * maxR
      : (1 - easeOut((t-0.5)/0.5)) * maxR;
    ctx.fillStyle = v.color1;
    ctx.beginPath(); ctx.arc(W/2, H/2, r, 0, Math.PI*2); ctx.fill();
    // 텍스트 (원이 최대일 때)
    const textAlpha = t<0.5 ? progress(t,0.35,0.5) : 1-progress(t,0.5,0.65);
    if(textAlpha>0){
      ctx.globalAlpha=textAlpha; ctx.fillStyle=v.textColor;
      ctx.font=`900 ${Math.round(H*0.1)}px 'Pretendard',sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(v.label, W/2, H/2);
    }
    ctx.globalAlpha=1;
  },
};

// ═══════════════════════════════════════════════
// ⑤ 로워서드 추가 (2개)
// ═══════════════════════════════════════════════

const lowerThird = {
  id: 'lower-third-05', name: '로워서드', type: 'lower-third', duration: 5000,
  fields: [
    { id: 'name',      label: '이름',          type: 'text',   default: '홍길동' },
    { id: 'title',     label: '직책/역할',     type: 'text',   default: 'YouTube 크리에이터' },
    { id: 'barColor',  label: '바 색상',       type: 'color',  default: '#ff0000' },
    { id: 'bgOpacity', label: '배경 불투명도', type: 'select',
      options: [{value:'0',label:'투명'},{value:'0.6',label:'반투명'},{value:'1',label:'불투명'}],
      default: '0' },
    { id: 'bgColor',   label: '배경색',        type: 'color',  default: '#000000' },
    { id: 'textColor', label: '텍스트색',      type: 'color',  default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    const opacity = parseFloat(v.bgOpacity||'0');
    if(opacity>0){ctx.globalAlpha=opacity;ctx.fillStyle=v.bgColor;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
    const barY=H*0.72, barH=H*0.16;
    let slideX;
    if(t<0.25) slideX=-W*0.5*(1-easeOut(t/0.25));
    else if(t<0.75) slideX=0;
    else slideX=-W*0.5*easeIn((t-0.75)/0.25);
    ctx.save(); ctx.translate(slideX,0);
    ctx.fillStyle=v.barColor; ctx.fillRect(W*0.05,barY,W*0.008,barH);
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(W*0.065,barY,W*0.45,barH);
    ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(barH*0.42)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(v.name, W*0.078, barY+barH*0.34);
    ctx.fillStyle=v.barColor;
    ctx.font=`${Math.round(barH*0.3)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.title, W*0.078, barY+barH*0.72);
    ctx.restore();
  },
};

const lowerNews = {
  id: 'lower-news-22', name: '뉴스 스타일', type: 'lower-third', duration: 5000,
  fields: [
    { id: 'badge',     label: '배지 텍스트', type: 'text',  default: 'BREAKING' },
    { id: 'name',      label: '이름/제목',   type: 'text',  default: '속보: 중요 발표' },
    { id: 'ticker',    label: '티커 텍스트', type: 'text',  default: '추가 정보는 설명란을 확인하세요' },
    { id: 'barColor',  label: '배지 색상',   type: 'color', default: '#cc0000' },
    { id: 'bgColor',   label: '바 배경색',   type: 'color', default: '#1a1a1a' },
    { id: 'textColor', label: '텍스트색',    type: 'color', default: '#ffffff' },
  ],
  render(ctx, t, v, W, H) {
    const slideP = easeOut(progress(t,0.0,0.3));
    const slideOut = easeIn(progress(t,0.78,1.0));
    const barY = H*0.76, barH = H*0.14;
    const barW = W * slideP - W * slideOut;
    ctx.fillStyle=v.bgColor; ctx.fillRect(0, barY, barW, barH);
    if(slideP < 0.05) return;
    // 배지
    const badgeW = W*0.13;
    ctx.fillStyle=v.barColor; ctx.fillRect(0, barY, badgeW*Math.min(slideP*3,1), barH);
    ctx.fillStyle=v.textColor;
    ctx.font=`900 ${Math.round(barH*0.38)}px 'Pretendard',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.badge, badgeW/2, barY+barH/2);
    // 이름
    ctx.textAlign='left';
    ctx.font=`bold ${Math.round(barH*0.42)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillText(v.name, badgeW+W*0.015, barY+barH*0.42);
    // 티커
    ctx.font=`${Math.round(barH*0.28)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.65)';
    ctx.fillText(v.ticker, badgeW+W*0.015, barY+barH*0.76);
    ctx.globalAlpha=1;
  },
};

// ═══════════════════════════════════════════════
// ⑥ 자막/강조 (3개)
// ═══════════════════════════════════════════════

const captionBubble = {
  id: 'caption-bubble-23', name: '말풍선 자막', type: 'caption', duration: 4000,
  fields: [
    { id: 'text',      label: '말풍선 텍스트', type: 'text',  default: '안녕하세요! 🎉' },
    { id: 'bgColor',   label: '말풍선 배경',   type: 'color', default: '#ffffff' },
    { id: 'textColor', label: '텍스트색',      type: 'color', default: '#111111' },
    { id: 'tailColor', label: '꼬리 색상',     type: 'color', default: '#ffffff' },
    { id: 'canvasBg',  label: '캔버스 배경',   type: 'color', default: '#1a1a2e' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle=v.canvasBg; ctx.fillRect(0,0,W,H);
    const scaleIn = t<0.2 ? elasticOut(t/0.2) : t>0.82 ? 1-easeIn((t-0.82)/0.18) : 1;
    const bx=W*0.08, by=H*0.22, bw=W*0.55, bh=H*0.38, br=bh*0.12;
    ctx.save(); ctx.translate(bx+bw/2, by+bh/2); ctx.scale(scaleIn,scaleIn); ctx.translate(-bw/2,-bh/2);
    // 버블 본체
    ctx.fillStyle=v.bgColor; ctx.beginPath(); ctx.roundRect(0,0,bw,bh,br); ctx.fill();
    // 꼬리 (좌하단)
    ctx.fillStyle=v.tailColor;
    ctx.beginPath(); ctx.moveTo(bw*0.15,bh-2); ctx.lineTo(bw*0.05,bh+bh*0.18); ctx.lineTo(bw*0.32,bh-2); ctx.closePath(); ctx.fill();
    // 텍스트
    ctx.fillStyle=v.textColor;
    ctx.font=`bold ${Math.round(bh*0.22)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const lines=wrapText(ctx,v.text,bw*0.82);
    const lh=bh*0.25;
    lines.forEach((line,i)=>ctx.fillText(line, bw/2, bh/2+(i-(lines.length-1)/2)*lh));
    ctx.restore();
  },
};

const captionHighlight = {
  id: 'caption-highlight-24', name: '형광펜 강조', type: 'caption', duration: 3000,
  fields: [
    { id: 'text',           label: '강조 텍스트',  type: 'text',  default: '이것이 핵심입니다!' },
    { id: 'highlightColor', label: '형광펜 색상',  type: 'color', default: '#ffeb3b' },
    { id: 'textColor',      label: '텍스트색',     type: 'color', default: '#111111' },
    { id: 'canvasBg',       label: '캔버스 배경',  type: 'color', default: '#f5f5f5' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle=v.canvasBg; ctx.fillRect(0,0,W,H);
    ctx.font=`900 ${Math.round(H*0.1)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const tw=ctx.measureText(v.text).width;
    const tx=W/2, ty=H/2;
    // 형광펜 (파동형 선으로 사실감 추가)
    const hlP=easeOut(progress(t,0.1,0.6));
    const hlW=(tw+W*0.06)*hlP;
    const hlX=tx-tw/2-W*0.03, hlY=ty+H*0.05;
    ctx.save();
    ctx.fillStyle=v.highlightColor; ctx.globalAlpha=0.75;
    // 약간 불규칙한 두꺼운 선
    ctx.beginPath(); ctx.moveTo(hlX, hlY-H*0.005);
    ctx.bezierCurveTo(hlX+hlW*0.3, hlY-H*0.01, hlX+hlW*0.7, hlY+H*0.01, hlX+hlW, hlY-H*0.003);
    ctx.lineTo(hlX+hlW, hlY+H*0.038); ctx.lineTo(hlX, hlY+H*0.042); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 텍스트 (형광펜보다 위에)
    const textP=easeOut(progress(t,0.0,0.3));
    ctx.globalAlpha=textP; ctx.fillStyle=v.textColor; ctx.fillText(v.text, tx, ty);
    const fo=progress(t,0.88,1.0);
    if(fo>0){ctx.globalAlpha=fo;ctx.fillStyle=v.canvasBg;ctx.fillRect(0,0,W,H);}
    ctx.globalAlpha=1;
  },
};

const captionBounce = {
  id: 'caption-bounce-25', name: '흔들림 강조', type: 'caption', duration: 3000,
  fields: [
    { id: 'text',        label: '강조 텍스트', type: 'text',  default: 'WOW! 🔥' },
    { id: 'textColor',   label: '텍스트색',    type: 'color', default: '#ff4757' },
    { id: 'shadowColor', label: '그림자색',    type: 'color', default: '#ffd93d' },
    { id: 'canvasBg',    label: '캔버스 배경', type: 'color', default: '#111111' },
  ],
  render(ctx, t, v, W, H) {
    ctx.fillStyle=v.canvasBg; ctx.fillRect(0,0,W,H);
    const inP = elasticOut(Math.min(t/0.4, 1));
    const wobble = t>0.4 && t<0.82 ? Math.sin(t*35)*0.015*(1-progress(t,0.4,0.82)) : 0;
    const scale = inP * (1 + wobble);
    const fo=progress(t,0.82,1.0);
    const alpha=fo>0 ? 1-fo : 1;
    ctx.globalAlpha=alpha;
    ctx.save(); ctx.translate(W/2, H/2); ctx.scale(scale,scale);
    // 그림자
    ctx.fillStyle=v.shadowColor;
    ctx.font=`900 ${Math.round(H*0.14)}px 'Pretendard','Noto Sans KR',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(v.text, H*0.012, H*0.018);
    // 본 텍스트
    ctx.fillStyle=v.textColor; ctx.fillText(v.text, 0, 0);
    ctx.restore();
    ctx.globalAlpha=1;
  },
};

// ═══════════════════════════════════════════════
// 내보내기
// ═══════════════════════════════════════════════
export const TEMPLATES = [
  // 인트로
  introFade, introSlide, introTyping, introCinematic, introZoomOut,
  // 아웃트로
  outroYouTube, outroSimple, outroSocial, outroNextEp, outroMinimal,
  // 섹션 타이틀
  sectionChapter, sectionWipe, sectionPoint, sectionHighlight, sectionStamp, sectionStep,
  // 트랜지션
  transFlash, transZoomBlur, transGlitch, transCircle,
  // 로워서드
  lowerThird, lowerNews,
  // 자막/강조
  captionBubble, captionHighlight, captionBounce,
];

export const TEMPLATE_TYPE_LABELS = {
  'intro':         '인트로',
  'outro':         '아웃트로',
  'section-title': '섹션 타이틀',
  'transition':    '트랜지션',
  'lower-third':   '로워서드',
  'caption':       '자막/강조',
};

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || null;
}
