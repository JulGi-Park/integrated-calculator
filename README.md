# 계산박스

대한민국 사용자를 위한 생활·금융·근로 계산기 웹서비스입니다. 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 계산기와 정책 페이지, sitemap, robots, 광고·분석 스크립트 구성을 포함합니다.

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
- `/calculators/seller-margin` — 판매자 마진 계산기
- `/calculators/salary` — 연봉 실수령액 계산기
- `/calculators/loan` — 대출 이자 계산기
- `/calculators/severance` — 퇴직금 계산기
- `/calculators/unemployment` — 실업급여 계산기
- `/about` — 서비스 소개
- `/contact` — 문의
- `/privacy-policy` — 개인정보처리방침
- `/terms` — 이용약관
- `/disclaimer` — 면책문구

각 계산기는 입력값 기준의 예상 결과를 제공하며, 계산 기준, 자동 반영되지 않는 항목, FAQ, 참고용 안내를 함께 표시합니다. 일부 입력값은 사용 편의를 위해 브라우저 localStorage에 저장될 수 있으며, 계산 결과·오류·사용자 식별 정보는 서버에 저장하지 않습니다.

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
- `components/common/` — 헤더, 푸터, 정책 페이지 레이아웃, JSON-LD 등 공통 UI
- `components/calculators/` — 계산기별 UI와 정적 설명 콘텐츠
- `lib/calculators/` — UI와 분리된 계산 로직과 정책값
- `tests/` — 계산 로직, UI, SEO, 정책 페이지, 정적 export 검증 테스트

계산 기능을 추가할 때는 기존 계산기처럼 UI, 설명 콘텐츠, 계산 로직, 정책값, 테스트를 분리해 배치합니다.

## 포함되지 않은 기능

로그인, 회원가입, 운영 데이터베이스, 결제, PWA, Capacitor, Wrangler·OpenNext 기반 서버 배포 구성은 포함하지 않습니다.
