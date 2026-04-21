"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { Restaurant } from "@/types/restaurant";

type Props = {
  center: { lat: number; lng: number } | null;
  radiusM: number;
  results: Restaurant[];
  onCenterChange: (c: { lat: number; lng: number }) => void;
  onDistrictChange?: (district: string | null) => void;
};

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export default function MapPicker({
  center,
  radiusM,
  results,
  onCenterChange,
  onDistrictChange,
}: Props) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const centerMarkerRef = useRef<NaverMarker | null>(null);
  const circleRef = useRef<NaverCircle | null>(null);
  const resultMarkersRef = useRef<NaverMarker[]>([]);
  const infoRef = useRef<NaverInfoWindow | null>(null);
  // Seed ready/scriptStatus from window.naver so remounts (e.g., after
  // collapsing and re-expanding the map card) don't wait for Script onLoad,
  // which may not fire when the script is already in the document.
  const naverAlreadyLoaded =
    typeof window !== "undefined" && !!window.naver?.maps?.Map;
  const [ready, setReady] = useState(naverAlreadyLoaded);
  const [scriptStatus, setScriptStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(naverAlreadyLoaded ? "ready" : "idle");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<
    Array<{ name: string; address?: string; roadAddress?: string; lat: number; lng: number; category?: string }>
  >([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [searchMsg, setSearchMsg] = useState<string>("");

  useEffect(() => {
    if (!ready || !mapElRef.current || mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Map) return;
    const initCenter = center ?? DEFAULT_CENTER;
    const map = new naver.maps.Map(mapElRef.current, {
      center: new naver.maps.LatLng(initCenter.lat, initCenter.lng),
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT },
    });
    mapRef.current = map;
    infoRef.current = new naver.maps.InfoWindow({ content: "" });
    naver.maps.Event.addListener(map, "click", (e) => {
      onCenterChange({ lat: e.coord.lat(), lng: e.coord.lng() });
    });
  }, [ready, center, onCenterChange]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.LatLng || !center) return;
    const latlng = new naver.maps.LatLng(center.lat, center.lng);
    mapRef.current.panTo(latlng);
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setPosition(latlng);
    } else {
      centerMarkerRef.current = new naver.maps.Marker({
        position: latlng,
        map: mapRef.current,
        title: "선택 위치",
      });
    }
    if (circleRef.current) {
      circleRef.current.setCenter(latlng);
      circleRef.current.setRadius(radiusM);
    } else {
      circleRef.current = new naver.maps.Circle({
        map: mapRef.current,
        center: latlng,
        radius: radiusM,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
        strokeColor: "#2563eb",
        strokeWeight: 2,
      });
    }
  }, [ready, center, radiusM]);

  useEffect(() => {
    if (!ready || !center || !onDistrictChange) return;
    const naver = window.naver;
    if (!naver?.maps?.LatLng || !naver.maps.Service?.reverseGeocode) return;
    const latlng = new naver.maps.LatLng(center.lat, center.lng);
    try {
      naver.maps.Service.reverseGeocode(
        { coords: latlng, orders: "legalcode,admcode,addr" },
        (status, result) => {
          try {
            if (status !== naver.maps.Service!.Status.OK) {
              onDistrictChange(null);
              return;
            }
            const entries = result.v2?.results ?? [];
            let district: string | null = null;
            for (const entry of entries) {
              const r = entry.region;
              const a1 = r?.area1?.name;
              const a2 = r?.area2?.name;
              if (a2) {
                district = a2;
                break;
              }
              if (a1 && !district) district = a1;
            }
            onDistrictChange(district);
          } catch {
            onDistrictChange(null);
          }
        },
      );
    } catch {
      onDistrictChange(null);
    }
  }, [ready, center, onDistrictChange]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.LatLng) return;
    for (const m of resultMarkersRef.current) m.setMap(null);
    resultMarkersRef.current = [];
    const info = infoRef.current;
    for (const r of results) {
      const pos = new naver.maps.LatLng(r.coord.lat, r.coord.lng);
      const marker = new naver.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: r.name,
      });
      if (info) {
        naver.maps.Event.addListener(marker, "click", () => {
          const html = `<div style="padding:8px;max-width:240px;font-size:12px">
            <div style="font-weight:600;margin-bottom:4px">${escapeHtml(r.name)}</div>
            ${r.category ? `<div style="color:#666">${escapeHtml(r.category)}</div>` : ""}
            ${r.address ? `<div style="color:#888">${escapeHtml(r.address)}</div>` : ""}
            ${typeof r.distanceM === "number" ? `<div style="margin-top:4px">${Math.round(r.distanceM)}m</div>` : ""}
          </div>`;
          info.setContent(html);
          info.open(mapRef.current!, marker);
        });
      }
      resultMarkersRef.current.push(marker);
    }
  }, [ready, results]);

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearchState("loading");
    setSearchMsg("");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.candidates) ? data.candidates : [];
      setCandidates(list);
      if (list.length === 0) {
        setSearchState("done");
        const ws = Array.isArray(data.warnings) ? data.warnings : [];
        setSearchMsg(ws.length > 0 ? ws.join(" | ") : "검색 결과가 없습니다.");
      } else {
        setSearchState("done");
        setSearchMsg(`${list.length}개 결과 중 선택하세요.`);
        if (list.length === 1) pickCandidate(list[0]);
      }
    } catch (e) {
      setSearchState("error");
      setSearchMsg((e as Error).message);
    }
  };

  const pickCandidate = (c: {
    lat: number;
    lng: number;
    name: string;
    address?: string;
    roadAddress?: string;
  }) => {
    onCenterChange({ lat: c.lat, lng: c.lng });
    setCandidates([]);
    setSearchMsg(`📍 ${c.name}${c.roadAddress ? ` (${c.roadAddress})` : ""}`);
  };

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchState("error");
      setSearchMsg("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setSearchState("loading");
    setSearchMsg("위치 확인 중…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCenterChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setCandidates([]);
        setSearchState("done");
        setSearchMsg(
          `📍 현재 위치로 이동 (±${Math.round(pos.coords.accuracy)}m)`,
        );
      },
      (err) => {
        setSearchState("error");
        if (err.code === err.PERMISSION_DENIED) {
          setSearchMsg(
            "위치 권한이 거부되었습니다. 브라우저 주소창 좌측 자물쇠 → 사이트 설정에서 위치를 허용하세요.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setSearchMsg("위치 정보를 가져올 수 없습니다.");
        } else if (err.code === err.TIMEOUT) {
          setSearchMsg("위치 확인 시간이 초과되었습니다.");
        } else {
          setSearchMsg("위치 확인 실패");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const mapUrl = clientId
    ? `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}&submodules=geocoder`
    : "";

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {mapUrl && (
        <Script
          src={mapUrl}
          strategy="afterInteractive"
          onLoad={() => {
            // 키/도메인 문제로 스크립트는 실행됐지만 maps가 null인 경우를 잡는다
            if (typeof window !== "undefined" && window.naver?.maps?.Map) {
              setScriptStatus("ready");
              setReady(true);
            } else {
              setScriptStatus("error");
            }
          }}
          onError={() => setScriptStatus("error")}
        />
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="주소 또는 장소명 (예: 서울역, 강남역 스타벅스)"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onSearch}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={searchState === "loading"}
        >
          {searchState === "loading" ? "검색중…" : "주소검색"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          title="현재 위치로 이동"
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
          disabled={searchState === "loading"}
        >
          📍 내 위치
        </button>
      </div>
      {searchMsg && (
        <p className="text-xs text-gray-600">{searchMsg}</p>
      )}
      {candidates.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">
              {candidates.length}개 후보 — 클릭해서 선택
            </span>
            <button
              type="button"
              onClick={() => setCandidates([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              닫기 ✕
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto overscroll-contain rounded border border-gray-300 bg-white shadow-sm divide-y divide-gray-100">
            {candidates.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pickCandidate(c)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition"
                >
                  <div className="font-medium text-gray-900">{c.name}</div>
                  {c.category && (
                    <div className="text-xs text-gray-500">{c.category}</div>
                  )}
                  <div className="text-xs text-gray-600 mt-0.5">
                    {c.roadAddress ?? c.address}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        ref={mapElRef}
        className="flex-1 min-h-[400px] w-full rounded border border-gray-200 bg-gray-100"
      />
      {!clientId && (
        <p className="text-xs text-amber-700">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 없어 지도를 불러올 수 없습니다.
        </p>
      )}
      {clientId && scriptStatus === "error" && (
        <p className="text-xs text-red-600">
          네이버 지도 인증 실패 — NCP 콘솔에서 현재 도메인(
          {typeof window !== "undefined" ? window.location.origin : ""})이
          "서비스 환경 등록 &gt; Web"에 추가되어 있는지 확인하세요.
        </p>
      )}
      <p className="text-xs text-gray-500">
        지도를 클릭해 중심점을 바꿀 수 있습니다.
      </p>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
