import { UNEMPLOYMENT_POLICY_2026 } from "@/lib/calculators/unemployment/policy";
import {
  unemploymentBasisSummary,
  unemploymentChecklist,
  unemploymentCriteriaRows,
  unemploymentExampleInputItems,
  unemploymentExampleResultItems,
  unemploymentExcludedItems,
  unemploymentFaqs,
  unemploymentInterpretationCards,
  unemploymentQuickCheckRows,
  unemploymentRelatedCalculators,
  unemploymentSources,
} from "./unemploymentContentData";
import styles from "./UnemploymentContent.module.css";

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function UnemploymentContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="use-case-title">
        <div className={styles.sectionHeading}>
          <h2 id="use-case-title">언제 쓰는 계산기인가요?</h2>
          <p>
            퇴사 후 구직급여 예상 금액과 지급일수를 미리 가늠하고, 신청 전
            확인해야 할 고용보험 이력과 퇴직 사유를 정리할 때 사용합니다.
            실제 수급 여부는 계산 결과가 아니라 고용센터 심사와 실업인정
            절차로 결정됩니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>입력값 안내</h3>
            <p>
              월급 기준은 월급을 30으로 나눈 간편 추정이며, 퇴직 전 1일
              평균임금을 알고 있다면 직접 입력 방식이 더 적합합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>자주 틀리는 부분</h3>
            <p>
              고용보험 가입 개월 수만으로 피보험 단위기간 180일 충족을
              단정할 수 없고, 자발적 퇴사는 증빙과 고용센터 판단이 필요합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>사용자 우선 안내</h3>
            <p>
              계산기는 금액 구조를 이해하도록 돕는 참고 도구이며, 수급자격이나
              지급일을 확정하지 않습니다.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="precheck-title">
        <div className={styles.sectionHeading}>
          <h2 id="precheck-title">실업급여 계산 전 먼저 확인할 항목</h2>
          <p>
            실업급여는 금액 산식만으로 결정되지 않습니다. 계산 전에 고용보험
            이력, 퇴직 사유, 이직확인서와 실업인정 절차를 함께 확인해야 합니다.
          </p>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <caption>빠른 판단표</caption>
            <thead>
              <tr>
                <th scope="col">확인 항목</th>
                <th scope="col">왜 중요한지</th>
                <th scope="col">계산기에 반영되는지</th>
                <th scope="col">추가 확인 필요 여부</th>
              </tr>
            </thead>
            <tbody>
              {unemploymentQuickCheckRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.importance}</td>
                  <td>{row.calculatorCoverage}</td>
                  <td>{row.additionalCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="basis-title">
        <div className={styles.sectionHeading}>
          <h2 id="basis-title">2026년 실업급여 계산 기준</h2>
          <p>{unemploymentBasisSummary}</p>
        </div>
        <aside className={styles.policyNotice} aria-label="공식 기준 재확인 안내">
          <strong>2026년 공식 금액 기준 반영</strong>
          <p>
            {UNEMPLOYMENT_POLICY_2026.sourceNote} 법령·제도 변경이나 개인별
            이력에 따라 실제 수급 여부와 지급 시점은 달라질 수 있으므로 신청
            전 고용24 또는 고용센터에서 본인 기준을 확인해 주세요.
          </p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">1일 구직급여액 계산 방식</h2>
          <p>
            현재 계산기는 월급 기준 입력 시 월급을 30으로 나누어 1일 평균임금을
            추정하고, 직접 입력 시 입력한 1일 평균임금을 그대로 사용합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          <div>
            <dt>기본 산식</dt>
            <dd>추정 1일 평균임금 × 60% = 계산 전 기준 급여액</dd>
          </div>
          <div>
            <dt>상한액·하한액 적용 방식</dt>
            <dd>
              계산 전 기준 급여액이 현재 계산기의 상한액보다 높으면 상한액,
              하한액보다 낮으면 하한액을 1일 구직급여액으로 표시합니다.
            </dd>
          </div>
          <div>
            <dt>고용보험 가입기간과 소정급여일수</dt>
            <dd>
              가입기간이 길수록, 50세 이상 및 장애인 구간일수록 더 긴
              소정급여일수가 적용될 수 있습니다.
            </dd>
          </div>
          <div>
            <dt>나이 구간별 수급기간 차이</dt>
            <dd>
              현재 계산기는 50세 미만과 50세 이상 및 장애인 구간을 나누어
              120일부터 270일까지 예상 일수를 계산합니다.
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="criteria-table-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-table-title">계산 기준 요약표</h2>
          <p>
            아래 표는 화면 결과와 같은 계산 기준을 설명합니다. 수급자격 판단은
            공식 절차에서 별도로 확인해야 합니다.
          </p>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <caption>계산 기준 요약표</caption>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">현재 계산기 기준</th>
                <th scope="col">공식 확인 지점</th>
              </tr>
            </thead>
            <tbody>
              {unemploymentCriteriaRows.map((row) => (
                <tr key={row.item}>
                  <th scope="row">{row.item}</th>
                  <td>{row.currentCalculatorBasis}</td>
                  <td>{row.officialCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="reason-title">
        <div className={styles.sectionHeading}>
          <h2 id="reason-title">자발적 퇴사와 예외 인정 가능성</h2>
          <p>
            자발적으로 퇴사하면 원칙적으로 실업급여 수급이 제한됩니다. 다만
            임금체불, 직장 내 괴롭힘, 통근 곤란, 질병·부상, 가족 간호,
            임신·출산·육아 등 계속 근무하기 어려운 정당한 사유가 객관적으로
            확인되면 예외적으로 인정될 수 있습니다.
          </p>
          <p>
            계산 결과는 실업급여 수급자격이 인정된다는 가정으로 산정한
            예상값입니다. 자발적 퇴사의 예외 인정 여부와 실제 수급자격은
            신청자의 상황과 제출 자료를 바탕으로 관할 고용센터에서
            판단합니다.
          </p>
        </div>
        <details className={styles.reasonDetails}>
          <summary
            id="voluntary-resignation-exceptions"
            className={styles.reasonSummary}
          >
            자발적 퇴사 예외 조건과 준비할 증빙 자세히 보기
          </summary>
          <div className={styles.reasonDetailsBody}>
            <article>
              <h3>1. 자발적 퇴사의 기본 원칙</h3>
              <p>
                사직서를 직접 제출했더라도 객관적으로 퇴사가 불가피했던
                정당한 이직 사유가 인정되면 수급자격이 인정될 수 있습니다.
                반대로 단순한 이직 준비, 휴식, 개인적인 적성 불일치, 시험·공부,
                창업 준비처럼 개인적인 선택에 따른 퇴사는 원칙적으로 인정되기
                어렵습니다. 사직서 문구만이 아니라 실제 퇴사 경위와 제출한
                증빙자료를 종합하여 판단합니다.
              </p>
            </article>

            <article>
              <h3>2. 함께 충족해야 하는 기본 수급요건</h3>
              <p>
                정당한 퇴사 사유가 인정되더라도 피보험단위기간 180일 이상,
                일할 의사와 능력이 있지만 취업하지 못한 상태, 적극적인
                재취업활동 등 공통 수급요건을 함께 충족해야 합니다.
              </p>
              <p>
                피보험단위기간 180일은 단순한 재직기간 6개월과 같지 않습니다.
                실제 근무일과 유급휴일 등 임금 지급의 기초가 된 날을 기준으로
                산정하므로 근무 형태에 따라 필요한 재직기간이 달라질 수
                있습니다.
              </p>
            </article>

            <article>
              <h3>3. 임금체불 또는 근로조건 저하</h3>
              <p>
                채용 당시보다 실제 근로조건이 낮아졌거나, 임금이 지급되지
                않거나 반복해서 지연된 경우, 최저임금 미달, 법정 연장근로
                한도 위반, 사업장 휴업에 따른 임금 감소 등이 정당한 사유로
                검토될 수 있습니다. 구체적인 기간·횟수와 판단 기준은 당시
                시행 중인 별표 2의 세부 기준을 확인해야 합니다.
              </p>
              <h4>준비할 수 있는 자료</h4>
              <ul>
                <li>근로계약서, 급여명세서, 급여 입금 통장내역</li>
                <li>출퇴근 기록, 근무일지, 회사와 주고받은 문자·메신저·이메일</li>
                <li>임금 지급을 요청한 자료와 노동관서 진정 또는 처리 자료</li>
              </ul>
              <p>
                단순히 급여가 기대보다 적었다는 사정만으로는 부족할 수
                있으므로 약정 조건과 실제 지급 내역을 비교할 수 있어야 합니다.
              </p>
            </article>

            <article>
              <h3>4. 직장 내 괴롭힘·성희롱·차별</h3>
              <p>
                직장 내 괴롭힘, 성희롱·성폭력, 종교·성별·장애·노조활동을
                이유로 한 불합리한 차별, 반복적인 폭언·모욕·따돌림 등으로
                계속 근무하기 어려웠다면 예외 인정 가능성을 검토할 수
                있습니다. 단순한 성격 차이나 일반적인 갈등만으로는 인정되기
                어려울 수 있습니다.
              </p>
              <h4>준비할 수 있는 자료</h4>
              <ul>
                <li>사내 신고서와 회사의 조사 결과</li>
                <li>문자·메신저·이메일, 녹음 또는 녹취 자료</li>
                <li>동료의 사실확인서, 병원 진료기록 또는 상담기록</li>
                <li>노동관서 신고 및 처리 자료</li>
              </ul>
            </article>

            <article>
              <h3>5. 사업장 이전·전근 등으로 통근이 곤란해진 경우</h3>
              <p>
                회사의 사업장 이전, 다른 지역 사업장으로의 전근, 배우자나
                부양할 가족과 동거하기 위한 거주지 이전 등으로 통상의
                교통수단을 이용한 왕복 출퇴근 시간 3시간 이상이 되었다면
                정당한 이직 사유로 검토될 수 있습니다. 회사가 통근버스,
                기숙사 또는 숙소를 제공했는지 등 통근 문제를 해결하려 한
                조치도 함께 확인될 수 있습니다.
              </p>
              <h4>준비할 수 있는 자료</h4>
              <ul>
                <li>사업장 이전 공문, 전근명령서, 인사발령 자료</li>
                <li>주민등록초본, 배우자의 재직증명서</li>
                <li>대중교통 경로와 예상 소요시간, 실제 출퇴근 시간 자료</li>
              </ul>
            </article>

            <article>
              <h3>6. 본인의 질병·부상으로 기존 업무가 어려운 경우</h3>
              <p>
                질병·부상 또는 심신장애로 기존 업무 수행이 어렵고 회사가
                휴직이나 업무 전환을 허용하지 않았다면 검토 대상이 될 수
                있습니다. 담당 업무를 계속하기 어려운지, 치료에 필요한
                기간, 휴직·업무 전환 요청 여부와 회사의 답변, 의사 소견과
                사업주 의견이 함께 확인되는지가 중요합니다.
              </p>
              <h4>준비할 수 있는 자료</h4>
              <ul>
                <li>진단서, 의사 소견서, 치료기록, 입퇴원확인서</li>
                <li>휴직 신청서·업무 전환 요청서와 회사의 거부 답변</li>
                <li>담당 업무 내용과 근무환경을 확인할 수 있는 자료</li>
              </ul>
              <p>
                병명만 있는 진단서보다 담당 업무 수행 곤란과 치료 필요 기간이
                구체적으로 나타난 자료가 상황 설명에 도움이 될 수 있습니다.
                퇴사 당시 바로 구직활동을 할 수 없다면 신청 시점이나 수급기간
                연장 여부를 별도로 확인해야 합니다.
              </p>
            </article>

            <article>
              <h3>7. 가족을 30일 이상 간호해야 하는 경우</h3>
              <p>
                부모 또는 함께 사는 친족이 질병·부상으로 30일 이상 본인의
                간호를 필요로 하지만 회사가 휴가나 휴직을 허용하지 않아
                퇴사한 경우에는 예외 인정 가능성을 검토할 수 있습니다.
                가족이 아프다는 사실만으로 자동 인정되는 것은 아니며 본인이
                직접 간호해야 하는 필요성과 회사에서 휴가·휴직을 사용할 수
                없었던 사정이 함께 확인되어야 합니다.
              </p>
              <h4>준비할 수 있는 자료</h4>
              <ul>
                <li>가족관계증명서, 주민등록등본</li>
                <li>환자의 진단서, 입퇴원확인서, 간호 필요 기간 자료</li>
                <li>휴가·휴직 신청서와 회사의 거부 또는 미승인 답변</li>
              </ul>
            </article>

            <article>
              <h3>8. 임신·출산·육아로 계속 근무하기 어려운 경우</h3>
              <p>
                임신·출산 또는 만 8세 이하나 초등학교 2학년 이하 자녀의
                육아로 업무를 계속하기 어렵고 회사가 관련 휴가·휴직이나
                근로시간 조정을 허용하지 않았다면 검토할 수 있습니다. 단순히
                육아가 힘들다는 이유만으로 자동 인정되는 것은 아니며, 퇴사
                전에 육아휴직·근로시간 조정 등 대안을 요청했는지가 중요하게
                검토될 수 있습니다.
              </p>
              <h4>준비할 수 있는 자료</h4>
              <ul>
                <li>임신확인서, 출생증명서, 가족관계증명서</li>
                <li>어린이집 또는 돌봄 관련 자료</li>
                <li>육아휴직·근로시간 단축 신청서와 회사의 거부 답변</li>
                <li>다른 보호자가 돌봄을 담당하기 어려운 사정을 확인할 자료</li>
              </ul>
            </article>

            <article>
              <h3>9. 회사의 경영상 사유</h3>
              <p>
                형식상 사직서를 제출했더라도 도산·폐업, 대량 감원, 사업의
                양도·인수·합병, 사업부서 폐지, 조직 축소, 업종 전환, 경영
                악화, 희망퇴직 또는 권고사직 등 회사 사정으로 퇴사했다면
                실제 이직 경위를 확인해야 합니다. 회사 공지, 면담 내용,
                이직확인서의 퇴사 사유를 함께 살펴야 하며, 본인의 중대한
                귀책사유로 해고되거나 이를 피하려고 사직한 경우에는 제한될
                수 있습니다.
              </p>
            </article>

            <article>
              <h3>10. 그 밖의 인정 가능 사유</h3>
              <p>
                사업장에서 중대한 재해가 발생했는데 회사가 필요한 시정조치를
                하지 않은 경우, 회사의 사업 내용이나 취급 상품이 법령 개정
                등으로 위법하게 된 경우, 객관적으로 보아 일반적인 근로자도
                같은 상황에서 퇴사했을 것으로 인정되는 경우에도 구체적인
                상황에 따라 검토될 수 있습니다. 마지막 기준은 개인적인
                불만이나 주관적인 판단만으로는 부족하고, 계속 근무하기
                어려웠다는 사실을 객관적인 자료로 설명할 수 있어야 합니다.
              </p>
            </article>

            <article>
              <h3>11. 인정받기 어려운 대표 사례</h3>
              <ul>
                <li>더 높은 연봉의 회사로 이직하기 위한 퇴사</li>
                <li>단순한 업무 불만, 적성 불일치 또는 일반적인 성격 갈등</li>
                <li>쉬거나 여행하기 위한 퇴사</li>
                <li>시험·자격증·공무원 준비 또는 창업 준비</li>
                <li>구체적인 휴직 요청 없이 바로 한 육아 퇴사</li>
                <li>의사 소견이나 업무 전환 요청 없이 한 건강상 퇴사</li>
                <li>회사 이전과 관계없이 개인적인 필요로 이사한 경우</li>
              </ul>
            </article>

            <article>
              <h3>12. 퇴사 전에 준비할 사항</h3>
              <ol>
                <li>문제 해결, 근무조건 개선, 휴직, 업무 전환 또는 근로시간 조정을 서면으로 요청합니다.</li>
                <li>회사의 거부·미승인·미조치 내용을 확인할 수 있는 답변을 확보합니다.</li>
                <li>사직서에는 단순히 ‘개인 사정’이라고만 적지 말고 실제 사유를 사실에 맞게 작성합니다.</li>
                <li>근로계약서, 급여자료, 진단서, 통근 자료, 문자·메신저·이메일을 보관합니다.</li>
                <li>회사 이직확인서의 퇴사 사유가 실제 내용과 일치하는지 확인합니다.</li>
                <li>사유가 발생한 시점과 실제 퇴사 시점의 관계를 설명할 수 있게 자료를 정리합니다.</li>
              </ol>
            </article>

            <article>
              <h3>13. 최종 판단 안내</h3>
              <p>
                회사가 실업급여를 받을 수 있다고 안내했거나 이직확인서를
                제출했다고 해서 수급자격이 자동으로 인정되는 것은 아닙니다.
                자발적 퇴사의 예외 인정 여부는 근무 상황, 퇴사 경위, 회사가
                취한 조치와 제출된 증빙자료를 바탕으로 관할 고용센터가 최종
                판단합니다.
              </p>
              <p>
                계산박스 실업급여 계산기는 수급자격이 인정된다는 가정으로
                예상 지급액을 계산하는 도구입니다. 정당한 사유 인정 여부,
                실제 수급 가능 여부 또는 고용센터 심사 결과를 판정하지
                않습니다.
              </p>
            </article>
          </div>
        </details>
      </section>

      <section className={styles.section} aria-labelledby="procedure-title">
        <div className={styles.sectionHeading}>
          <h2 id="procedure-title">이직확인서와 실업인정 절차</h2>
          <p>
            고용24 안내에 따르면 퇴직한 회사의 상실 신고와 이직확인서 제출,
            구직 등록, 사전 교육, 수급자격 인정 신청, 실업인정 절차가 이어집니다.
            계산 결과는 이 절차를 대신하지 않습니다.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>
            월급 330만원, 고용보험 가입기간 36개월, 50세 미만, 비자발적 퇴사
            입력을 현재 계산기 기준으로 계산한 예시입니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {unemploymentExampleInputItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article className={styles.exampleCard}>
            <h3>예시 결과</h3>
            <dl>
              {unemploymentExampleResultItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과 해석 방법</h2>
          <p>
            화면에 표시되는 결과는 예상 계산입니다. 실제 지급 여부는 고용보험
            이력, 퇴직 사유, 이직확인서, 실업인정 절차에 따라 달라질 수 있습니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          {unemploymentInterpretationCards.map(({ title, description }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="excluded-title">
        <div className={styles.sectionHeading}>
          <h2 id="excluded-title">이 계산기에 포함되지 않는 항목</h2>
          <p>
            다음 항목은 현재 계산기가 자동 판단하지 않는 영역입니다. 신청 전
            공식 기관에서 확인해 주세요.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {unemploymentExcludedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="checklist-title">
        <div className={styles.sectionHeading}>
          <h2 id="checklist-title">신청 전 체크리스트</h2>
        </div>
        <ol className={styles.checkList}>
          {unemploymentChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {unemploymentFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <h2 id="related-title">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          {unemploymentRelatedCalculators.map(({ href, title, description }) => (
            <a
              className={`${styles.relatedCard} ${styles.relatedLink}`}
              href={href}
              key={href}
            >
              <h3>{title}</h3>
              <p>{description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">공식 출처</h2>
          <p>
            {formatKoreanDate(UNEMPLOYMENT_POLICY_2026.basisDate)} 기준으로
            아래 공식 기관 자료를 확인했습니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {unemploymentSources.map(
            ({ organization, title, checkedAt, href, criterion }) => (
              <li key={href}>
                <div>
                  <strong>{organization}</strong>
                  <span>{title}</span>
                  <span>
                    확인 기준일: {formatKoreanDate(checkedAt)} · {criterion}
                  </span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  원문 보기
                </a>
              </li>
            ),
          )}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="면책 문구">
        면책 문구: 이 페이지는 입력값 기준의 예상 계산과 일반 안내를 제공합니다.
        법률 자문이나 고용센터 심사 결과를 대신하지 않습니다. 공식 기준은 변경될
        수 있으므로 신청 전 고용보험, 고용24 또는 관할 고용센터에서 최신 기준과
        본인 이력을 확인해 주세요.
      </aside>
    </div>
  );
}
