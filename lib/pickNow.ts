import type { Restaurant } from "@/types/restaurant";

export type TimeBucket =
  | "breakfast"
  | "lunch"
  | "afternoon"
  | "dinner"
  | "latenight";

export const BUCKET_LABELS: Record<TimeBucket, string> = {
  breakfast: "아침 (속 편하게)",
  lunch: "점심 (가볍게/이색)",
  afternoon: "오후/간식",
  dinner: "저녁 (든든하게)",
  latenight: "야간 (한 잔)",
};

export type PickMode = "food" | "drink";

// Food mode: drink-only cafes (specialty coffee, 버블티, 주스, 전통찻집, 프랜차이즈
// 카페, 테마카페) are excluded. Brunch cafes + bakery + dessert cafes stay
// because their menu is food-centric.
export const BUCKET_LEAVES: Record<TimeBucket, string[]> = {
  breakfast: ["cf-bakery", "kr-porridge", "kr-soup", "ot-sandwich", "cf-brunch"],
  lunch: [
    "kr-bibim",
    "kr-noodle",
    "kr-bunsik",
    "jp-donburi",
    "jp-udon",
    "jp-ramen",
    "sea-vn-pho",
    "sea-thai",
    "sea-vn-banhmi",
    "in-curry",
    "ot-salad",
    "la-taco",
  ],
  afternoon: ["cf-dessert", "cf-bakery", "cf-brunch"],
  dinner: [
    "kr-grill",
    "kr-chicken",
    "w-pasta",
    "w-pizza",
    "cn-hotpot",
    "cn-classic",
    "kr-jokbal",
    "w-burger",
    "w-bbq",
  ],
  latenight: ["jp-izakaya", "kr-bar", "w-spanish", "kr-chicken", "cn-lamb"],
};

// Drink mode: beverage-first cafes by day, bars by night.
export const DRINK_BUCKET_LEAVES: Record<TimeBucket, string[]> = {
  breakfast: ["cf-specialty", "cf-franchise"],
  lunch: ["cf-specialty", "cf-boba", "cf-juice", "cf-franchise"],
  afternoon: [
    "cf-specialty",
    "cf-boba",
    "cf-juice",
    "cf-franchise",
    "cf-trad",
    "cf-theme",
  ],
  dinner: ["cf-specialty", "cf-theme", "kr-bar", "jp-izakaya"],
  latenight: ["kr-bar", "jp-izakaya", "w-spanish", "cn-lamb"],
};

export const BUCKET_LABELS_DRINK: Record<TimeBucket, string> = {
  breakfast: "아침 (모닝 커피)",
  lunch: "점심 (식후 음료)",
  afternoon: "오후 (카페 타임)",
  dinner: "저녁 (한 잔 시작)",
  latenight: "야간 (술 한잔)",
};

export function getBucketLeaves(bucket: TimeBucket, mode: PickMode): string[] {
  return mode === "drink" ? DRINK_BUCKET_LEAVES[bucket] : BUCKET_LEAVES[bucket];
}

export function getBucketLabel(bucket: TimeBucket, mode: PickMode): string {
  return mode === "drink" ? BUCKET_LABELS_DRINK[bucket] : BUCKET_LABELS[bucket];
}

// Kakao category_group_code hint per bucket (food mode).
export const BUCKET_KAKAO_GROUP: Record<TimeBucket, "FD6" | "CE7" | undefined> = {
  breakfast: undefined, // mix of food + cafe
  lunch: "FD6",
  afternoon: "CE7",
  dinner: "FD6",
  latenight: "FD6",
};

export const DRINK_BUCKET_KAKAO_GROUP: Record<
  TimeBucket,
  "FD6" | "CE7" | undefined
> = {
  breakfast: "CE7",
  lunch: "CE7",
  afternoon: "CE7",
  dinner: undefined, // cafes + bars both
  latenight: undefined,
};

export function getBucketKakaoGroup(
  bucket: TimeBucket,
  mode: PickMode,
): "FD6" | "CE7" | undefined {
  return mode === "drink"
    ? DRINK_BUCKET_KAKAO_GROUP[bucket]
    : BUCKET_KAKAO_GROUP[bucket];
}

export function bucketForHour(h: number): TimeBucket {
  if (h >= 5 && h < 10) return "breakfast";
  if (h >= 10 && h < 14) return "lunch";
  if (h >= 14 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "dinner";
  return "latenight"; // 21-24 and 0-5
}

export function getTimeBucket(d: Date = new Date()): TimeBucket {
  return bucketForHour(d.getHours() + d.getMinutes() / 60);
}

export type WaitingLevel = "low" | "medium" | "high" | "unknown";

/**
 * Waiting-probability proxy. Not real busyness — Google Places API does not
 * expose popular-times data. We estimate from review count + whether the
 * current hour is a typical rush window for the bucket.
 */
export function estimateWaitingLevel(
  ratingCount: number | undefined,
  bucket: TimeBucket,
  hour: number,
): WaitingLevel {
  if (ratingCount === undefined) return "unknown";

  const isRush =
    (bucket === "lunch" && hour >= 11.5 && hour <= 13.5) ||
    (bucket === "dinner" && hour >= 18 && hour <= 20) ||
    (bucket === "latenight" && hour >= 21 && hour <= 23);

  let base: WaitingLevel;
  if (ratingCount < 50) base = "low";
  else if (ratingCount < 300) base = "medium";
  else base = "high";

  if (isRush) return base;
  // off-peak: shift down one level
  if (base === "high") return "medium";
  if (base === "medium") return "low";
  return "low";
}

export type PickNowResult = Restaurant & { waitingLevel: WaitingLevel };

// Deterministic shuffle (Lehmer RNG) so a given seed always yields the same order.
export function shuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = Math.abs(Math.floor(seed)) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
