"use client";

import { useState } from "react";
import type { Anime, SeasonMonth } from "@/services/anime";
import { useWatchedAnime } from "@/hooks/useWatchedAnime";
import { AnimeCard } from "@/components/AnimeCard";

type Filter = "all" | "watched";

const FILTER_LABELS: Record<Filter, string> = {
  all: "全部",
  watched: "已看",
};

const SEASON_MONTHS: SeasonMonth[] = [1, 4, 7, 10];
const SEASON_LABELS: Record<SeasonMonth, string> = {
  1: "1 月番", 4: "4 月番", 7: "7 月番", 10: "10 月番",
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

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

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

  const currentList = seasonCache[cacheKey(selectedYear, selectedMonth)] ?? [];

  const filtered = currentList.filter((anime) => {
    if (filter === "watched" && !watched[anime.id]?.watched) return false;
    return true;
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

        {/* 年份 + 季度 下拉栏 */}
        <div className="ml-auto flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => loadSeason(parseInt(e.target.value), selectedMonth)}
            disabled={isLoading}
            className="bg-zinc-800 text-zinc-300 text-sm rounded-full px-3 py-1.5 border border-zinc-700 focus:outline-none focus:border-pink-500 cursor-pointer disabled:opacity-50"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => loadSeason(selectedYear, parseInt(e.target.value) as SeasonMonth)}
            disabled={isLoading}
            className="bg-zinc-800 text-zinc-300 text-sm rounded-full px-3 py-1.5 border border-zinc-700 focus:outline-none focus:border-pink-500 cursor-pointer disabled:opacity-50"
          >
            {SEASON_MONTHS.map((m) => (
              <option key={m} value={m}>{SEASON_LABELS[m]}</option>
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
          {filter === "watched" ? "还没有标记已看的动漫" : "没有符合条件的动漫"}
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
