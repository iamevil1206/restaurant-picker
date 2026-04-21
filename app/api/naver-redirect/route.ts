import { NextResponse } from "next/server";
import { searchNaverLocal } from "@/lib/naverApi";

export const runtime = "nodejs";

function mapUrl(q: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  const district = searchParams.get("district")?.trim() || "";
  if (!name) {
    return new NextResponse("name required", { status: 400 });
  }

  let hasHits = false;
  try {
    const items = await searchNaverLocal(name, { lat: 37.5, lng: 127 });
    hasHits = items.length > 0;
  } catch {
    // treat as "no hits" — we'll fall back to district-prefixed query
  }

  const target =
    hasHits || !district ? mapUrl(name) : mapUrl(`${district} ${name}`);
  return NextResponse.redirect(target, 302);
}
