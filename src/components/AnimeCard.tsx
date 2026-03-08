"use client";

import Image from "next/image";
import { Star, Eye, EyeOff } from "lucide-react";
import type { Anime } from "@/services/anime";
import type { WatchEntry } from "@/hooks/useWatchedAnime";

interface AnimeCardProps {
  anime: Anime;
  entry: WatchEntry | undefined;
  onToggleWatched: (id: number) => void;
  onSetRating: (id: number, rating: number) => void;
}

export function AnimeCard({ anime, entry, onToggleWatched, onSetRating }: AnimeCardProps) {
  const isWatched = entry?.watched ?? false;
  const userRating = entry?.rating ?? null;

  return (
    <div className="group relative flex flex-col bg-zinc-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={anime.image_url}
          alt={anime.title}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:brightness-75 transition-all duration-300"
        />

        {/* Bangumi score */}
        {anime.score !== null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
            <Star size={11} fill="currentColor" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {/* Bottom gradient overlay with watched toggle — always visible */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/70 to-transparent flex items-end pb-2 px-2">
          <button
            onClick={() => onToggleWatched(anime.id)}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
              isWatched
                ? "bg-pink-500 text-white"
                : "bg-black/50 text-zinc-300 hover:bg-white/20 hover:text-white"
            }`}
            title={isWatched ? "取消已看" : "标记为已看"}
          >
            {isWatched ? <Eye size={11} /> : <EyeOff size={11} />}
            {isWatched ? "已看" : "未看"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h2 className="text-white text-sm font-semibold leading-tight line-clamp-2">
          {anime.title}
        </h2>

        {/* Air date and tags */}
        <div className="flex flex-col gap-1 mt-1">
          {anime.air_date && (
            <span className="text-zinc-500 text-xs">{anime.air_date} 开播</span>
          )}
          {anime.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* User rating — only visible when watched */}
        {isWatched && (
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onSetRating(anime.id, star)}
                className="text-zinc-600 hover:text-yellow-400 transition-colors"
              >
                <Star
                  size={14}
                  fill={userRating !== null && star <= userRating ? "currentColor" : "none"}
                  className={userRating !== null && star <= userRating ? "text-yellow-400" : ""}
                />
              </button>
            ))}
            {userRating !== null && (
              <span className="text-zinc-500 text-xs ml-1">{userRating}/5</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
