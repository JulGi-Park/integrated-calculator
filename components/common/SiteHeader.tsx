"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FavoritesHeader } from "./FavoritesHeader";

const menuItems = [
  { href: "/calculators/", label: "계산기 목록" },
  { href: "/knowledge/", label: "지식센터" },
  { href: "/about/", label: "소개" },
  { href: "/methodology/", label: "계산 방법론" },
  { href: "/updates/", label: "변경 이력" },
  { href: "/contact/", label: "문의" },
];

function MenuLink({ item, className, onClick }: { item: typeof menuItems[number]; className: string; onClick?: () => void }) {
  // Knowledge is served by Pages Functions; load its current runtime gates and metadata.
  return item.href === "/knowledge/"
    ? <a className={className} href={item.href} onClick={onClick}>{item.label}</a>
    : <Link className={className} href={item.href} onClick={onClick}>{item.label}</Link>;
}

function DesktopNavigation({ items }: { items: typeof menuItems }) {
  return (
    <nav aria-label="주요 메뉴">
      {items.map((item) => <MenuLink key={item.href} item={item} className="nav-link" />)}
      <a className="nav-link" href="https://blog.gyesanbox.kr/">블로그</a>
      <FavoritesHeader />
    </nav>
  );
}

function MobileMenuPanel({ onClose, items }: { onClose: () => void; items: typeof menuItems }) {
  return (
    <nav id="site-menu-panel" className="site-menu-panel" aria-label="주요 메뉴">
      <div className="site-menu-panel__links">
        {items.map((item) => <MenuLink key={item.href} item={item} className="site-menu-link" onClick={onClose} />)}
        <a className="site-menu-link" href="https://blog.gyesanbox.kr/" onClick={onClose}>블로그</a>
      </div>
      <div className="site-menu-panel__favorites"><FavoritesHeader showCurrent={false} /></div>
    </nav>
  );
}

export function SiteHeader({ knowledgeEnabled = false }: { knowledgeEnabled?: boolean }) {
  const items = menuItems.filter((item) => item.href !== "/knowledge/" || knowledgeEnabled);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeMenu = () => {
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header__desktop">
        <div className="site-header__inner">
          <Link className="brand" href="/" aria-label="계산박스 홈">
            <span className="brand__mark" aria-hidden="true">=</span>
            <span>계산박스</span>
          </Link>
          <DesktopNavigation items={items} />
        </div>
      </div>
      <div className="site-header__mobile">
        <div className="site-header__inner">
          <button ref={triggerRef} type="button" className="site-menu-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="site-menu-panel" aria-label={open ? "메뉴 닫기" : "메뉴 열기"}>
            <span className="site-menu-trigger__icon" aria-hidden="true"><span /><span /><span /></span>
            <span>메뉴</span>
          </button>
          <Link className="brand" href="/" aria-label="계산박스 홈">계산박스</Link>
          <div className="site-header__action"><FavoritesHeader showList={false} /></div>
          {open && <MobileMenuPanel items={items} onClose={() => setOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
