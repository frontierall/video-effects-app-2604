# Plan Prompt

아래 프롬프트는 이와 유사한 프로그램을 새로 만들 때, AI에게 초기 설계와 구현 계획을 요청하기 위한 템플릿이다.

## 추천 Plan Prompt

```text
React + Vite + Tailwind 기반으로 동작하는 "Video Effects Studio" 스타일의 웹앱을 설계해줘.

목표:
- Canvas 기반 영상 효과 템플릿 편집기
- 실시간 미리보기
- AI 프롬프트로 새 템플릿 생성
- 배경 음악 업로드 및 검색
- FFmpeg 기반 MP4 export

필수 기능:
- 템플릿 선택 패널
- 텍스트/색상/숫자/선택 필드 편집
- 로고 이미지 업로드
- 추가 자막 레이어
- AI 생성 탭
- 음악 탭
- export 탭
- Zustand 기반 상태 관리
- 서버 API에서 Anthropic/OpenRouter 라우팅

원하는 산출물:
1. 폴더 구조
2. 상태 구조
3. 컴포넌트 분리 기준
4. API 설계
5. export 처리 방식
6. 보안/예외 처리 포인트
7. 단계별 구현 계획

제약:
- UI는 단일 작업 화면 형태
- Canvas 렌더 함수는 템플릿 단위로 관리
- AI 생성 결과는 render(ctx, t, v, W, H) 형태로 표준화
- 나중에 generated template도 edit/export 가능해야 함
- OpenRouter 모델 ID는 실제 canonical ID만 사용해야 함
```

## 더 구체적인 구현용 Prompt

```text
아래 요구사항으로 코드를 작성해줘.

- React 18 + Vite
- Zustand store 하나로 selectedTemplateId, fieldValues, textObjects, generatedTemplates, backgroundMusic 관리
- TemplateSelector, CanvasPreview, FieldEditor, AITemplateGenerator, AudioPanel, ExportPanel 컴포넌트 분리
- API는 /api/ai-template-gen, /api/music-search, /api/music-proxy
- ai-template-gen은 model registry 기반으로 Anthropic/OpenRouter 라우팅
- OpenRouter 모델은 requestedModel과 apiModel을 분리
- fallbackApplied, resolvedModel, resolvedProvider를 응답에 포함
- generatedTemplates도 local templates와 동일하게 edit/export/reset 가능해야 함

코드 작성 전 먼저 파일 구조와 데이터 흐름을 설명해줘.
```

## 유지보수용 개선 계획 Prompt

```text
현재 Video Effects Studio 코드베이스를 리팩터링하려고 한다.

아래 문제를 해결하는 계획을 우선순위별로 제안해줘.

- AI generated template가 edit/export/reset에서 로컬 템플릿과 다르게 동작함
- Jamendo 검색과 music proxy 허용 도메인이 일치하지 않음
- export cancel 시 onstop 후속 처리가 계속 실행됨
- Canvas preview가 progress state 업데이트로 과도하게 리렌더링됨
- AI history preview가 카드마다 requestAnimationFrame 루프를 돌고 있음

원하는 답변 형식:
- P0 / P1 / P2 우선순위
- 파일별 수정 포인트
- 위험도
- 테스트 시나리오
```
