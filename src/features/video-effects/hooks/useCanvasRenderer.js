import { useRef, useEffect, useCallback, useState } from 'react';
import { renderVideoEffectFrame } from '../utils/videoEffectsTextObjects';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';

const PREVIEW_W = 640;
const PREVIEW_H = 360;

/**
 * Canvas 애니메이션 렌더러
 * @param {object} template - 템플릿 객체 (render 함수 포함)
 * @param {object} values   - 사용자 커스텀 값
 * @param {boolean} autoPlay - 마운트 시 자동 재생 여부
 */
export function useCanvasRenderer(template, values, autoPlay = true) {
  const { uploadedImage, durationOverride } = useVideoEffectsStore();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(null); // 일시정지 시점 (ms)
  const imageElementRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0~1

  const duration = durationOverride ?? template?.duration ?? 3000;

  // 이미지 프리로드
  useEffect(() => {
    if (uploadedImage?.url) {
      const img = new Image();
      img.src = uploadedImage.url;
      img.onload = () => {
        imageElementRef.current = img;
        renderFrame(progress);
      };
    } else {
      imageElementRef.current = null;
      renderFrame(progress);
    }
  }, [uploadedImage?.url]);

  // 렌더 한 프레임
  const renderFrame = useCallback((t) => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    try {
      const renderOptions = {
        ...values,
        uploadedImageElement: imageElementRef.current
      };
      renderVideoEffectFrame(ctx, template, t, renderOptions, PREVIEW_W, PREVIEW_H);
    } catch (e) {
      console.error('[CanvasRenderer] render error:', e);
    }
    setProgress(t);
  }, [template, values]);

  // 애니메이션 루프
  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    const t = Math.min(elapsed / duration, 1);
    renderFrame(t);
    if (t < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setPlaying(false);
      startTimeRef.current = null;
    }
  }, [duration, renderFrame]);

  const play = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // 일시정지 상태에서 재개
    const resumeFrom = pausedAtRef.current != null ? pausedAtRef.current : 0;
    startTimeRef.current = performance.now() - resumeFrom;
    pausedAtRef.current = null;
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = progress * duration;
    setPlaying(false);
  }, [progress, duration]);

  const restart = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = null;
    startTimeRef.current = performance.now();
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const seekTo = useCallback((ratio) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    pausedAtRef.current = ratio * duration;
    renderFrame(ratio);
  }, [duration, renderFrame]);

  // 템플릿/값 변경 시 첫 프레임 렌더
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    pausedAtRef.current = null;
    startTimeRef.current = null;
    renderFrame(0);
    if (autoPlay) {
      setTimeout(() => restart(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  // values 변경 시 현재 위치에서 다시 렌더 (재생 중이 아닐 때)
  useEffect(() => {
    if (!playing) {
      renderFrame(progress);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    canvasRef,
    playing,
    progress,
    play,
    pause,
    restart,
    seekTo,
    PREVIEW_W,
    PREVIEW_H,
  };
}
