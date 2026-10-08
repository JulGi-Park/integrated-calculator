import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [header, styles, top] = await Promise.all([
  readFile("components/common/SiteHeader.tsx", "utf8"),
  readFile("app/globals.css", "utf8"),
  readFile("components/common/BackToTop.tsx", "utf8"),
]);

test("헤더 메뉴는 접근 가능한 토글과 전체 글로벌 링크를 제공한다", () => {
  for (const href of ["/calculators/", "/knowledge/", "/about/", "/methodology/", "/updates/", "/contact/", "https://blog.gyesanbox.kr/"]) {
    assert.match(header, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /pointerdown/);
  assert.match(header, /showList=\{false\}/);
  assert.match(header, /showCurrent=\{false\}/);
});

test("모바일 헤더는 sticky이고 PC에는 TOP 이동 버튼이 있다", () => {
  assert.match(header, /className="site-header__desktop"/);
  assert.match(header, /className="site-header__mobile"/);
  assert.match(header, /<DesktopNavigation items=\{items\} \/>/);
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*?\.site-header \{ position: sticky; top: 0; \}/);
  assert.match(styles, /\.site-header__mobile \{ display: none; \}/);
  assert.match(styles, /\.site-header__desktop \{ display: none; \}/);
  assert.match(styles, /\.back-to-top/);
  assert.match(top, /window\.scrollY > 360/);
  assert.match(top, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
});

test("PC와 열린 모바일 메뉴는 지식센터 및 기존 링크를 유지하고 선택 후 모바일 메뉴를 닫는다", async () => {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://gyesanbox.kr/" });
  Object.defineProperty(globalThis, "self", { value: dom.window, configurable: true });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Node"]) {
    Object.defineProperty(globalThis, key, { value: key === "window" ? dom.window : dom.window[key], configurable: true });
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const React = await import("react");
  const { render, fireEvent, cleanup } = await import("@testing-library/react");
  const { SiteHeader } = await import("../components/common/SiteHeader.tsx");
  const view = render(React.createElement(SiteHeader, { knowledgeEnabled: true }));
  try {
    const paths = ["/calculators/", "/knowledge/", "/about/", "/methodology/", "/updates/", "/contact/", "https://blog.gyesanbox.kr/"];
    const checkMenu = selector => {
      const links = [...view.container.querySelectorAll(`${selector} a`)];
      const href = link => link.getAttribute("href").replace(/\/$/u, "");
      for (const path of paths) assert.equal(links.filter(link => href(link) === path.replace(/\/$/u, "")).length, 1, path);
      assert.equal(links.find(link => href(link) === "/knowledge").textContent, "지식센터");
    };
    checkMenu(".site-header__desktop");
    const trigger = view.getByRole("button", { name: "메뉴 열기" });
    fireEvent.click(trigger);
    checkMenu("#site-menu-panel");
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    const link = view.container.querySelector('#site-menu-panel a[href^="/knowledge"]');
    link.addEventListener("click", event => event.preventDefault());
    fireEvent.click(link);
    assert.equal(view.container.querySelector("#site-menu-panel"), null);
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    view.rerender(React.createElement(SiteHeader, { knowledgeEnabled: false }));
    fireEvent.click(trigger);
    assert.equal(view.container.querySelectorAll('a[href^="/knowledge"]').length, 0);
    assert.equal(view.container.querySelectorAll('a[href^="/calculators"]').length, 2);
  } finally {
    cleanup();
    dom.window.close();
  }
});
