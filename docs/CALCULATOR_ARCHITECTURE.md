# 계산기 구조와 재사용 기준

## 현재 파일 구조

- `app/`: App Router 페이지, 페이지 전용 메타데이터와 서버 컴포넌트 조합
- `components/common/`: 사이트 헤더·푸터와 계산기 간 확실히 재사용되는 공통 UI
- `components/calculators/`: 계산기별 클라이언트 UI, 콘텐츠, 브라우저 유틸리티와 스타일
- `lib/calculators/`: React 및 브라우저 API에 의존하지 않는 계산 엔진
- `tests/`: 라우트, 엔진, UI, 브라우저 기능, 콘텐츠·SEO 회귀 테스트

판매자 계산기는 서버 페이지가 메타데이터, JSON-LD, 계산 UI와 정적 콘텐츠를 조합하고, 상태가 필요한 `SellerMarginCalculator`만 클라이언트 컴포넌트로 실행한다.

## 프로젝트 공통 구조

- `app/layout.tsx`: 한국어 문서와 사이트 셸
- `components/common/SiteHeader.tsx`, `SiteFooter.tsx`: 공통 탐색과 푸터
- `app/globals.css`: 색상 토큰, 최대 폭, 페이지 제목, 링크, 모바일 기준
- `components/common/JsonLdScripts.tsx`: 여러 JSON-LD 객체의 안전한 직렬화와 script 출력
- `next.config.ts`: Cloudflare Pages용 정적 내보내기

`JsonLdScripts`에는 계산기 이름, FAQ, 경로를 넣지 않는다. 각 페이지가 전용 JSON-LD 데이터를 만들고 완성된 객체 배열만 전달한다.

## 계산기 간 재사용 가능 구조

다음 구조와 동작 원칙은 새 계산기에서도 재사용한다.

- 서버 페이지와 클라이언트 계산 UI의 경계
- 계산 엔진과 UI 상태의 분리
- `page-section`, `page-heading`과 사이트 최대 폭
- label과 input 연결, `aria-invalid`, `aria-describedby`, `aria-live`
- 오류 시 첫 입력으로 포커스 이동
- 계산 전·성공·오류·입력 변경 상태 구분
- 최신 결과에서만 복사·공유 허용
- JSON-LD 안전 출력
- 정적 export 및 직접 URL 검증 방식

입력 필드, 결과 카드, localStorage, Clipboard, Web Share는 현재 판매자 계산기에서만 구현돼 있다. 두 번째 계산기의 요구가 확인되기 전에는 범용 폼 빌더나 복잡한 제네릭 컴포넌트로 만들지 않는다.

## 계산기별 전용 구조

각 계산기는 다음 항목을 자체 파일에서 정의한다.

- 입력·결과·검증 오류 타입
- 검증 규칙, 계산식, 반올림 정책
- 입력 필드 순서와 기본값
- 결과 항목과 상태 판정
- 복사 문자열과 사용자 메시지
- localStorage 키, 저장 버전과 저장 데이터 검증
- 기준일, 계산식 설명, 고정 예시, 제외 항목, FAQ와 면책
- SEO title·description·Open Graph
- WebApplication, BreadcrumbList, FAQPage 데이터
- 계산기 전용 CSS와 회귀 테스트

판매자 계산기의 필드명, 원가 방식, 손익 판정, 저장 키와 문구를 다른 계산기에 재사용하지 않는다.

## 새 계산기 추가 순서

1. `lib/calculators/<calculator>/`에 타입, 검증과 순수 계산 엔진을 작성한다.
2. 엔진의 정상·오류·경계값과 입력 불변성 테스트를 작성한다.
3. `app/calculators/<calculator>/page.tsx`에 고유 메타데이터와 서버 페이지를 만든다.
4. 계산기 전용 클라이언트 UI와 스타일을 추가한다.
5. 필요할 때만 전용 저장·복사·공유 로직을 추가한다.
6. 화면 콘텐츠와 같은 데이터 원본으로 FAQPage JSON-LD를 만든다.
7. `JsonLdScripts`에 계산기 전용 JSON-LD 배열을 전달한다.
8. 계산기 목록에는 실제 라우트가 구현된 뒤에만 활성 링크를 추가한다.
9. 전체 테스트, 타입 검사, 린트, 정적 빌드와 직접 URL을 검증한다.

## localStorage 규칙

- 키 형식: `integrated-calculator:<calculator-slug>:inputs`
- 계산기마다 고유한 키와 저장 버전을 명시한다.
- raw 입력값만 저장하고 결과, 오류, 포커스와 상태 메시지는 저장하지 않는다.
- 저장 데이터 전체를 계산기 전용 검증 함수로 확인한다.
- 읽기·쓰기·삭제 실패는 계산 동작을 막지 않아야 한다.
- 초기화는 해당 계산기의 키만 삭제한다.

## SEO 및 JSON-LD 규칙

- 페이지마다 고유한 title과 description을 둔다.
- 운영 도메인이 확정되기 전에는 canonical이나 임의 URL을 만들지 않는다.
- 구조화 데이터 값은 계산기 전용 데이터로 유지한다.
- 화면 FAQ와 FAQPage는 같은 상수에서 생성한다.
- 허위 평점, 리뷰, 가격과 사용량을 추가하지 않는다.
- JSON-LD 출력은 공통 `JsonLdScripts`를 사용한다.

## 테스트 구성 기준

- 엔진 테스트: 계산식, 검증, 반올림과 입력 불변성
- UI 테스트: 사용자 입력, 제출, 오류, 포커스, 초기화와 결과
- 브라우저 기능 테스트: 저장·복원, Clipboard와 Web Share
- 콘텐츠 테스트: 고정 예시와 실제 엔진 결과 일치
- SEO 테스트: 메타데이터, canonical 안전 규칙과 JSON-LD
- 빌드 테스트: `out/`의 정적 HTML과 직접 URL 생성

## 과도한 공통화를 피하는 기준

한 계산기에서만 사용되는 구조는 기본적으로 전용으로 둔다. 두 계산기에서 실제 중복이 확인되고, 문구나 타입을 억지로 일반화하지 않아도 단순한 API를 만들 수 있을 때만 공통화한다. 현재 연봉 실수령액 계산기 개발은 이 구조로 시작할 수 있으며, 두 번째 구현 후 입력 래퍼·결과 카드·브라우저 유틸리티의 실제 중복을 다시 평가한다.
