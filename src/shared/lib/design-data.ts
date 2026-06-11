export type NbAccent = "terracotta" | "sage" | "plum";

export interface NbPost {
  id: string;
  slug: string;
  cat: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  date: string;
  readTime: string;
  tags: string[];
  cover: string;
  accent: NbAccent;
}

export const TECH_POSTS: NbPost[] = [
  {
    id: "t1",
    slug: "react-19-use-hook",
    cat: "FE",
    title: "React 19의 use() Hook, 정말로 깊게",
    titleEn: "Getting weird with React 19's use()",
    excerpt:
      "Suspense와 결합했을 때의 렌더링 모델을 직접 그려보며 정리한 노트. 콘텍스트 안과 밖에서의 행동이 어떻게 다른지.",
    excerptEn:
      "Drawing the render model by hand to figure out what use() does in and out of Suspense.",
    date: "2026.05.18",
    readTime: "12분",
    tags: ["react", "suspense", "frontend"],
    cover: "frontend",
    accent: "terracotta",
  },
  {
    id: "t2",
    slug: "tiny-vector-db",
    cat: "AI",
    title: "작은 벡터 DB 직접 만들어보기",
    titleEn: "Building a tiny vector DB from scratch",
    excerpt:
      "HNSW를 200줄 파이썬으로 직접 짜보면서 인덱스가 왜 그렇게 생겼는지 비로소 이해했다.",
    excerptEn:
      "200 lines of Python, one HNSW index, and finally an intuition for why it's shaped that way.",
    date: "2026.05.04",
    readTime: "18분",
    tags: ["ai", "python", "vectordb"],
    cover: "ai",
    accent: "sage",
  },
  {
    id: "t3",
    slug: "css-container-queries",
    cat: "FE",
    title: "CSS @container 쿼리 실전 가이드",
    titleEn: "Container queries, for real this time",
    excerpt:
      "미디어 쿼리만 쓰던 손가락을 굳이 풀어가며. 카드 컴포넌트 하나를 6가지 컨텍스트에서 다시 그렸다.",
    excerptEn:
      "Six contexts, one card. Container queries finally make sense once you redraw the same card six times.",
    date: "2026.04.22",
    readTime: "9분",
    tags: ["css", "frontend", "layout"],
    cover: "css",
    accent: "plum",
  },
  {
    id: "t4",
    slug: "llm-kv-cache",
    cat: "AI",
    title: "LLM 추론 최적화 노트: KV 캐시",
    titleEn: "Inference notes: the KV cache, briefly",
    excerpt:
      "왜 토큰 길이가 두 배가 되면 메모리가 네 배가 되는가. 그림 한 장으로 끝내려는 시도.",
    excerptEn:
      "Why does memory go up 4× when sequence length doubles? One diagram, hopefully enough.",
    date: "2026.04.10",
    readTime: "7분",
    tags: ["ai", "llm", "systems"],
    cover: "llm",
    accent: "terracotta",
  },
  {
    id: "t5",
    slug: "suspense-async-patterns",
    cat: "FE",
    title: "Suspense와 비동기 데이터의 다섯 가지 패턴",
    titleEn: "Five patterns for async data with Suspense",
    excerpt:
      "로딩 UI를 어디까지 미루는 것이 사용자에게 친절한가. 다섯 가지 패턴, 다섯 가지 트레이드오프.",
    excerptEn:
      "How late can a loading state arrive before it feels rude? Five patterns, five trade-offs.",
    date: "2026.03.27",
    readTime: "14분",
    tags: ["react", "frontend", "ux"],
    cover: "suspense",
    accent: "sage",
  },
];

export const HOBBY_POSTS: NbPost[] = [
  {
    id: "h1",
    slug: "city-3241",
    cat: "축구",
    title: "맨시티의 3-2-4-1 빌드업, 다시 그려보기",
    titleEn: "Re-drawing City's 3-2-4-1 build-up",
    excerpt:
      "풀백이 미드필더가 되는 그 순간. 칠판을 다시 펴고 화살표를 그려가며 정리한 메모.",
    excerptEn:
      "The exact second the fullback becomes a midfielder. Chalkboard out, arrows redrawn.",
    date: "2026.05.21",
    readTime: "8분",
    tags: ["축구", "전술", "맨시티"],
    cover: "tactics",
    accent: "sage",
  },
  {
    id: "h2",
    slug: "may-reading-notes",
    cat: "독서",
    title: "5월의 독서 노트: 세 권을 한꺼번에",
    titleEn: "May reading notes: three at once",
    excerpt:
      "병렬 독서가 가능할까. 세 권을 한 달 안에 펼친 결과는 의외로 정돈된 메모로 남았다.",
    excerptEn:
      "Can you really read three books in parallel? Turns out, my notes came out tidier than I expected.",
    date: "2026.05.16",
    readTime: "6분",
    tags: ["독서", "에세이", "월간노트"],
    cover: "books",
    accent: "plum",
  },
  {
    id: "h3",
    slug: "elden-ring-dlc",
    cat: "게임",
    title: "Elden Ring DLC, 두 번째 클리어 후기",
    titleEn: "Elden Ring DLC, second clear thoughts",
    excerpt:
      "같은 보스를 다시 만났을 때 비로소 보이는 안무. 두 번째에야 이해한 것들.",
    excerptEn:
      "The choreography only reveals itself on the second clear. What I missed the first time.",
    date: "2026.05.09",
    readTime: "11분",
    tags: ["게임", "리뷰", "soulslike"],
    cover: "game",
    accent: "terracotta",
  },
  {
    id: "h4",
    slug: "north-london-derby",
    cat: "축구",
    title: "노스 런던 더비, 90분 동안 일어난 일",
    titleEn: "North London Derby, minute by minute",
    excerpt:
      "점수 외에 기록할 만한 것들. 우리 팀의 두 번째 골이 만들어진 길을 분 단위로 따라간다.",
    excerptEn:
      "Other things worth remembering. Tracing the second goal minute by minute.",
    date: "2026.04.28",
    readTime: "10분",
    tags: ["축구", "리뷰", "토트넘"],
    cover: "derby",
    accent: "plum",
  },
  {
    id: "h5",
    slug: "unfinished-books",
    cat: "독서",
    title: "읽다 만 책에 대하여",
    titleEn: "In defense of unfinished books",
    excerpt: "끝까지 못 읽은 책이 늘어간다. 부끄러운 일이 아니라는 짧은 변호.",
    excerptEn:
      "A growing pile of unfinished books. A short defense of why that's okay.",
    date: "2026.04.15",
    readTime: "4분",
    tags: ["독서", "에세이"],
    cover: "unfinished",
    accent: "sage",
  },
];

export interface NbTag {
  name: string;
  count: number;
  kind: "tech" | "hobby";
}

export const ALL_TAGS: NbTag[] = [
  { name: "frontend", count: 14, kind: "tech" },
  { name: "react", count: 9, kind: "tech" },
  { name: "ai", count: 7, kind: "tech" },
  { name: "python", count: 6, kind: "tech" },
  { name: "css", count: 5, kind: "tech" },
  { name: "llm", count: 4, kind: "tech" },
  { name: "suspense", count: 3, kind: "tech" },
  { name: "systems", count: 3, kind: "tech" },
  { name: "layout", count: 2, kind: "tech" },
  { name: "축구", count: 12, kind: "hobby" },
  { name: "독서", count: 9, kind: "hobby" },
  { name: "게임", count: 6, kind: "hobby" },
  { name: "전술", count: 5, kind: "hobby" },
  { name: "리뷰", count: 5, kind: "hobby" },
  { name: "에세이", count: 4, kind: "hobby" },
  { name: "맨시티", count: 3, kind: "hobby" },
  { name: "토트넘", count: 3, kind: "hobby" },
  { name: "월간노트", count: 2, kind: "hobby" },
  { name: "soulslike", count: 2, kind: "hobby" },
];

export function accentVar(accent: NbAccent): string {
  if (accent === "sage") return "var(--nb-sage)";
  if (accent === "plum") return "var(--nb-pink)";
  return "var(--nb-butter)";
}

export function accentTint(accent: NbAccent): string {
  if (accent === "sage") return "#BCCFA4";
  if (accent === "plum") return "#E6BAA9";
  return "#E3CB87";
}

// Font stacks
export const NB_HAND = "'Caveat', 'Gowun Dodum', cursive";
export const NB_HAND2 = "'Kalam', 'Gaegu', cursive";
export const NB_BODY = "'Lora', 'Gowun Batang', Georgia, serif";
export const NB_SANS = "'Gowun Dodum', 'Kalam', system-ui, sans-serif";
export const NB_MONO = "'IBM Plex Mono', ui-monospace, monospace";
