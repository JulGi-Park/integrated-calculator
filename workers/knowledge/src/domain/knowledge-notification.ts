const ADMIN_EMAIL = "julgidev@gmail.com";
const SENDER_EMAIL = "knowledge-notice@gyesanbox.kr";
const ADMIN_URL = "https://gyesanbox.kr/admin/knowledge";

export const formatKoreanDateTime = (value: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}`;
};

const logNotification = (questionId: string, result: "sent" | "failed", errorType: string | null): void => {
  console.log(JSON.stringify({
    event: "knowledge_question_email_notification",
    question_id: questionId,
    result,
    error_type: errorType,
    occurred_at: new Date().toISOString(),
  }));
};

export const sendKnowledgeQuestionNotification = async (
  email: SendEmail | undefined,
  question: { id: string; category: string; title: string; createdAt: string },
): Promise<void> => {
  if (!email) return;

  const text = [
    "새로운 질문이 등록되었습니다.",
    "",
    `카테고리: ${question.category}`,
    `질문 제목: ${question.title}`,
    `등록 일시: ${formatKoreanDateTime(question.createdAt)} (KST)`,
    `질문 ID: ${question.id}`,
    "",
    "관리자 페이지:",
    ADMIN_URL,
  ].join("\n");

  try {
    await email.send({
      to: ADMIN_EMAIL,
      from: { email: SENDER_EMAIL, name: "계산박스" },
      subject: "[계산박스] 지식센터 새 질문 등록",
      text,
    });
    logNotification(question.id, "sent", null);
  } catch (error) {
    const typedError = error as { code?: unknown; name?: unknown };
    const errorType = typeof typedError?.code === "string"
      ? typedError.code
      : typeof typedError?.name === "string" ? typedError.name : "UnknownError";
    logNotification(question.id, "failed", errorType);
  }
};
