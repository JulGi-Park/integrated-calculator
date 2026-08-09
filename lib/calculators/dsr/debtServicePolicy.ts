import type { DsrLoanType, DsrRepaymentType } from "./types";

export interface DsrDebtPolicyRow {
  loanType: DsrLoanType | "excluded" | "other";
  repaymentType: DsrRepaymentType | "any";
  principalCalculation: string;
  interestCalculation: string;
  assessmentMaturity: string;
  maximumMaturity: number | null;
  exclusion: boolean;
  condition: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  source: string;
}

export const DSR_DEBT_SERVICE_POLICY = {
  verifiedAt: "2026-08-09",
  effectiveFrom: "2026-06-30",
  generalMaximumMaturityMonths: 480,
  mortgageBulletMaximumMaturityMonths: 120,
  creditDefaultMaturityMonths: 60,
  creditInstallmentMinimumMaturityMonths: 60,
  creditInstallmentMaximumMaturityMonths: 120,
  creditInstallmentMinimumRatio: 40,
  nonHousingMortgageMaturityMonths: 96,
  officetelBulletMaturityMonths: 96,
  leaseDepositSecuredMaturityMonths: 48,
  source:
    "https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2200000108789",
} as const;

const actualInterest = "향후 1년간 실제 부담 이자";
const currentSource = DSR_DEBT_SERVICE_POLICY.source;

export const DSR_DEBT_SERVICE_MATRIX: readonly DsrDebtPolicyRow[] = [
  {
    loanType: "mortgage",
    repaymentType: "levelPayment",
    principalCalculation: "분할상환 개시 이후 향후 1년간 실제 원금 상환액",
    interestCalculation: actualInterest,
    assessmentMaturity: "실제 만기, 상환능력 입증 입력이 없으면 최대 40년",
    maximumMaturity: 480,
    exclusion: false,
    condition: "개별 주담대·잔금대출의 원금 전액 분할상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "mortgage",
    repaymentType: "equalPrincipal",
    principalCalculation: "분할상환 개시 이후 향후 1년간 실제 원금 상환액",
    interestCalculation: actualInterest,
    assessmentMaturity: "실제 만기, 상환능력 입증 입력이 없으면 최대 40년",
    maximumMaturity: 480,
    exclusion: false,
    condition: "개별 주담대·잔금대출의 원금 전액 분할상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "mortgage",
    repaymentType: "partialInstallment",
    principalCalculation:
      "향후 1년 실제 분할상환 원금 + 만기상환액/(대출기간-거치기간)",
    interestCalculation: actualInterest,
    assessmentMaturity: "실제 만기, 상환능력 입증 입력이 없으면 최대 40년",
    maximumMaturity: 480,
    exclusion: false,
    condition: "개별 주담대·잔금대출의 원금 일부 분할상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "mortgage",
    repaymentType: "bullet",
    principalCalculation: "대출총액/대출기간",
    interestCalculation: actualInterest,
    assessmentMaturity: "실제 만기, 최대 10년",
    maximumMaturity: 120,
    exclusion: false,
    condition: "개별 주담대·잔금대출의 원금 일시상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "credit",
    repaymentType: "levelPayment",
    principalCalculation: "대출총액/약정만기",
    interestCalculation: actualInterest,
    assessmentMaturity: "5년 이상 10년 이내 실제 약정만기",
    maximumMaturity: 120,
    exclusion: false,
    condition:
      "무거치, 월·분기 균등분할, 총대출액의 40% 이상 분할상환 요건 충족",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "credit",
    repaymentType: "equalPrincipal",
    principalCalculation: "대출총액/약정만기",
    interestCalculation: actualInterest,
    assessmentMaturity: "5년 이상 10년 이내 실제 약정만기",
    maximumMaturity: 120,
    exclusion: false,
    condition:
      "무거치, 월·분기 균등분할, 총대출액의 40% 이상 분할상환 요건 충족",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "credit",
    repaymentType: "any",
    principalCalculation: "대출총액/5년",
    interestCalculation: actualInterest,
    assessmentMaturity: "5년",
    maximumMaturity: 60,
    exclusion: false,
    condition: "분할상환 인정요건 미충족 또는 일시상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "nonHousingMortgage",
    repaymentType: "any",
    principalCalculation: "대출총액/8년",
    interestCalculation: actualInterest,
    assessmentMaturity: "8년",
    maximumMaturity: 96,
    exclusion: false,
    condition: "오피스텔 외 비주택담보대출",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "officetelMortgage",
    repaymentType: "levelPayment",
    principalCalculation: "분할상환 개시 이후 향후 1년간 실제 원금 상환액",
    interestCalculation: actualInterest,
    assessmentMaturity: "실제 만기, 상환능력 입증 입력이 없으면 최대 40년",
    maximumMaturity: 480,
    exclusion: false,
    condition: "전액 분할상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "officetelMortgage",
    repaymentType: "partialInstallment",
    principalCalculation:
      "향후 1년 실제 분할상환 원금 + 만기상환액/(대출기간-거치기간)",
    interestCalculation: actualInterest,
    assessmentMaturity: "실제 만기, 최대 40년",
    maximumMaturity: 480,
    exclusion: false,
    condition: "거치기간 1년 이하인 일부 분할상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "officetelMortgage",
    repaymentType: "bullet",
    principalCalculation: "대출총액/8년",
    interestCalculation: actualInterest,
    assessmentMaturity: "8년",
    maximumMaturity: 96,
    exclusion: false,
    condition: "일시상환 또는 거치기간 1년 초과 일부 분할상환",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "leaseDepositSecured",
    repaymentType: "any",
    principalCalculation: "대출총액/4년",
    interestCalculation: actualInterest,
    assessmentMaturity: "4년",
    maximumMaturity: 48,
    exclusion: false,
    condition: "임차인이 지급한 전세보증금을 담보로 한 대출",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "other",
    repaymentType: "any",
    principalCalculation: "향후 1년간 실제 상환액",
    interestCalculation: actualInterest,
    assessmentMaturity: "계약상 향후 1년",
    maximumMaturity: null,
    exclusion: false,
    condition: "할부·리스·단기카드대출·학자금·대부업대출 등",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
  {
    loanType: "excluded",
    repaymentType: "any",
    principalCalculation: "DSR 불포함",
    interestCalculation: "DSR 불포함",
    assessmentMaturity: "해당 없음",
    maximumMaturity: null,
    exclusion: true,
    condition:
      "전세자금·예적금담보·보험계약·서민금융·300만원 이하 소액·주택연금 등",
    effectiveFrom: "2026-06-30",
    effectiveTo: null,
    source: currentSource,
  },
] as const;
