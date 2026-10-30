import { escapeKnowledgeSeoHtml as escape, knowledgeDetailPath } from "../lib/knowledge/seo";
import { fetchPublicQuestionPage } from "./knowledge-seo";

export function renderKnowledgeList(data: Awaited<ReturnType<typeof fetchPublicQuestionPage>>): string {
  const href = (page: number) => page === 1 ? "/knowledge/" : `/knowledge/?page=${page}`;
  const pages = new Set([1, data.totalPages]);
  for (let page = Math.max(1, data.page - 2); page <= Math.min(data.totalPages, data.page + 2); page++) pages.add(page);
  let previous = 0;
  const numbered = [...pages].sort((a, b) => a - b).map((page) => {
    const gap = previous && page > previous + 1 ? '<span aria-hidden="true">…</span>' : "";
    previous = page;
    return `${gap}<a href="${href(page)}"${page === data.page ? ' aria-current="page"' : ""} aria-label="${page}페이지">${page}</a>`;
  }).join("");
  return `<section class="knowledge-server-list" aria-labelledby="knowledge-list-title">
<h2 id="knowledge-list-title">최신 질문</h2><p>전체 ${data.total}건 · ${data.page} / ${data.totalPages}페이지</p>
${data.items.length ? `<ul>${data.items.map((item) => `<li><a href="${knowledgeDetailPath(item.id)}">${escape(item.title)}</a>${item.category ? `<span>${escape(item.category)}</span>` : ""}</li>`).join("")}</ul>` : "<p>등록된 질문이 없습니다.</p>"}
${data.totalPages > 1 ? `<nav aria-label="질문 페이지 번호">${data.page > 1 ? `<a href="${href(data.page - 1)}" rel="prev">이전</a>` : ""}${numbered}${data.page < data.totalPages ? `<a href="${href(data.page + 1)}" rel="next">다음</a>` : ""}</nav>` : ""}
<noscript><p>질문 등록·검색·수정 기능을 사용하려면 JavaScript를 켜 주세요.</p></noscript></section>`;
}
