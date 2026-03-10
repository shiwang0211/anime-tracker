import { NextRequest, NextResponse } from "next/server";
import { fetchAnimeBySeason, type SeasonMonth } from "@/services/anime";

const VALID_MONTHS = new Set([1, 4, 7, 10]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const year = parseInt(params.get("year") ?? "");
  const month = parseInt(params.get("month") ?? "");

  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < 2009 || year > currentYear) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (!VALID_MONTHS.has(month)) {
    return NextResponse.json({ error: "Invalid month (must be 1, 4, 7, or 10)" }, { status: 400 });
  }

  try {
    const anime = await fetchAnimeBySeason(year, month as SeasonMonth);
    return NextResponse.json(anime);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
