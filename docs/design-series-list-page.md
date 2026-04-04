# Series List Page 설계 문서

## 1. 개요

| 항목 | 내용 |
|------|------|
| **목적** | 전체 시리즈를 카테고리별로 그룹핑하여 보여주는 `/series` 페이지 추가 |
| **현재 상태** | `series/[slug]` (상세)만 존재, 목록 페이지 없음 |
| **홈페이지와 차이** | 홈은 시리즈를 카드 형태로 요약 표시 + 미분류 포스트 포함. 시리즈 목록 페이지는 시리즈에 집중하여 전체 목록을 제공 |

---

## 2. FSD 레이어 구조

```
src/
├── app/series/
│   └── page.tsx                    # [NEW] 라우트 진입점 (데이터 페칭 + 메타데이터)
├── views/series-list/
│   ├── index.ts                    # [NEW] public export
│   └── ui/SeriesListPage.tsx       # [NEW] 페이지 UI 컴포넌트
├── widgets/
│   ├── category-section/           # [기존] 재사용
│   └── series-grid/                # [기존] 재사용
├── entities/
│   ├── series/                     # [기존] 재사용 (API, SeriesCard, types)
│   └── category/                   # [기존] 재사용 (getAllCategories)
```

### 레이어별 역할

| 레이어 | 파일 | 역할 | 신규/기존 |
|--------|------|------|-----------|
| `app` | `series/page.tsx` | 라우트, 데이터 페칭, 메타데이터 | **신규** |
| `views` | `series-list/ui/SeriesListPage.tsx` | 페이지 레이아웃, UI 조합 | **신규** |
| `widgets` | `category-section/` | 카테고리 제목 + SeriesGrid 조합 | 기존 |
| `widgets` | `series-grid/` | SeriesCard 그리드 배치 | 기존 |
| `entities` | `series/`, `category/` | 데이터 모델, API, 기본 UI | 기존 |

---

## 3. 파일별 상세 설계

### 3.1 `src/app/series/page.tsx` (라우트)

```ts
// 역할: 데이터 페칭 + views 컴포넌트에 전달
// 패턴: series/[slug]/page.tsx, app/page.tsx와 동일한 구조

export const revalidate = 60;

// generateMetadata → "Series | {BLOG_NAME}"
// default export → getAllCategories + getAllPublishedSeries 페칭
//                → CategoryWithSeries[] 그룹핑
//                → <SeriesListPage categories={...} /> 렌더
```

**데이터 흐름:**
```
getAllCategories() ─┐
                    ├─→ CategoryWithSeries[] 조합 ─→ SeriesListPage
getAllPublishedSeries() ─┘
```

> 홈페이지(`app/page.tsx`)와 동일한 데이터 페칭 로직. `getUncategorizedPosts()`는 불필요하므로 제외.

### 3.2 `src/views/series-list/ui/SeriesListPage.tsx` (뷰)

```ts
// Props
interface SeriesListPageProps {
  categories: CategoryWithSeries[];
}
```

**UI 구조:**
```
<main className="max-w-3xl mx-auto px-6 py-10">
  ├── <Breadcrumb items={[홈, "Series"]} />
  ├── <header>
  │     ├── <h1> "Series" </h1>
  │     └── <p> 전체 시리즈 수 표시 </p>
  │   </header>
  └── <section>
        ├── <CategorySection category={cat1} />  ← 기존 위젯 재사용
        ├── <CategorySection category={cat2} />
        └── ...
      </section>
  └── (시리즈 없을 때 empty state)
</main>
```

**기존 컴포넌트 재사용:**
- `CategorySection` → 카테고리별 시리즈 그리드
- `Breadcrumb` → `SeriesDetailPage`에서 사용 중인 것과 동일

---

## 4. 의존성 그래프

```
app/series/page.tsx
  ├── entities/series/server  (getAllPublishedSeries)
  ├── entities/category/server (getAllCategories)
  └── views/series-list       (SeriesListPage)
        ├── widgets/category-section (CategorySection)
        │     └── widgets/series-grid (SeriesGrid)
        │           └── entities/series (SeriesCard)
        └── shared/ui/breadcrumb (Breadcrumb)
```

FSD 규칙 준수:
- `app` → `views` → `widgets` → `entities` → `shared` (상위→하위만 참조)
- 같은 레이어 간 참조 없음

---

## 5. 작업 목록

| # | 작업 | 파일 | 신규/수정 |
|---|------|------|-----------|
| 1 | views 생성 | `src/views/series-list/ui/SeriesListPage.tsx` | 신규 |
| 2 | views export | `src/views/series-list/index.ts` | 신규 |
| 3 | 라우트 생성 (metadata 포함) | `src/app/series/page.tsx` | 신규 |
| 4 | 상세 Breadcrumb: `홈 > Series > 시리즈명` | `src/views/series-detail/ui/SeriesDetailPage.tsx` | 수정 |
| 5 | 홈 Series 섹션에 "더보기" 링크 | `src/views/home/ui/HomePage.tsx` | 수정 |

**총 신규 파일: 3개, 수정 파일: 2개**

---

## 6. 설계 결정 사항

### Q1. 홈페이지와 중복되는 부분은?
- 데이터 페칭 로직(카테고리 + 시리즈 그룹핑)이 동일
- 하지만 홈은 uncategorizedPosts도 표시하고, 시리즈 섹션은 일부. 별도 페이지로 분리하는 것이 적절

### Q2. 시리즈가 없는 카테고리는?
- 기존 `CategorySection`이 `series_list.length === 0`이면 `null` 반환 → 자동 필터링

### Q3. Breadcrumb을 넣는 이유?
- `series/[slug]/page.tsx`에서 이미 Breadcrumb 사용 중
- 시리즈 상세에서 "Series" 경로를 클릭해 목록으로 돌아오는 네비게이션 가능
- 향후 Breadcrumb: `홈 > Series > {시리즈명}` 흐름 완성
