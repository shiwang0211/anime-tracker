export interface Anime {
  id: number;
  title: string;
  image_url: string;
  score: number | null;
  air_date: string | null;
  weekday: string | null;
}

export type SeasonMonth = 1 | 4 | 7 | 10;

export function getCurrentSeason(): { year: number; month: SeasonMonth } {
  const now = new Date();
  const m = now.getMonth() + 1;
  const year = now.getFullYear();
  const month: SeasonMonth = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10;
  return { year, month };
}

interface BangumiImage {
  large: string;
  common: string;
  medium: string;
  small: string;
  grid: string;
}

interface BangumiSearchSubject {
  id: number;
  name: string;
  name_cn: string;
  images: BangumiImage;
  rating?: { rank: number; score: number; total: number };
  date: string;
  air_weekday?: number;
}

interface BangumiSearchResponse {
  total: number;
  limit: number;
  offset: number;
  data: BangumiSearchSubject[] | null;
}

const WEEKDAY_CN: Record<number, string> = {
  1: "周一", 2: "周二", 3: "周三", 4: "周四",
  5: "周五", 6: "周六", 7: "周日",
};

const SEASON_END: Record<SeasonMonth, string> = {
  1: "03-31", 4: "06-30", 7: "09-30", 10: "12-31",
};

const BANGUMI_HEADERS = {
  "User-Agent": "anime-tracker/1.0 (https://github.com/example/anime-tracker)",
  "Content-Type": "application/json",
  "Accept": "application/json",
};

const LIMIT = 50;

async function searchPage(
  startDate: string,
  endDate: string,
  offset: number,
  revalidate: number
): Promise<BangumiSearchResponse> {
  const res = await fetch(
    `https://api.bgm.tv/v0/search/subjects?limit=${LIMIT}&offset=${offset}`,
    {
      method: "POST",
      headers: BANGUMI_HEADERS,
      body: JSON.stringify({
        filter: {
          type: [2],
          air_date: [`>=${startDate}`, `<=${endDate}`],
          tag: ["日本"],
        },
        sort: "rank",
      }),
      next: { revalidate },
    }
  );
  if (!res.ok) throw new Error(`Bangumi API error: ${res.status}`);
  return res.json();
}

export async function fetchAnimeBySeason(year: number, month: SeasonMonth): Promise<Anime[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${SEASON_END[month]}`;
  const { year: currentYear, month: currentMonth } = getCurrentSeason();
  const isPast = year < currentYear || (year === currentYear && month < currentMonth);
  const revalidate = isPast ? 86400 : 3600;

  // First page to get total
  const firstPage = await searchPage(startDate, endDate, 0, revalidate);
  const results: BangumiSearchSubject[] = [...(firstPage.data ?? [])];
  const total = firstPage.total;

  // Remaining pages in parallel
  const remaining = Math.ceil((total - LIMIT) / LIMIT);
  if (remaining > 0) {
    const pages = await Promise.all(
      Array.from({ length: remaining }, (_, i) =>
        searchPage(startDate, endDate, (i + 1) * LIMIT, revalidate)
      )
    );
    for (const page of pages) {
      results.push(...(page.data ?? []));
    }
  }

  return results.map((item) => {
    let weekday: string | null = null;
    if (item.air_weekday && WEEKDAY_CN[item.air_weekday]) {
      weekday = WEEKDAY_CN[item.air_weekday];
    } else if (item.date) {
      const d = new Date(item.date);
      const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
      const mapped = day === 0 ? 7 : day;
      weekday = WEEKDAY_CN[mapped] ?? null;
    }
    return {
      id: item.id,
      title: item.name_cn || item.name,
      image_url: item.images?.large ?? "",
      score: item.rating?.score ?? null,
      air_date: item.date || null,
      weekday,
    };
  });
}
