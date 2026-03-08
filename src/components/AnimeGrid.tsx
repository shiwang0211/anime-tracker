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
  const { watched, toggleWatched, setRating } = useWatchedAnime();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = animeList.filter((anime) => {
    if (filter === "watched") return watched[anime.id]?.watched;
    if (filter === "unwatched") return !watched[anime.id]?.watched;
    return true;
  });

  return (
    <>
      <div className="flex gap-2 mb-6">
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
            />
          ))}
        </div>
      )}
    </>
  );
}
