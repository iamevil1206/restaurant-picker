import { NextResponse } from "next/server";
import { haversineMeters } from "@/lib/geo";

export const runtime = "nodejs";

function mask(s: string | undefined): string {
  if (!s) return "(missing)";
  if (s.length <= 6) return `${s.length}chars`;
  return `${s.slice(0, 3)}…${s.slice(-2)} (len=${s.length})`;
}

function describe(s: string | undefined): Record<string, unknown> {
  if (!s) return { present: false };
  return {
    present: true,
    length: s.length,
    preview: mask(s),
    hasLeadingSpace: s !== s.trimStart(),
    hasTrailingSpace: s !== s.trimEnd(),
    hasQuotes: s.startsWith('"') || s.startsWith("'"),
    hasNewline: /[\r\n]/.test(s),
  };
}

function parseCoordCurrent(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return NaN;
  return n > 1e6 ? n / 1e7 : n;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat") ?? "37.5547");
  const lng = Number(url.searchParams.get("lng") ?? "126.9707");
  const rawQ = (url.searchParams.get("q") || "짬뽕").trim();
  const district = (url.searchParams.get("district") || "").trim();
  const q = district ? `${district} ${rawQ}` : rawQ;
  const radiusM = Number(url.searchParams.get("radius") ?? "500");
  const center = { lat, lng };

  const id = process.env.NAVER_SEARCH_CLIENT_ID;
  const secret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  const envReport = {
    NAVER_SEARCH_CLIENT_ID: describe(id),
    NAVER_SEARCH_CLIENT_SECRET: describe(secret),
    NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: describe(
      process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
    ),
    GOOGLE_PLACES_API_KEY: describe(process.env.GOOGLE_PLACES_API_KEY),
  };

  let naverResult: Record<string, unknown> = { attempted: false };
  if (id && secret) {
    try {
      const apiUrl = new URL("https://openapi.naver.com/v1/search/local.json");
      apiUrl.searchParams.set("query", q);
      apiUrl.searchParams.set("display", "5");
      apiUrl.searchParams.set("start", "1");
      apiUrl.searchParams.set("sort", "random");

      const res = await fetch(apiUrl.toString(), {
        headers: {
          "X-Naver-Client-Id": id.trim(),
          "X-Naver-Client-Secret": secret.trim(),
        },
        cache: "no-store",
      });
      const raw = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        /* noop */
      }

      const items: Array<Record<string, unknown>> =
        (parsed as { items?: Array<Record<string, unknown>> } | null)?.items ??
        [];

      const analyzed = items.map((item) => {
        const mapx = item.mapx as string | undefined;
        const mapy = item.mapy as string | undefined;
        const parsedLng = mapx ? parseCoordCurrent(mapx) : NaN;
        const parsedLat = mapy ? parseCoordCurrent(mapy) : NaN;
        const distanceM =
          Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
            ? haversineMeters(center, { lat: parsedLat, lng: parsedLng })
            : null;
        return {
          title: (item.title as string)?.replace(/<[^>]*>/g, ""),
          raw: { mapx, mapy },
          parsedCoord: { lat: parsedLat, lng: parsedLng },
          distanceM,
          insideRadius: distanceM !== null ? distanceM <= radiusM : null,
          address: item.address,
          roadAddress: item.roadAddress,
        };
      });

      naverResult = {
        attempted: true,
        status: res.status,
        ok: res.ok,
        query: q,
        center,
        radiusM,
        totalItems: items.length,
        analyzed,
      };
    } catch (e) {
      naverResult = { attempted: true, error: (e as Error).message };
    }
  }

  return NextResponse.json({ env: envReport, naverTest: naverResult });
}
