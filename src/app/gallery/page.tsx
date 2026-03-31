"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GalleryGrid } from "@/components/GalleryGrid";
import { GalleryListView } from "@/components/GalleryListView";
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

const WORKFLOW_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "flux-gguf", label: "Flux-schnell" },
  { value: "sd15", label: "SD1.5" },
];

const PAGE_SIZE = 20;

function getInitialViewMode(): "grid" | "list" {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("ai-design-studio:view-mode") as "grid" | "list") ?? "grid";
  }
  return "grid";
}

function getInitialGridSize(): "sm" | "md" | "lg" {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("ai-design-studio:grid-size") as "sm" | "md" | "lg") ?? "md";
  }
  return "md";
}

export default function GalleryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [viewMode, setViewMode] = useState<"grid" | "list">(getInitialViewMode);
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">(getInitialGridSize);

  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isFavoriteFilter, setIsFavoriteFilter] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("ai-design-studio:view-mode", mode);
  };

  const handleGridSizeChange = (size: "sm" | "md" | "lg") => {
    setGridSize(size);
    localStorage.setItem("ai-design-studio:grid-size", size);
  };

  const fetchGenerations = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const items = await listGenerations({
          search: debouncedSearch || undefined,
          templateId: templateFilter || undefined,
          workflow: workflowFilter || undefined,
          dateFilter: dateFilter || undefined,
          sort,
          limit: PAGE_SIZE,
          offset: currentOffset,
          tags: tagFilter.length > 0 ? tagFilter : undefined,
          isFavorite: isFavoriteFilter || undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, templateFilter, workflowFilter, dateFilter, sort, tagFilter, isFavoriteFilter, offset]
  );

  // Refetch on filter change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchGenerations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, templateFilter, workflowFilter, dateFilter, sort, tagFilter, isFavoriteFilter]);

  const handleLoadMore = () => {
    fetchGenerations(false);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const tag = tagInput.trim();
      if (!tagFilter.includes(tag)) {
        setTagFilter((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTagFilter((prev) => prev.filter((t) => t !== tag));
  };

  const selectStyle = {
    backgroundColor: "var(--color-bg-elevated)",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 10px",
    fontSize: "13px",
  };

  const viewBtnStyle = (active: boolean) => ({
    width: "32px",
    height: "32px",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: "var(--radius-sm)",
    border: "none",
    cursor: "pointer" as const,
    backgroundColor: active ? "var(--color-accent-muted)" : "transparent",
    color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
  });

  return (
    <div data-testid="gallery-page" className="min-h-screen p-6 flex flex-col gap-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          ギャラリー
        </h1>
        <div className="flex items-center gap-1">
          <button
            data-testid="view-toggle-grid"
            onClick={() => handleViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="グリッド表示"
            style={viewBtnStyle(viewMode === "grid")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            data-testid="view-toggle-list"
            onClick={() => handleViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="リスト表示"
            style={viewBtnStyle(viewMode === "list")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2.5" rx="1" />
              <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
              <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div data-testid="gallery-filter-bar" className="flex flex-col gap-3">
        {/* Search always visible */}
        <div className="flex gap-3 items-center">
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
          {/* Mobile filter toggle */}
          <button
            data-testid="gallery-filter-toggle"
            onClick={() => setFilterDrawerOpen((v) => !v)}
            className="md:hidden px-3 py-1.5 text-sm"
            style={selectStyle}
            aria-label="フィルターを絞り込む"
          >
            フィルター {filterDrawerOpen ? "▲" : "▼"}
          </button>
        </div>

        {/* Filter controls: inline on desktop, drawer on mobile */}
        <div
          data-testid="gallery-filter-drawer"
          aria-expanded={filterDrawerOpen}
          className="flex-wrap gap-3 items-center hidden md:flex"
          style={
            filterDrawerOpen
              ? { display: "flex" as const }
              : undefined
          }
        >
          {/* Workflow filter */}
          <select
            data-testid="gallery-workflow-filter"
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            style={selectStyle}
            aria-label="ワークフローでフィルター"
          >
            {WORKFLOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

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

          {/* Tag filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              data-testid="gallery-tag-filter"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="タグ (Enter で追加)"
              className="px-3 py-1.5 text-sm"
              style={{
                ...selectStyle,
                minWidth: "120px",
              }}
              aria-label="タグでフィルター"
            />
            {tagFilter.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded flex items-center gap-1"
                style={{
                  backgroundColor: "var(--color-accent-muted)",
                  color: "var(--color-accent)",
                }}
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  aria-label={`タグ「${tag}」を削除`}
                  style={{ color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Favorite filter */}
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--color-text-primary)" }}>
            <input
              type="checkbox"
              data-testid="gallery-favorite-filter"
              checked={isFavoriteFilter}
              onChange={(e) => setIsFavoriteFilter(e.target.checked)}
            />
            お気に入りのみ
          </label>

          {/* Grid size (grid mode only) */}
          {viewMode === "grid" && (
            <select
              data-testid="gallery-grid-size"
              value={gridSize}
              onChange={(e) => handleGridSizeChange(e.target.value as "sm" | "md" | "lg")}
              style={selectStyle}
              aria-label="グリッドサイズ"
            >
              <option value="sm">小</option>
              <option value="md">中</option>
              <option value="lg">大</option>
            </select>
          )}
        </div>
      </div>

      {/* Gallery */}
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
      ) : viewMode === "list" ? (
        <GalleryListView generations={generations} onCardClick={setSelectedGen} />
      ) : (
        <GalleryGrid
          generations={generations}
          onCardClick={setSelectedGen}
          gridSize={gridSize}
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
