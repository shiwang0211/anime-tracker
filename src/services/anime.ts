export interface Anime {
  id: number;
  title: string;
  image_url: string;
  score: number | null;
  air_date: string | null;
  weekday: string | null;
}

interface BangumiImage {
  large: string;
  common: string;
  medium: string;
  small: string;
  grid: string;
}

interface BangumiRating {
  total: number;
  score: number;
}

interface BangumiCalendarItem {
  id: number;
  name: string;
  name_cn: string;
  images: BangumiImage;
  rating?: BangumiRating;
  air_date: string;
}

interface BangumiCalendarEntry {
  weekday: { cn: string; id: number };
  items: BangumiCalendarItem[];
}

interface BangumiTag {
  name: string;
  count: number;
}

interface BangumiSubjectDetail {
  tags: BangumiTag[];
}

async function fetchSubjectTags(id: number): Promise<BangumiTag[]> {
  try {
    const res = await fetch(`https://api.bgm.tv/v0/subjects/${id}`, {
      headers: {
        "User-Agent": "anime-tracker/1.0 (https://github.com/example/anime-tracker)",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data: BangumiSubjectDetail = await res.json();
    return data.tags ?? [];
  } catch {
    return [];
  }
}

export async function fetchCurrentSeasonAnime(): Promise<Anime[]> {
  const res = await fetch("https://api.bgm.tv/calendar", {
    headers: {
      "User-Agent": "anime-tracker/1.0 (https://github.com/example/anime-tracker)",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Bangumi API error: ${res.status}`);
  }

  const calendar: BangumiCalendarEntry[] = await res.json();

  // Deduplicate by ID, preserving weekday info
  const seen = new Set<number>();
  const itemsWithWeekday: Array<{ item: BangumiCalendarItem; weekday: string }> = [];
  for (const entry of calendar) {
    for (const item of entry.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        itemsWithWeekday.push({ item, weekday: entry.weekday.cn });
      }
    }
  }

  // Fetch tags for all items in parallel
  const allTags = await Promise.all(itemsWithWeekday.map(({ item }) => fetchSubjectTags(item.id)));

  // Filter Japanese only, exclude 2008 and earlier, sort by score descending
  return itemsWithWeekday
    .map(({ item, weekday }, i) => {
      const tags = allTags[i];
      const isJapanese = tags.some((t) => t.name === "日本");
      return { item, weekday, isJapanese };
    })
    .filter(({ isJapanese, item }) => {
      if (!isJapanese) return false;
      const year = item.air_date ? parseInt(item.air_date.slice(0, 4)) : null;
      if (year !== null && year <= 2008) return false;
      return true;
    })
    .sort((a, b) => (b.item.rating?.score ?? 0) - (a.item.rating?.score ?? 0))
    .map(({ item, weekday }) => ({
      id: item.id,
      title: item.name_cn || item.name,
      image_url: item.images.large,
      score: item.rating?.score ?? null,
      air_date: item.air_date || null,
      weekday: weekday,
    }));
}
