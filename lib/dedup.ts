import type { Restaurant } from "@/types/restaurant";
import { haversineMeters } from "./geo";

const STRIP_RE = /(본점|지점|\d+호점|점$|\s+)/g;
const BRACKETS_RE = /\([^)]*\)|\[[^\]]*\]/g;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(BRACKETS_RE, "")
    .replace(STRIP_RE, "")
    .trim();
}

// Dice coefficient on bigrams — Korean-friendly enough for short names
function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const ba = bigrams(a);
  const bb = bigrams(b);
  let overlap = 0;
  for (const g of ba) if (bb.has(g)) overlap++;
  return (2 * overlap) / (ba.size + bb.size);
}

export function dedup(list: Restaurant[]): Restaurant[] {
  const groups: Restaurant[][] = [];
  const seen = new Set<number>();

  for (let i = 0; i < list.length; i++) {
    if (seen.has(i)) continue;
    const group = [list[i]];
    seen.add(i);
    const nameI = normalizeName(list[i].name);
    for (let j = i + 1; j < list.length; j++) {
      if (seen.has(j)) continue;
      const d = haversineMeters(list[i].coord, list[j].coord);
      if (d > 30) continue;
      const sim = diceSimilarity(nameI, normalizeName(list[j].name));
      if (sim >= 0.7) {
        group.push(list[j]);
        seen.add(j);
      }
    }
    groups.push(group);
  }

  return groups.map(merge);
}

function pickFirstDefined<T>(values: (T | undefined)[]): T | undefined {
  for (const v of values) if (v !== undefined && v !== null) return v;
  return undefined;
}

function merge(group: Restaurant[]): Restaurant {
  const naverEntry = group.find((r) => r.sources.includes("naver"));
  const googleEntry = group.find((r) => r.sources.includes("google"));
  const kakaoEntry = group.find((r) => r.sources.includes("kakao"));

  const primary = kakaoEntry ?? naverEntry ?? googleEntry ?? group[0];
  const sources = Array.from(
    new Set(group.flatMap((r) => r.sources)),
  ) as Restaurant["sources"];

  return {
    id: group.length === 1 ? primary.id : `merged:${primary.id}`,
    name: primary.name,
    category: pickFirstDefined([
      kakaoEntry?.category,
      naverEntry?.category,
      googleEntry?.category,
    ]),
    address: pickFirstDefined([
      kakaoEntry?.address,
      naverEntry?.address,
      googleEntry?.address,
    ]),
    roadAddress: pickFirstDefined([
      kakaoEntry?.roadAddress,
      naverEntry?.roadAddress,
      googleEntry?.roadAddress,
    ]),
    phone: pickFirstDefined([
      kakaoEntry?.phone,
      naverEntry?.phone,
      googleEntry?.phone,
    ]),
    coord: primary.coord,
    distanceM: Math.min(
      ...group.map((r) => r.distanceM ?? Number.POSITIVE_INFINITY),
    ),
    priceLevel: pickFirstDefined([
      googleEntry?.priceLevel,
      kakaoEntry?.priceLevel,
      naverEntry?.priceLevel,
    ]),
    rating: googleEntry?.rating,
    userRatingCount: googleEntry?.userRatingCount,
    openNow: googleEntry?.openNow,
    naverPlaceId: naverEntry?.naverPlaceId,
    googlePlaceId: googleEntry?.googlePlaceId,
    kakaoPlaceId: kakaoEntry?.kakaoPlaceId,
    naverUrl: naverEntry?.naverUrl,
    googleUrl: googleEntry?.googleUrl,
    kakaoUrl: kakaoEntry?.kakaoUrl,
    sources: group.length > 1 ? ["merged"] : sources,
  };
}
