"use client";

import { useState } from "react";
import type { Anime, SeasonMonth } from "@/services/anime";
import { useWatchedAnime } from "@/hooks/useWatchedAnime";
import { AnimeCard } from "@/components/AnimeCard";

type Filter = "all" | "watched" | "wantToWatch";

const FILTER_LABELS: Record<Filter, string> = {
  all: "全部",
  watched: "已看",
  wantToWatch: "想看",
};

function cacheKey(year: number, month: SeasonMonth) {
  return `${year}-${month}`;
}

interface AnimeGridProps {
  initialAnimeList: Anime[];
  initialYear: number;
  initialMonth: SeasonMonth;
}

export function AnimeGrid({ initialAnimeList, initialYear, initialMonth }: AnimeGridProps) {
  const { watched, toggleWatched, setRating, setCompletionStatus, setEpisodeProgress } = useWatchedAnime();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<SeasonMonth>(initialMonth);
  const [seasonCache, setSeasonCache] = useState<Record<string, Anime[]>>({
    [cacheKey(initialYear, initialMonth)]: initialAnimeList,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentYear = new Date().getFullYear();

  // 生成年份+季度合并选项，从最新到最早
  const seasonOptions: { year: number; month: SeasonMonth; label: string }[] = [];
  const seasonMonths: SeasonMonth[] = [10, 7, 4, 1];
  for (let y = currentYear; y >= currentYear - 4; y--) {
    for (const m of seasonMonths) {
      seasonOptions.push({ year: y, month: m, label: `${y}年${m}月番` });
    }
  }

  async function loadSeason(year: number, month: SeasonMonth) {
    const key = cacheKey(year, month);
    setSelectedYear(year);
    setSelectedMonth(month);
    setFetchError(null);

    if (seasonCache[key] !== undefined) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/anime?year=${year}&month=${month}`);
      if (!res.ok) throw new Error(`加载失败 (${res.status})`);
      const data: Anime[] = await res.json();
      setSeasonCache((prev) => ({ ...prev, [key]: data }));
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    const q = searchInput.trim();
    if (q === "") return;
    setSearchQuery(q);
  }

  function handleClear() {
    setSearchInput("");
    setSearchQuery("");
  }

  const currentList = seasonCache[cacheKey(selectedYear, selectedMonth)] ?? [];

  const filtered = currentList
    .filter((anime) => {
      if (!anime.image_url || anime.score === 0 || !anime.air_date) return false;
      if (filter === "watched" && !watched[anime.id]?.watched) return false;
      if (filter === "wantToWatch" && !watched[anime.id]?.wantToWatch) return false;
      if (searchQuery && !anime.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* 观看状态筛选 */}
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-pink-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}

        {/* 搜索栏 */}
        <div className="flex gap-1 flex-1 min-w-0 mx-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="输入作品名"
              className="w-full bg-zinc-800 text-white text-sm rounded-full pl-4 pr-8 py-1.5 border border-zinc-700 placeholder-zinc-600 focus:outline-none focus:border-pink-500"
            />
            {searchInput && (
              <button
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                aria-label="清空搜索"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="bg-zinc-800 text-zinc-300 text-sm rounded-full px-3 py-1.5 border border-zinc-700 hover:text-white hover:border-pink-500 transition-colors whitespace-nowrap"
          >
            搜索
          </button>
        </div>

        {/* 年份+季度 合并下拉栏 */}
        <div className="ml-auto">
          <select
            value={cacheKey(selectedYear, selectedMonth)}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              loadSeason(y, m as SeasonMonth);
            }}
            disabled={isLoading}
            className="bg-zinc-800 text-zinc-300 text-sm rounded-full px-3 py-1.5 border border-zinc-700 focus:outline-none focus:border-pink-500 cursor-pointer disabled:opacity-50"
          >
            {seasonOptions.map(({ year, month, label }) => (
              <option key={`${year}-${month}`} value={`${year}-${month}`}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
          加载中...
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-red-400 text-sm">{fetchError}</p>
          <button
            onClick={() => {
              const key = cacheKey(selectedYear, selectedMonth);
              setSeasonCache((prev) => { const next = { ...prev }; delete next[key]; return next; });
              loadSeason(selectedYear, selectedMonth);
            }}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-800 rounded-full"
          >
            重试
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
          {filter === "watched" ? "还没有标记已看的动漫" : filter === "wantToWatch" ? "还没有标记想看的动漫" : "没有符合条件的动漫"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              entry={watched[anime.id]}
              onToggleWatched={toggleWatched}
              onSetRating={setRating}
              onSetCompletionStatus={setCompletionStatus}
              onSetEpisodeProgress={setEpisodeProgress}
            />
          ))}
        </div>
      )}
    </>
  );
}
