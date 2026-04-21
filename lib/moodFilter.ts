import type { Restaurant } from "@/types/restaurant";
import { searchNaverBlog } from "./naverApi";
import { MOOD_LABELS, MOOD_TRIGGERS, type MoodKind } from "./categories";

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function matchedTrigger(haystack: string, triggers: string[]): string | null {
  for (const t of triggers) {
    if (haystack.includes(t)) return t;
  }
  return null;
}

async function runPool<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const size = Math.min(concurrency, items.length);
  if (size === 0) return;
  let next = 0;
  const runners = Array.from({ length: size }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

export type MoodFilterResult = {
  matchedByKind: Record<MoodKind, Set<string>>;
  errors: string[];
  postsFetched: number;
};

export async function filterRestaurantsByMood(
  restaurants: Restaurant[],
  moods: MoodKind[],
  district: string | null,
  opts: { concurrency?: number; display?: number } = {},
): Promise<MoodFilterResult> {
  const matchedByKind = Object.fromEntries(
    (Object.keys(MOOD_LABELS) as MoodKind[]).map((k) => [k, new Set<string>()]),
  ) as Record<MoodKind, Set<string>>;
  const errors: string[] = [];
  let postsFetched = 0;

  if (restaurants.length === 0 || moods.length === 0) {
    return { matchedByKind, errors, postsFetched };
  }

  const districtPart = district?.trim() ? `${district.trim()} ` : "";
  const concurrency = opts.concurrency ?? 8;
  const display = opts.display ?? 20;

  await runPool(
    restaurants,
    async (r) => {
      const query = `${districtPart}${r.name}`;
      try {
        const items = await searchNaverBlog(query, { display });
        postsFetched += items.length;
        const haystack = items
          .map((i) => `${stripTags(i.title)} ${stripTags(i.description)}`)
          .join(" ");
        for (const kind of moods) {
          if (matchedTrigger(haystack, MOOD_TRIGGERS[kind]) !== null) {
            matchedByKind[kind].add(r.id);
          }
        }
      } catch (e) {
        errors.push(`${r.name}: ${(e as Error).message}`);
      }
    },
    concurrency,
  );

  return { matchedByKind, errors, postsFetched };
}
