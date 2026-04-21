import { NextResponse } from "next/server";
import type { SearchInput, SearchResponse, Restaurant } from "@/types/restaurant";
import { getSubtreeHints, getNode, getMoodKind, type MoodKind } from "@/lib/categories";
import { searchNaverLocal } from "@/lib/naverApi";
import { searchGoogleText, searchGoogleNearby } from "@/lib/googleApi";
import { searchKakaoLocal } from "@/lib/kakaoApi";
import { dedup } from "@/lib/dedup";
import { filterRestaurantsByMood } from "@/lib/moodFilter";

export const runtime = "nodejs";

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validate(body: unknown): SearchInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "body required" };
  const b = body as Record<string, unknown>;
  if (!isNumber(b.lat) || !isNumber(b.lng)) return { error: "lat/lng required" };
  if (!isNumber(b.radiusM) || b.radiusM <= 0 || b.radiusM > 5000)
    return { error: "radiusM must be 0~5000" };
  if (!Array.isArray(b.categoryLeafIds))
    return { error: "categoryLeafIds required" };
  return {
    lat: b.lat,
    lng: b.lng,
    radiusM: b.radiusM,
    priceMin: isNumber(b.priceMin) ? b.priceMin : undefined,
    priceMax: isNumber(b.priceMax) ? b.priceMax : undefined,
    categoryLeafIds: b.categoryLeafIds as string[],
    includeUnknownPrice: b.includeUnknownPrice === true,
    sort: b.sort === "rating" ? "rating" : "distance",
    district: typeof b.district === "string" ? b.district : null,
  };
}

function getKakaoGroupCode(
  leafIds: string[],
): "FD6" | "CE7" | undefined {
  let hasRestaurant = false;
  let hasCafe = false;
  for (const id of leafIds) {
    const node = getNode(id);
    if (!node) continue;
    if (id.startsWith("cf-") || id === "cafe") hasCafe = true;
    else hasRestaurant = true;
  }
  if (hasRestaurant && !hasCafe) return "FD6";
  if (hasCafe && !hasRestaurant) return "CE7";
  return undefined;
}

const CUISINE_FILTER_MAP: Array<{
  match: (id: string) => boolean;
  patterns: string[];
}> = [
  {
    match: (id) => id === "korean" || id.startsWith("kr-"),
    patterns: ["한식", "분식"],
  },
  {
    match: (id) => id === "chinese" || id.startsWith("cn-"),
    patterns: ["중식", "중국", "대만"],
  },
  {
    match: (id) => id === "japanese" || id.startsWith("jp-"),
    patterns: ["일식", "일본"],
  },
  {
    match: (id) => id === "western" || id.startsWith("w-"),
    patterns: ["양식", "이탈리아", "프랑스", "스페인", "스테이크", "지중해", "브런치"],
  },
  {
    match: (id) => id === "sea" || id.startsWith("sea-"),
    patterns: ["동남아", "베트남", "태국", "말레이", "인도네시아", "필리핀", "아시안"],
  },
  {
    match: (id) => id === "indian" || id.startsWith("in-"),
    patterns: ["인도"],
  },
  {
    match: (id) => id === "me" || id.startsWith("me-"),
    patterns: ["중동", "터키", "튀르키예", "이란", "페르시아"],
  },
  {
    match: (id) => id === "latin" || id.startsWith("la-"),
    patterns: ["중남미", "멕시코", "브라질", "페루", "남미", "아르헨티나"],
  },
  {
    match: (id) => id === "africa" || id.startsWith("af-"),
    patterns: ["아프리카"],
  },
  {
    match: (id) => id === "cafe" || id.startsWith("cf-"),
    patterns: ["카페", "커피", "디저트", "베이커리", "찻집", "티룸"],
  },
];

function getCuisineFilters(leafIds: string[]): string[] {
  const set = new Set<string>();
  for (const id of leafIds) {
    for (const entry of CUISINE_FILTER_MAP) {
      if (entry.match(id)) entry.patterns.forEach((p) => set.add(p));
    }
  }
  return Array.from(set);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = validate(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed;
  const warnings: string[] = [];
  const center = { lat: input.lat, lng: input.lng };

  if (!process.env.KAKAO_REST_API_KEY && !process.env.GOOGLE_PLACES_API_KEY) {
    warnings.push(
      "위치 기반 검색(Kakao Local 또는 Google Places) 키가 없습니다. .env.local에 KAKAO_REST_API_KEY를 추가하면 반경 검색이 작동합니다.",
    );
  }

  const leaves = input.categoryLeafIds.length > 0 ? input.categoryLeafIds : [];
  const keywords = new Set<string>();
  const googleTypes = new Set<string>();
  const googleKeywords = new Set<string>();

  for (const id of leaves) {
    const hintsList = getSubtreeHints(id);
    for (const hints of hintsList) {
      hints.naverKeywords.forEach((k) => keywords.add(k));
      hints.googleTypes?.forEach((t) => googleTypes.add(t));
      if (hints.googleKeyword) googleKeywords.add(hints.googleKeyword);
    }
  }

  if (keywords.size === 0 && googleKeywords.size === 0 && googleTypes.size === 0) {
    keywords.add("맛집");
    googleKeywords.add("맛집");
    googleTypes.add("restaurant");
    warnings.push("No category selected — defaulting to 맛집/restaurant");
  }

  const kakaoGroupCode = getKakaoGroupCode(leaves);
  const cuisineFilters = getCuisineFilters(leaves);

  const allResults: Restaurant[] = [];
  const tasks: Array<{ source: "naver" | "kakao" | "google"; promise: Promise<Restaurant[]> }> = [];

  const districtPrefix = input.district?.trim() ? `${input.district.trim()} ` : "";

  const MAX_KW = 12;
  const MAX_GOOGLE_KW = 6;
  const cappedKeywords = Array.from(keywords).slice(0, MAX_KW);
  const cappedGoogleKw = Array.from(googleKeywords).slice(0, MAX_GOOGLE_KW);
  if (keywords.size > MAX_KW) {
    warnings.push(`카테고리 하위 키워드가 많아 상위 ${MAX_KW}개만 검색합니다. 더 좁은 세부 카테고리를 선택하면 정확도가 올라갑니다.`);
  }

  for (const kw of cappedKeywords) {
    const biasedQuery = `${districtPrefix}${kw}`;
    tasks.push({
      source: "naver",
      promise: searchNaverLocal(biasedQuery, center).catch((e) => {
        warnings.push(`Naver "${biasedQuery}": ${(e as Error).message}`);
        return [] as Restaurant[];
      }),
    });
    tasks.push({
      source: "kakao",
      promise: searchKakaoLocal(kw, center, input.radiusM, {
        categoryGroupCode: kakaoGroupCode,
      }).catch((e) => {
        warnings.push(`Kakao "${kw}": ${(e as Error).message}`);
        return [] as Restaurant[];
      }),
    });
  }

  for (const kw of cappedGoogleKw) {
    tasks.push({
      source: "google",
      promise: searchGoogleText(kw, center, input.radiusM, {
        priceMin: input.priceMin,
        priceMax: input.priceMax,
      }).catch((e) => {
        warnings.push(`Google text "${kw}": ${(e as Error).message}`);
        return [] as Restaurant[];
      }),
    });
  }

  if (googleTypes.size > 0) {
    tasks.push({
      source: "google",
      promise: searchGoogleNearby(
        Array.from(googleTypes).slice(0, 50),
        center,
        input.radiusM,
      ).catch((e) => {
        warnings.push(`Google nearby: ${(e as Error).message}`);
        return [] as Restaurant[];
      }),
    });
  }

  const settled = await Promise.all(tasks.map((t) => t.promise));
  let naverTotalFetched = 0;
  for (let i = 0; i < settled.length; i++) {
    const arr = settled[i];
    if (tasks[i].source === "naver") naverTotalFetched += arr.length;
    allResults.push(...arr);
  }

  const deduped = dedup(allResults);

  const matchesCuisine = (r: Restaurant): boolean => {
    if (cuisineFilters.length === 0) return true;
    // Google-only results have generic type names; don't filter them out on cuisine
    const hasKoreanCategorySource =
      r.sources.includes("kakao") ||
      r.sources.includes("naver") ||
      r.sources.includes("merged");
    if (!hasKoreanCategorySource) return true;
    if (!r.category) return false;
    return cuisineFilters.some((p) => r.category!.includes(p));
  };

  const filtered = deduped.filter((r) => {
    if (r.distanceM !== undefined && r.distanceM > input.radiusM) return false;
    if (!matchesCuisine(r)) return false;
    if (input.priceMin !== undefined || input.priceMax !== undefined) {
      if (r.priceLevel === undefined) {
        return input.includeUnknownPrice === true;
      }
      if (input.priceMin !== undefined && r.priceLevel < input.priceMin) return false;
      if (input.priceMax !== undefined && r.priceLevel > input.priceMax) return false;
    }
    return true;
  });

  const kakaoHits = filtered.filter(
    (r) => r.sources.includes("kakao") || r.sources.includes("merged"),
  ).length;
  const hasKakaoKey = !!process.env.KAKAO_REST_API_KEY;
  if (
    naverTotalFetched > 0 &&
    filtered.length === 0 &&
    !hasKakaoKey
  ) {
    warnings.push(
      `네이버가 ${naverTotalFetched}건 반환했지만 전부 반경 밖입니다. 네이버 공식 검색 API는 위치 기반이 아닙니다. Kakao Local API 키(KAKAO_REST_API_KEY)를 추가하면 정확한 반경 검색이 가능합니다.`,
    );
  }
  if (hasKakaoKey && kakaoHits === 0 && filtered.length === 0) {
    warnings.push(
      `반경 ${input.radiusM}m 내에 Kakao/Naver/Google 어느 쪽에서도 결과가 없습니다. 반경을 늘리거나 카테고리를 넓혀보세요.`,
    );
  }

  const moodLeafIds = leaves.filter((id) => getMoodKind(id) !== undefined);
  const regularLeafIds = leaves.filter((id) => getMoodKind(id) === undefined);
  const moodKinds: MoodKind[] = Array.from(
    new Set(moodLeafIds.map((id) => getMoodKind(id)!)),
  );

  let finalResults: Restaurant[] = filtered;

  if (moodKinds.length > 0) {
    const hasNaverKey =
      !!process.env.NAVER_SEARCH_CLIENT_ID && !!process.env.NAVER_SEARCH_CLIENT_SECRET;
    if (!hasNaverKey) {
      warnings.push(
        "리뷰 기반(감성/이색/주점) 필터는 NAVER_SEARCH_CLIENT_ID/SECRET 이 필요합니다.",
      );
    } else {
      const { matchedByKind, errors, postsFetched } = await filterRestaurantsByMood(
        filtered,
        moodKinds,
        input.district ?? null,
        { concurrency: 3, display: 20 },
      );
      errors.slice(0, 3).forEach((e) => warnings.push(`리뷰 분석 오류: ${e}`));
      if (errors.length > 3) {
        warnings.push(`리뷰 분석 오류 ${errors.length - 3}건 추가 생략.`);
      }
      const moodMatched = new Set<string>();
      for (const kind of moodKinds) {
        for (const rid of matchedByKind[kind]) moodMatched.add(rid);
      }
      const moodResults = filtered.filter((r) => moodMatched.has(r.id));

      if (regularLeafIds.length > 0) {
        // union semantics: regular leaves already bring full filtered set
        finalResults = filtered;
      } else {
        finalResults = moodResults;
      }

      if (finalResults.length === 0) {
        warnings.push(
          `리뷰 기반 필터 결과가 0건입니다. (후보 ${filtered.length}개에서 블로그 포스트 ${postsFetched}건 분석)`,
        );
      }
    }
  }

  finalResults.sort((a, b) => {
    if (input.sort === "rating") {
      return (b.rating ?? -1) - (a.rating ?? -1);
    }
    return (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity);
  });

  const response: SearchResponse = {
    results: finalResults,
    warnings,
    query: {
      keywords: cappedKeywords,
      googleTypes: Array.from(googleTypes),
    },
  };
  return NextResponse.json(response);
}
