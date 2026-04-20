import { NextResponse } from "next/server";

export const runtime = "nodejs";

export type GeocodeCandidate = {
  name: string;
  address?: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  category?: string;
};

export type GeocodeResponse = {
  candidates: GeocodeCandidate[];
  source: "kakao" | "naver" | "none";
  warnings: string[];
};

type KakaoKeywordDoc = {
  id: string;
  place_name: string;
  category_name?: string;
  address_name?: string;
  road_address_name?: string;
  x: string;
  y: string;
};
type KakaoAddressDoc = {
  address_name: string;
  x: string;
  y: string;
  address?: { address_name?: string };
  road_address?: { address_name?: string; building_name?: string };
};

type KakaoCallResult = {
  candidates: GeocodeCandidate[];
  status: number | null;
  errorBody?: string;
};

async function searchKakaoKeyword(q: string): Promise<KakaoCallResult> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return { candidates: [], status: null };
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", q);
  url.searchParams.set("size", "15");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${key.trim()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    return { candidates: [], status: res.status, errorBody: body.slice(0, 300) };
  }
  const data: { documents?: KakaoKeywordDoc[] } = await res.json();
  const candidates = (data.documents ?? []).map((d) => ({
    name: d.place_name,
    address: d.address_name,
    roadAddress: d.road_address_name,
    lat: Number(d.y),
    lng: Number(d.x),
    category: d.category_name,
  }));
  return { candidates, status: res.status };
}

async function searchKakaoAddress(q: string): Promise<KakaoCallResult> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return { candidates: [], status: null };
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", q);
  url.searchParams.set("size", "10");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${key.trim()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    return { candidates: [], status: res.status, errorBody: body.slice(0, 300) };
  }
  const data: { documents?: KakaoAddressDoc[] } = await res.json();
  const candidates = (data.documents ?? []).map((d) => ({
    name:
      d.road_address?.building_name ||
      d.road_address?.address_name ||
      d.address_name,
    address: d.address?.address_name ?? d.address_name,
    roadAddress: d.road_address?.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
  return { candidates, status: res.status };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const warnings: string[] = [];
  if (!q) {
    return NextResponse.json({ candidates: [], source: "none", warnings: ["empty query"] });
  }

  if (!process.env.KAKAO_REST_API_KEY) {
    warnings.push(
      "KAKAO_REST_API_KEY가 없어 주소/장소 검색을 할 수 없습니다. .env.local에 추가하세요.",
    );
    return NextResponse.json<GeocodeResponse>({
      candidates: [],
      source: "none",
      warnings,
    });
  }

  const [kw, addr] = await Promise.all([
    searchKakaoKeyword(q).catch((e) => ({
      candidates: [] as GeocodeCandidate[],
      status: -1,
      errorBody: (e as Error).message,
    })),
    searchKakaoAddress(q).catch((e) => ({
      candidates: [] as GeocodeCandidate[],
      status: -1,
      errorBody: (e as Error).message,
    })),
  ]);

  if (kw.status && kw.status >= 400) {
    warnings.push(`Kakao keyword 호출 실패: HTTP ${kw.status} ${kw.errorBody ?? ""}`);
  }
  if (addr.status && addr.status >= 400) {
    warnings.push(`Kakao address 호출 실패: HTTP ${addr.status} ${addr.errorBody ?? ""}`);
  }

  const seen = new Set<string>();
  const candidates: GeocodeCandidate[] = [];
  for (const c of [...kw.candidates, ...addr.candidates]) {
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
    const sig = `${c.lat.toFixed(5)},${c.lng.toFixed(5)}:${c.name}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    candidates.push(c);
  }

  if (candidates.length === 0 && warnings.length === 0) {
    warnings.push(
      `Kakao에서 '${q}' 검색 결과 없음 (keyword: ${kw.candidates.length}, address: ${addr.candidates.length}). 검색어를 다르게 시도해보세요.`,
    );
  }

  return NextResponse.json<GeocodeResponse>({
    candidates: candidates.slice(0, 20),
    source: "kakao",
    warnings,
  });
}
