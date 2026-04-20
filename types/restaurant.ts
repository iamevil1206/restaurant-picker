export type Source = "naver" | "google" | "kakao" | "merged";

export type Coord = { lat: number; lng: number };

export type Restaurant = {
  id: string;
  name: string;
  category?: string;
  address?: string;
  roadAddress?: string;
  phone?: string;
  coord: Coord;
  distanceM?: number;
  priceLevel?: number;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  naverPlaceId?: string;
  googlePlaceId?: string;
  kakaoPlaceId?: string;
  naverUrl?: string;
  googleUrl?: string;
  kakaoUrl?: string;
  sources: Source[];
};

export type SearchInput = {
  lat: number;
  lng: number;
  radiusM: number;
  priceMin?: number;
  priceMax?: number;
  categoryLeafIds: string[];
  includeUnknownPrice?: boolean;
  sort?: "distance" | "rating";
  district?: string | null;
};

export type SearchResponse = {
  results: Restaurant[];
  warnings: string[];
  query: {
    keywords: string[];
    googleTypes: string[];
  };
};
