"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GalleryGrid } from "@/components/GalleryGrid";
import { ImageDetailModal } from "@/components/ImageDetailModal";
import { listGenerations } from "@/lib/api";
import type { Generation } from "@/lib/api";

const TEMPLATE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "blog-thumbnail", label: "ブログサムネイル" },
  { value: "sns-post", label: "SNS投稿画像" },
  { value: "icon", label: "アイコン" },
  { value: "illustration", label: "イラスト" },
  { value: "custom", label: "カスタム" },
];

const DATE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "month", label: "今月" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

const PAGE_SIZE = 20;

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  const fetchGenerations = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const items = await listGenerations({
          search: debouncedSearch || undefined,
          templateId: templateFilter || undefined,
          dateFilter: dateFilter || undefined,
          sort,
          limit: PAGE_SIZE,
          offset: currentOffset,
        });
        if (reset) {
          setGenerations(items);
          setOffset(items.length);
        } else {
          setGenerations((prev) => [...prev, ...items]);
          setOffset((prev) => prev + items.length);
        }
        setHasMore(items.length === PAGE_SIZE);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, templateFilter, dateFilter, sort, offset]
  );

  // Refetch on filter change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchGenerations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, templateFilter, dateFilter, sort]);

  const handleLoadMore = () => {
    fetchGenerations(false);
  };

  const selectStyle = {
    backgroundColor: "var(--color-bg-elevated)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 10px",
    fontSize: "13px",
  };

  return (
    <div data-testid="gallery-page" className="min-h-screen p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
        ギャラリー
      </h1>

      {/* Filter bar */}
      <div
        data-testid="gallery-filter-bar"
        className="flex flex-wrap gap-3 items-center"
      >
        {/* Search */}
        <input
          data-testid="gallery-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="プロンプトで検索"
          className="flex-1 min-w-40 px-3 py-1.5 text-sm"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
          }}
          aria-label="プロンプトで検索"
        />

        {/* Template filter */}
        <select
          data-testid="gallery-template-filter"
          value={templateFilter}
          onChange={(e) => setTemplateFilter(e.target.value)}
          style={selectStyle}
          aria-label="テンプレートでフィルター"
        >
          {TEMPLATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Date filter */}
        <select
          data-testid="gallery-date-filter"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={selectStyle}
          aria-label="日付でフィルター"
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          data-testid="gallery-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={selectStyle}
          aria-label="並び替え"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading && generations.length === 0 ? (
        <div
          data-testid="gallery-loading"
          className="flex items-center justify-center py-20"
        >
          <div
            className="animate-spin w-8 h-8 rounded-full"
            style={{
              border: "2px solid var(--color-border)",
              borderTopColor: "var(--color-accent)",
            }}
            aria-label="読み込み中"
          />
        </div>
      ) : (
        <GalleryGrid
          generations={generations}
          onCardClick={setSelectedGen}
        />
      )}

      {/* Load more */}
      {hasMore && generations.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            data-testid="gallery-load-more"
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded text-sm transition-colors"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: loading ? "var(--color-text-disabled)" : "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {loading ? "読み込み中..." : "もっと読み込む"}
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedGen && (
        <ImageDetailModal
          generation={selectedGen}
          onClose={() => setSelectedGen(null)}
        />
      )}
    </div>
  );
}
