import { KNOWLEDGE_CATEGORIES } from "../../../lib/knowledge/categories";

const escape = (value: string): string => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const categories = KNOWLEDGE_CATEGORIES.map((category) => `<option value="${escape(category)}">${escape(category)}</option>`).join("");

const client = String.raw`
(() => {
  const root = (id) => document.getElementById(id);
  const apiRoot = '/api/knowledge/v1';
  const state = { mode: 'list', id: null, page: 1, totalPages: 1, services: [], answer: null, status: null };
  const notice = root('notice');
  const show = (message, error = false) => { notice.textContent = message; notice.className = error ? 'error' : ''; };
  const request = async (path, options = {}) => {
    const headers = { Accept: 'application/json' };
    if (options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      headers['Idempotency-Key'] = crypto.randomUUID();
    }
    const response = await fetch(apiRoot + path, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', ...options, headers });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error?.message || '요청을 완료하지 못했습니다.');
    return result.data;
  };
  const setMode = (mode) => {
    state.mode = mode;
    root('list-view').hidden = mode !== 'list';
    root('edit-view').hidden = mode === 'list';
    root('form-heading').textContent = mode === 'create' ? '새 질문 등록' : '질문 수정';
    root('password').required = mode === 'create';
    root('answer-group').hidden = mode !== 'edit';
    root('actions').hidden = mode !== 'edit';
  };
  const statusLabel = (value) => ({ draft: '초안', published: '공개', hidden: '숨김' })[value] || value;
  const renderServices = (selected = []) => {
    const holder = root('services');
    holder.replaceChildren();
    const chosen = new Set(selected);
    for (const service of state.services) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox'; input.name = 'service'; input.value = service.id; input.checked = chosen.has(service.id);
      label.append(input, document.createTextNode(' ' + service.name));
      holder.append(label);
    }
  };
  const selectedServices = () => [...document.querySelectorAll('input[name="service"]:checked')].map((input) => input.value);
  const renderPagination = () => {
    const holder = root('pagination'); holder.replaceChildren();
    const add = (text, page, disabled = false) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
      button.disabled = disabled; button.addEventListener('click', () => loadList(page)); holder.append(button);
    };
    if (state.totalPages <= 1) return;
    add('이전', state.page - 1, state.page <= 1);
    const indicator = document.createElement('span'); indicator.textContent = state.page + ' / ' + state.totalPages; holder.append(indicator);
    add('다음', state.page + 1, state.page >= state.totalPages);
  };
  const loadList = async (page = state.page) => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      for (const [id, name] of [['query', 'query'], ['status', 'status'], ['answered', 'answered'], ['filter-category', 'category']]) {
        const value = root(id).value.trim(); if (value) params.set(name, value);
      }
      const data = await request('/admin/questions?' + params);
      state.page = data.page; state.totalPages = data.total_pages;
      root('result-count').textContent = '결과 ' + data.total + '건';
      const holder = root('questions'); holder.replaceChildren();
      if (!data.items.length) holder.textContent = '조건에 맞는 질문이 없습니다.';
      for (const question of data.items) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'question-row';
        const title = document.createElement('strong'); title.textContent = question.title;
        const meta = document.createElement('small');
        meta.textContent = [question.category || '미분류', statusLabel(question.status), question.answer ? '답변 있음' : '답변 대기', question.isAnonymous ? '익명' : question.nickname].join(' · ');
        button.append(title, meta); button.addEventListener('click', () => openQuestion(question.id)); holder.append(button);
      }
      renderPagination(); show('');
    } catch (error) { show(error.message, true); }
  };
  const openQuestion = async (id) => {
    try {
      const data = await request('/admin/questions/' + encodeURIComponent(id));
      const question = data.question;
      state.id = id; state.answer = question.answer; state.status = question.status;
      root('title').value = question.title; root('body').value = question.body;
      root('category').value = question.category || '';
      root('password').value = '';
      root('password').placeholder = question.passwordConfigured ? '••••••••' : '';
      root('password-hint').textContent = question.passwordConfigured ? '기존 비밀번호가 설정되어 있습니다. 변경할 때만 새 값을 입력하세요.' : '';
      root('answer').value = question.answer?.body || '';
      root('answer-save').textContent = question.answer ? '공식답변 수정' : '공식답변 등록';
      root('hide').hidden = question.status !== 'published';
      root('publish').hidden = question.status === 'published';
      renderServices((question.relatedServices || []).map((service) => service.id));
      setMode('edit'); show('');
    } catch (error) { show(error.message, true); }
  };
  root('new').addEventListener('click', () => {
    state.id = null; state.answer = null; state.status = null;
    root('edit-form').reset(); root('password').placeholder = ''; root('password-hint').textContent = '';
    renderServices(); setMode('create'); show('');
  });
  root('back').addEventListener('click', () => { setMode('list'); loadList(); });
  root('search-form').addEventListener('submit', (event) => { event.preventDefault(); loadList(1); });
  for (const id of ['status', 'answered', 'filter-category']) root(id).addEventListener('change', () => loadList(1));
  root('reset').addEventListener('click', () => {
    for (const id of ['query', 'status', 'answered', 'filter-category']) root(id).value = '';
    loadList(1);
  });
  root('edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = root('save'); submit.disabled = true;
    const payload = { title: root('title').value, body: root('body').value, category: root('category').value, serviceIds: selectedServices() };
    if (state.mode === 'create' || root('password').value) payload.password = root('password').value;
    try {
      const create = state.mode === 'create';
      const data = await request(create ? '/admin/questions' : '/admin/questions/' + state.id, {
        method: create ? 'POST' : 'PATCH', body: JSON.stringify(payload),
      });
      if (create) state.id = data.id;
      await openQuestion(state.id);
      show(create ? '질문을 공개 상태로 등록했습니다.' : '수정사항을 저장했습니다.');
    } catch (error) { show(error.message, true); }
    finally { submit.disabled = false; }
  });
  root('answer-save').addEventListener('click', async () => {
    try {
      await request('/admin/questions/' + state.id + '/answer', { method: state.answer ? 'PATCH' : 'POST', body: JSON.stringify({ body: root('answer').value }) });
      await openQuestion(state.id); show('공식답변을 저장했습니다.');
    } catch (error) { show(error.message, true); }
  });
  for (const action of ['hide', 'publish']) root(action).addEventListener('click', async () => {
    try {
      await request('/admin/questions/' + state.id + '/' + action, { method: 'POST', body: '{}' });
      await openQuestion(state.id); show(action === 'hide' ? '질문을 숨겼습니다.' : '질문을 공개했습니다.');
    } catch (error) { show(error.message, true); }
  });
  root('delete').addEventListener('click', async () => {
    if (!confirm('이 질문과 공식답변을 삭제하시겠습니까?')) return;
    try {
      await request('/admin/questions/' + state.id, { method: 'DELETE' });
      setMode('list'); await loadList(); show('질문을 삭제했습니다.');
    } catch (error) { show(error.message, true); }
  });
  request('/services').then((data) => { state.services = data.items || []; renderServices(); }).catch((error) => show(error.message, true));
  loadList(1);
})();`;

export const adminUi = (): Response => new Response(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>지식센터 관리자 · 계산박스</title><style>
*{box-sizing:border-box}body{font-family:system-ui,sans-serif;margin:0;background:#f5f7fb;color:#172033}main{max-width:1100px;margin:auto;padding:24px}h1{font-size:1.5rem}section{background:#fff;border:1px solid #dce3ee;border-radius:12px;padding:20px;margin-top:18px}button,input,select,textarea{font:inherit}button{cursor:pointer;border:1px solid #b7c5d8;background:white;border-radius:7px;padding:8px 12px}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #2563eb}button:disabled{opacity:.5;cursor:not-allowed}.primary{background:#2563eb;color:white;border-color:#2563eb}.danger{color:#b91c1c}label{display:block}.toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:10px}.toolbar label{min-width:130px;flex:1}.toolbar input,.toolbar select,.field input,.field select,.field textarea{width:100%;padding:9px;border:1px solid #b7c5d8;border-radius:7px}.field{margin:14px 0}.field textarea{min-height:150px}.question-row{display:block;width:100%;border:0;border-bottom:1px solid #dce3ee;border-radius:0;text-align:left;padding:12px 4px}.question-row strong,.question-row small{display:block}.question-row small{color:#58677f;margin-top:4px}#services{display:flex;flex-wrap:wrap;gap:8px}#services label{border:1px solid #dce3ee;border-radius:7px;padding:7px}#pagination,.actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:16px}#notice{min-height:1.5em}#notice.error{color:#b91c1c}@media(max-width:600px){main{padding:12px}section{padding:14px}.toolbar label{min-width:100%}.toolbar button{flex:1}}
</style></head><body><main><h1>계산박스 지식센터 관리</h1><p id="notice" role="status" aria-live="polite"></p><section id="list-view"><div class="actions"><h2>질문 목록</h2><button id="new" class="primary" type="button">+ 새 질문 등록</button></div><form id="search-form" class="toolbar"><label>검색<input id="query" placeholder="제목 또는 질문 내용"></label><label>상태<select id="status"><option value="">전체</option><option value="draft">초안</option><option value="published">공개</option><option value="hidden">숨김</option></select></label><label>답변<select id="answered"><option value="">전체</option><option value="yes">답변 있음</option><option value="no">답변 대기</option></select></label><label>카테고리<select id="filter-category"><option value="">전체</option>${categories}</select></label><button class="primary" type="submit">검색</button><button id="reset" type="button">초기화</button></form><p id="result-count"></p><div id="questions"></div><nav id="pagination" aria-label="질문 페이지 이동"></nav></section><section id="edit-view" hidden><button id="back" type="button">← 목록으로</button><h2 id="form-heading">새 질문 등록</h2><form id="edit-form"><label class="field">제목<input id="title" required maxlength="120"></label><label class="field">카테고리<select id="category" required><option value="">선택하세요</option>${categories}</select></label><label class="field">질문 내용<textarea id="body" required maxlength="4000"></textarea></label><label class="field">임시 비밀번호<input id="password" type="password" minlength="4" autocomplete="new-password"><small id="password-hint"></small></label><fieldset><legend>관련 계산기</legend><div id="services"></div></fieldset><div class="actions"><button id="save" class="primary" type="submit">저장</button></div></form><div id="answer-group"><label class="field">공식답변<textarea id="answer" maxlength="4000"></textarea></label><button id="answer-save" type="button">공식답변 등록</button></div><div id="actions" class="actions"><button id="publish" type="button">공개</button><button id="hide" type="button">숨김</button><button id="delete" type="button" class="danger">삭제</button></div></section></main><script>${client}</script></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
