# Codex 데스크톱 작업환경 재현 프롬프트

아래 프롬프트를 **새 데스크톱 PC의 Codex 앱**에서 그대로 붙여 넣어 사용합니다. 새 PC에서 프로젝트를 둘 경로가 다르면 `TARGET_ROOT`만 수정합니다.

## 확인된 현재 환경 (2026-07-10, Asia/Seoul)

- OS: Windows 10 Home 64-bit, 빌드 19045
- Codex Desktop 앱 빌드 계열: `26.707.31123`
- Git: `2.54.0.windows.1`
- GitHub CLI: `2.96.0`
- Node.js: `24.15.0`
- npm: `11.12.1`
- 저장소: `https://github.com/JulGi-Park/integrated-calculator.git`
- 브랜치: `main` (점검 당시 `origin/main`과 동기화, 변경 없음)
- 현재 프로젝트 경로: `E:\00 Codex\00 web\Cal`
- 주요 앱 의존성: Next.js `16.2.9`, React/React DOM `19.2.7`, TypeScript `5.9.3`
- 활성 Codex 플러그인: Browser, Sites, Visualize, GitHub, Linear, Slack
- Codex 데스크톱 설정: 상세 표시 `STEPS_COMMANDS`, 주변 제안 끔, 후속 요청 `queue`, Windows sandbox `elevated`
- 프로젝트 환경 변수 템플릿: `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT` (실제 값은 별도 입력)

## 새 PC의 Codex에 전달할 프롬프트

```text
이 Windows 데스크톱에 기존 Codex 개발환경을 안전하게 재현해 줘.

목표:
- 저장소: https://github.com/JulGi-Park/integrated-calculator.git
- 대상 경로(TARGET_ROOT): E:\00 Codex\00 web\Cal
- 기준 브랜치: main
- 기준 도구 버전:
  - Git 2.54.0.windows.1
  - GitHub CLI 2.96.0
  - Node.js 24.15.0
  - npm 11.12.1
- Codex 플러그인: Browser, Sites, Visualize, GitHub, Linear, Slack
- 프로젝트별 환경 변수: NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT (비밀값은 내가 직접 제공하거나 로그인 후 입력)

중요 안전 규칙:
1. 먼저 현재 PC의 OS, Codex, Git, gh, Node, npm 버전과 설치 경로를 읽기 전용으로 점검하고 결과를 표로 보여 줘.
2. 이미 설치된 프로그램이나 기존 프로젝트를 덮어쓰거나 삭제하지 마. 버전 차이가 있어도 먼저 보고하고, 호환 가능한 최신 패치 버전이면 유지해도 되는지 판단 근거를 제시해.
3. auth.json, API 키, OAuth 토큰, 쿠키, 세션 DB, installation_id, *.sqlite, .codex-global-state.json 같은 인증·상태 파일을 다른 PC에서 복사하지 마. GitHub, Codex, Slack, Linear는 공식 로그인 흐름으로 새로 인증해.
4. Codex의 config.toml 전체를 복사하지 마. 사용자명, 런타임 해시, named pipe가 포함된 경로는 이 PC에서 자동 생성되어야 한다.
5. .env 실제 값은 출력하거나 Git에 추가하지 마. .env.example만 기준으로 누락 여부를 알려 줘.
6. 설치나 설정 변경 전 현재 상태와 실행할 명령을 요약하고, 관리자 권한·로그인·외부 서비스 연결처럼 사용자 개입이 필요한 시점에는 멈춰서 요청해.

수행 순서:
A. 사전 점검
- Windows 버전/아키텍처와 사용 가능한 패키지 관리자(winget 등)를 확인해.
- `git --version`, `gh --version`, `node --version`, `npm --version`을 확인해.
- Codex Desktop 설치와 로그인 상태를 확인하되 비밀값은 읽거나 표시하지 마.
- TARGET_ROOT 및 상위 드라이브가 존재하고 쓰기 가능한지 확인해. E: 드라이브가 없으면 임의 경로를 만들지 말고 나에게 새 TARGET_ROOT를 물어봐.

B. 도구 준비
- 누락된 도구만 공식 배포 경로로 설치해. 가능한 경우 위 기준 버전을 맞추고, 정확한 버전을 설치할 수 없으면 호환 가능한 버전과 차이를 보고해.
- Git 기본 브랜치는 main으로 설정해.
- Git 사용자 이름/이메일과 GitHub 인증은 기존 값을 추측하지 말고 나에게 확인하거나 공식 `gh auth login` 흐름을 사용해.

C. Codex 구성
- Codex 앱이 자체 생성한 런타임과 기본 config를 유지해.
- 가능하면 앱/공식 플러그인 관리 기능을 통해 Browser, Sites, Visualize, GitHub, Linear, Slack을 설치·활성화해. 캐시 디렉터리를 직접 복사하지 마.
- 다음 사용자 설정을 지원되는 방식으로 적용해: conversation detail = STEPS_COMMANDS, ambient suggestions = false, follow-up queue mode = queue.
- Windows sandbox의 elevated 설정은 보안 영향을 설명한 뒤 현재 앱에서 지원되는 경우에만 적용해.
- 프로젝트를 연 뒤 TARGET_ROOT를 trusted project로 등록해. 사용자명이나 이전 PC 경로를 하드코딩하지 마.

D. 저장소 복원
- TARGET_ROOT가 없으면 상위 폴더를 만들고 저장소를 clone해.
- TARGET_ROOT가 이미 Git 저장소이면 remote가 위 URL과 일치하는지, 미커밋 변경이 있는지 먼저 검사해. 변경이 있으면 fetch/pull/checkout하지 말고 상태만 보고해.
- 깨끗한 경우 `git fetch --prune`, `git switch main`, fast-forward 방식으로 `origin/main`과 동기화해. 강제 reset은 하지 마.
- `node_modules`, `.next`, `out`은 이전 PC에서 복사하지 말고 `package-lock.json` 기준 `npm ci`로 재생성해.
- `.env.example`을 확인하고 실제 `.env`가 필요하면 키 이름만 준비한 뒤 값 입력을 나에게 요청해. 실제 값을 응답이나 로그에 노출하지 마.

E. 검증
- 아래를 순서대로 실행하고 각 결과를 요약해:
  1. npm ci
  2. npm run lint
  3. npm run typecheck
  4. npm test
  5. npm run build
- 실패하면 로그에서 핵심 원인을 진단하되, 범위를 벗어난 코드 변경은 먼저 제안만 해.
- 마지막으로 `git status --short --branch`, remote URL, 현재 커밋 SHA, 도구 버전, 활성 플러그인, 환경 변수 누락 여부를 보여 줘.

완료 기준:
- main이 origin/main과 일치한다.
- 의존성이 package-lock.json에서 재현된다.
- lint/typecheck/test/build 결과가 명확히 보고된다.
- Codex 플러그인과 데스크톱 설정이 적용되었거나, 적용 불가 항목과 수동 단계가 정리된다.
- 인증정보나 PC 고유 상태 파일은 복사되지 않는다.

작업을 시작해. 먼저 읽기 전용 사전 점검 결과와 예상 변경 목록부터 보여 줘.
```

## 직접 옮기지 말아야 할 항목

- `%USERPROFILE%\.codex\auth.json`
- `%USERPROFILE%\.codex\installation_id`
- `%USERPROFILE%\.codex\*.sqlite*`, `sessions`, `attachments`, `logs`
- `%USERPROFILE%\.codex\.codex-global-state.json*`
- `%USERPROFILE%\.codex\plugins\cache` (새 PC에서 플러그인을 재설치)
- 기존 PC의 `config.toml` 전체 (자동 생성 절대경로와 런타임 식별자 포함)
- 프로젝트의 `node_modules`, `.next`, `out`
- 실제 `.env` 및 모든 토큰·비밀번호

## 사용자 준비 사항

- OpenAI/Codex 로그인 수단
- GitHub 계정 및 저장소 접근 권한
- 필요 시 Slack/Linear 재로그인 권한
- 실제 AdSense client ID (`NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT`)
- 새 PC에 `E:` 드라이브가 없을 경우 사용할 대상 경로
