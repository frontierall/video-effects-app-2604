# Change Log

이 문서는 git 커밋 이력과 현재 워킹트리 변경을 같이 요약한다.

## 주요 git 커밋

최근 확인된 커밋:

1. `6dbbe6e` `init: Video Effects Studio standalone app`
   - 프로젝트 초기 구성
2. `4033137` `add password gate (v1234) on app startup`
   - 앱 시작 시 비밀번호 게이트 추가
3. `cb33146` `add background music feature (upload + Pixabay library)`
   - 배경 음악 업로드/라이브러리 기능 추가
4. `64d711c` `fix: switch ai-template-gen to use ANTHROPIC_API_KEY`
   - AI 생성 API를 Anthropic 키 기준으로 정리

## 현재 워킹트리 기준 주요 수정

### UI/스타일

- 다크 모드 헤더 및 메인 레이아웃 정리
- 비밀번호 게이트 UI 개선
- AI 생성 탭, 음악 탭, 템플릿 선택 카드 디자인 확장

관련 파일:

- `src/App.jsx`
- `src/PasswordGate.jsx`
- `src/features/video-effects/components/*.jsx`

### AI 기능

- `api/_openrouterTool.js` 추가
- `api/ai-template-gen.js`를 멀티 모델 라우팅 구조로 변경
- Anthropic/OpenRouter fallback 로직 추가
- 실제 실행 모델 메타 응답 추가
- DeepSeek 모델 ID를 `deepseek/deepseek-v3.2`로 정리

관련 파일:

- `api/ai-template-gen.js`
- `api/_claudeTool.js`
- `api/_openrouterTool.js`
- `src/features/video-effects/components/AITemplateGenerator.jsx`
- `src/features/video-effects/utils/aiTemplateRunner.js`

### 오디오 기능

- Jamendo 검색 프록시 조정
- 음악 선택/볼륨 UI 보강

관련 파일:

- `api/music-search.js`
- `src/features/video-effects/components/AudioPanel.jsx`

### 렌더링/export

- Canvas 렌더링 훅 보강
- 텍스트 오브젝트 렌더링 유틸 수정
- FFmpeg export 흐름 정리

관련 파일:

- `src/features/video-effects/hooks/useCanvasRenderer.js`
- `src/features/video-effects/hooks/useMediaExport.js`
- `src/features/video-effects/utils/videoEffectsTextObjects.js`

## 이번 세션에서 한 핵심 수정

1. AI 모델 선택 UI와 서버 라우팅 연결
2. OpenRouter invalid model ID 대응
3. 실행 모델 메타데이터를 프론트에 표시
4. DeepSeek 모델 값을 OpenRouter canonical ID로 교체

## 아직 커밋되지 않은 주요 파일

- `.env.sample`
- `api/_claudeTool.js`
- `api/_openrouterTool.js`
- `api/ai-template-gen.js`
- `src/features/video-effects/components/AITemplateGenerator.jsx`
- `src/features/video-effects/utils/aiTemplateRunner.js`

정확한 현재 상태는 아래 명령으로 다시 확인할 수 있다.

```bash
git status --short
git diff --stat
git log --oneline --decorate -n 15
```
