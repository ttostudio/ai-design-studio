"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStatus } from "@/lib/api";
import type { StatusResponse } from "@/lib/api";

const NAV_LINKS = [
  { href: "/", label: "生成" },
  { href: "/gallery", label: "ギャラリー" },
  { href: "/templates", label: "テンプレート" },
];

export function Navbar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusResponse>({ available: false, connection: "unknown" });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getStatus().then(setStatus).catch(() => {});
    const interval = setInterval(() => {
      getStatus().then(setStatus).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status.connection === "online";

  return (
    <>
      <nav
        data-testid="navbar"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          data-testid="navbar-logo"
          className="font-semibold text-base"
          style={{ color: "var(--color-accent)" }}
        >
          AI Design Studio
        </Link>

        {/* Desktop nav links */}
        <div data-testid="navbar-links" className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`navbar-link-${link.label}`}
                className="text-sm transition-colors"
                style={{
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  borderBottom: isActive ? `2px solid var(--color-accent)` : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: status + hamburger */}
        <div className="flex items-center gap-4">
          {/* ComfyUI status badge */}
          <div
            data-testid="comfyui-status-badge"
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: isOnline ? "var(--color-success)" : "var(--color-error)" }}
              aria-hidden="true"
            />
            <span>{isOnline ? "接続中" : "オフライン"}</span>
          </div>

          {/* Hamburger menu (mobile) */}
          <button
            data-testid="navbar-hamburger"
            className="md:hidden p-1"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{ color: "var(--color-text-secondary)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {menuOpen ? (
                <path d="M4 4l12 12M4 16L16 4" stroke="currentColor" strokeWidth="2" fill="none" />
              ) : (
                <>
                  <rect y="4" width="20" height="2" rx="1" />
                  <rect y="9" width="20" height="2" rx="1" />
                  <rect y="14" width="20" height="2" rx="1" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          data-testid="navbar-mobile-menu"
          className="fixed top-14 left-0 right-0 z-40 md:hidden flex flex-col"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-6 py-3 text-sm"
                style={{
                  color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                  borderLeft: isActive ? `3px solid var(--color-accent)` : "3px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && status.connection !== "unknown" && (
        <div
          data-testid="offline-banner"
          className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center h-10 text-sm"
          style={{
            backgroundColor: "rgba(224, 82, 82, 0.1)",
            color: "var(--color-error)",
            borderBottom: "1px solid rgba(224, 82, 82, 0.2)",
          }}
          role="alert"
          aria-live="polite"
        >
          ⚠️ ComfyUI に接続できません。サービスの起動を確認してください。
        </div>
      )}
    </>
  );
}
