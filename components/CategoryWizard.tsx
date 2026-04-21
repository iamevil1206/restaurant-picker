"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_TREE,
  type CategoryNode,
  isLeaf,
  getNode,
} from "@/lib/categories";

type Props = {
  topId: string | null;
  midIds: string[];
  leafIds: string[];
  onTopChange: (id: string | null) => void;
  onMidChange: (ids: string[]) => void;
  onLeafChange: (ids: string[]) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onMoveFavorite: (from: number, to: number) => void;
};

export default function CategoryWizard({
  topId,
  midIds,
  leafIds,
  onTopChange,
  onMidChange,
  onLeafChange,
  favoriteIds,
  onToggleFavorite,
  onMoveFavorite,
}: Props) {
  const top = CATEGORY_TREE;
  const topNode = useMemo(
    () => top.find((n) => n.id === topId) ?? null,
    [top, topId],
  );

  const midNodes: CategoryNode[] = useMemo(() => {
    if (!topNode) return [];
    if (!topNode.children) return [];
    if (topNode.children.every(isLeaf)) return topNode.children;
    return topNode.children;
  }, [topNode]);

  const leafNodes: CategoryNode[] = useMemo(() => {
    const selectedMids = midNodes.filter((n) => midIds.includes(n.id));
    const flat: CategoryNode[] = [];
    for (const m of selectedMids) {
      if (isLeaf(m)) {
        flat.push(m);
      } else if (m.children) {
        for (const c of m.children) if (isLeaf(c)) flat.push(c);
      }
    }
    return flat;
  }, [midNodes, midIds]);

  const toggle = (id: string, list: string[], setter: (ids: string[]) => void) => {
    if (list.includes(id)) setter(list.filter((x) => x !== id));
    else setter([...list, id]);
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const favoriteNodes = useMemo(
    () =>
      favoriteIds
        .map((id) => ({ id, node: getNode(id) }))
        .filter((x): x is { id: string; node: CategoryNode } => !!x.node),
    [favoriteIds],
  );

  return (
    <div className="flex flex-col gap-4">
      {favoriteNodes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>⭐ 즐겨찾기</span>
            <span className="text-xs font-normal text-gray-400">
              드래그 또는 ↑↓로 순서 변경
            </span>
          </h3>
          <ul className="max-h-48 overflow-y-auto overscroll-contain flex flex-col gap-1.5 rounded border border-amber-100 bg-amber-50/40 p-2">
            {favoriteNodes.map(({ id, node }, idx) => {
              const selected = leafIds.includes(id);
              const isDragOver = dragOverIndex === idx && dragIndex !== idx;
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragEnter={() => setDragOverIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== idx) {
                      onMoveFavorite(dragIndex, idx);
                    }
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`flex items-center gap-1 rounded border px-2 py-1 text-sm transition ${
                    isDragOver
                      ? "border-amber-500 bg-amber-100"
                      : selected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <span
                    className="cursor-grab select-none text-gray-400"
                    title="드래그로 순서 변경"
                  >
                    ⠿
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(id, leafIds, onLeafChange)}
                    className={`flex-1 text-left truncate ${
                      selected
                        ? "text-orange-700 font-medium"
                        : "text-gray-800"
                    }`}
                  >
                    {node.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveFavorite(idx, idx - 1)}
                    disabled={idx === 0}
                    className="px-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                    title="위로"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveFavorite(idx, idx + 1)}
                    disabled={idx === favoriteNodes.length - 1}
                    className="px-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                    title="아래로"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(id)}
                    className="px-1 text-xs text-amber-500 hover:text-red-500"
                    title="즐겨찾기 해제"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">1단계 · 대분류</h3>
        <div className="flex flex-wrap gap-2">
          {top.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                onTopChange(n.id === topId ? null : n.id);
                onMidChange([]);
                onLeafChange([]);
              }}
              className={`rounded-full px-3 py-1 text-sm border ${
                topId === n.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </section>

      {midNodes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            2단계 · 중분류 (다중 선택)
          </h3>
          <div className="flex flex-wrap gap-2">
            {midNodes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  toggle(n.id, midIds, (ids) => {
                    onMidChange(ids);
                    if (isLeaf(n)) {
                      toggle(n.id, leafIds, onLeafChange);
                    } else {
                      const kept = leafIds.filter((lid) =>
                        n.children?.some((c) => c.id === lid)
                          ? ids.includes(n.id)
                          : true,
                      );
                      onLeafChange(kept);
                    }
                  });
                }}
                className={`rounded-full px-3 py-1 text-sm border ${
                  midIds.includes(n.id)
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
                }`}
              >
                {n.label}
                {!isLeaf(n) && (
                  <span className="ml-1 text-xs opacity-70">
                    ({n.children?.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {leafNodes.length > 0 && (() => {
        const regular = leafNodes.filter((n) => !n.mood);
        const moody = leafNodes.filter((n) => n.mood);
        const renderLeaf = (n: CategoryNode, variant: "regular" | "mood") => {
          const selected = leafIds.includes(n.id);
          const favorited = favoriteIds.includes(n.id);
          const selectedCls =
            variant === "mood"
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-orange-600 text-white border-orange-600";
          const unselectedCls =
            variant === "mood"
              ? "bg-white text-purple-700 border-purple-300 hover:border-purple-500"
              : "bg-white text-gray-700 border-gray-300 hover:border-orange-400";
          return (
            <div
              key={n.id}
              className={`inline-flex items-center rounded-full border text-sm overflow-hidden ${
                selected ? selectedCls : unselectedCls
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(n.id, leafIds, onLeafChange)}
                className="pl-3 py-1"
              >
                {n.label}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(n.id);
                }}
                className={`pl-1 pr-3 py-1 text-sm ${
                  favorited
                    ? selected
                      ? "text-yellow-300"
                      : "text-amber-500"
                    : selected
                      ? "text-white/70 hover:text-yellow-300"
                      : "text-gray-300 hover:text-amber-500"
                }`}
                title={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {favorited ? "★" : "☆"}
              </button>
            </div>
          );
        };
        return (
          <>
            {regular.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  3단계 · 세부 (다중 선택)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {regular.map((n) => renderLeaf(n, "regular"))}
                </div>
              </section>
            )}
            {moody.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-purple-700 mb-1 flex items-center gap-2">
                  <span>✨ 리뷰 기반 추천</span>
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  반경 내 해당 업종을 모두 찾아 최신 블로그 리뷰 20건을 분석해 매칭된 곳만 보여줍니다 (다소 느릴 수 있음).
                </p>
                <div className="flex flex-wrap gap-2">
                  {moody.map((n) => renderLeaf(n, "mood"))}
                </div>
              </section>
            )}
          </>
        );
      })()}
    </div>
  );
}
