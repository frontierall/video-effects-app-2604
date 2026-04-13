# Known Issues

현재 코드 기준으로 중요한 남은 이슈를 정리한다.

## P0

### 1. AI 템플릿 편집 불가

- 원인: `FieldEditor`가 정적 `TEMPLATES`만 조회
- 위치: [src/features/video-effects/components/FieldEditor.jsx](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/components/FieldEditor.jsx:69)
- 영향: AI 생성 템플릿 선택 시 편집기 `null` 반환

### 2. AI 템플릿 export 불가

- 원인: `ExportPanel`도 정적 `TEMPLATES`만 조회
- 위치: [src/features/video-effects/components/ExportPanel.jsx](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/components/ExportPanel.jsx:15)
- 영향: AI 생성 템플릿 export 불가

### 3. AI 템플릿 초기화 버그

- 원인: `resetFields()`가 정적 템플릿만 다시 찾음
- 위치: [src/features/video-effects/hooks/useVideoEffectsStore.js](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/hooks/useVideoEffectsStore.js:109)
- 영향: AI 템플릿 선택 시 필드 초기화가 빈 객체 방향으로 깨질 수 있음

### 4. Jamendo 검색과 export 프록시 불일치

- 원인: 검색은 Jamendo인데 프록시는 Pixabay URL만 허용
- 위치:
  - [src/features/video-effects/components/AudioPanel.jsx](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/components/AudioPanel.jsx:110)
  - [api/music-proxy.js](/mnt/d/github_frontierall/video-effects-app-2604/api/music-proxy.js:9)
- 영향: 라이브러리 음악은 선택되더라도 export에서 실패 가능

### 5. export 취소가 완전하지 않음

- 원인: `cancelExport()`가 recorder를 멈춘 뒤에도 `onstop` 후속 처리 진행 가능
- 위치:
  - [src/features/video-effects/hooks/useMediaExport.js](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/hooks/useMediaExport.js:96)
  - [src/features/video-effects/hooks/useMediaExport.js](/mnt/d/github_frontierall/video-effects-app-2604/src/features/video-effects/hooks/useMediaExport.js:202)
- 영향: 사용자가 취소를 눌러도 변환/다운로드가 이어질 수 있음

## P1

### 6. 미리보기/히스토리 렌더링 비용이 큼

- `useCanvasRenderer()`가 progress를 매 프레임 state로 갱신
- AI history 카드가 카드마다 독립 `requestAnimationFrame` 실행

## P2

### 7. 비밀번호 게이트는 보안 기능이 아님

- 비밀번호가 클라이언트에 하드코딩
- 세션스토리지 플래그만 검사

## 권장 해결 순서

1. 템플릿 조회 공통화
2. Jamendo 프록시 정합성 수정
3. export cancel 상태 분리
4. preview/history 성능 최적화
5. 비밀번호 게이트를 실제 인증 구조로 교체
