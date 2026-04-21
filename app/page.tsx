"use client";

import { useCallback, useState } from "react";
import MapPicker from "@/components/MapPicker";
import RadiusSelector from "@/components/RadiusSelector";
import PriceRangeSlider from "@/components/PriceRangeSlider";
import CategoryWizard from "@/components/CategoryWizard";
import ResultList from "@/components/ResultList";
import PickNowModal from "@/components/PickNowModal";
import { useFavorites } from "@/hooks/useFavorites";
import type { Restaurant, SearchInput, SearchResponse } from "@/types/restaurant";

export default function HomePage() {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [radiusM, setRadiusM] = useState(500);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(4);
  const [priceIgnore, setPriceIgnore] = useState(true);
  const [includeUnknownPrice, setIncludeUnknownPrice] = useState(true);
  const [topId, setTopId] = useState<string | null>(null);
  const [midIds, setMidIds] = useState<string[]>([]);
  const [leafIds, setLeafIds] = useState<string[]>([]);
  const [sort, setSort] = useState<"distance" | "rating">("distance");
  const { favorites, toggle: toggleFavorite, move: moveFavorite } = useFavorites();

  const [results, setResults] = useState<Restaurant[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickNowOpen, setPickNowOpen] = useState(false);

  const runSearch = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    setError(null);
    try {
      const effectiveLeaves = leafIds.length > 0 ? leafIds : midIds;
      const payload: SearchInput = {
        lat: center.lat,
        lng: center.lng,
        radiusM,
        priceMin: priceIgnore ? undefined : priceMin,
        priceMax: priceIgnore ? undefined : priceMax,
        categoryLeafIds: effectiveLeaves,
        includeUnknownPrice,
        sort,
        district,
      };
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`검색 실패: ${res.status} ${text}`);
      }
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setWarnings(data.warnings);
    } catch (e) {
      setError((e as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [
    center,
    district,
    radiusM,
    priceIgnore,
    priceMin,
    priceMax,
    leafIds,
    midIds,
    includeUnknownPrice,
    sort,
  ]);

  const canSearch = center !== null && !loading;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            🍽️ 단계별 음식점 추천
          </h1>
          <p className="text-xs text-gray-500">
            위치 → 반경 → 가격대 → 카테고리 순서대로 좁혀가세요. 언제든 "지금 검색" 가능.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          onClick={() => setPickNowOpen(true)}
          disabled={!center}
          title={!center ? "먼저 지도에서 위치를 지정하세요" : "500m 반경 · 시간대별 추천"}
        >
          🎲 지금 뭐먹을까?
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 flex flex-col gap-3 bg-white rounded-lg border border-gray-200 p-3 h-[560px]">
          <MapPicker
            center={center}
            radiusM={radiusM}
            results={results}
            onCenterChange={setCenter}
            onDistrictChange={setDistrict}
          />
          {district && (
            <p className="text-xs text-gray-500">
              📍 {district} — Naver 검색에 이 지역명이 자동으로 추가됩니다
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 p-4">
          <RadiusSelector value={radiusM} onChange={setRadiusM} />
          <PriceRangeSlider
            min={priceMin}
            max={priceMax}
            ignore={priceIgnore}
            includeUnknown={includeUnknownPrice}
            onChange={(v) => {
              setPriceMin(v.min);
              setPriceMax(v.max);
              setPriceIgnore(v.ignore);
              setIncludeUnknownPrice(v.includeUnknown);
            }}
          />
          <div className="h-px bg-gray-200" />
          <CategoryWizard
            topId={topId}
            midIds={midIds}
            leafIds={leafIds}
            onTopChange={setTopId}
            onMidChange={setMidIds}
            onLeafChange={setLeafIds}
            favoriteIds={favorites}
            onToggleFavorite={toggleFavorite}
            onMoveFavorite={moveFavorite}
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={!canSearch}
            className="sticky bottom-0 w-full rounded-lg bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "검색중…" : "🔎 지금 검색"}
          </button>
        </section>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
        {error && (
          <p className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}
        <ResultList
          results={results}
          loading={loading}
          warnings={warnings}
          sort={sort}
          onSortChange={setSort}
        />
      </div>

      <PickNowModal
        open={pickNowOpen}
        onClose={() => setPickNowOpen(false)}
        center={center}
        district={district}
      />
    </main>
  );
}
