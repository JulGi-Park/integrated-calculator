import type {
  ParentalLeaveMonthlyBenefit,
  ParentalLeavePolicyName,
  ParentalLeaveSpecialMissingInput,
  ParentalLeaveSpecialPolicyResult,
  ParentalLeaveSpecialReason,
} from "./parentalLeaveTypes";

export interface ParentalLeavePresentedMonthlyRow {
  month: number;
  policyLabel: string;
  amount: number;
  isFallback: boolean;
  note: string;
}

export interface ParentalLeavePresentedFallbackRange {
  fromMonth: number;
  toMonth: number;
  policyLabel: string;
  message: string;
}

export interface ParentalLeaveResultPresentation {
  title: string;
  status: "general" | "specialApplied" | "needsInput" | "notApplicable" | "needsReview";
  appliedPolicyLabel: string;
  notAppliedPolicyLabels: string[];
  primaryNotice: string;
  reasonMessages: string[];
  missingInputMessages: string[];
  warningMessages: string[];
  monthlyRows: ParentalLeavePresentedMonthlyRow[];
  fallbackRanges: ParentalLeavePresentedFallbackRange[];
  totalEstimatedAmount: number;
  policyDate: string;
  sourceNames: string[];
  disclaimer: string;
}

const policyLabels: Record<ParentalLeavePolicyName, string> = {
  general: "일반 육아휴직급여",
  parentsTogetherSixPlusSix: "부모 함께 육아휴직제 6+6 특례",
  singleParent: "한부모 육아휴직 특례",
  none: "선택한 특례 없음",
};

const reasonMessages: Record<ParentalLeaveSpecialReason, string> = {
  childAgeMonthsOver18: "자녀 월령이 18개월을 초과해 6+6 특례 적용 여부를 일반 계산으로 대체했습니다.",
  partnerLeaveNotUsed: "배우자 육아휴직 사용이 확인되지 않아 6+6 특례를 적용하지 않았습니다.",
  missingChildAgeMonths: "자녀 월령 입력이 필요합니다.",
  missingPartnerLeaveMonths: "배우자 육아휴직 사용 개월 수 입력이 필요합니다.",
  leaveMonthOutOfSpecialRange: "6+6 특례 공통 사용기간은 1~6개월 범위에서 확인해야 합니다.",
  notSameChild: "같은 자녀 기준이 아니므로 6+6 특례를 적용하지 않았습니다.",
  unknownEligibility: "특례 대상 여부가 명확하지 않아 고용센터 확인이 필요합니다.",
  notSingleParent: "한부모 특례 대상이 아닌 입력으로 확인되어 일반 계산을 참고값으로 표시합니다.",
  missingSingleParentStatus: "한부모 해당 여부 입력이 필요합니다.",
  multipleSpecialPoliciesSelected: "두 특례를 동시에 선택한 상태이므로 계산 방식 확인이 필요합니다.",
  insufficientInputs: "특례 판단에 필요한 입력값이 부족합니다.",
  unsupportedCase: "현재 계산기가 확정 계산으로 처리하지 않는 특례 조합입니다.",
  centerReviewRequired: "특례 적용 가능 여부는 고용센터 확인이 필요합니다.",
};

const missingInputMessages: Record<ParentalLeaveSpecialMissingInput, string> = {
  childAgeMonths: "자녀 월령",
  partnerUsedParentalLeave: "배우자 육아휴직 사용 여부",
  partnerLeaveMonths: "배우자 육아휴직 사용 개월 수",
  sameChild: "같은 자녀 기준 여부",
  isSingleParent: "한부모 해당 여부",
};

const forbiddenFinalityPatterns = /지급됩니다|확정 금액입니다|반드시 받을 수 있습니다|승인됩니다/;

function getRequestedPolicyLabels(
  result: ParentalLeaveSpecialPolicyResult,
): string[] {
  if (result.requestedPolicy === "multiple") {
    return [
      policyLabels.parentsTogetherSixPlusSix,
      policyLabels.singleParent,
    ];
  }

  if (result.requestedPolicy === "none") {
    return [];
  }

  return [policyLabels[result.requestedPolicy]];
}

function getTitle(result: ParentalLeaveSpecialPolicyResult): string {
  if (result.requestedPolicy === "multiple") {
    return "특례 중복 선택 검토 안내";
  }

  if (result.appliedPolicy === "parentsTogetherSixPlusSix") {
    return "6+6 특례 입력값 기준 예상 계산";
  }

  if (result.appliedPolicy === "singleParent") {
    return "한부모 특례 입력값 기준 예상 계산";
  }

  return "일반 육아휴직급여 예상 계산";
}

function getStatus(
  result: ParentalLeaveSpecialPolicyResult,
): ParentalLeaveResultPresentation["status"] {
  if (result.reasons.includes("multipleSpecialPoliciesSelected")) {
    return "needsReview";
  }

  if (result.missingInputs.length > 0) {
    return "needsInput";
  }

  if (!result.isApplicable && result.fallbackPolicy === "general") {
    return "notApplicable";
  }

  if (
    result.appliedPolicy === "parentsTogetherSixPlusSix" ||
    result.appliedPolicy === "singleParent"
  ) {
    return "specialApplied";
  }

  return "general";
}

function getPrimaryNotice(result: ParentalLeaveSpecialPolicyResult): string {
  if (result.reasons.includes("multipleSpecialPoliciesSelected")) {
    return "두 특례를 동시에 선택한 상태이므로 계산 방식 확인이 필요합니다. 임의로 더 유리한 특례를 자동 적용하지 않고 일반 계산 참고값을 표시합니다.";
  }

  if (result.missingInputs.length > 0) {
    return "특례 금액을 임의 추정하지 않고 보완해야 할 입력값을 먼저 확인합니다.";
  }

  if (!result.isApplicable && result.fallbackPolicy === "general") {
    return "특례 조건을 충족하지 않아 일반 육아휴직급여 기준의 참고값을 표시합니다.";
  }

  if (result.appliedPolicy === "parentsTogetherSixPlusSix") {
    return "입력값 기준으로 6+6 특례 예상 급여를 표시합니다. 일부 기간은 일반 육아휴직급여 기준으로 이어질 수 있습니다.";
  }

  if (result.appliedPolicy === "singleParent") {
    return "입력값 기준으로 한부모 특례 예상 급여를 표시합니다. 4개월차 이후는 일반 육아휴직급여 기준으로 이어질 수 있습니다.";
  }

  return "일반 육아휴직급여 예상 계산입니다. 특례 조건을 선택하지 않았거나 입력되지 않았습니다.";
}

function getNotAppliedPolicyLabels(
  result: ParentalLeaveSpecialPolicyResult,
): string[] {
  if (result.isApplicable && result.requestedPolicy !== "multiple") {
    return [];
  }

  const requestedPolicyLabels = getRequestedPolicyLabels(result);

  if (requestedPolicyLabels.length > 0) {
    return requestedPolicyLabels;
  }

  return [];
}

function buildMonthlyRows(
  result: ParentalLeaveSpecialPolicyResult,
): ParentalLeavePresentedMonthlyRow[] {
  return result.monthlyResults.map((item) => {
    const appliedPolicy = item.appliedPolicy ?? "general";

    return {
      month: item.month,
      policyLabel: policyLabels[appliedPolicy],
      amount: item.estimatedAmount,
      isFallback:
        result.requestedPolicy !== "none" &&
        result.requestedPolicy !== "multiple" &&
        appliedPolicy === "general" &&
        result.fallbackPolicy === "general",
      note: buildMonthlyNote(item, appliedPolicy),
    };
  });
}

function buildMonthlyNote(
  item: ParentalLeaveMonthlyBenefit,
  appliedPolicy: ParentalLeavePolicyName,
): string {
  const limitNote = item.capApplied
    ? "상한 적용"
    : item.floorApplied
      ? "하한 적용"
      : "상한·하한 미적용";

  return `${policyLabels[appliedPolicy]} 기준 예상액, ${limitNote}`;
}

function buildFallbackRanges(
  rows: ParentalLeavePresentedMonthlyRow[],
): ParentalLeavePresentedFallbackRange[] {
  const ranges: ParentalLeavePresentedFallbackRange[] = [];
  let rangeStart: number | null = null;
  let previousMonth: number | null = null;

  for (const row of rows) {
    if (row.isFallback) {
      rangeStart ??= row.month;
      previousMonth = row.month;
      continue;
    }

    if (rangeStart !== null && previousMonth !== null) {
      ranges.push(buildFallbackRange(rangeStart, previousMonth));
      rangeStart = null;
      previousMonth = null;
    }
  }

  if (rangeStart !== null && previousMonth !== null) {
    ranges.push(buildFallbackRange(rangeStart, previousMonth));
  }

  return ranges;
}

function buildFallbackRange(
  fromMonth: number,
  toMonth: number,
): ParentalLeavePresentedFallbackRange {
  return {
    fromMonth,
    toMonth,
    policyLabel: policyLabels.general,
    message:
      fromMonth === toMonth
        ? `${fromMonth}개월차는 일반 육아휴직급여 기준 예상액으로 표시합니다.`
        : `${fromMonth}~${toMonth}개월차는 일반 육아휴직급여 기준 예상액으로 표시합니다.`,
  };
}

function sanitizeMessages(messages: string[]): string[] {
  return messages.map((message) =>
    message.replace(forbiddenFinalityPatterns, "예상 계산입니다"),
  );
}

export function buildParentalLeaveResultPresentation(
  result: ParentalLeaveSpecialPolicyResult,
): ParentalLeaveResultPresentation {
  const monthlyRows = buildMonthlyRows(result);

  return {
    title: getTitle(result),
    status: getStatus(result),
    appliedPolicyLabel: policyLabels[result.appliedPolicy],
    notAppliedPolicyLabels: getNotAppliedPolicyLabels(result),
    primaryNotice: getPrimaryNotice(result),
    reasonMessages: sanitizeMessages(
      result.reasons.map((reason) => reasonMessages[reason]),
    ),
    missingInputMessages: result.missingInputs.map(
      (input) => missingInputMessages[input],
    ),
    warningMessages: sanitizeMessages(result.warnings),
    monthlyRows,
    fallbackRanges: buildFallbackRanges(monthlyRows),
    totalEstimatedAmount: result.totalEstimatedAmount,
    policyDate: result.policyDate,
    sourceNames: result.sourceNames,
    disclaimer: result.disclaimer,
  };
}
