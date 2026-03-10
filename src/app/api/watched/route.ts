import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import type { WatchedMap } from "@/hooks/useWatchedAnime";

const KEY = "watched";

export async function GET() {
  const data = await redis.get<WatchedMap>(KEY);
  return NextResponse.json(data ?? {});
}

export async function PUT(request: NextRequest) {
  const body: WatchedMap = await request.json();
  await redis.set(KEY, body);
  return NextResponse.json({ ok: true });
}
