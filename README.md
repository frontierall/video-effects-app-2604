# Video Effects Studio

Canvas 기반 영상 효과 템플릿을 만들고, AI로 새 효과를 생성하고, 배경 음악을 붙여 MP4로 내보내는 React + Vite 프로젝트다.

## 핵심 기능

- 정적 템플릿 선택과 커스텀 필드 편집
- Canvas 기반 실시간 미리보기
- AI 프롬프트로 새 템플릿 생성
- 배경 음악 업로드 및 Jamendo 검색
- FFmpeg 기반 MP4 export
- 다크 모드
- 비밀번호 게이트

## 기술 스택

- Frontend: React 18, Vite, Tailwind CSS, Zustand
- Media: Canvas 2D, MediaRecorder, `@ffmpeg/ffmpeg`
- API: Vercel Functions
- AI: Anthropic, OpenRouter

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.sample`을 참고해 `.env`를 만든다.

필수 항목:

- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- `JAMENDO_CLIENT_ID`

### 3. 프론트 실행

```bash
npm run dev
```

### 4. API 실행

```bash
npm run dev:api
```

보통 Vercel dev는 `http://localhost:3000`에서 동작한다. 프론트와 API를 함께 테스트할 때는 Vercel dev 주소 기준으로 접속하는 편이 안전하다.

### 5. 빌드

```bash
npm run build
```

## 사용자 흐름

1. 템플릿 선택
2. 디자인 탭에서 텍스트/색상/로고 편집
3. AI 탭에서 자연어로 새 템플릿 생성
4. 음악 탭에서 오디오 업로드 또는 검색
5. export 탭에서 해상도 선택 후 MP4 출력

## 주요 파일

- 앱 엔트리: [src/App.jsx](/mnt/d/github_frontierall/video-effects-app-2604/src/App.jsx:1)
- 메인 작업 화면: [src/tabs/VideoEffectsTab.jsx](/mnt/d/github_frontierall/video-effects-app-2604/src/tabs/VideoEffectsTab.jsx:1)
- 상태 저장소: [src/features/video-effects/hooks/useVideoEffectsStore.js](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/hooks/useVideoEffectsStore.js:1)
- AI 생성 API: [api/ai-template-gen.js](/mnt/d/github_frontierall/video-effects-app-2604/api/ai-template-gen.js:1)
- export 처리: [src/features/video-effects/hooks/useMediaExport.js](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/hooks/useMediaExport.js:1)

## 현재 상태

최근 작업으로 아래가 반영됐다.

- AI 모델 선택과 서버 라우팅 연결
- OpenRouter/Anthropic fallback 처리
- 실제 실행 모델 메타데이터 UI 표시
- DeepSeek 모델 ID를 OpenRouter canonical ID 기준으로 정리

아직 남아 있는 중요한 이슈도 있다. 상세 내용은 [docs/05-known-issues.md](/mnt/d/github_frontierall/video-effects-app-2604/docs/05-known-issues.md:1)를 참고하면 된다.

## 문서 안내

- 구조 설명: [docs/01-folder-map.md](/mnt/d/github_frontierall/video-effects-app-2604/docs/01-folder-map.md:1)
- 변경 이력: [docs/02-change-log.md](/mnt/d/github_frontierall/video-effects-app-2604/docs/02-change-log.md:1)
- 프롬프트 모음: [docs/03-prompts.md](/mnt/d/github_frontierall/video-effects-app-2604/docs/03-prompts.md:1)
- 재구현용 계획 프롬프트: [docs/04-plan-prompt.md](/mnt/d/github_frontierall/video-effects-app-2604/docs/04-plan-prompt.md:1)
- 남은 이슈: [docs/05-known-issues.md](/mnt/d/github_frontierall/video-effects-app-2604/docs/05-known-issues.md:1)
