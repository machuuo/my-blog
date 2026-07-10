# typegen-1 — Supabase 타입 SSOT 도입

> 상태: ✅ 구현 완료 (2026-07-10)
> 선행: c-2(projectService), s-1 / 후속: tierD-1(룰 재평가), migration-1(스키마 버전 관리, 별도 트랙)

---

## 1. 배경 & 목표

### 왜 하는가

Supabase 클라이언트를 제네릭 없이 생성하고 있다.

```ts
createClient(supabaseUrl, serviceRoleKey)   // → SupabaseClient<any>
```

제네릭이 없으니 모든 쿼리 결과가 `any`로 흘러나오고, 데이터 계층이 그 `any`를 `as`로 좁혀 **타입을 지어낸다.** `src/entities` 안에만 `as` 단언이 31개다.

가장 뚜렷한 증상은 `entities/post/model/mappers.ts`다.

```ts
description: (row.description as string) ?? "",
```

`as string`은 컴파일러에게 "절대 null이 아니다"라고 단언하는 문장인데, 바로 뒤에 `?? ""`로 null을 방어한다. **둘 중 하나는 반드시 거짓이고, 코드만 봐서는 어느 쪽인지 알 수 없다.**

이것이 Tier D를 통째로 기각시킨 근본 원인이다. `no-unnecessary-condition`은 타입만 보고 `?? ""`를 "불필요"로 판정해 삭제를 요구했다. 룰이 틀린 게 아니라, **룰에게 주어진 타입이 거짓이라 판단할 수 없었다.** `backlog.md`가 "진짜 레버리지는 룰 추가가 아니라 Supabase 타입 생성"이라고 적어둔 지점이다.

`series.ts` / `categories.ts`는 매퍼조차 거치지 않고 `data as Series[]`로 통째 캐스팅한다. RPC(`get_published_series_with_count`)의 반환 타입도 `data as SeriesWithCount[]`로, **현재 완전히 검증 밖**이다.

### 목표

DB 스키마를 **단일 진실 공급원(SSOT)** 으로 삼아 로우 타입을 생성하고, 데이터 계층의 `as` 단언을 제거한다.

```text
Postgres 스키마  ──생성──▶  database.types.ts  ──▶  toPost()  ──▶  Post
   (SSOT)                  (기계 생성, 손대지 않음)   (경계/매퍼)   (손으로 쓴 도메인 타입)
```

**도메인 타입(`Post`, `Series`, `Category`)은 SSOT 대상이 아니다.** `Post`에는 DB에 없는 `readingTime`(reading-time 계산값), `date`(= `created_at` 리네임)가 있다. 도메인 타입은 "앱이 원하는 모양"이고, 매퍼가 DB 로우와 도메인 타입 사이의 부패 방지 계층(anti-corruption layer)으로 남는다. **SSOT는 매퍼의 입력 쪽까지만 들어온다.**

---

## 2. 기능 요구사항

사용자(= 이 리포의 개발자) 관점.

- 개발자는 `pnpm db:types` 한 번으로 원격 스키마에서 TypeScript 타입을 재생성할 수 있다.
- 개발자가 DB 컬럼명을 잘못 적으면 `tsc`가 즉시 알려준다 (현재는 런타임에 `undefined`로 발견).
- 개발자가 `select()`에 없는 컬럼을 읽으면 `tsc`가 알려준다.
- 개발자가 `insert()`/`update()`에 존재하지 않는 **컬럼명**을 넘기면 `tsc`가 알려준다. (페이로드를 `TablesInsert<T>`/`TablesUpdate<T>` 명시 변수에 담아야 성립 — §8 결정 11. **값 타입**은 `body: any`라 검사되지 않음.)
- RPC 반환 타입이 실제 함수 시그니처와 일치하는지 컴파일러가 검증한다.
- 도메인 타입(`Post` 등)은 DB 로우가 아니라 앱이 정의한 모양으로 유지된다.

### in scope

- Supabase CLI를 devDependency로 도입, `db:types` 스크립트 등록
- `database.types.ts` 생성 및 커밋 (원격 프로젝트 기준, `--project-id`)
- 서버 클라이언트에 `<Database>` 제네릭 주입
- `post` / `series` / `category` 3개 엔티티 **매퍼 경유로 통일**
  - `post`: 기존 매퍼 입력 타입 교체 (`Record<string, unknown>` → 생성 로우 타입)
  - `series`: dead 상태인 매퍼를 부활시켜 `api/series.ts`가 소비
  - `category`: 매퍼 신규 작성
- 조인 쿼리(`toPostWithSeries`) 타입을 생성 타입에서 파생 (§8 결정 7)
- 순수 함수인 매퍼 3종에 대한 단위 테스트 신규 작성
- dead code 정리: `createBrowserSupabaseClient`(`client.ts`) 삭제, `@supabase/ssr` 의존성 제거
- 생성 파일을 ESLint 대상에서 제외

### out of scope

- **로컬 마이그레이션 도입(`supabase init` + `db pull`)** — §8 결정 1 참조. 별도 트랙(`migration-1`).
- **Tier D 룰 재평가** — `no-unnecessary-condition` 17건, C-2의 `eslint-disable` 5건 재판정. 후속 PR(`tierD-1`).
- **`src/app/api/upload/route.ts`** — `.from("images")`는 Storage 버킷이지 테이블이 아니다. 타입 생성과 무관.
- **`entities/post/index.ts`의 `toPost` re-export 제거** — 배럴 밖 소비처 0건이지만 이번 작업이 건드리는 파일이 아니므로 보고만 하고 남긴다.
- CI drift 게이트 — §8 결정 2 참조.

---

## 3. 완료 조건

### 파이프라인

- [x] `pnpm add -D supabase`로 CLI가 devDependency에 등록됨 (전역 설치 아님)
- [x] `package.json`에 `db:types` 스크립트 존재, 재실행 시 동일 산출물 (idempotent)
- [x] `src/shared/lib/supabase/database.types.ts` 생성 및 커밋됨
- [x] 생성 파일이 `eslint.config.mjs`의 `ignores`에 등록되어 lint 대상 밖

### 타입 검증

- [x] `server.ts`가 `createClient<Database>(...)`로 생성
- [x] `src/entities/**` 의 `as` 단언 31개 중, DB 로우 타입을 지어내던 것이 **0개**로 감소
- [x] `series.ts`의 `data as SeriesWithCount[]` 제거 — RPC 반환 타입이 생성 타입에서 추론됨
- [x] `categories.ts`의 `data as Category[]` 제거
- [x] `toPostWithSeries`의 `row.series as Record<string, unknown>` / `series?.categories as ...` 제거 (~~`QueryData`로 대체~~ → §8 결정 7 참조: `Pick<Tables<...>>` 파생으로 변경)
- [x] `select()`에 존재하지 않는 컬럼명 → `tsc` 실패 (`SelectQueryError`, 회귀 차단 검증 후 되돌림)
- [x] `insert()`에 존재하지 않는 컬럼명 → `tsc` 실패 (`TS2353`) — 페이로드를 `TablesInsert<T>` 명시 변수에 담아야 성립 (§8 결정 11)
- [x] `update()`에 존재하지 않는 컬럼명 → `tsc` 실패 (`TS2353`) — `TablesUpdate<T>` 명시 변수 필요. **인라인 리터럴은 미검출** (§8 결정 11)
- [ ] `insert()`/`update()`의 **값 타입** 검증 — `body`가 `await request.json()`이라 `any`. 이 작업으로 달성 불가, 별도 트랙(`validation-1`, zod)

### 매퍼 통일

- [x] `post` / `series` / `category` 세 엔티티의 `api/*.ts`가 모두 매퍼를 경유해 도메인 타입을 반환
- [x] 세 매퍼 모두 입력이 생성 로우 타입이고 함수 본문에 `as` 없음
- [x] `mappers.test.ts` 3개 신규 (post 7 · series 5 · category 3 = 15케이스). series `post_count` null 케이스는 §8 결정 10대로 제외

### 회귀 안전

- [x] `pnpm exec tsc --noEmit` 통과
- [x] `pnpm lint` — error 0, warning ≤ baseline(13)
- [x] `pnpm test` 전부 통과 (8 파일 37 테스트 = 기존 22 + 신규 매퍼 15)
- [x] `pnpm build` 통과 (SSG 경로가 실제 쿼리를 돌림)
- [x] `if (error || !data) return []` 형태의 런타임 가드가 **하나도 삭제되지 않음** (타입이 정직해져도 런타임 방어는 유지)

### dead code

- [x] `createBrowserSupabaseClient` 삭제, `client.ts` 파일 제거
- [x] `pnpm remove @supabase/ssr`, `pnpm-lock.yaml` 갱신
- [x] `series/model/mappers.ts`는 **삭제가 아니라 재작성** (매퍼 통일로 소비처가 생김)

### 접근성

- [x] `PostMeta`의 `date`가 `null`이면 `<time>` 요소와 구분자(`·`)를 **함께** 렌더링하지 않는다 (빈 `<time>`이나 고립된 구분자가 남지 않음)
- [x] `date`가 있을 때 `<time dateTime={date}>`의 기계 판독 속성이 유지된다
- [x] JSX 조건부 렌더링은 ternary 전략 (`react/jsx-no-leaked-render`)

그 외 aria 속성·포커스 관리·키보드 상호작용은 해당 없음 — 상호작용 UI가 아니다.

---

## 4. 기능 흐름

사용자 시나리오가 아니라 **개발자 워크플로**다.

### 최초 도입 (1회)

```text
pnpm add -D supabase
  ↓
pnpm exec supabase login          ← 브라우저 인증 (사람이 직접 수행)
  ↓
pnpm db:types                     ← 원격 스키마 → database.types.ts
  ↓
제네릭 주입 → 매퍼 재작성 → as 제거
  ↓
tsc / lint / test / build green
```

### 상시 (스키마 변경 시)

```text
대시보드에서 스키마 변경
  ↓
pnpm db:types
  ↓
git diff database.types.ts        ← 변경분 확인
  ↓
tsc 실패 지점 = 영향받는 코드      ← 여기가 이 작업의 핵심 가치
  ↓
수정 후 스키마 변경과 코드 변경을 같은 커밋에
```

### 실패 시나리오

| 상황 | 현재 | 도입 후 |
|---|---|---|
| 컬럼명 오타 | 런타임 `undefined` → 화면 공백 | `tsc` 컴파일 실패 |
| 컬럼 삭제 | 런타임 `undefined` | `tsc` 컴파일 실패 |
| nullable 변경 | 조용히 통과 (`as`가 가림) | `tsc`가 폴백 필요 지점 지목 |
| RPC 시그니처 변경 | 조용히 통과 (`as`가 가림) | `tsc` 컴파일 실패 |
| 스키마 변경 후 `db:types` 미실행 | — | **탐지 안 됨** (§8 결정 2의 알려진 한계) |

런타임 동작은 **바뀌지 않는다.** `if (error || !data) return []` 가드도, `?? ""` 폴백도 그대로다. 이 작업은 컴파일 타임에만 영향을 준다.

---

## 5. UI 설계

**UI 변경은 `PostMeta` 한 곳뿐이다.** 나머지 컴포넌트·props·상태는 건드리지 않는다.

도메인 타입이 정직해지면서(§8 결정 8) `PostMeta`의 props가 `date: string` → `date: string | null`로 넓어졌다. 기존 코드는 `null`을 받으면 `new Date(null)`로 **1970-01-01을 렌더링**했다. 이제 날짜가 없으면 `<time>`과 구분자를 함께 생략하고 읽는 시간만 표시한다.

```text
[date 있음]                        [date 없음 — 신규]
┌──────────────────────────┐      ┌──────────────────────────┐
│ 2026년 1월 1일 · 3 min read │      │ 3 min read               │
└──────────────────────────┘      └──────────────────────────┘
                                    ↑ <time>과 · 모두 미렌더링 (← 변경)
```

`PostCard.tsx:32`와 `PostDetailPage.tsx:44`는 `post.date`를 그대로 넘기므로 수정이 없다 (props가 넓어진 방향이라 호환).

### 타입 흐름도 (컴포넌트 트리 대신)

```text
Postgres (SSOT)
  │  supabase gen types typescript --project-id
  ▼
database.types.ts                        [생성물, 커밋됨, lint 제외]
  │  Database, Tables<"posts">, TablesInsert<"posts">
  ├─────────────────────────────┐
  ▼                             ▼
shared/lib/supabase/server.ts   entities/*/model/mappers.ts
  createClient<Database>()        toPost(row: Tables<"posts">): Post
  │                               toSeries(row: Tables<"series">): Series
  │                               toCategory(row: Tables<"categories">): Category
  │                             │
  ├──▶ entities/*/api/*.ts ─────┤   읽기: data.map(toPost)
  │   POST_WITH_SERIES_SELECT   │   조인: select 리터럴 → 호출부 대입검사
  │                             ▼
  │                        entities/*/model/types.ts
  │                          PostRow / PostWithSeriesRow  [생성 타입에서 파생]
  │                          Post / Series / Category     [손으로 쓴 도메인 타입]
  │                             │
  │                             ▼
  │                        entities/post/ui/PostMeta.tsx  (date null 가드)
  │
  └──▶ app/api/*/route.ts        쓰기: insert(payload: TablesInsert<"posts">)
```

### 접근성

해당 없음 — 상호작용 UI가 없다.

---

## 6. 기술 설계

### 변경 파일

| 파일 | 액션 | 역할 |
|---|---|---|
| `package.json` | modify | `supabase` devDep 추가, `@supabase/ssr` 제거, `db:types` 스크립트 |
| `pnpm-lock.yaml` | modify | 위 의존성 변경 반영 |
| `eslint.config.mjs` | modify | `ignores`에 생성 파일 등록 |
| `src/shared/lib/supabase/database.types.ts` | create | **생성물.** 손으로 수정 금지 |
| `src/shared/lib/supabase/server.ts` | modify | `createClient<Database>` 제네릭 주입 |
| `src/shared/lib/supabase/client.ts` | delete | `createBrowserSupabaseClient` 소비처 0 |
| `src/entities/post/model/mappers.ts` | modify | 입력 타입 교체, `as` 제거, 조인 타입 |
| `src/entities/post/model/mappers.test.ts` | create | 신규 테스트 |
| `src/entities/series/model/mappers.ts` | modify | dead → 부활. 입력 타입 교체 |
| `src/entities/series/model/mappers.test.ts` | create | 신규 테스트 |
| `src/entities/category/model/mappers.ts` | create | 신규 매퍼 |
| `src/entities/category/model/mappers.test.ts` | create | 신규 테스트 |
| `src/entities/post/model/types.ts` | modify | `PostRow`/`PostWithSeriesRow` 파생 + 도메인 타입 nullable화 (결정 8) |
| `src/entities/series/model/types.ts` | modify | `SeriesRow`/`SeriesWithCountRow` 파생 |
| `src/entities/category/model/types.ts` | modify | `CategoryRow` 파생 |
| `src/entities/post/ui/PostMeta.tsx` | modify | `date: string \| null` 가드 (`new Date(null)` → 1970 렌더 버그 제거) |
| `src/entities/post/api/posts.ts` | modify | `POST_WITH_SERIES_SELECT` 상수화(중복 제거), 조인 타입 대입검사 |
| `src/entities/series/api/series.ts` | modify | `as` 제거, 매퍼 경유, RPC 타입 |
| `src/entities/category/api/categories.ts` | modify | `as` 제거, 매퍼 경유 |
| `.gitignore` | modify | `supabase/.temp/` (CLI 스크래치) |
| `docs/개발계획서/harness/backlog.md` | modify | typegen-1 완료 + tierD-1 / migration-1 등재 |
| `docs/개발계획서/harness/lint-baseline.json` | modify | neutral 항목 추가 (룰 변경 없음, `warn_total` 13 불변) |
| `docs/개발계획서/harness/typegen-1_supabase-type-ssot-flow.json` | create | 구현 순서/완료 조건 추적 |

| `src/app/api/posts/route.ts` | modify | `insert`/`update` 페이로드를 `TablesInsert<"posts">`/`TablesUpdate<"posts">` 변수로 (결정 11) |
| `src/app/api/series/route.ts` | modify | 〃 `TablesInsert<"series">` / `TablesUpdate<"series">` |
| `src/app/api/categories/route.ts` | modify | 〃 `TablesInsert<"categories">` / `TablesUpdate<"categories">` |

**정정 이력 (2회)** — ① 최초에는 "route 3종 무변경 확정"으로 기록했다. 제네릭 주입 후 `tsc` 0 에러였기 때문이다. `/impl-review`에서 그 관찰이 틀렸음이 드러났다: `.insert()`는 인라인 리터럴의 초과 속성 검사를 건너뛰므로 없는 컬럼을 넣어도 통과시킨다. ② 그 정정에서 "`.update()`는 인라인으로도 안전"이라고 다시 잘못 기록했다. 유효 컬럼이 없는 프로브로 검증한 탓이다. 2차 재리뷰에서 실제 route 형태로 프로브를 짜니 `.update()`도 미검출이었다. **결국 insert 3곳 + update 3곳 모두 명시 타입 변수로 전환했고, 세 파일 각각 `TS2353` 발생을 회귀 검증했다.**

entities/category 슬라이스 배럴은 `toCategory` 외부 소비처가 없어 노출하지 않았다(`entities/post/index.ts`의 `toPost` re-export가 dead가 된 전례).

### 테스트 케이스

순수 함수인 매퍼 3종에 대해 (`*.test.ts`).

**`post/model/mappers.test.ts`**
1. `toPost` — 모든 컬럼이 채워진 로우 → 도메인 타입으로 변환, `date`가 `created_at`에서 옴
2. `toPost` — `description`/`tags`/`series_id`/`display_order`가 `null` → 각각 `""` / `[]` / `null` / `null` 폴백
3. `toPost` — `content`가 `null` → `readingTime`이 빈 문자열 기준으로 계산돼 예외 없음 (경계값)
4. `toPostWithSeries` — `series` 조인 성공 → `series_title`/`category_name` 채워짐
5. `toPostWithSeries` — `series`가 `null` (미분류 글) → 4개 필드 모두 `null` (조인 누락)

**`series/model/mappers.test.ts`**
1. `toSeries` — 정상 로우 변환
2. `toSeries` — `description` null → `""`, `thumbnail_url` null → `null` 유지 (폴백 방향이 다름에 주의)
3. `toSeriesWithCount` — `post_count`가 숫자 → 그대로
4. `toSeriesWithCount` — `post_count`가 `null`/`undefined` → `0` (경계값)

**`category/model/mappers.test.ts`**
1. `toCategory` — 정상 로우 변환
2. `toCategory` — `display_order` 경계값(0) 보존 (`??` 오용 시 falsy로 삼켜지는지 확인)
3. `toCategory` — 여분 컬럼이 있어도 도메인 타입에 새지 않음

### 핵심 인터페이스

생성 파일 하단에 헬퍼 타입이 함께 나온다. 이름과 모양만 적는다.

```text
Database                       스키마 전체 (Tables / Views / Functions / Enums)
Tables<"posts">                posts 테이블의 Row 타입
TablesInsert<"posts">          insert 페이로드 타입 (기본값 컬럼은 optional)
TablesUpdate<"posts">          update 페이로드 타입 (전부 optional)
```

조인 결과는 테이블 타입으로 그대로 떨어지지 않는다. `model/types.ts`에서 생성 타입을 `Pick`으로 파생해 조합한다 (§8 결정 7 — `QueryData`는 `import/no-cycle`과 충돌해 기각).

```ts
type SeriesJoin = Pick<Tables<"series">, "title" | "slug"> & {
  categories: Pick<Tables<"categories">, "name" | "slug"> | null;
};
export type PostWithSeriesRow = PostRow & { series: SeriesJoin | null };
```

이 타입은 `api/posts.ts`의 `toPostWithSeries(data)` 호출부에서 **대입 검사로 검증된다.** 타입 클라이언트가 `select` 리터럴을 파싱해 `data`에 구체 타입을 주므로, `select`에서 컬럼이 빠지면 `TS2345`로 실패한다.

조인 쿼리는 인라인이 아니라 `POST_WITH_SERIES_SELECT` 상수로 **한 곳에 선언한다.** 기존에 `getPostBySlug`와 `getPublishedPostBySlug`가 동일한 `select("*, series(title, slug, categories(name, slug))")`를 중복 보유했는데, 여기서 하나로 모인다.

### 상태 관리

해당 없음 — 클라이언트 상태를 다루지 않는다. 서버 컴포넌트에서 호출되는 순수 fetch 계층이다.

### API 연동 방향

새 엔드포인트는 없다. 기존 `entities/*/api/*.ts`(읽기, `createServerSupabaseClient`)와 `app/api/*/route.ts`(쓰기) 경로가 그대로 유지되며 타입만 정직해진다.

### 전제 조건 (사람이 수행)

- `supabase login` — 브라우저 인증이라 에이전트가 대신 못 한다.
- `--project-id` 값은 `NEXT_PUBLIC_SUPABASE_URL`의 서브도메인(`https://<여기>.supabase.co`)이다. 공개 URL에 이미 노출된 값이므로 `package.json`에 평문으로 둬도 비밀 유출이 아니다. **`SUPABASE_SERVICE_ROLE_KEY`와 혼동 금지.**

---

## 7. 에러 & 피드백 처리

사용자향 피드백은 **변경 없음.** 이 작업은 컴파일 타임 계층만 건드린다.

| 계층 | 현재 동작 | 도입 후 |
|---|---|---|
| 읽기 실패 (`error \|\| !data`) | `[]` 또는 `null` 반환 | 동일. **가드를 삭제하지 않는다** |
| 쓰기 실패 | `NextResponse.json({ error }, { status: 400 })` | 동일 |
| 매퍼 null 폴백 (`?? ""`) | 런타임 방어 | 동일. 정당성 재판정은 `tierD-1`에서 |

개발자향 피드백은 바뀐다. 타입 불일치가 **런타임 `undefined`에서 `tsc` 컴파일 실패로 앞당겨진다.** 이것이 이 작업의 유일한 관측 가능한 산출물이다.

`?? ""` 폴백을 이번 PR에서 건드리지 않는 이유: 타입이 정직해지면 컴파일러가 "이 폴백은 죽은 코드"라고 알려줄 수 있게 되는데, 그 판정을 신뢰하려면 먼저 생성 타입이 실제 DB와 일치함을 검증해야 한다. **타입 도입과 폴백 재판정을 한 PR에 섞으면, 회귀 시 어느 쪽이 원인인지 구분할 수 없다.**

---

## 8. 결정 사항

**결정 1 — 마이그레이션은 도입하지 않는다 (A안).**
로컬 마이그레이션(B안)이 정석이다. 스키마가 Git에서 리뷰되고, 코드 변경과 한 커밋에 묶이며, CI가 네트워크 없이 타입을 생성할 수 있다. 그럼에도 A를 택하는 이유는 **A가 B의 부분집합**이기 때문이다. 타입 생성 명령이 같고(`--project-id` ↔ `--local`), `database.types.ts` / 제네릭 주입 / 매퍼 재작성 / 조인 타입 파생은 B에서도 그대로 남는다. 즉 **A→B 이행 시 버려지는 작업이 없다.** 지금 아픈 곳은 "타입이 거짓말한다"이지 "스키마 이력이 없다"가 아니고, 스키마는 안정적(`posts`/`series`/`categories`)이다. B를 지금 강행하면 `db pull` baseline 검증, 로컬 Docker 스택, 영구적인 마이그레이션 규율이라는 **본 문제와 무관한 비용**이 붙는다. B는 `migration-1`로 백로그에 등재한다.

**결정 2 — drift 방어는 `pnpm db:types` 스크립트까지만. CI 게이트는 두지 않는다.**
CI가 재생성 후 `git diff --exit-code`로 차단하는 방식이 확실하지만, CI에 `SUPABASE_ACCESS_TOKEN` 시크릿을 등록하고 매 실행이 원격 DB에 접근해야 한다. 스키마 변경 빈도가 낮은 1인 블로그에 비해 비용이 크다. **알려진 한계: 스키마를 바꾸고 `pnpm db:types`를 잊으면 탐지되지 않는다.** 이를 받아들이는 대신 재생성 경로를 `package.json`에 남겨 다음 사람이 방법을 알 수 있게 한다. B(마이그레이션) 도입 시 토큰 없이 CI 검사가 가능해지므로, 그때 재검토한다.

**결정 3 — 세 엔티티 모두 매퍼를 경유한다.**
`Tables<"series">`를 도메인 타입으로 그대로 재export하는 방안(코드 최소)도 있었으나 기각했다. 그러면 DB 스키마가 뷰 계층까지 새어나가 FSD 레이어 분리가 무의미해지고, 컬럼명 변경이 뷰를 직격한다. `Post`가 이미 `readingTime`·`date` 같은 파생 필드를 갖는 것처럼, 도메인 타입은 DB 로우와 다른 관심사다. **dead 상태인 `series/model/mappers.ts`는 삭제 대상이 아니라 재작성 대상**이 된다 — 매퍼 통일로 소비처가 생기기 때문이다.

**결정 4 — Tier D 재평가는 후속 PR(`tierD-1`)로 분리한다.**
타입이 정직해지면 C-2에서 `eslint-disable`로 덮은 `?? ""` 5건과 Tier D가 기각한 `no-unnecessary-condition` 17건을 재판정할 수 있다. 그러나 타입 도입과 룰 승격을 한 PR에 섞으면 diff가 커지고 회귀 원인 특정이 어려워진다. 이번 PR은 **`tsc`/`lint`/`test`/`build` green + 런타임 동작 무변경**까지가 완료선이다.

**결정 5 — dead code 3건 중 2건만 정리한다.**
`createBrowserSupabaseClient`(`client.ts` 전체)와 미사용 의존성 `@supabase/ssr`은 제거한다. 전자는 이 작업이 제네릭 주입으로 직접 손대는 파일이라 "내가 만든 orphan"에 준하고, 후자는 `package.json`을 어차피 수정하기 때문이다. 반면 `entities/post/index.ts:3`의 `toPost` re-export는 소비처 0건이지만 이번 작업의 변경 경로가 아니므로 **보고만 하고 남긴다** (surgical changes 원칙). 백로그에 기록한다.

**결정 6 — 생성 파일은 lint 대상에서 제외하되 커밋한다.**
`database.types.ts`는 수백 줄 기계 생성물이라 `import/order`, `max-lines` 등 룰에 무의미하게 걸린다. `eslint.config.mjs`의 `ignores`에 등록한다. 다만 `.gitignore`에는 넣지 **않는다** — 커밋해야 CI가 CLI·DB 접근 없이 `tsc`를 돌릴 수 있고, PR diff에서 스키마 변경이 눈에 보인다. 반면 CLI 스크래치인 `supabase/.temp/`는 `.gitignore`에 넣는다 (`migration-1`이 추가할 `supabase/migrations/`는 추적해야 하므로 디렉토리 전체가 아니라 `.temp/`만).

---

## 구현 정정 (2026-07-10)

**결정 7 — 조인 타입은 `QueryData`가 아니라 `Pick<Tables<...>>` 파생으로 간다. [설계 변경]**
설계 시점에는 `QueryData<typeof query>`로 조인 결과 타입을 역추출할 계획이었으나 구현 중 **기존 룰과 양립 불가**함이 드러났다. `QueryData`는 인스턴스화된 쿼리 *값*을 필요로 하는데, 그 값은 `api/posts.ts`에만 존재한다(모듈 스코프에서 `createServerSupabaseClient()`를 호출하면 `requireEnv`가 import 시점에 던져 빌드가 깨진다). 그 타입을 `model/mappers.ts`가 import하면 `api → model → api` 순환이 되어 `import/no-cycle`(error, maxDepth 3)에 걸린다.
대신 `model/types.ts`에서 생성 타입을 파생한다.

```ts
type SeriesJoin = Pick<Tables<"series">, "title" | "slug"> & {
  categories: Pick<Tables<"categories">, "name" | "slug"> | null;
};
export type PostWithSeriesRow = PostRow & { series: SeriesJoin | null };
```

**안전성은 컴파일러가 보증한다.** 타입 클라이언트가 `select` 리터럴을 파싱해 `data`에 구체 타입을 부여하므로, `select` 문자열에서 컬럼이 **빠지면** `posts.ts`의 `toPostWithSeries(data)` 호출부가 `TS2345`로 실패한다(코드 리뷰에서 프로브로 실증). 한계는 컬럼이 **추가**되는 방향(무해)은 잡지 못해 `Pick`을 수동 동기화해야 한다는 점이다.

엄밀히 말하면 `QueryData`가 **불가능한 것은 아니다.** 실행되지 않는 thunk의 반환 타입에서 뽑아내면 import 시점의 `requireEnv` 예외를 피할 수 있다. 다만 그 타입을 `model`이 쓰려면 여전히 순환이 생기므로, 매퍼를 제네릭으로 바꾸거나 조인 매핑을 `api` 레이어로 옮겨야 한다. **즉 `QueryData`를 쓰려면 레이어 배치를 바꿔야 하고, 그 대가가 `Pick` 수동 동기화보다 크다고 판단했다.** 양방향 drift-proof가 필요해지거나 조인 매핑을 `api`로 옮기는 설계를 택할 경우 재검토한다.

**결정 8 — 도메인 타입 `Post`를 nullable로 정직하게 바꾼다. [설계에 없던 발견]**
타입 생성 결과 `posts.created_at` / `published` / `updated_at`이 DB상 **nullable**인데 도메인 타입은 non-null로 선언하고 매퍼에 폴백조차 없었다(`row.created_at as string`). `description`/`tags`/`content`와 달리 **거짓말만 있고 방어가 없는** 상태였다. 특히 `PostMeta`가 `new Date(date)`를 호출하므로 null이 들어오면 조용히 **1970-01-01**을 렌더링했다.
폴백 추가(`?? ""`) 대신 도메인 타입을 `string | null`로 정직하게 선언하는 쪽을 택했다. 파급은 `PostMeta` 한 곳뿐이었다(null이면 `<time>`과 구분자를 렌더링하지 않음). `usePostForm.ts:61`은 이미 `?? false`로 방어 중이었고 `updated_at`은 소비처가 없었다.

**결정 9 — `series.description` null→`""` 정규화는 의도된 신규 동작이다.**
기존 `series.ts`는 매퍼를 거치지 않고 `data as Series[]`로 통째 캐스팅했으므로 `toSeries`의 `?? ""` 폴백이 적용된 적이 없었다. 매퍼 통일(결정 3) 결과 null description이 `""`로 정규화된다. React 렌더상 관측 불가능하지만 raw 캐스팅 대비 엄밀히는 새 동작이므로 기록한다.

**결정 10 — RPC `post_count`의 null 테스트 케이스는 작성하지 않는다.**
생성 타입이 `post_count: number`(non-null)로 선언한다(Postgres `count()`는 NULL을 반환하지 않음). 따라서 §3에 계획했던 "post_count null → 0" 케이스는 타입상 도달 불가능해 테스트할 수 없다. 매퍼의 `Number(row.post_count ?? 0)` 런타임 가드는 유지하되(bigint가 문자열로 올 가능성 + 결정 4의 이연 원칙), 폴백의 정당성 재판정은 `tierD-1`에서 다룬다.

**결정 11 — 쓰기 페이로드는 예외 없이 `TablesInsert<T>` / `TablesUpdate<T>` 명시 변수에 담는다. [impl-review 반영]**
supabase-js의 `.insert()`·`.update()`는 **인라인 객체 리터럴에서 초과 속성 검사(EPC)가 작동하지 않는다.** 오버로드 추론이 개입해 리터럴의 freshness가 사라지기 때문이다. 프로브 실측:

| 호출 형태 | 없는 컬럼 | 값 타입 불일치 |
|---|---|---|
| insert / update — 인라인 리터럴 (유효 컬럼 섞임) | ❌ 통과 | ✅ `TS2769` |
| update — 인라인 리터럴 (유효 컬럼 0개) | ✅ `TS2353` | — |
| insert / update — 명시 타입 변수 | ✅ `TS2353` | ✅ |

두 번째 행이 함정이다. **유효 컬럼이 하나도 없는 객체로 프로브를 짜면 인라인도 잡히는 것처럼 보인다.** 실제 route는 모두 유효 컬럼이 섞인 형태이므로 인라인은 미검출이다. 이 때문에 최초 정정에서 "`update()`는 인라인으로도 안전"이라고 잘못 기록했다가 재리뷰에서 뒤집었다.

명시 타입 변수는 대입 시점에 대상 타입이 확정되어 오버로드 추론이 개입하지 않으므로, 값이 `any`여도 컬럼명 검사가 항상 걸린다. 따라서 쓰기 경로 6곳(posts / series / categories 의 insert 3 + update 3) 전부에 적용한다.

**남는 구멍:** `body`가 `await request.json()`이라 값이 전부 `any`다. `title: 123` 같은 **값 타입 오류는 여전히 통과**한다. 진짜 방어는 zod 스키마 검증이며 별도 트랙(`validation-1`)이다. 이 작업은 "컬럼명"만 지킨다.

**결정 12 — `db:types`는 임시 파일을 거쳐 원자적으로 교체한다. [CodeRabbit 리뷰 반영]**
쉘의 `>` 리다이렉션은 **명령 실행 전에 출력 파일을 비운다.** `supabase gen types`가 네트워크 오류나 인증 만료로 실패하면 `database.types.ts`가 0바이트로 남고, 그 상태로 `tsc`를 돌리면 `Database` 타입이 사라져 전 파일이 깨진다. 재현 확인함.
`> tmp && mv tmp dest || (rm -f tmp; exit 1)` 형태로 바꿔, 성공 시에만 교체하고 실패 시 기존 파일을 보존하며 임시 파일도 남기지 않는다. 두 경로 모두 실측 검증했다(실패 시 exit 1 + 원본 8613바이트 유지 + `.tmp` 잔재 0).

**보고 — dead code 2건 추가 발견 (변경 경로 밖이라 남김).**
`src/shared/types/index.ts`가 `Post`/`PostFrontmatter`를 중복 정의하는데 소비처 0건이며 `entities/post/model/types.ts`보다 낡았다(필드 불일치). `entities/post/index.ts:3`의 `toPost` re-export도 소비처 0건이다. 둘 다 `surgical changes` 원칙에 따라 이번 PR에서 건드리지 않고 백로그에 등재한다.
다만 `toPost`는 **시그니처가 `Record<string, unknown>` → `PostRow`로 좁아진 채 슬라이스 배럴로 공개돼 있다.** 소비처가 0이라 런타임 영향은 없으나, 형식상 공개 API의 breaking change다.

**보고 — 전역 훅 `post-barrel.sh`가 barrel-1과 충돌한다.**
Write로 생성한 모든 `.ts`에 대해 같은 디렉토리의 `index.ts` 배럴을 요구하는데, barrel-1(PR #20)이 정확히 그런 dead 세그먼트 배럴 8개를 삭제했고 `ENTRY_POINTS.entities`는 슬라이스 루트 `index.ts`만 진입점으로 허용한다. `entities/*/model/index.ts`를 만들면 소비처 0인 dead 배럴이 생긴다. 이번 작업에서는 배럴을 만들지 않고 진행했다. 훅은 전역이라 별도 정리 필요.
