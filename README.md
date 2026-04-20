# 단계별 음식점 추천 (Restaurant Picker)

위치 → 반경 → 가격대 → 카테고리(대→중→소) 순서로 좁혀가며 네이버와 구글 검색 결과를 병합해 음식점을 추천하는 웹앱.

## 주요 기능

- 네이버 지도에서 **지점 선택** (클릭 또는 주소검색)
- **반경**: 100m / 200m / 500m / 1km / 2km
- **가격대**: Google `price_level` 0~4 근사치 (상관없음 토글)
- **3단계 카테고리 위저드** + 다중 선택
- 네이버 검색 API + Google Places API 결과를 **좌표+이름 기반으로 중복 제거**
- 어느 단계에서든 **"지금 검색"** 가능 (중분류만 고르고 검색해도 됨)

## 사전 준비 — API 키 3개

> 키 없이도 UI는 켜지지만 검색 결과는 비어 있습니다.

### 1. Naver Cloud Platform — Maps (지도 표시)
1. https://console.ncloud.com 접속 → `AI·NAVER API` → `Maps` → `Application 등록`
2. `Maps JavaScript API` 체크
3. 서비스 환경 등록에 `http://localhost:3000` 추가
4. `Client ID` 복사 → `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`에 붙여넣기

### 2. Naver Developers — 검색 API (로컬 검색)
1. https://developers.naver.com/apps → `Application 등록`
2. 사용 API에 `검색` 체크, 비로그인 오픈 API → 서비스 URL `http://localhost:3000`
3. `Client ID`, `Client Secret` 복사 → `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET`

### 3. Google Cloud — Places API (New)
1. https://console.cloud.google.com → 프로젝트 생성/선택
2. `APIs & Services` → `Library`에서 **Places API (New)** 활성화
3. `Credentials` → `Create API Key`
4. 키에 HTTP referer 제한 (`http://localhost:3000/*`) 권장
5. → `GOOGLE_PLACES_API_KEY`

### .env.local 작성
`.env.local.example`를 `.env.local`로 복사 후 값을 채웁니다.

```bash
cp .env.local.example .env.local
```

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000

## 검증 시나리오

1. 지도에서 서울역 근처 클릭 → 반경 500m → 일식 선택 → 돈카츠 선택 → "지금 검색"
2. 일식 > 돈카츠 + 라멘 다중 선택 → 두 세트가 중복 없이 병합되는지 확인
3. 가격대 `보통 ~ 비쌈` 지정 후 검색 → 구글 price_level 1~3만 표시 (가격정보 없음 포함 토글도 시험)
4. 강남역 1km → 카페 > 브런치 → 구글 `brunch_restaurant` / `cafe` type 활용 확인
5. 키 없는 상태에서도 지도는 로드되는지 (NCP 키만 있으면 지도 OK), 검색 결과 0개일 때 경고 표시 확인

## 구조

```
app/
  page.tsx                       # 메인 위저드
  api/search/route.ts            # 네이버+구글 호출 + dedup
components/
  MapPicker.tsx                  # 네이버 지도 + 반경 원 + 결과 마커
  RadiusSelector.tsx
  PriceRangeSlider.tsx
  CategoryWizard.tsx             # 1~3단계 다중 선택
  ResultList.tsx
lib/
  categories.ts                  # 카테고리 트리 + searchHints
  naverApi.ts                    # 네이버 로컬 검색
  googleApi.ts                   # Places searchText / searchNearby
  dedup.ts                       # 이름 정규화 + Haversine 30m + Dice 유사도 ≥ 0.7
  geo.ts
types/
  restaurant.ts
  naver-maps.d.ts
```

## 제약 및 알려진 한계

- **1인분 평균 가격 ₩ 정확도**: 공식 API에 해당 필드 없음 → Google `price_level` 0~4 근사치. 정확한 금액 필터는 v2에서 내부 DB로 추가 예정.
- **네이버 로컬 검색 결과 수**: API 제약상 쿼리당 최대 5건 (display=5). 다중 카테고리로 쿼리가 늘어나면 커버리지가 개선됨.
- **세부 카테고리(예: 돈카츠) 매칭**: 네이버는 비교적 정확, 구글은 타입 + 키워드 병용으로 근사.
- **해외 지역**: 네이버는 커버리지가 약함 → 구글 단독 결과 비중 증가.
- **네이버 지도 스크립트 파라미터**: 신규 서비스는 `ncpKeyId`, 구버전은 `ncpClientId`. 이 앱은 `ncpKeyId` 사용 (필요 시 `components/MapPicker.tsx`의 URL 수정).

## v2 로드맵

- 사용자 계정 / 즐겨찾기
- 가격 태깅 DB (유저 기여)
- 운영시간 필터
- 해외 지역 폴백 (구글 단독)
