# 통합 계산기

대한민국 사용자를 위한 생활·사업 계산기 웹서비스입니다. 현재 판매자 마진, 연봉·월급 실수령액, 대출이자, 퇴직금 계산기를 제공합니다.

## 실행 환경

- Node.js 20.9 이상 (개발 확인 버전: 24.15.0)
- npm (개발 확인 버전: 11.12.1)

별도의 환경변수 없이 기본 페이지를 실행할 수 있습니다.

## 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버가 시작되면 브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속합니다.

Windows에서는 `start-local.cmd`를 더블클릭하면 린트, TypeScript 검사, 테스트, 프로덕션 빌드를 차례로 실행합니다. 모든 검증이 통과하면 개발 서버를 시작하고 기본 브라우저에서 `http://localhost:3000/`을 자동으로 엽니다. 서버를 종료하려면 실행 파일 창에서 `Ctrl+C`를 누릅니다.

## 검증 명령

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 구현된 URL

- `/` — 서비스 홈
- `/calculators` — 계산기 목록
- `/calculators/seller-margin` — 온라인 판매자 마진·순이익 계산기
- `/calculators/salary` — 연봉·월급 실수령액 계산기
- `/calculators/loan` — 대출이자 계산기
- `/calculators/severance` — 퇴직금 계산기

각 계산기는 최신 계산 결과의 텍스트 복사와 지원 기기의 Web Share 공유를 제공합니다. 입력값은 계산기별 localStorage 키에 버전이 포함된 raw 문자열 형식으로 저장되며, 계산 결과·오류·사용자 식별 정보는 저장하지 않습니다. 초기화하면 해당 계산기의 저장 입력값도 삭제됩니다.

## Cloudflare Pages 호환성

`next.config.ts`에서 `output: "export"`와 `trailingSlash: true`를 사용합니다. `npm run build`가 완료되면 Cloudflare Pages에 게시할 정적 결과물이 `out/`에 생성됩니다.

- 빌드 명령: `npm run build`
- 출력 디렉터리: `out`
- Cloudflare Pages 프레임워크 프리셋: Next.js (Static HTML Export)
- 서버 런타임, Server Actions, Route Handlers, SSR에 의존하지 않음
- 현재 `next/image`를 사용하지 않음
- 계산 기능은 브라우저에서 실행되는 순수 TypeScript 로직으로 유지

`npm run build`는 Next.js 빌드 후 `npm run verify:cloudflare`를 자동 실행합니다. 다음 조건 중 하나라도 깨지면 빌드는 실패합니다.

- `output: "export"` 또는 `trailingSlash: true`가 제거됨
- `out/` 또는 필수 페이지의 정적 HTML이 생성되지 않음
- Server Actions, Route Handlers, 동적 서버 API가 추가됨
- 호환성 검토 없이 `next/image`가 추가됨

새 동적 URL은 반드시 `generateStaticParams()`로 빌드 시 모든 경로를 생성할 수 있어야 합니다. 계산 로직은 브라우저에서 실행 가능한 순수 TypeScript 함수로 유지합니다.

향후 `next/image`를 도입할 경우 정적 내보내기에서는 기본 이미지 최적화 서버를 사용할 수 없으므로 사용자 정의 로더 또는 `unoptimized` 설정을 적용한 후 검증 스크립트의 제한을 명시적으로 갱신해야 합니다.

## 프로젝트 구조

- `app/` — App Router 페이지, 레이아웃, 전역 스타일
- `components/common/` — 헤더와 푸터 등 공통 UI
- `components/calculators/` — 계산기별 클라이언트 UI, 콘텐츠, 브라우저 유틸리티와 스타일
- `lib/calculators/` — React 및 브라우저 API에 의존하지 않는 계산 엔진
- `docs/` — 계산 정책과 구조 문서
- `tests/` — 엔진, UI, 저장·복사·공유, 콘텐츠, 라우트 검증 테스트

## 이번 작업에 포함되지 않은 기능

로그인, 데이터베이스, 결제, 광고·분석 도구, PWA, Capacitor, Wrangler·OpenNext 및 실제 배포 설정은 아직 구현하지 않았습니다.
