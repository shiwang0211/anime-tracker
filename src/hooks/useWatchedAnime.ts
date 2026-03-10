"use client";

import { useState, useEffect } from "react";

export interface WatchEntry {
  watched: boolean;
  rating: number | null;
  completionStatus: "completed" | "ongoing" | null;
  episodeProgress: number | null;
}

export type WatchedMap = Record<number, WatchEntry>;

const STORAGE_KEY = "anime-tracker-watched";

function load(): WatchedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocal(data: WatchedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function syncToServer(data: WatchedMap) {
  fetch("/api/watched", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

export function useWatchedAnime() {
  const [watched, setWatched] = useState<WatchedMap>({});

  useEffect(() => {
    // 优先从服务端加载，服务端无数据则尝试上传本地数据
    fetch("/api/watched")
      .then((r) => r.json())
      .then((serverData: WatchedMap) => {
        if (Object.keys(serverData).length > 0) {
          setWatched(serverData);
          saveLocal(serverData);
        } else {
          const localData = load();
          setWatched(localData);
          if (Object.keys(localData).length > 0) {
            syncToServer(localData); // 将本地历史数据迁移到服务端
          }
        }
      })
      .catch(() => {
        setWatched(load()); // 服务端不可用时降级到本地
      });
  }, []);

  function persist(updated: WatchedMap) {
    saveLocal(updated);
    syncToServer(updated);
  }

  function toggleWatched(id: number) {
    setWatched((prev) => {
      const current = prev[id];
      const next = current?.watched
        ? { ...current, watched: false, rating: null, completionStatus: null, episodeProgress: null }
        : { watched: true, rating: null, completionStatus: null, episodeProgress: null };
      const updated = { ...prev, [id]: next };
      persist(updated);
      return updated;
    });
  }

  function setRating(id: number, rating: number) {
    setWatched((prev) => {
      const current = prev[id];
      const updated = { ...prev, [id]: { ...current, watched: true, rating } };
      persist(updated);
      return updated;
    });
  }

  function setCompletionStatus(id: number, status: "completed" | "ongoing") {
    setWatched((prev) => {
      const current = prev[id];
      const updated = {
        ...prev,
        [id]: {
          ...current,
          watched: true,
          completionStatus: status,
          episodeProgress: status === "completed" ? null : current?.episodeProgress ?? null,
        },
      };
      persist(updated);
      return updated;
    });
  }

  function setEpisodeProgress(id: number, ep: number | null) {
    setWatched((prev) => {
      const current = prev[id];
      const updated = { ...prev, [id]: { ...current, watched: true, episodeProgress: ep } };
      persist(updated);
      return updated;
    });
  }

  return { watched, toggleWatched, setRating, setCompletionStatus, setEpisodeProgress };
}
