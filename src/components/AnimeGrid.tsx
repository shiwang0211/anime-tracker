"use client";

import { useState } from "react";
import type { Anime } from "@/services/anime";
import { useWatchedAnime } from "@/hooks/useWatchedAnime";
import { AnimeCard } from "@/components/AnimeCard";

type Filter = "all" | "watched" | "unwatched";

const FILTER_LABELS: Record<Filter, string> = {
  all: "全部",
  watched: "已看",
  unwatched: "未看",
};

export function AnimeGrid({ animeList }: { animeList: Anime[] }) {
  const { watched, toggleWatched, setRating, setCompletionStatus, setEpisodeProgress } = useWatchedAnime();
  const [filter, setFilter] = useState<Filter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  // 功能3: 从 air_date 提取所有年份，降序排列
  const years = Array.from(
    new Set(
      animeList
        .map((a) => a.air_date?.slice(0, 4))
        .filter((y): y is string => Boolean(y))
    )
  ).sort((a, b) => b.localeCompare(a));

  const filtered = animeList.filter((anime) => {
    if (filter === "watched" && !watched[anime.id]?.watched) return false;
    if (filter === "unwatched" && watched[anime.id]?.watched) return false;
    if (yearFilter !== "all" && anime.air_date?.slice(0, 4) !== yearFilter) return false;
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

        {/* 功能3: 年份筛选下拉栏 */}
        {years.length > 0 && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="ml-auto bg-zinc-800 text-zinc-300 text-sm rounded-full px-3 py-1.5 border border-zinc-700 focus:outline-none focus:border-pink-500 cursor-pointer"
          >
            <option value="all">全部年份</option>
            {years.map((y) => (
              <option key={y} value={y}>{y} 年</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
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
