import { NextResponse } from "next/server";
import type { Restaurant } from "@/types/restaurant";
import {
  BUCKET_KAKAO_GROUP,
  BUCKET_LABELS,
  BUCKET_LEAVES,
  bucketForHour,
  estimateWaitingLevel,
  getTimeBucket,
  shuffle,
  type PickNowResult,
  type TimeBucket,
} from "@/lib/pickNow";
import { getSubtreeHints } from "@/lib/categories";
import { searchNaverLocal } from "@/lib/naverApi";
import { searchGoogleText, searchGoogleNearby } from "@/lib/googleApi";
import { searchKakaoLocal } from "@/lib/kakaoApi";
import { dedup } from "@/lib/dedup";

export const runtime = "nodejs";

const RADIUS_M = 500;
const LIMIT = 5;
const MAX_KW = 8;
const MAX_GOOGLE_KW = 4;

type Input = {
  lat: number;
  lng: number;
  seed: number;
  district: string | null;
  clientHour?: number;
  bucketOverride?: TimeBucket;
};

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validate(body: unknown): Input | { error: string } {
  if (!body || typeof body !== "object") return { error: "body required" };
  const b = body as Record<string, unknown>;
  if (!isNumber(b.lat) || !isNumber(b.lng)) return { error: "lat/lng required" };
  return {
    lat: b.lat,
    lng: b.lng,
    seed: isNumber(b.seed) ? b.seed : Date.now(),
    district: typeof b.district === "string" ? b.district : null,
    clientHour:
      isNumber(b.clientHour) && b.clientHour >= 0 && b.clientHour < 24
        ? b.clientHour
        : undefined,
    bucketOverride:
      typeof b.bucketOverride === "string"
        ? (b.bucketOverride as TimeBucket)
        : undefined,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = validate(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const hour =
    parsed.clientHour ??
    new Date().getHours() + new Date().getMinutes() / 60;
  const bucket =
    parsed.bucketOverride ??
    (parsed.clientHour !== undefined ? bucketForHour(hour) : getTimeBucket());
  const leafIds = BUCKET_LEAVES[bucket];
  const center = { lat: parsed.lat, lng: parsed.lng };
  const warnings: string[] = [];

  if (!process.env.KAKAO_REST_API_KEY && !process.env.GOOGLE_PLACES_API_KEY) {
    warnings.push(
      "위치 기반 검색 키가 없어 결과가 빈약할 수 있습니다 (KAKAO_REST_API_KEY 또는 GOOGLE_PLACES_API_KEY).",
    );
  }

  const keywords = new Set<string>();
  const googleTypes = new Set<string>();
  const googleKeywords = new Set<string>();
  for (const id of leafIds) {
    for (const hints of getSubtreeHints(id)) {
      hints.naverKeywords.forEach((k) => keywords.add(k));
      hints.googleTypes?.forEach((t) => googleTypes.add(t));
      if (hints.googleKeyword) googleKeywords.add(hints.googleKeyword);
    }
  }

  const cappedKw = Array.from(keywords).slice(0, MAX_KW);
  const cappedGoogleKw = Array.from(googleKeywords).slice(0, MAX_GOOGLE_KW);
  const districtPrefix = parsed.district?.trim() ? `${parsed.district.trim()} ` : "";
  const kakaoGroup = BUCKET_KAKAO_GROUP[bucket];

  const tasks: Promise<Restaurant[]>[] = [];
  for (const kw of cappedKw) {
    tasks.push(
      searchNaverLocal(`${districtPrefix}${kw}`, center).catch(() => [] as Restaurant[]),
      searchKakaoLocal(kw, center, RADIUS_M, {
        categoryGroupCode: kakaoGroup,
      }).catch(() => [] as Restaurant[]),
    );
  }
  for (const kw of cappedGoogleKw) {
    tasks.push(
      searchGoogleText(kw, center, RADIUS_M).catch(() => [] as Restaurant[]),
    );
  }
  if (googleTypes.size > 0) {
    tasks.push(
      searchGoogleNearby(
        Array.from(googleTypes).slice(0, 50),
        center,
        RADIUS_M,
      ).catch(() => [] as Restaurant[]),
    );
  }

  const settled = await Promise.all(tasks);
  const all: Restaurant[] = [];
  for (const arr of settled) all.push(...arr);

  const deduped = dedup(all).filter(
    (r) => (r.distanceM ?? Infinity) <= RADIUS_M,
  );

  const shuffled = shuffle(deduped, parsed.seed);
  const picks: PickNowResult[] = shuffled.slice(0, LIMIT).map((r) => ({
    ...r,
    waitingLevel: estimateWaitingLevel(r.userRatingCount, bucket, hour),
  }));

  return NextResponse.json({
    bucket: { key: bucket, label: BUCKET_LABELS[bucket] },
    hour,
    results: picks,
    warnings,
    totalCandidates: deduped.length,
  });
}
