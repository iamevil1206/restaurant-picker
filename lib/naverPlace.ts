import type { Restaurant } from "@/types/restaurant";

export function extractDistrict(addr?: string): string {
  if (!addr) return "";
  const m = addr.match(/([가-힣]+[시도])?\s*([가-힣]+[구군])/);
  return m?.[2] ?? "";
}

export function pickNaverHref(r: Restaurant): string {
  if (r.naverUrl) {
    try {
      const u = new URL(r.naverUrl);
      if (u.hostname.includes("naver.com")) return r.naverUrl;
    } catch {
      /* invalid URL — fall through to search */
    }
  }
  const district = extractDistrict(r.roadAddress) || extractDistrict(r.address);
  const params = new URLSearchParams({ name: r.name });
  if (district) params.set("district", district);
  return `/api/naver-redirect?${params.toString()}`;
}
