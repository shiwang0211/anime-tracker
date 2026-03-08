export interface Anime {
  id: number;
  title: string;
  image_url: string;
  score: number | null;
  air_date: string | null;
  tags: string[];
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

const EXCLUDED_TAGS = new Set(["TV", "日本"]);

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

  // Deduplicate by ID
  const seen = new Set<number>();
  const items = calendar.flatMap((entry) => entry.items).filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Fetch tags for all items in parallel
  const allTags = await Promise.all(items.map((item) => fetchSubjectTags(item.id)));

  // Filter Japanese only, then sort by score descending
  return items
    .map((item, i) => {
      const tags = allTags[i];
      const isJapanese = tags.some((t) => t.name === "日本");
      const displayTags = tags
        .filter((t) => !EXCLUDED_TAGS.has(t.name))
        .slice(0, 3)
        .map((t) => t.name);
      return { item, tags, isJapanese, displayTags };
    })
    .filter(({ isJapanese }) => isJapanese)
    .sort((a, b) => (b.item.rating?.score ?? 0) - (a.item.rating?.score ?? 0))
    .map(({ item, displayTags }) => ({
      id: item.id,
      title: item.name_cn || item.name,
      image_url: item.images.large,
      score: item.rating?.score ?? null,
      air_date: item.air_date || null,
      tags: displayTags,
    }));
}
