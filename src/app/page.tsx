import { fetchCurrentSeasonAnime } from "@/services/anime";
import { AnimeGrid } from "@/components/AnimeGrid";

export default async function Home() {
  let animeList = [];
  let error: string | null = null;

  try {
    animeList = await fetchCurrentSeasonAnime();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch anime";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-pink-500">上海石头</span>的二次元小站
        </h1>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        {error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : (
          <AnimeGrid animeList={animeList} />
        )}
      </main>
    </div>
  );
}
