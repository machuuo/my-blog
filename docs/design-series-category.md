# Series & Category 시스템 설계서

> posts를 series(컨셉)로 그룹핑하고, series는 category(코드 테이블)로 상위 분류하는 3계층 구조.

## 1. 데이터 모델

### 1.1 계층 구조

```
category (코드 테이블, 고정)
  └─ series (컨셉, 동적)
       └─ post (글)
```

### 1.2 ERD

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  categories  │       │     series       │       │     posts        │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ category_id  │──1:N─▶│ series_id        │──1:N─▶│ post_id          │
│ name         │       │ category_id (FK) │       │ series_id (FK?)  │
│ slug         │       │ title            │       │ slug             │
│ display_order│       │ description      │       │ title            │
│              │       │ thumbnail_url?   │       │ description      │
│              │       │ slug             │       │ content          │
│              │       │ display_order    │       │ tags             │
│              │       │ published        │       │ display_order?   │
│              │       │ created_at       │       │ published        │
│              │       │ updated_at       │       │ created_at       │
│              │       │                  │       │ updated_at       │
└──────────────┘       └──────────────────┘       └──────────────────┘
```

### 1.3 관계 & 제약

| 관계 | 유형 | 제약 |
|------|------|------|
| category → series | 1:N | series는 **반드시** category에 속함 |
| series → post | 1:N | post는 series에 속하지 않을 수 있음 (**nullable**) |

- `series_id`가 null인 post → UI에서 "기타"로 표시 (DB에 기타 레코드 없음)

### 1.4 정렬 규칙

| 대상 | 기준 |
|------|------|
| categories | `display_order ASC` |
| series (카테고리 내) | `display_order ASC` |
| posts (series 내) | `display_order ASC` |
| posts (기타/미소속) | `created_at DESC` |

---

## 2. DB 스키마 (Supabase PostgreSQL)

### 2.1 categories 테이블

```sql
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_categories_display_order ON categories (display_order ASC);

-- RLS: 누구나 읽기 가능 (코드 테이블)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (true);
```

### 2.2 series 테이블

```sql
CREATE TABLE series (
  series_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  thumbnail_url TEXT,
  slug          TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_series_category ON series (category_id, display_order ASC);
CREATE INDEX idx_series_slug ON series (slug);
CREATE INDEX idx_series_published ON series (published, display_order ASC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER set_series_updated_at
  BEFORE UPDATE ON series
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: published=true만 공개
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_select_published" ON series
  FOR SELECT USING (published = true);
```

### 2.3 posts 테이블 변경

```sql
-- 기존 id → post_id 리네임
ALTER TABLE posts RENAME COLUMN id TO post_id;

-- 새 컬럼 추가
ALTER TABLE posts ADD COLUMN series_id UUID REFERENCES series(series_id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN display_order INT;

-- 인덱스
CREATE INDEX idx_posts_series ON posts (series_id, display_order ASC);
```

> **마이그레이션 안전**: `series_id`와 `display_order` 모두 nullable이므로 기존 데이터에 영향 없음. 기존 posts는 자동으로 "기타"에 노출.

---

## 3. TypeScript 타입

### 3.1 새 타입 정의

> 위치: `src/entities/category/model/types.ts`, `src/entities/series/model/types.ts`

```ts
// entities/category/model/types.ts
export interface Category {
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
}

// entities/series/model/types.ts
export interface Series {
  series_id: string;
  category_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  slug: string;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// UI 표시용 (post 수 포함)
export interface SeriesWithCount extends Series {
  post_count: number;
}

// category별 series 그룹
export interface CategoryWithSeries extends Category {
  series_list: SeriesWithCount[];
}
```

### 3.2 기존 Post 타입 변경

```ts
// entities/post/model/types.ts
export interface Post extends PostFrontmatter {
  post_id: string;          // id → post_id
  slug: string;
  content: string;
  readingTime: string;
  updated_at: string;
  series_id: string | null; // 추가
  display_order: number | null; // 추가
}
```

---

## 4. FSD 레이어 구조

### 4.1 새 엔티티 슬라이스

```
src/entities/
├── category/
│   ├── model/
│   │   └── types.ts          # Category 타입
│   ├── api/
│   │   └── categories.ts     # getAllCategories
│   ├── index.ts              # 클라이언트 배럴
│   └── server.ts             # 서버 배럴
│
├── series/
│   ├── model/
│   │   ├── types.ts          # Series, SeriesWithCount, CategoryWithSeries 타입
│   │   └── mappers.ts        # DB row → Series 매핑
│   ├── api/
│   │   └── series.ts         # getAllSeries, getSeriesBySlug, getSeriesByCategory
│   ├── ui/
│   │   └── SeriesCard.tsx    # 시리즈 카드 컴포넌트
│   ├── index.ts
│   └── server.ts
│
├── post/                     # 기존 — 변경
│   ├── model/
│   │   ├── types.ts          # Post에 series_id, display_order 추가
│   │   └── mappers.ts        # toPost 매퍼 수정
│   ├── api/
│   │   └── posts.ts          # getPostsBySeries 추가
│   └── ...
```

### 4.2 의존성 흐름

```
types → lib → api → stores → hooks → components → app
                ↑
  category/api ─┘
  series/api ───┘  (category 타입만 import, category/api는 import 안 함)
  post/api ─────┘  (series 타입만 import)
```

**엔티티 간 의존 규칙:**
- `series`는 `category`의 **타입만** import (api 직접 호출 금지)
- `post`는 `series`의 **타입만** import
- 조합은 **views** 또는 **widgets** 레이어에서 수행

---

## 5. API 레이어

### 5.1 서버 쿼리 함수

```ts
// entities/category/api/categories.ts
export async function getAllCategories(): Promise<Category[]>
// → SELECT * FROM categories ORDER BY display_order ASC

// entities/series/api/series.ts
export async function getAllPublishedSeries(): Promise<SeriesWithCount[]>
// → SELECT s.*, COUNT(p.post_id) as post_count
//   FROM series s LEFT JOIN posts p ON s.series_id = p.series_id AND p.published = true
//   WHERE s.published = true
//   GROUP BY s.series_id
//   ORDER BY s.display_order ASC

export async function getSeriesBySlug(slug: string): Promise<Series | null>
// → SELECT * FROM series WHERE slug = :slug AND published = true

export async function getSeriesByCategory(categoryId: string): Promise<SeriesWithCount[]>
// → 위와 유사, WHERE s.category_id = :categoryId 추가

// entities/post/api/posts.ts (추가)
export async function getPostsBySeries(seriesId: string): Promise<Post[]>
// → SELECT * FROM posts WHERE series_id = :seriesId AND published = true
//   ORDER BY display_order ASC

export async function getUncategorizedPosts(): Promise<Post[]>
// → SELECT * FROM posts WHERE series_id IS NULL AND published = true
//   ORDER BY created_at DESC
```

### 5.2 API Routes (관리자용)

```
POST   /api/categories          # 카테고리 생성
PUT    /api/categories           # 카테고리 수정
DELETE /api/categories           # 카테고리 삭제 (series 없을 때만)

POST   /api/series               # 시리즈 생성
PUT    /api/series               # 시리즈 수정
DELETE /api/series               # 시리즈 삭제 (posts 연결 해제)

PUT    /api/posts                # 기존 — series_id, display_order 필드 추가
```

---

## 6. 페이지 & 라우팅

### 6.1 새 라우트

| 경로 | 용도 | 데이터 |
|------|------|--------|
| `/` (변경) | 메인: category별 series 목록 | `CategoryWithSeries[]` + 기타 posts |
| `/series/[slug]` (신규) | series 상세: 해당 posts 목록 | `Series` + `Post[]` |
| `/write` (변경) | 글 작성 폼에 series 선택 추가 | `Series[]` (드롭다운) |

### 6.2 메인 페이지 데이터 흐름

```
app/page.tsx (Server Component)
  ├─ getAllCategories()
  ├─ getAllPublishedSeries()  → category별로 그룹핑
  ├─ getUncategorizedPosts()  → "기타" 섹션
  └─ <HomePage categories={...} uncategorizedPosts={...} />
```

### 6.3 Series 상세 페이지

```
app/series/[slug]/page.tsx (Server Component, ISR)
  ├─ getSeriesBySlug(slug)
  ├─ getPostsBySeries(series.series_id)
  └─ <SeriesDetailPage series={...} posts={...} />
```

---

## 7. UI 컴포넌트

### 7.1 새 컴포넌트

| 컴포넌트 | 레이어 | 역할 |
|----------|--------|------|
| `Breadcrumb` | shared/ui | 계층 경로 네비게이션 (category > series > post) |
| `SeriesCard` | entities/series/ui | 시리즈 카드 (제목, 설명, 썸네일, post 수) |
| `SeriesGrid` | widgets/series-grid/ui | category 섹션 내 series 카드 그리드 |
| `CategorySection` | widgets/category-section/ui | category 헤더 + SeriesGrid |
| `SeriesDetailPage` | views/series-detail/ui | series 상세 페이지 레이아웃 |

### 7.2 메인 페이지 구조 (변경)

```
HomePage
├─ CategorySection (category: "프론트엔드")
│   └─ SeriesGrid
│       ├─ SeriesCard ("React 기초", 5 posts)
│       └─ SeriesCard ("CSS 레이아웃", 3 posts)
├─ CategorySection (category: "백엔드")
│   └─ SeriesGrid
│       └─ SeriesCard ("NestJS 입문", 4 posts)
└─ Section ("기타")
    └─ PostList (uncategorized posts)
```

### 7.3 Breadcrumb 네비게이션

> 위치: `src/shared/ui/breadcrumb.tsx`

현재 위치의 계층 경로를 `홈 > 카테고리 > 시리즈 > 포스트` 형태로 표시하는 공통 컴포넌트.

#### 인터페이스

```ts
interface BreadcrumbItem {
  label: string;
  href?: string; // 없으면 현재 위치 (마지막 항목)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
```

#### 페이지별 사용 예시

| 페이지 | Breadcrumb 경로 |
|--------|-----------------|
| 시리즈 상세 (`/series/[slug]`) | `홈 > 카테고리명 > 시리즈명` |
| 포스트 상세 (`/posts/[slug]`) — series 있음 | `홈 > 카테고리명 > 시리즈명 > 포스트제목` |
| 포스트 상세 (`/posts/[slug]`) — series 없음 | `홈 > 포스트제목` |

#### 구현 가이드

- `ChevronRight` (lucide-react) 아이콘으로 항목 구분
- 마지막 항목은 링크 없이 `text-foreground`로 표시 (현재 위치)
- 나머지 항목은 `text-muted-foreground`에 hover 시 `text-foreground` 전환
- 기존 PostDetailPage의 `← 목록으로` 링크를 Breadcrumb으로 교체

### 7.4 글 작성 폼 변경 (PostForm)

- series 드롭다운 추가 (선택 사항)
- display_order 입력 필드 추가 (series 선택 시)
- category → series 2단 셀렉트 또는 단순 series 목록

---

## 8. ISR & 캐시 전략

| 변경 시 | revalidate 대상 |
|---------|-----------------|
| post 생성/수정/삭제 | `/`, `/posts/[slug]`, `/series/[series-slug]` |
| series 생성/수정/삭제 | `/`, `/series/[slug]` |
| category 변경 | `/` |

---

## 9. 마이그레이션 계획

### Phase 1: DB 스키마

1. `categories` 테이블 생성
2. `series` 테이블 생성
3. `posts`에 `series_id`, `display_order` 컬럼 추가
4. `posts.id` → `posts.post_id` 리네임
5. RLS 정책 추가

### Phase 2: 백엔드

1. `entities/category` 슬라이스 생성 (types, api, barrel)
2. `entities/series` 슬라이스 생성 (types, mappers, api, ui, barrel)
3. `entities/post` 수정 (types, mappers, api에 series 관련 추가)
4. API routes 추가/수정

### Phase 3: 프론트엔드

1. Breadcrumb 공통 컴포넌트 생성 (`shared/ui/breadcrumb.tsx`)
2. SeriesCard, SeriesGrid, CategorySection 위젯 생성
3. SeriesDetailPage 뷰 생성 (Breadcrumb 포함)
4. PostDetailPage에 Breadcrumb 적용 (기존 `← 목록으로` 교체)
5. HomePage 리팩토링 (category/series 기반)
6. PostForm에 series 선택 추가
7. `/series/[slug]` 라우트 추가

### Phase 4: 데이터 & 검증

1. 초기 category 데이터 시딩
2. 기존 posts가 "기타"로 정상 노출되는지 확인
3. ISR revalidation 경로 검증

---

## 10. 미결 사항

- [ ] 초기 category 목록 확정 (프론트엔드, 백엔드, 인프라 등)
- [ ] series 썸네일 이미지 업로드 — 기존 `/api/upload` 재사용 vs 별도 처리
- [ ] series 삭제 시 하위 posts 처리: `SET NULL` (기타로 이동) 확정
- [ ] 관리자 UI: category/series CRUD 페이지 필요 여부
