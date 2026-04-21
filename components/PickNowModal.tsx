"use client";

import { useCallback, useEffect, useState } from "react";
import type { Restaurant } from "@/types/restaurant";
import { pickNaverHref } from "@/lib/naverPlace";

type WaitingLevel = "low" | "medium" | "high" | "unknown";

type PickNowResult = Restaurant & { waitingLevel?: WaitingLevel };

type PickNowResponse = {
  bucket: { key: string; label: string };
  hour: number;
  results: PickNowResult[];
  warnings: string[];
  totalCandidates: number;
};

type Mode = "food" | "drink";

type Props = {
  open: boolean;
  onClose: () => void;
  center: { lat: number; lng: number } | null;
  district: string | null;
  mode: Mode;
};

const MODE_META: Record<
  Mode,
  { title: string; emoji: string; primaryColor: string }
> = {
  food: {
    title: "지금 뭐먹을까?",
    emoji: "🎲",
    primaryColor: "bg-rose-600 hover:bg-rose-700",
  },
  drink: {
    title: "지금 뭐마실까?",
    emoji: "🍹",
    primaryColor: "bg-indigo-600 hover:bg-indigo-700",
  },
};

const BADGE_STYLE: Record<
  WaitingLevel,
  { color: string; label: string; icon: string }
> = {
  low: {
    color: "bg-green-100 text-green-700 border-green-300",
    label: "여유",
    icon: "🟢",
  },
  medium: {
    color: "bg-amber-100 text-amber-700 border-amber-300",
    label: "보통",
    icon: "🟡",
  },
  high: {
    color: "bg-red-100 text-red-700 border-red-300",
    label: "붐빌 수 있음",
    icon: "🔴",
  },
  unknown: {
    color: "bg-gray-100 text-gray-500 border-gray-300",
    label: "정보 없음",
    icon: "⚪",
  },
};

export default function PickNowModal({ open, onClose, center, district, mode }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PickNowResponse | null>(null);

  const fetchPicks = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const res = await fetch("/api/pick-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: center.lat,
          lng: center.lng,
          district,
          mode,
          seed: Math.floor(Math.random() * 1_000_000),
          clientHour: now.getHours() + now.getMinutes() / 60,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }
      const d: PickNowResponse = await res.json();
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [center, district, mode]);

  useEffect(() => {
    if (open) {
      setData(null);
      fetchPicks();
    }
  }, [open, fetchPicks]);

  if (!open) return null;

  const meta = MODE_META[mode];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">
            {meta.emoji} {meta.title}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        {data && (
          <p className="text-xs text-gray-500 mb-1">
            현재 <b className="text-gray-700">{data.bucket.label}</b> · 반경 500m ·
            후보 {data.totalCandidates}곳 중 최대 {data.results.length}곳 랜덤
          </p>
        )}
        <p className="text-[10px] text-gray-400 mb-3">
          📊 혼잡도는 리뷰수 기반 추정 (실시간 아님)
        </p>

        {error && (
          <p className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        {data?.warnings.map((w, i) => (
          <p
            key={i}
            className="mb-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5"
          >
            {w}
          </p>
        ))}

        {loading && (
          <p className="text-sm text-gray-500 py-8 text-center">검색중…</p>
        )}

        {!loading && data && data.results.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">
            반경 500m 안에 이 시간대에 어울리는 가게가 없어요.
          </p>
        )}

        {!loading && data && data.results.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {data.results.map((r) => {
              const w: WaitingLevel = r.waitingLevel ?? "unknown";
              const style = BADGE_STYLE[w];
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {r.name}
                      </p>
                      {r.category && (
                        <p className="text-xs text-gray-500 truncate">
                          {r.category}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                        {r.distanceM !== undefined && (
                          <span>{Math.round(r.distanceM)}m</span>
                        )}
                        {r.rating !== undefined && (
                          <span>
                            ⭐ {r.rating.toFixed(1)}
                            {r.userRatingCount !== undefined
                              ? ` (${r.userRatingCount})`
                              : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${style.color}`}
                      title="리뷰수 + 시간대 기반 추정 (실시간 혼잡도 아님)"
                    >
                      {style.icon} {style.label}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
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
                      href={pickNaverHref(r)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      네이버 플레이스
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-lg ${meta.primaryColor} px-4 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300`}
            onClick={fetchPicks}
            disabled={loading || !center}
          >
            {meta.emoji} 다시
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
