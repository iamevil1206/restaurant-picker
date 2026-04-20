"use client";

import { useMemo } from "react";
import { CATEGORY_TREE, type CategoryNode, isLeaf } from "@/lib/categories";

type Props = {
  topId: string | null;
  midIds: string[];
  leafIds: string[];
  onTopChange: (id: string | null) => void;
  onMidChange: (ids: string[]) => void;
  onLeafChange: (ids: string[]) => void;
};

export default function CategoryWizard({
  topId,
  midIds,
  leafIds,
  onTopChange,
  onMidChange,
  onLeafChange,
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

  return (
    <div className="flex flex-col gap-4">
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

      {leafNodes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            3단계 · 세부 (다중 선택)
          </h3>
          <div className="flex flex-wrap gap-2">
            {leafNodes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => toggle(n.id, leafIds, onLeafChange)}
                className={`rounded-full px-3 py-1 text-sm border ${
                  leafIds.includes(n.id)
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
