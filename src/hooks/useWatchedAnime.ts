"use client";

import { useState, useEffect } from "react";

export interface WatchEntry {
  watched: boolean;
  rating: number | null;
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

function save(data: WatchedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useWatchedAnime() {
  const [watched, setWatched] = useState<WatchedMap>({});

  useEffect(() => {
    setWatched(load());
  }, []);

  function toggleWatched(id: number) {
    setWatched((prev) => {
      const current = prev[id];
      const next = current?.watched
        ? { ...current, watched: false, rating: null }
        : { watched: true, rating: null };
      const updated = { ...prev, [id]: next };
      save(updated);
      return updated;
    });
  }

  function setRating(id: number, rating: number) {
    setWatched((prev) => {
      const updated = {
        ...prev,
        [id]: { watched: true, rating },
      };
      save(updated);
      return updated;
    });
  }

  return { watched, toggleWatched, setRating };
}
