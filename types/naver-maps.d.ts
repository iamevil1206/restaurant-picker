export {};

declare global {
  interface Window {
    naver?: NaverNamespace;
  }

  type LatLngCtor = new (lat: number, lng: number) => NaverLatLng;
  interface NaverLatLng {
    lat(): number;
    lng(): number;
    destinationPoint(bearing: number, distanceM: number): NaverLatLng;
  }

  interface NaverMap {
    setCenter(latlng: NaverLatLng): void;
    panTo(latlng: NaverLatLng): void;
    setZoom(level: number, useEffect?: boolean): void;
    getCenter(): NaverLatLng;
    destroy(): void;
  }

  interface NaverMapOptions {
    center: NaverLatLng;
    zoom?: number;
    zoomControl?: boolean;
    zoomControlOptions?: { position: number };
  }

  interface NaverMarker {
    setMap(map: NaverMap | null): void;
    setPosition(pos: NaverLatLng): void;
    getPosition(): NaverLatLng;
  }

  interface NaverCircle {
    setMap(map: NaverMap | null): void;
    setRadius(r: number): void;
    setCenter(latlng: NaverLatLng): void;
  }

  interface NaverInfoWindow {
    open(map: NaverMap, marker: NaverMarker): void;
    close(): void;
    setContent(html: string): void;
  }

  interface NaverEvent {
    coord: NaverLatLng;
  }

  interface NaverServiceResult {
    status: string;
    v2?: { addresses?: Array<{ x: string; y: string; roadAddress?: string; jibunAddress?: string }> };
  }

  interface NaverReverseArea {
    name?: string;
  }
  interface NaverReverseRegion {
    area1?: NaverReverseArea;
    area2?: NaverReverseArea;
    area3?: NaverReverseArea;
    area4?: NaverReverseArea;
  }
  interface NaverReverseResultEntry {
    region?: NaverReverseRegion;
    land?: unknown;
  }
  interface NaverReverseResult {
    v2?: {
      results?: NaverReverseResultEntry[];
      address?: { jibunAddress?: string; roadAddress?: string };
    };
  }

  interface NaverNamespace {
    maps: {
      Map: new (el: HTMLElement, opts: NaverMapOptions) => NaverMap;
      LatLng: LatLngCtor;
      Marker: new (opts: {
        position: NaverLatLng;
        map: NaverMap;
        title?: string;
        icon?: unknown;
      }) => NaverMarker;
      Circle: new (opts: {
        map: NaverMap;
        center: NaverLatLng;
        radius: number;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
      }) => NaverCircle;
      InfoWindow: new (opts: { content: string }) => NaverInfoWindow;
      Event: {
        addListener(
          target: unknown,
          eventName: string,
          handler: (e: NaverEvent) => void,
        ): void;
        removeListener(listener: unknown): void;
      };
      Service?: {
        geocode(
          opts: { query: string },
          cb: (status: string, result: NaverServiceResult) => void,
        ): void;
        reverseGeocode(
          opts: { coords: NaverLatLng; orders?: string },
          cb: (status: string, result: NaverReverseResult) => void,
        ): void;
        Status: { OK: string; ERROR: string };
        OrderType: { ADDR: string; ROAD_ADDR: string; LEGAL_CODE: string; ADM_CODE: string };
      };
      Position: {
        TOP_RIGHT: number;
        TOP_LEFT: number;
        BOTTOM_RIGHT: number;
        BOTTOM_LEFT: number;
      };
    };
  }
}
