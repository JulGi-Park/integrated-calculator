# 계산박스 Tool-Site 제거 3차 Production Gate 감사

- 감사일: 2026-08-24 (Asia/Seoul)
- Production: <https://gyesanbox.kr>
- 판정: **READY**
- 판정 의미: 현재 확인 가능한 범위에서 AdSense 재신청 전에 해결해야 할 Tool-Site 구조적 차단요인이 발견되지 않았다. 승인을 보장하는 판정은 아니다.
- AdSense 재신청 및 계정 설정 변경은 수행하지 않았다.

## A. Git

| 항목 | SHA |
| --- | --- |
| pre-merge main | `dfc538bc593c01779a4eb1338e49d3623c190ce7` |
| merge target | `86ab79f88d1e4b7e2e3a7dff176f6f8306b8fa3c` |
| merge commit | `6dbe0fb9dbcd9ea2475b0cb4f561ad09afe46e14` |
| Production 콘텐츠 감사 기준 | `6dbe0fb9dbcd9ea2475b0cb4f561ad09afe46e14` |
| final main / origin/main | 이 감사 문서를 포함한 최종 커밋. 커밋 후 `git rev-parse main origin/main`으로 동일성 확인하고 최종 작업 보고서에 기록한다. |

- merge commit 방식으로 병합했다.
- force push와 history rewrite를 하지 않았다.
- 보호 대상 미추적 파일 4개는 수정·삭제·이동·커밋하지 않았다.
- 병합 대상 diff에서 `.env`, secret, 의도하지 않은 dependency 변경이나 신규 미승인 계산기 공개는 발견되지 않았다.

## B. Deployment

| 항목 | 결과 |
| --- | --- |
| Cloudflare Pages project | `integrated-calculator` |
| production branch | `main` |
| deployment ID | `967634ae-21b1-4bb7-b988-fbeacc791d22` |
| source SHA | `6dbe0fb9dbcd9ea2475b0cb4f561ad09afe46e14` |
| status | SUCCESS |
| production URL | <https://gyesanbox.kr> |
| deployment check time | 2026-08-24 05:12 KST 무렵 |
| custom domain | HTTPS 200, Cloudflare 응답, 최신 콘텐츠 확인 |

감사 문서와 Production 감사 스크립트만 추가하는 최종 커밋은 별도 main push로 배포 상태와 source SHA를 다시 확인한다. 이 변경은 사이트 런타임 콘텐츠를 바꾸지 않는다.

## C. URL inventory

| 항목 | 결과 |
| --- | ---: |
| public/indexable route | 30 |
| sitemap URL | 30 |
| 공개 계산기 | 21 |
| 고정 noindex public route | 0 |
| 검사한 hard 404 noindex | 3 |
| redirect URL in sitemap | 0 |
| sitemap/noindex conflict | 0 |

- Production sitemap과 최종 local output의 URL 순서·집합이 일치했다.
- 30개 URL 모두 HTTPS 200, 무리디렉션, 자기 canonical이며 query/hash가 없다.
- `/calculators/`는 카테고리 목적·상황별 선택 안내·필터·카드별 입력/결과 안내가 있는 탐색 페이지다. 판정은 `INDEX_KEEP`이다.
- 미존재 URL 세 곳은 HTTP 404, noindex, canonical 없음, 광고 없음, H1과 홈/계산기 목록 복구 링크가 모두 존재했다.

## D. AdSense boundary

- allowlist: 홈과 21개 계산기, 총 22개 URL에서 direct load 시 AdSense 연결 상태를 확인했다.
- blocked: `/calculators/`, 소개, 방법론, 변경 이력, 문의, 개인정보처리방침, 약관, 면책, error/loading/test/result 전용 및 미등록 경로에서 script 0, slot 0, Auto Ads DOM 0을 확인했다.
- 기본 정책은 명시적 allowlist 외 전부 차단하는 fail-safe 방식이다.
- SPA 허용→차단 5개 시나리오에서 script/slot/global 상태가 제거됐다.
- SPA 차단→허용 3개 시나리오에서 허용 상태가 다시 구성됐다.
- 광고를 클릭하지 않았고, 계산 버튼과 광고의 혼동·결과 방해 overlay·가짜 버튼·과도한 sticky UI는 발견되지 않았다.

## E. YMYL

| 계산기 | Production smoke 결과 |
| --- | --- |
| 연봉 실수령액 | 실제 입력→계산→결과 렌더 PASS |
| 4대보험 | 실제 입력→계산→결과 렌더 PASS |
| 건강보험 상한 | 총 보험료 상한 9,183,480원 기준에서 근로자 부담 4,591,740원 확인 |
| 장기요양보험 | 연봉/4대보험 동일 입력에서 603,376원으로 일치 |
| 주휴수당 | 39.99시간·40시간 허용, 40.01시간 거부 확인 |
| 퇴직금 | 날짜·임금 실제 입력, 결과 및 상세 산식 렌더 PASS |
| 실업급여 | 임금·가입기간·연령·퇴사 사유 입력, 결과 렌더 PASS |
| 육아휴직급여 | 월 급여·기간 입력, 결과 렌더 PASS |
| 대출 | 원금·금리·기간 입력, 상환 결과/표 렌더 PASS |
| DSR | 일반/스트레스 DSR 결과 렌더 PASS |
| 예금·적금 | 만기 수령액 10,338,400원 결과 렌더 PASS |
| 근로·자녀장려금 | 신청/가구/소득/재산 입력, 예상액 결과 렌더 PASS |

- 자동차 유지비의 참고 기준은 위택스·오피넷으로 표시되고, 내부 계산기 링크는 관련 계산 동선으로 분리되어 있었다.
- 결과는 예상값이며 공식 기관 결과와 달라질 수 있는 조건·기준일·예외가 화면에 표시되는지 확인했다.

## F. SEO

| 항목 | Production 결과 |
| --- | --- |
| title 누락 / 중복 | 0 / 0 |
| description 누락 / 중복 | 0 / 0 |
| canonical 오류 | 0 |
| H1 오류 | 0 |
| Open Graph 누락 | 0 |
| JSON-LD | 24개 페이지에 존재, 전부 JSON parse PASS; 나머지는 허위 schema를 추가하지 않음 |
| sitemap | 200, 30개, canonical과 일치 |
| robots | 200, sitemap 선언 정상, 핵심 route 차단 없음 |
| broken internal route | 0 |
| orphan calculator | 0 |

- 21개 계산기 모두 화면에 계산 목적·입력 설명·계산 기준/공식·출처/근거·예시/해석·예외/한계·기준일·관련 계산기·페이지별 고유 가치가 렌더됐다. 숨겨진 H2/H3는 0개였다.
- Production 자동 유사도 검사에서 최고 5단어 shingle Jaccard는 `vat-profit`과 `labor-pay` 사이 0.89%, 35자 이상 동일 문장이 3개 이상 계산기에 반복된 사례는 0개였다. 이 수치는 승인 점수가 아니라 수동 boilerplate 검토 보조값으로만 사용했다.

## G. Mobile

- viewport: 390 × 844
- 검사: 홈, 계산기 목록, 연봉, 4대보험, 대출, 국비지원 자격증 비용, 방법론, 소개, 404
- 9개 화면 모두 horizontal overflow 0, interactive element overflow 0, 고정 방해 overlay 0이었다.
- header/menu/footer가 정상 노출됐고 모바일 메뉴를 실제로 열었다.
- 예금 계산기에서 모바일 입력→계산→결과·결과 복사 액션 렌더를 확인했다.
- 긴 숫자, 계산 폼, 결과, 표/공식, 내부 링크에서 화면 밖 요소가 발견되지 않았다.

## H. Remaining risks

### P0

- NONE

### P1

- NONE

### P2

- Search Console의 과거 제외 항목 21개에는 Blogger URL과 예전 무슬래시 URL이 남아 있다. 현 sitemap의 30개 URL과는 분리된 과거 크롤링 기록이며 모니터링 대상이다.
- Search Console 최근 3개월 실적은 클릭 7, 노출 898, CTR 0.8%, 평균 게재순위 10.6으로 데이터가 적다. 일부 광범위 검색어의 의도 일치 여부는 장기 추세로 재검토한다.
- Core Web Vitals는 모바일/데스크톱 모두 최근 90일 현장 데이터가 부족해 판정할 수 없다.

### Search Console 직접 확인

- `gyesanbox.kr/sitemap.xml`: 2026-08-24 마지막 읽음, 성공, 발견된 페이지 30.
- 색인 생성됨 30, 미색인 21. 미색인 상세는 리디렉션 오류 8, 크롤링됨-현재 미색인 3, 리디렉션 포함 8, 대체 canonical 1, 404 1이었다.
- 리디렉션 오류의 사이트 본체 항목은 `/calculators`, `/loan`, `/severance`, `/unemployment`, `/privacy-policy` 같은 과거 무슬래시 URL이었다.
- 크롤링됨-현재 미색인 3개는 Blogger 모바일 URL, 과거 `/calculators/salary`, 과거 `/disclaimer`였다.
- 국비지원 자격증 비용 계산기는 Google 등록됨, HTTPS 정상, 사용자 선언 canonical과 Google 선택 canonical이 검사 URL로 일치했다. 최근 크롤링은 2026-08-17 Googlebot 스마트폰이었다.

## I. AdSense 재신청 판정

**READY**

Production source, 광고 경계, SPA 전환, hard 404, 21개 publisher content, 핵심 YMYL 계산, sitemap/canonical/indexability, 내부 링크와 모바일 회귀에서 재신청 전 구조적 차단요인이 발견되지 않았다. 남은 항목은 과거 Search Console 기록과 장기 성과 모니터링 수준이다. AdSense 재신청은 이번 작업에서 실행하지 않는다.
