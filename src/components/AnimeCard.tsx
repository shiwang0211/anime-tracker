"use client";

import Image from "next/image";
import { Star, Eye, EyeOff } from "lucide-react";

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
import type { Anime } from "@/services/anime";
import type { WatchEntry } from "@/hooks/useWatchedAnime";

interface AnimeCardProps {
  anime: Anime;
  entry: WatchEntry | undefined;
  onToggleWatched: (id: number) => void;
  onSetRating: (id: number, rating: number) => void;
  onSetCompletionStatus: (id: number, status: "completed" | "ongoing") => void;
  onSetEpisodeProgress: (id: number, ep: number | null) => void;
}

export function AnimeCard({ anime, entry, onToggleWatched, onSetRating, onSetCompletionStatus, onSetEpisodeProgress }: AnimeCardProps) {
  const isWatched = entry?.watched ?? false;
  const userRating = entry?.rating ?? null;
  const completionStatus = entry?.completionStatus ?? null;
  const episodeProgress = entry?.episodeProgress ?? null;

  // 封面底部：完结状态标签文字
  const completionBadge =
    completionStatus === "completed"
      ? "追完"
      : completionStatus === "ongoing" && episodeProgress !== null
      ? `第${episodeProgress}集`
      : null;

  return (
    <div className="group relative flex flex-col bg-zinc-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* 点击封面跳转 Bangumi 页面 */}
      <a
        href={`https://bgm.tv/subject/${anime.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-[3/4] w-full overflow-hidden block"
      >
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

        {/* 底部渐变条 — 已看按钮 + 用户评分 + 追剧进度 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent flex items-end flex-wrap gap-1 pb-2 px-2 pt-4">
          <button
            onClick={(e) => { e.preventDefault(); onToggleWatched(anime.id); }}
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
          {isWatched && userRating !== null && (
            <span className="text-xs text-green-400 bg-black/50 px-1.5 py-0.5 rounded-full">
              ★{userRating}
            </span>
          )}
          {isWatched && completionBadge && (
            <span className="text-xs text-zinc-300 bg-black/50 px-1.5 py-0.5 rounded-full">
              {completionBadge}
            </span>
          )}
        </div>
      </a>

      <div className="flex flex-col gap-1 p-3">
        <h2 className="text-white text-sm font-semibold leading-tight line-clamp-2">
          {anime.title}
        </h2>

        {/* 开播时间 + 放送星期 */}
        {(anime.air_date || anime.weekday) && (
          <span className="text-zinc-500 text-xs mt-1">
            {anime.air_date && `${anime.air_date} 开播`}
            {anime.weekday && <span className="text-zinc-600"> · {anime.weekday}放送</span>}
          </span>
        )}

        {/* 已看后显示：用户评分（十分制，绿色）+ 追剧进度 */}
        {isWatched && (
          <>
            {/* 用户评分 */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-zinc-500 text-xs">用户评分</span>
              <select
                value={userRating ?? ""}
                onChange={(e) => onSetRating(anime.id, parseInt(e.target.value))}
                className="bg-zinc-800 text-green-400 text-xs rounded px-1.5 py-0.5 border-none focus:outline-none cursor-pointer"
              >
                <option value="" disabled>-</option>
                {RATING_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {userRating !== null && (
                <span className="text-zinc-500 text-xs">/10</span>
              )}
            </div>

            {/* 追剧进度：已追完 / 未追完 */}
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => onSetCompletionStatus(anime.id, "completed")}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  completionStatus === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                追完
              </button>
              <button
                onClick={() => onSetCompletionStatus(anime.id, "ongoing")}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  completionStatus === "ongoing"
                    ? "bg-zinc-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                在追
              </button>
              {completionStatus === "ongoing" && (
                <>
                  <span className="text-zinc-500 text-xs">第</span>
                  <input
                    type="number"
                    min={0}
                    value={episodeProgress ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onSetEpisodeProgress(anime.id, val === "" ? null : Math.max(0, parseInt(val)));
                    }}
                    className="w-10 bg-zinc-800 text-white text-xs rounded px-1.5 py-0.5 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="?"
                  />
                  <span className="text-zinc-500 text-xs">集</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
