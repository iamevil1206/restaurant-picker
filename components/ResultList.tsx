"use client";

import { useMemo } from "react";
import type { Restaurant } from "@/types/restaurant";

const PRICE_LABEL = ["무료", "₩", "₩₩", "₩₩₩", "₩₩₩₩"];

type Props = {
  results: Restaurant[];
  loading: boolean;
  warnings: string[];
  sort: "distance" | "rating";
  onSortChange: (s: "distance" | "rating") => void;
};

export default function ResultList({
  results,
  loading,
  warnings,
  sort,
  onSortChange,
}: Props) {
  const sorted = useMemo(() => {
    const copy = [...results];
    copy.sort((a, b) => {
      if (sort === "rating") {
        const ar = a.rating ?? -1;
        const br = b.rating ?? -1;
        if (br !== ar) return br - ar;
        return (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity);
      }
      return (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity);
    });
    return copy;
  }, [results, sort]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          결과 {loading ? "…" : `${sorted.length}곳`}
        </h2>
        <div className="flex gap-1">
          {(["distance", "rating"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSortChange(s)}
              className={`rounded px-2 py-1 text-xs border ${
                sort === s
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {s === "distance" ? "거리순" : "평점순"}
            </button>
          ))}
        </div>
      </div>
      {warnings.length > 0 && (
        <ul className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">
          {warnings.map((w, i) => (
            <li key={i}>⚠️ {w}</li>
          ))}
        </ul>
      )}
      {loading && <p className="text-sm text-gray-500">검색 중…</p>}
      {!loading && sorted.length === 0 && (
        <p className="text-sm text-gray-500">결과가 없습니다. 조건을 바꿔보세요.</p>
      )}
      <ul className="flex flex-col gap-2">
        {sorted.map((r) => (
          <li
            key={r.id}
            className="rounded border border-gray-200 p-3 hover:border-blue-400 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{r.name}</div>
                {r.category && (
                  <div className="text-xs text-gray-500 truncate">{r.category}</div>
                )}
                {(r.roadAddress || r.address) && (
                  <div className="text-xs text-gray-600 truncate">
                    {r.roadAddress ?? r.address}
                  </div>
                )}
              </div>
              <div className="text-xs text-right flex-shrink-0">
                {typeof r.distanceM === "number" && (
                  <div className="text-gray-700">{Math.round(r.distanceM)}m</div>
                )}
                {typeof r.rating === "number" && (
                  <div className="text-amber-600">
                    ★ {r.rating.toFixed(1)}
                    {r.userRatingCount ? ` (${r.userRatingCount})` : ""}
                  </div>
                )}
                {typeof r.priceLevel === "number" && (
                  <div className="text-gray-600">{PRICE_LABEL[r.priceLevel]}</div>
                )}
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-xs flex-wrap">
              {r.kakaoUrl && (
                <a
                  className="text-yellow-700 hover:underline"
                  href={r.kakaoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  카카오맵
                </a>
              )}
              <a
                className="text-green-700 hover:underline"
                href={r.naverUrl ?? buildNaverSearchUrl(r)}
                target="_blank"
                rel="noreferrer"
              >
                네이버
              </a>
              {r.googleUrl && (
                <a
                  className="text-blue-700 hover:underline"
                  href={r.googleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  구글 지도
                </a>
              )}
              {r.sources.includes("merged") && (
                <span className="text-gray-400">• 다중 소스 병합</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildNaverSearchUrl(r: Restaurant): string {
  const roadShort = r.roadAddress?.split(" ").slice(0, 2).join(" ") ?? "";
  const addrShort = r.address?.split(" ").slice(0, 2).join(" ") ?? "";
  const locale = roadShort || addrShort;
  const q = locale ? `${locale} ${r.name}` : r.name;
  return `https://map.naver.com/p/search/${encodeURIComponent(q)}`;
}
