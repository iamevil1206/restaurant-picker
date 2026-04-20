"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadFavorites, saveFavorites } from "@/lib/favorites";

export type UseFavorites = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  move: (from: number, to: number) => void;
  hydrated: boolean;
};

export function useFavorites(): UseFavorites {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydratedRef.current) saveFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggle = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((x) => x !== id));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setFavorites((prev) => {
      if (
        from === to ||
        from < 0 ||
        from >= prev.length ||
        to < 0 ||
        to >= prev.length
      )
        return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }, []);

  return { favorites, isFavorite, toggle, remove, move, hydrated };
}
