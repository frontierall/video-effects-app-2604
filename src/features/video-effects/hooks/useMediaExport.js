import { useRef, useState, useCallback } from 'react';
import { renderVideoEffectFrame } from '../utils/videoEffectsTextObjects';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useVideoEffectsStore } from '../hooks/useVideoEffectsStore';

const EXPORT_RESOLUTIONS = {
  '1080p': { width: 1920, height: 1080 },
  '720p':  { width: 1280, height: 720 },
  '480p':  { width: 854,  height: 480 },
};

// 브라우저가 지원하는 mimeType 자동 감지 (녹화용)
function getSupportedMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

/**
 * Canvas 애니메이션을 고품질 MP4(Premiere 호환)로 내보내는 훅
 */
export function useMediaExport() {
  const { uploadedImage, durationOverride, backgroundMusic } = useVideoEffectsStore();
  const ffmpegRef = useRef(new FFmpeg());
  const offscreenRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(null);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [resolution, setResolution] = useState('1080p');
  const [lastError, setLastError] = useState(null);
  const [statusText, setStatusText] = useState('');

  // FFmpeg 로드
  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg.loaded) return ffmpeg;

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ffmpeg;
  };

  const exportVideo = useCallback(async (template, values, fps = 30) => {
    if (!template || exporting) return;
    setLastError(null);
    setExporting(true);
    setExportProgress(0);
    setStatusText('이미지 로드 및 준비 중...');

    // 이미지 프리로드
    let imgElement = null;
    if (uploadedImage?.url) {
      imgElement = await new Promise((resolve) => {
        const img = new Image();
        img.src = uploadedImage.url;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    }

    const { width: W, height: H } = EXPORT_RESOLUTIONS[resolution] || EXPORT_RESOLUTIONS['1080p'];
    const duration = durationOverride ?? template.duration;

    // 오프스크린 Canvas 생성
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    offscreenRef.current = canvas;
    const ctx = canvas.getContext('2d');

    // MediaRecorder 설정
    const mimeType = getSupportedMimeType();
    const stream = canvas.captureStream(fps);

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 12_000_000 // 고화질 녹화
    });
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      try {
        setStatusText('MP4 변환 중 (프리미어 호환)...');
        const webmBlob = new Blob(chunksRef.current, { type: mimeType });

        // FFmpeg 변환 시작
        const ffmpeg = await loadFFmpeg();
        const inputName = 'input.webm';
        const outputName = 'output.mp4';

        await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

        if (backgroundMusic?.exportUrl) {
          // 배경 음악 믹싱
          const audioData = await fetchFile(backgroundMusic.exportUrl);
          await ffmpeg.writeFile('music', audioData);
          await ffmpeg.exec([
            '-i', inputName,
            '-i', 'music',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', fps.toString(),
            '-c:a', 'aac',
            '-b:a', '192k',
            '-af', `volume=${backgroundMusic.volume ?? 0.8}`,
            '-shortest',
            outputName
          ]);
        } else {
          // 오디오 없음
          await ffmpeg.exec([
            '-i', inputName,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', fps.toString(),
            '-an',
            outputName
          ]);
        }

        const data = await ffmpeg.readFile(outputName);
        const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(mp4Blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}_${resolution}.mp4`;
        a.click();

        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (err) {
        console.error('[FFmpeg] Error:', err);
        const isJamendo = backgroundMusic?.provider === 'jamendo';
        const jamendoMessage = !backgroundMusic?.isDownloadAllowed
          ? 'Jamendo 트랙 다운로드가 허용되지 않아 export할 수 없습니다.'
          : 'Jamendo 오디오 로드 또는 변환에 실패했습니다. 프록시와 다운로드 허용 상태를 확인해 주세요.';
        setLastError(isJamendo ? jamendoMessage : 'MP4 변환 실패. 원본 파일을 대신 시도합니다.');
        const webmBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(webmBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}_${resolution}.webm`;
        a.click();
      } finally {
        setExporting(false);
        setExportProgress(0);
        setStatusText('');
      }
    };

    recorder.onerror = (e) => {
      setLastError('녹화 중 오류가 발생했습니다: ' + e.error?.message);
      setExporting(false);
    };

    // 녹화 시작
    recorder.start();
    const startTime = performance.now();
    setStatusText('녹화 중...');

    const renderLoop = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, W, H);
      try {
        const renderOptions = {
          ...values,
          uploadedImageElement: imgElement
        };
        renderVideoEffectFrame(ctx, template, t, renderOptions, W, H);
      } catch (e) {
        console.error('[MediaExport] render error:', e);
      }

      setExportProgress(t);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(renderLoop);
      } else {
        setTimeout(() => {
          recorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 200);
      }
    };

    rafRef.current = requestAnimationFrame(renderLoop);
  }, [exporting, resolution, uploadedImage, backgroundMusic]);

  const cancelExport = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    setExporting(false);
    setExportProgress(0);
    setStatusText('');
  }, []);

  return {
    exporting,
    exportProgress,
    resolution,
    setResolution,
    exportVideo,
    cancelExport,
    lastError,
    statusText,
    EXPORT_RESOLUTIONS,
  };
}
