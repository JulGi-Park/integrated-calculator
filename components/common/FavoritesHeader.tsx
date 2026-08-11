"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  FAVORITES_STORAGE_KEY,
  getFavoritePage,
  MAX_FAVORITES,
  normalizeFavoritePath,
  parseFavorites,
  serializeFavorites,
  type FavoriteItem,
} from "@/lib/favorites";

const FAVORITES_CHANGED_EVENT = "gyesanbox:favorites-changed";

function subscribeFavorites(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_CHANGED_EVENT, onStoreChange);
  };
}

function getFavoritesSnapshot() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerFavoritesSnapshot() {
  return "";
}

function createFavorite(path: string): FavoriteItem {
  return { path, addedAt: Date.now() };
}

export function FavoritesHeader() {
  const pathname = usePathname();
  const currentPath = normalizeFavoritePath(pathname);
  const currentPage = currentPath ? getFavoritePage(currentPath) : undefined;
  const rawFavorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [fallbackRaw, setFallbackRaw] = useState<string | null>(null);
  const effectiveRaw = rawFavorites || fallbackRaw || "";
  const items = useMemo(() => parseFavorites(effectiveRaw), [effectiveRaw]);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const saved = useMemo(() => new Set(items.map((item) => item.path)), [items]);

  const persist = (next: FavoriteItem[]) => {
    const limited = next.slice(0, MAX_FAVORITES);
    const serialized = serializeFavorites(limited);
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, serialized);
      setFallbackRaw(null);
    } catch {
      // Private browsing and storage quota errors must not break the page.
      setFallbackRaw(serialized);
    }
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
  };

  const toggle = () => {
    if (!currentPath || !currentPage) return;
    const wasSaved = saved.has(currentPath);
    const next = wasSaved
      ? items.filter((item) => item.path !== currentPath)
      : [createFavorite(currentPath), ...items];
    persist(next);
    setNotice(wasSaved ? "즐겨찾기에서 삭제했습니다" : "즐겨찾기에 추가했습니다");
  };

  const remove = (path: string) => {
    persist(items.filter((item) => item.path !== path));
    setNotice("즐겨찾기에서 삭제했습니다");
  };

  const clear = () => {
    persist([]);
    setNotice("즐겨찾기를 모두 삭제했습니다");
  };

  const pages = items
    .map((item) => getFavoritePage(item.path))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));

  return (
    <div className="favorites-header">
      {currentPage && (
        <button
          type="button"
          className="favorites-current"
          onClick={toggle}
          aria-pressed={saved.has(currentPath!)}
          aria-label={
            saved.has(currentPath!)
              ? "즐겨찾기 해제"
              : "즐겨찾기 추가"
          }
        >
          <span aria-hidden="true">{saved.has(currentPath!) ? "★" : "☆"}</span>
          <span>{saved.has(currentPath!) ? "즐겨찾기 해제" : "즐겨찾기 추가"}</span>
        </button>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="favorites-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="favorites-menu"
        aria-label="즐겨찾기 목록 열기"
      >
        <span aria-hidden="true">★</span>
        <span>즐겨찾기 목록{items.length ? ` (${items.length})` : ""}</span>
      </button>
      {open && (
        <div
          id="favorites-menu"
          className="favorites-menu"
          role="dialog"
          aria-label="즐겨찾기 목록"
        >
          <div className="favorites-menu__heading">
            <strong>저장한 페이지</strong>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="즐겨찾기 닫기"
            >
              ×
            </button>
          </div>
          {pages.length ? (
            <ul>
              {pages.map((page) => (
                <li key={page.path}>
                  <Link href={page.path} onClick={() => setOpen(false)}>
                    {page.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(page.path)}
                    aria-label={`${page.title} 삭제`}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="favorites-empty">저장된 즐겨찾기가 없습니다.</p>
          )}
          {pages.length > 0 && (
            <button type="button" className="favorites-clear" onClick={clear}>
              전체 삭제
            </button>
          )}
          <p className="favorites-live" aria-live="polite">
            {notice}
          </p>
        </div>
      )}
    </div>
  );
}
