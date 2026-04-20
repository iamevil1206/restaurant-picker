import type { Restaurant } from "@/types/restaurant";
import { haversineMeters } from "./geo";

type NaverLocalItem = {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
};

type NaverLocalResponse = {
  items?: NaverLocalItem[];
};

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

function parseCoord(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  return n > 1e6 ? n / 1e7 : n;
}

export async function searchNaverLocal(
  keyword: string,
  center: { lat: number; lng: number },
): Promise<Restaurant[]> {
  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!id || !secret) return [];

  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("display", "5");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "comment");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": id,
      "X-Naver-Client-Secret": secret,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Naver local search failed: ${res.status}`);
  }
  const data: NaverLocalResponse = await res.json();
  const items = data.items ?? [];

  return items
    .map((item): Restaurant | null => {
      const lng = parseCoord(item.mapx);
      const lat = parseCoord(item.mapy);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const coord = { lat, lng };
      const distanceM = haversineMeters(center, coord);
      const name = stripTags(item.title);
      const id = `naver:${name}:${lat.toFixed(5)},${lng.toFixed(5)}`;
      return {
        id,
        name,
        category: item.category?.trim() || undefined,
        address: item.address?.trim() || undefined,
        roadAddress: item.roadAddress?.trim() || undefined,
        phone: item.telephone?.trim() || undefined,
        coord,
        distanceM,
        naverUrl: item.link || undefined,
        sources: ["naver"],
      };
    })
    .filter((x): x is Restaurant => x !== null);
}
