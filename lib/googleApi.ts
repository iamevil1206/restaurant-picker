import type { Restaurant } from "@/types/restaurant";
import { haversineMeters } from "./geo";

type GoogleLocation = { latitude: number; longitude: number };
type GooglePlace = {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: GoogleLocation;
  rating?: number;
  userRatingCount?: number;
  priceLevel?:
    | "PRICE_LEVEL_UNSPECIFIED"
    | "PRICE_LEVEL_FREE"
    | "PRICE_LEVEL_INEXPENSIVE"
    | "PRICE_LEVEL_MODERATE"
    | "PRICE_LEVEL_EXPENSIVE"
    | "PRICE_LEVEL_VERY_EXPENSIVE";
  types?: string[];
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  currentOpeningHours?: { openNow?: boolean };
};

type GoogleSearchResponse = {
  places?: GooglePlace[];
};

const PRICE_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const PRICE_ENUM = [
  "PRICE_LEVEL_FREE",
  "PRICE_LEVEL_INEXPENSIVE",
  "PRICE_LEVEL_MODERATE",
  "PRICE_LEVEL_EXPENSIVE",
  "PRICE_LEVEL_VERY_EXPENSIVE",
] as const;

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.googleMapsUri",
  "places.nationalPhoneNumber",
  "places.currentOpeningHours.openNow",
].join(",");

function normalize(
  place: GooglePlace,
  center: { lat: number; lng: number },
): Restaurant | null {
  if (!place.location) return null;
  const coord = { lat: place.location.latitude, lng: place.location.longitude };
  const distanceM = haversineMeters(center, coord);
  const priceLevel =
    place.priceLevel && PRICE_MAP[place.priceLevel] !== undefined
      ? PRICE_MAP[place.priceLevel]
      : undefined;
  return {
    id: `google:${place.id}`,
    name: place.displayName?.text ?? "(unknown)",
    category: place.types?.[0],
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber,
    coord,
    distanceM,
    priceLevel,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openNow: place.currentOpeningHours?.openNow,
    googlePlaceId: place.id,
    googleUrl: place.googleMapsUri,
    sources: ["google"],
  };
}

export async function searchGoogleText(
  textQuery: string,
  center: { lat: number; lng: number },
  radiusM: number,
  opts: { priceMin?: number; priceMax?: number } = {},
): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const priceLevels: string[] = [];
  const min = opts.priceMin ?? 0;
  const max = opts.priceMax ?? 4;
  for (let i = min; i <= max; i++) {
    if (PRICE_ENUM[i]) priceLevels.push(PRICE_ENUM[i]);
  }

  const body: Record<string, unknown> = {
    textQuery,
    maxResultCount: 20,
    languageCode: "ko",
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusM,
      },
    },
  };
  if (priceLevels.length > 0 && priceLevels.length < 5) {
    body.priceLevels = priceLevels;
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google searchText failed: ${res.status} ${text}`);
  }
  const data: GoogleSearchResponse = await res.json();
  const places = data.places ?? [];
  return places
    .map((p) => normalize(p, center))
    .filter((x): x is Restaurant => x !== null)
    .filter((r) => (r.distanceM ?? 0) <= radiusM);
}

export async function searchGoogleNearby(
  includedTypes: string[],
  center: { lat: number; lng: number },
  radiusM: number,
): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || includedTypes.length === 0) return [];

  const body = {
    includedTypes,
    maxResultCount: 20,
    languageCode: "ko",
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: Math.min(radiusM, 50000),
      },
    },
  };

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google searchNearby failed: ${res.status} ${text}`);
  }
  const data: GoogleSearchResponse = await res.json();
  const places = data.places ?? [];
  return places
    .map((p) => normalize(p, center))
    .filter((x): x is Restaurant => x !== null);
}
