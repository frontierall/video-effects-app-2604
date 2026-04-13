# Folder Map

## 루트

- `src/`: 프론트엔드 애플리케이션
- `api/`: Vercel 서버리스 API
- `img/`: 참고 이미지 또는 로컬 자산
- `dist/`: 빌드 결과물
- `.vercel/`: Vercel 로컬 개발 관련 파일

## src

- `src/main.jsx`
  - React 진입점
- `src/App.jsx`
  - 전체 레이아웃, 헤더, 다크 모드
- `src/PasswordGate.jsx`
  - 앱 진입 비밀번호 게이트
- `src/index.css`
  - Tailwind 및 전역 스타일
- `src/tabs/VideoEffectsTab.jsx`
  - 좌측 템플릿 선택 + 우측 작업 공간 탭 구조

## src/features/video-effects/components

- `TemplateSelector.jsx`
  - 템플릿 목록, 필터, 썸네일 렌더
- `CanvasPreview.jsx`
  - 미리보기 재생, 시크, 시간 조절, 오디오 동기화
- `FieldEditor.jsx`
  - 텍스트/색상/숫자/선택 필드 편집, 로고 업로드, 추가 자막
- `AITemplateGenerator.jsx`
  - AI 모델 선택, 프롬프트 입력, 생성 히스토리, 실행 모델 메타
- `AudioPanel.jsx`
  - 오디오 업로드, Jamendo 검색, 볼륨 조절
- `ExportPanel.jsx`
  - 해상도 선택, 모션 블러 토글, export UI

## src/features/video-effects/hooks

- `useVideoEffectsStore.js`
  - Zustand 전역 상태
- `useCanvasRenderer.js`
  - Canvas 애니메이션 루프와 미리보기 상태
- `useMediaExport.js`
  - MediaRecorder + FFmpeg 기반 export 처리

## src/features/video-effects/utils

- `videoEffectsTextObjects.js`
  - 추가 자막 객체 생성 및 렌더링
- `aiTemplateRunner.js`
  - AI가 생성한 `renderCode`를 함수로 변환, localStorage 저장/복원

## src/features/video-effects/data

- `videoEffectTemplates.js`
  - 정적 템플릿 모음

## api

- `_claudeTool.js`
  - Anthropic tool-use helper
- `_openrouterTool.js`
  - OpenRouter tool/function-call helper
- `ai-template-gen.js`
  - AI 템플릿 생성 라우트
- `music-search.js`
  - Jamendo 검색 프록시
- `music-proxy.js`
  - 외부 오디오 프록시

## 재구현 시 추천 구조

- `ui/` 또는 `components/`
- `features/video-effects/`
- `features/audio/`
- `features/ai/`
- `server/api/`
- `docs/`

현재 프로젝트는 작은 규모라 빠르게 작업하기 좋지만, 기능이 더 늘어나면 `audio`, `ai`, `export`를 별도 feature 폴더로 분리하는 편이 낫다.
