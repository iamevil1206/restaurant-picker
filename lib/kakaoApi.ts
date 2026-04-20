import type { Restaurant } from "@/types/restaurant";

type KakaoDocument = {
  id: string;
  place_name: string;
  category_name?: string;
  category_group_code?: string;
  category_group_name?: string;
  phone?: string;
  address_name?: string;
  road_address_name?: string;
  x: string;
  y: string;
  place_url?: string;
  distance?: string;
};

type KakaoResponse = {
  documents?: KakaoDocument[];
  meta?: { total_count?: number };
};

export async function searchKakaoLocal(
  keyword: string,
  center: { lat: number; lng: number },
  radiusM: number,
  opts: { categoryGroupCode?: "FD6" | "CE7" } = {},
): Promise<Restaurant[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return [];

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("x", String(center.lng));
  url.searchParams.set("y", String(center.lat));
  url.searchParams.set("radius", String(Math.min(radiusM, 20000)));
  url.searchParams.set("size", "15");
  url.searchParams.set("sort", "distance");
  if (opts.categoryGroupCode) {
    url.searchParams.set("category_group_code", opts.categoryGroupCode);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${key.trim()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kakao local failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data: KakaoResponse = await res.json();
  const docs = data.documents ?? [];

  return docs
    .map((d): Restaurant | null => {
      const lng = Number(d.x);
      const lat = Number(d.y);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const distanceM = d.distance ? Number(d.distance) : undefined;
      return {
        id: `kakao:${d.id}`,
        name: d.place_name,
        category: d.category_name || d.category_group_name || undefined,
        address: d.address_name,
        roadAddress: d.road_address_name,
        phone: d.phone,
        coord: { lat, lng },
        distanceM,
        kakaoPlaceId: d.id,
        kakaoUrl: d.place_url,
        sources: ["kakao"],
      };
    })
    .filter((x): x is Restaurant => x !== null);
}
