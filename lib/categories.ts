export type SearchHints = {
  naverKeywords: string[];
  googleTypes?: string[];
  googleKeyword?: string;
};

export type CategoryNode = {
  id: string;
  label: string;
  children?: CategoryNode[];
  searchHints?: SearchHints;
};

const leaf = (
  id: string,
  label: string,
  searchHints: SearchHints,
): CategoryNode => ({ id, label, searchHints });

export const CATEGORY_TREE: CategoryNode[] = [
  {
    id: "restaurant",
    label: "음식점",
    children: [
      {
        id: "korean",
        label: "한식",
        children: [
          leaf("kr-set", "한정식", {
            naverKeywords: ["한정식"],
            googleTypes: ["korean_restaurant", "fine_dining_restaurant"],
            googleKeyword: "한정식",
          }),
          leaf("kr-soup", "국밥/탕/해장국", {
            naverKeywords: ["국밥", "해장국", "설렁탕", "곰탕"],
            googleTypes: ["korean_restaurant"],
            googleKeyword: "국밥 해장국",
          }),
          leaf("kr-stew", "찌개/전골", {
            naverKeywords: ["찌개", "전골", "김치찌개", "부대찌개"],
            googleTypes: ["korean_restaurant"],
            googleKeyword: "찌개 전골",
          }),
          leaf("kr-grill", "구이/고기집", {
            naverKeywords: ["삼겹살", "갈비", "고깃집", "소고기", "돼지갈비"],
            googleTypes: ["barbecue_restaurant", "korean_restaurant"],
            googleKeyword: "삼겹살 고깃집",
          }),
          leaf("kr-bunsik", "분식", {
            naverKeywords: ["분식", "떡볶이", "김밥"],
            googleTypes: ["korean_restaurant", "fast_food_restaurant"],
            googleKeyword: "분식 떡볶이",
          }),
          leaf("kr-noodle", "한식 면요리", {
            naverKeywords: ["칼국수", "냉면", "잔치국수", "수제비"],
            googleTypes: ["korean_restaurant"],
            googleKeyword: "칼국수 냉면",
          }),
          leaf("kr-porridge", "죽", {
            naverKeywords: ["죽"],
            googleKeyword: "죽 전문점",
          }),
          leaf("kr-bibim", "비빔밥/덮밥", {
            naverKeywords: ["비빔밥", "덮밥", "한식덮밥"],
            googleTypes: ["korean_restaurant"],
            googleKeyword: "비빔밥",
          }),
          leaf("kr-bar", "한식 술집/안주", {
            naverKeywords: ["한식주점", "포장마차", "전집", "막걸리"],
            googleTypes: ["bar", "korean_restaurant"],
            googleKeyword: "한식주점 막걸리",
          }),
          leaf("kr-jokbal", "족발/보쌈", {
            naverKeywords: ["족발", "보쌈"],
            googleKeyword: "족발 보쌈",
          }),
          leaf("kr-chicken", "치킨", {
            naverKeywords: ["치킨", "후라이드치킨"],
            googleTypes: ["fast_food_restaurant"],
            googleKeyword: "치킨",
          }),
        ],
      },
      {
        id: "chinese",
        label: "중식",
        children: [
          leaf("cn-classic", "중화요리(짜장/짬뽕)", {
            naverKeywords: ["중국집", "짜장면", "짬뽕"],
            googleTypes: ["chinese_restaurant"],
            googleKeyword: "중국집 짜장면",
          }),
          leaf("cn-dimsum", "딤섬/만두", {
            naverKeywords: ["딤섬", "만두", "샤오롱바오"],
            googleTypes: ["chinese_restaurant"],
            googleKeyword: "딤섬 만두",
          }),
          leaf("cn-hotpot", "훠궈/마라탕", {
            naverKeywords: ["훠궈", "마라탕", "마라샹궈"],
            googleTypes: ["chinese_restaurant"],
            googleKeyword: "훠궈 마라탕",
          }),
          leaf("cn-lamb", "양꼬치/중국식 꼬치", {
            naverKeywords: ["양꼬치"],
            googleTypes: ["chinese_restaurant"],
            googleKeyword: "양꼬치",
          }),
          leaf("cn-sichuan", "사천요리", {
            naverKeywords: ["사천요리", "사천음식"],
            googleTypes: ["chinese_restaurant"],
            googleKeyword: "사천요리",
          }),
          leaf("cn-taiwanese", "대만식", {
            naverKeywords: ["대만음식", "루로우판"],
            googleTypes: ["chinese_restaurant"],
            googleKeyword: "대만음식",
          }),
        ],
      },
      {
        id: "japanese",
        label: "일식",
        children: [
          leaf("jp-tonkatsu", "돈카츠", {
            naverKeywords: ["돈카츠", "돈까스"],
            googleKeyword: "돈카츠",
          }),
          leaf("jp-sushi", "스시/회", {
            naverKeywords: ["스시", "초밥", "회", "사시미"],
            googleTypes: ["sushi_restaurant", "japanese_restaurant"],
            googleKeyword: "스시 초밥",
          }),
          leaf("jp-ramen", "라멘", {
            naverKeywords: ["라멘", "라면전문"],
            googleTypes: ["ramen_restaurant"],
            googleKeyword: "라멘",
          }),
          leaf("jp-udon", "우동/소바", {
            naverKeywords: ["우동", "소바"],
            googleTypes: ["japanese_restaurant"],
            googleKeyword: "우동 소바",
          }),
          leaf("jp-donburi", "덮밥(규동/가츠동)", {
            naverKeywords: ["규동", "덮밥", "가츠동", "오야코동"],
            googleTypes: ["japanese_restaurant"],
            googleKeyword: "일식 덮밥",
          }),
          leaf("jp-izakaya", "이자카야", {
            naverKeywords: ["이자카야", "일본식주점"],
            googleTypes: ["bar", "japanese_restaurant"],
            googleKeyword: "이자카야",
          }),
          leaf("jp-yakitori", "야키토리/꼬치", {
            naverKeywords: ["야키토리", "꼬치구이"],
            googleTypes: ["japanese_restaurant"],
            googleKeyword: "야키토리",
          }),
          leaf("jp-okonomi", "오코노미야키/타코야키", {
            naverKeywords: ["오코노미야키", "타코야키"],
            googleKeyword: "오코노미야키 타코야키",
          }),
          leaf("jp-kaiseki", "가이세키/일본정식", {
            naverKeywords: ["가이세키", "일본정식"],
            googleTypes: ["fine_dining_restaurant", "japanese_restaurant"],
            googleKeyword: "가이세키",
          }),
          leaf("jp-teppan", "철판구이", {
            naverKeywords: ["철판구이", "텟판야키"],
            googleKeyword: "철판구이",
          }),
        ],
      },
      {
        id: "western",
        label: "양식",
        children: [
          leaf("w-pasta", "파스타/이탈리안", {
            naverKeywords: ["파스타", "이탈리안"],
            googleTypes: ["italian_restaurant"],
            googleKeyword: "파스타",
          }),
          leaf("w-pizza", "피자", {
            naverKeywords: ["피자"],
            googleTypes: ["pizza_restaurant"],
            googleKeyword: "피자",
          }),
          leaf("w-steak", "스테이크", {
            naverKeywords: ["스테이크", "스테이크하우스"],
            googleTypes: ["steak_house"],
            googleKeyword: "스테이크",
          }),
          leaf("w-french", "프렌치", {
            naverKeywords: ["프렌치", "프랑스요리"],
            googleTypes: ["french_restaurant"],
            googleKeyword: "프렌치 레스토랑",
          }),
          leaf("w-burger", "버거/아메리칸", {
            naverKeywords: ["수제버거", "버거"],
            googleTypes: ["hamburger_restaurant"],
            googleKeyword: "수제버거",
          }),
          leaf("w-bbq", "바베큐/그릴", {
            naverKeywords: ["바베큐", "스모크"],
            googleTypes: ["barbecue_restaurant"],
            googleKeyword: "바베큐",
          }),
          leaf("w-spanish", "스페인/타파스", {
            naverKeywords: ["스페인음식", "타파스"],
            googleTypes: ["spanish_restaurant"],
            googleKeyword: "스페인 타파스",
          }),
          leaf("w-mediterranean", "지중해", {
            naverKeywords: ["지중해요리"],
            googleTypes: ["mediterranean_restaurant"],
            googleKeyword: "지중해 요리",
          }),
          leaf("w-brunch", "브런치/올데이", {
            naverKeywords: ["브런치"],
            googleTypes: ["brunch_restaurant", "breakfast_restaurant"],
            googleKeyword: "브런치",
          }),
        ],
      },
      {
        id: "sea",
        label: "동남아식",
        children: [
          leaf("sea-thai", "태국", {
            naverKeywords: ["태국음식", "팟타이", "똠얌꿍"],
            googleTypes: ["thai_restaurant"],
            googleKeyword: "태국음식",
          }),
          leaf("sea-vn-pho", "쌀국수", {
            naverKeywords: ["쌀국수", "포"],
            googleTypes: ["vietnamese_restaurant"],
            googleKeyword: "쌀국수",
          }),
          leaf("sea-vn-banhmi", "반미/베트남 가정식", {
            naverKeywords: ["반미", "베트남음식"],
            googleTypes: ["vietnamese_restaurant"],
            googleKeyword: "반미 베트남음식",
          }),
          leaf("sea-malay", "말레이/싱가포르", {
            naverKeywords: ["말레이시아음식", "싱가포르음식", "락사"],
            googleKeyword: "말레이시아 싱가포르 음식",
          }),
          leaf("sea-indo", "인도네시아", {
            naverKeywords: ["인도네시아음식", "나시고렝"],
            googleTypes: ["indonesian_restaurant"],
            googleKeyword: "인도네시아 음식",
          }),
          leaf("sea-ph", "필리핀", {
            naverKeywords: ["필리핀음식"],
            googleKeyword: "필리핀 음식",
          }),
        ],
      },
      {
        id: "indian",
        label: "인도",
        children: [
          leaf("in-curry", "북인도 커리", {
            naverKeywords: ["인도커리", "북인도", "치킨마살라"],
            googleTypes: ["indian_restaurant"],
            googleKeyword: "인도 커리",
          }),
          leaf("in-south", "남인도/도사", {
            naverKeywords: ["남인도", "도사"],
            googleTypes: ["indian_restaurant"],
            googleKeyword: "남인도 도사",
          }),
          leaf("in-biryani", "비리야니", {
            naverKeywords: ["비리야니"],
            googleTypes: ["indian_restaurant"],
            googleKeyword: "비리야니",
          }),
          leaf("in-tandoor", "탄두리/난", {
            naverKeywords: ["탄두리", "난", "인도식빵"],
            googleTypes: ["indian_restaurant"],
            googleKeyword: "탄두리 난",
          }),
        ],
      },
      {
        id: "me",
        label: "중동",
        children: [
          leaf("me-kebab", "케밥/샤와르마", {
            naverKeywords: ["케밥", "샤와르마"],
            googleTypes: ["middle_eastern_restaurant"],
            googleKeyword: "케밥",
          }),
          leaf("me-hummus", "후무스/메제", {
            naverKeywords: ["후무스", "메제", "팔라펠"],
            googleTypes: ["middle_eastern_restaurant"],
            googleKeyword: "후무스 팔라펠",
          }),
          leaf("me-turkish", "튀르키예/터키", {
            naverKeywords: ["터키음식", "튀르키예"],
            googleTypes: ["turkish_restaurant"],
            googleKeyword: "터키 음식",
          }),
          leaf("me-iran", "이란/페르시아", {
            naverKeywords: ["이란음식", "페르시아"],
            googleKeyword: "이란 음식",
          }),
        ],
      },
      {
        id: "latin",
        label: "중남미",
        children: [
          leaf("la-taco", "타코", {
            naverKeywords: ["타코", "멕시칸"],
            googleTypes: ["mexican_restaurant"],
            googleKeyword: "타코",
          }),
          leaf("la-burrito", "부리토/퀘사디아", {
            naverKeywords: ["부리토", "퀘사디아"],
            googleTypes: ["mexican_restaurant"],
            googleKeyword: "부리토",
          }),
          leaf("la-peru", "페루/세비체", {
            naverKeywords: ["페루음식", "세비체"],
            googleKeyword: "페루 음식 세비체",
          }),
          leaf("la-brazil", "브라질/슈하스코", {
            naverKeywords: ["브라질음식", "슈하스코"],
            googleTypes: ["brazilian_restaurant"],
            googleKeyword: "슈하스코",
          }),
          leaf("la-argentina", "아르헨티나/남미 그릴", {
            naverKeywords: ["아르헨티나", "남미 스테이크"],
            googleKeyword: "아르헨티나 스테이크",
          }),
        ],
      },
      {
        id: "africa",
        label: "아프리카",
        children: [
          leaf("af-eth", "에티오피아", {
            naverKeywords: ["에티오피아음식", "인제라"],
            googleKeyword: "에티오피아 음식",
          }),
          leaf("af-morocco", "모로코", {
            naverKeywords: ["모로코음식", "타진"],
            googleKeyword: "모로코 요리",
          }),
          leaf("af-south", "남아프리카/아프리카 기타", {
            naverKeywords: ["남아공", "아프리카음식"],
            googleKeyword: "아프리카 음식",
          }),
        ],
      },
      {
        id: "fusion",
        label: "퓨전/무국적",
        children: [
          leaf("fu-fusion", "퓨전 다이닝", {
            naverKeywords: ["퓨전", "무국적"],
            googleKeyword: "퓨전 레스토랑",
          }),
          leaf("fu-buffet", "뷔페", {
            naverKeywords: ["뷔페"],
            googleTypes: ["buffet_restaurant"],
            googleKeyword: "뷔페",
          }),
        ],
      },
      {
        id: "other",
        label: "기타",
        children: [
          leaf("ot-sandwich", "샌드위치", {
            naverKeywords: ["샌드위치", "서브웨이"],
            googleTypes: ["sandwich_shop"],
            googleKeyword: "샌드위치",
          }),
          leaf("ot-salad", "샐러드", {
            naverKeywords: ["샐러드"],
            googleKeyword: "샐러드 전문점",
          }),
          leaf("ot-vegan", "비건/채식", {
            naverKeywords: ["비건", "채식", "베지테리언"],
            googleTypes: ["vegan_restaurant", "vegetarian_restaurant"],
            googleKeyword: "비건 채식",
          }),
          leaf("ot-seafood", "해산물/조개구이", {
            naverKeywords: ["해산물", "조개구이", "회센터"],
            googleTypes: ["seafood_restaurant"],
            googleKeyword: "해산물",
          }),
          leaf("ot-fastfood", "패스트푸드", {
            naverKeywords: ["패스트푸드", "햄버거"],
            googleTypes: ["fast_food_restaurant"],
            googleKeyword: "패스트푸드",
          }),
        ],
      },
    ],
  },
  {
    id: "cafe",
    label: "카페",
    children: [
      leaf("cf-specialty", "스페셜티 커피", {
        naverKeywords: ["스페셜티커피", "로스터리카페"],
        googleTypes: ["coffee_shop"],
        googleKeyword: "스페셜티 커피",
      }),
      leaf("cf-brunch", "브런치 카페", {
        naverKeywords: ["브런치카페"],
        googleTypes: ["brunch_restaurant", "cafe"],
        googleKeyword: "브런치 카페",
      }),
      leaf("cf-dessert", "디저트 카페", {
        naverKeywords: ["디저트카페", "케이크"],
        googleTypes: ["dessert_restaurant", "cafe"],
        googleKeyword: "디저트 카페",
      }),
      leaf("cf-bakery", "베이커리", {
        naverKeywords: ["베이커리", "빵집"],
        googleTypes: ["bakery"],
        googleKeyword: "베이커리 빵집",
      }),
      leaf("cf-trad", "전통 찻집", {
        naverKeywords: ["전통찻집", "찻집"],
        googleTypes: ["tea_house"],
        googleKeyword: "전통 찻집",
      }),
      leaf("cf-theme", "테마 카페", {
        naverKeywords: ["테마카페", "북카페", "보드게임카페"],
        googleTypes: ["cafe"],
        googleKeyword: "테마 카페",
      }),
      leaf("cf-franchise", "프랜차이즈 카페", {
        naverKeywords: ["스타벅스", "투썸플레이스", "이디야"],
        googleTypes: ["coffee_shop", "cafe"],
        googleKeyword: "프랜차이즈 카페",
      }),
      leaf("cf-boba", "버블티/밀크티", {
        naverKeywords: ["버블티", "공차", "밀크티"],
        googleTypes: ["cafe"],
        googleKeyword: "버블티",
      }),
      leaf("cf-juice", "주스/스무디", {
        naverKeywords: ["주스", "스무디"],
        googleTypes: ["juice_shop"],
        googleKeyword: "주스 스무디",
      }),
    ],
  },
];

function walk(nodes: CategoryNode[], acc: Map<string, CategoryNode>) {
  for (const n of nodes) {
    acc.set(n.id, n);
    if (n.children) walk(n.children, acc);
  }
}

const BY_ID: Map<string, CategoryNode> = (() => {
  const m = new Map<string, CategoryNode>();
  walk(CATEGORY_TREE, m);
  return m;
})();

export function getNode(id: string): CategoryNode | undefined {
  return BY_ID.get(id);
}

export function getLeafHints(id: string): SearchHints | undefined {
  const node = BY_ID.get(id);
  return node?.searchHints;
}

function collectLeafHints(node: CategoryNode, acc: SearchHints[]): void {
  if (node.searchHints && isLeaf(node)) {
    acc.push(node.searchHints);
    return;
  }
  if (node.children) {
    for (const c of node.children) collectLeafHints(c, acc);
  }
}

export function getSubtreeHints(id: string): SearchHints[] {
  const node = BY_ID.get(id);
  if (!node) return [];
  const acc: SearchHints[] = [];
  collectLeafHints(node, acc);
  return acc;
}

export function isLeaf(node: CategoryNode): boolean {
  return !node.children || node.children.length === 0;
}

export function allLeafIds(): string[] {
  const ids: string[] = [];
  for (const n of BY_ID.values()) if (isLeaf(n)) ids.push(n.id);
  return ids;
}
