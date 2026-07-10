# barrel-1: 배럴 소비 강제 (FSD 진입점 lint)

> 상태: ✅ 구현 완료 (2026-07-09) · 브랜치: `chore/lint/barrel-entry-point`
> 룰(구현): **`boundaries/dependencies` + `internalPath` 통합** · 롤아웃: **직접 error + 1 PR**
>
> ⚠️ 설계 시 주 룰로 지목한 `boundaries/entry-point`는 v6.0.2에서 **deprecated**로 확인됨 → 권고대로 `boundaries/dependencies` + `internalPath`로 **마이그레이션**해 진입점을 강제(기존 레이어 룰에 통합). alias 해석이 정상 동작해 `import/no-internal-modules` 백스톱은 **완전 중복 → 드롭**(§8). dead 배럴은 **8개**(1건 정정, §2).

---

## 1. 배경 & 목표 (WHY)

FSD 슬라이스마다 배럴(`index.ts`)을 만들어놨지만, lint가 **내부 파일 직접 import를 막지 못한다.** 기존 `boundaries/dependencies`는 "어느 레이어를 import하느냐"(상→하)만 검사하고, "그 레이어의 **배럴(공개 API)** 을 통했는가, 내부 파일을 직접 찔렀는가"는 보지 않는다. 결과적으로 배럴이 "공개 API 계약" 역할을 강제하지 못한다.

전수 감사 결과 **위반은 사실상 전부 `shared`에 집중**돼 있다(도메인 슬라이스는 이미 캡슐화 준수):

| 위치 | 위반 | 성격 |
|---|---|---|
| shared/ui 세그먼트 (notebook 30 + shadcn primitive 12) | 42 | **`shared/ui/index.ts` 부재** + notebook 배럴 100% 우회 |
| shared/lib client-safe (design-data 12·utils 6·constants 6·env 2·slugify 1) | 27 | 배럴 있는데 우회 |
| shared/lib auth·supabase | 13 | ⚠️ **server-only, 배럴 제외가 의도** (예외 유지) |
| entities server 세그먼트 | 10 | ✅ 정상 2차 진입점 (위반 아님) |
| entities/features/widgets/views 세그먼트 딥 | **0** | 이미 깔끔 |

**목표**: FSD 진입점 규칙을 lint로 error 강제한다.
- 슬라이스(entities/features/widgets/views)는 `index.ts`(entities는 `+server.ts`)로만 진입.
- shared는 세그먼트 배럴(`@/shared/ui`, `@/shared/lib`, `@/shared/api`, `@/shared/types`)로만 진입.
- server-only(`auth`, `supabase/*`)는 정식 예외 진입점으로 허용.
- 이 과정에서 `shared/ui/index.ts` 신설, shared 딥 import 69건 교체, dead 세그먼트 배럴 8개 제거를 함께 수행한다(설계 초안 9개 중 `nb-frame/lib`은 소비 中이라 제외 — §2·§8).

---

## 2. 기능 요구사항 (WHAT)

**In scope:**

- `boundaries/dependencies` + `internalPath` error 도입 — 기존 레이어 상→하 규칙에 진입점 정책을 통합해 강제(`boundaries/entry-point` deprecated 대체).
- ~~`import/no-internal-modules` error 도입~~ — **드롭**(alias 해석이 dependencies 진입점 검사에서 정상 동작 → 완전 중복, §8).
- `src/shared/ui/index.ts` **신설** — shadcn primitive(badge/breadcrumb/button/card/dialog/separator) + `export * from "./notebook"` re-export.
- shared 딥 import **69건** 배럴 경유로 교체:
  - `@/shared/ui/*` 42건 → `@/shared/ui` (단 `shared/ui/dialog.tsx`→button은 같은 세그먼트라 relative `./button`, 배럴 경유 시 순환)
  - `@/shared/lib/{design-data,utils,constants,env,slugify}` 27건 → `@/shared/lib`
- **dead 세그먼트 배럴 8개 제거**(소비 0건 확인됨):
  - `views/{about,home,hobby-detail,hobby-list,tags,tech-detail,tech-list}/ui/index.ts` (7)
  - `widgets/nb-frame/ui/index.ts` (1)
  - ⚠️ `widgets/nb-frame/lib/index.ts`는 **제외** — `NbFrame.tsx`가 `../lib`로 소비 중(설계서 "소비 0" 오기재 정정). 9개 → **8개**.
- 회귀 차단 검증(일부러 딥 import 추가 → lint 실패 확인 후 되돌리기).

**Out of scope:**

- **server-only 예외 불변** — `@/shared/lib/auth`, `@/shared/lib/supabase/{server,client}`, `@/entities/*/server`는 직접 진입점 유지(배럴로 합치면 client 번들에 server 코드 유입).
- 도메인 슬라이스 내부 리팩터/이동 — 세그먼트 딥 위반이 0이라 교체 불필요.
- app router route 폴더 배럴 규칙 — app은 최상위(피import 대상 아님), 예외.
- `boundaries/dependencies`(레이어 상→하) 기존 룰 — 불변.
- Supabase 타입 생성 등 별도 트랙 — 무관.

---

## 3. 완료 조건 (Acceptance Criteria)

- [x] `boundaries/dependencies`(진입점 `internalPath` 통합)가 error로 등록되고, 슬라이스 내부 파일 직접 import(`@/views/home/ui/HomePage` 등) 시 lint 실패한다.
- [x] ~~`import/no-internal-modules` 백스톱~~ — 드롭(완전 중복). dependencies 단독으로 `@/` alias deep import 차단 확인.
- [x] `src/shared/ui/index.ts`가 신설되어 shadcn primitive 6종 + notebook 컴포넌트를 모두 re-export한다(이름 충돌 없음, tsc green 확인).
- [x] `@/shared/ui/*` 42건, `@/shared/lib/{design-data,utils,constants,env,slugify}` 27건이 각각 `@/shared/ui`, `@/shared/lib` 배럴 경유로 교체된다(dialog→button은 relative).
- [x] server-only 진입점(`@/shared/lib/auth`, `@/shared/lib/supabase/*`, `@/entities/*/server`)은 **여전히 직접 import 가능**하고 lint를 통과한다.
- [x] dead 세그먼트 배럴 **8개**가 제거되고, 제거 전 `grep`으로 소비 0건 + 제거 후 `tsc` green을 확인한다(`nb-frame/lib`은 소비 中이라 유지).
- [x] `pnpm tsc --noEmit`, `pnpm lint`(0 error/13 warn), `pnpm test`(22/22) 모두 green(위반 0).
- [x] 회귀 검증: 슬라이스 내부 경로 import + 레이어 위반 임의 추가 → `pnpm lint` 실패 확인 후 되돌린다.
- [x] `lint-baseline.json`: 신규 룰이 error라 warn 미발생 → `warn_total` 13 불변.
- [x] 접근성: 해당 없음 — lint 설정/import 경로 변경, 런타임 UI 불변.

---

## 4. 기능 흐름 (HOW)

```text
[개발자가 내부 파일을 직접 import]
  import { HomePage } from "@/views/home/ui/HomePage"
      → boundaries/dependencies(internalPath): "슬라이스는 index.ts로만 진입" → lint error
  수정: import { HomePage } from "@/views/home"          → 통과

[shared 세그먼트]
  import { Button } from "@/shared/ui/button"
      → dependencies(internalPath): "shared 세그먼트 배럴로만 진입" → lint error
  수정: import { Button } from "@/shared/ui"             → 통과 (배럴 신설 후)
  ※ shared 내부 형제(dialog→button)는 same-element 검사 제외 → relative "./button"

[server-only 예외 — 불변 통과]
  import { getPostBySlug } from "@/entities/post/server"  → ✅ 통과(2차 진입점)
  import { createClient } from "@/shared/lib/supabase/server" → ✅ 통과(server-only 예외)
  import { isAuthenticated } from "@/shared/lib/auth"     → ✅ 통과(server-only 예외)
```

- **에러 시나리오**: 런타임 에러 아님 — 빌드/CI lint 단계에서 error로 차단. 개발자는 배럴 경유 경로로 수정하면 해소.

---

## 5. UI 설계

- **UI 레이아웃**: N/A — lint 설정 + import 경로 변경. 런타임 렌더 결과 불변.
- **컴포넌트 트리**: 변경 없음. `shared/ui/index.ts`는 순수 re-export 파일(렌더 무관).
- **접근성**: N/A — interactive UI 없음.

---

## 6. 기술 설계

### 진입점 정책 (계약)

| 레이어 | 허용 진입점 | 비고 |
|---|---|---|
| entities/*  | `index.ts` + `server.ts` | client-safe(index) ↔ server-only fetcher(server) 이중구조 |
| features/*, widgets/*, views/* | `index.ts` | 슬라이스 루트 배럴만 |
| shared | `ui/index.ts`, `lib/index.ts`, `api/index.ts`, `types/index.ts` | 세그먼트 = 공개 단위(FSD) |
| shared server-only 예외 | `lib/auth.ts`, `lib/supabase/*.ts` | 배럴 불가(server/client 경계) |
| app | (피import 대상 아님) | 최상위, 예외 |

### 신규/변경 파일

| 파일 | 종류 | 역할 |
|---|---|---|
| `eslint.config.mjs` | 수정 | 기존 `boundaries/dependencies`(레이어 상→하)에 `internalPath` 진입점 규칙 통합(modern selector 재작성). `ENTRY_POINTS` 상수 정의. server-only(`lib/auth.ts`, `lib/supabase/*.ts`)·entities `server.ts`·slice `index.ts` 예외 allow |
| `src/shared/ui/index.ts` | **신규** | shadcn primitive 6종(`badge`/`breadcrumb`/`button`/`card`/`dialog`/`separator`) + `export * from "./notebook"` re-export (`export *` 방식) |
| shared 딥 import 34개 (부록 A) | 수정 | `@/shared/ui/*`→`@/shared/ui`, `@/shared/lib/{design-data,utils,constants,env,slugify}`→`@/shared/lib`. 단 `shared/ui/dialog.tsx`→button은 relative `./button` |
| dead 배럴 **8개** (부록 A) | **삭제** | views 7개 ui/index.ts + nb-frame/ui/index.ts. nb-frame/lib/index.ts는 소비 中이라 제외 |
| harness 문서 (migration·backlog·baseline·설계서·flow) | 수정 | Decisions/Changelog·완료 기록·baseline neutral 항목 |

### 부록 A — 변경 파일 전수 (drift 추적용)

**신규(1)**: `src/shared/ui/index.ts` · **설정(1)**: `eslint.config.mjs`

**import 교체(34)**:

| # | 파일 | # | 파일 |
|---|---|---|---|
| 1 | `src/app/api/auth/route.ts` | 18 | `src/shared/ui/notebook/NbChip.tsx` |
| 2 | `src/app/api/posts/route.ts` | 19 | `src/shared/ui/notebook/Polaroid.tsx` |
| 3 | `src/app/layout.tsx` | 20 | `src/shared/ui/notebook/SectionHeader.tsx` |
| 4 | `src/app/posts/[slug]/page.tsx` | 21 | `src/shared/ui/notebook/StickyNote.tsx` |
| 5 | `src/app/series/[slug]/page.tsx` | 22 | `src/views/about/ui/AboutPage.tsx` |
| 6 | `src/app/series/page.tsx` | 23 | `src/views/hobby-detail/ui/HobbyDetailPage.tsx` |
| 7 | `src/entities/post/ui/PostCard.tsx` | 24 | `src/views/hobby-list/ui/HobbyListPage.tsx` |
| 8 | `src/entities/series/ui/SeriesCard.tsx` | 25 | `src/views/home/ui/HomePage.tsx` |
| 9 | `src/features/auth/ui/LoginForm.tsx` | 26 | `src/views/post-detail/ui/PostDetailPage.tsx` |
| 10 | `src/features/write-post/lib/usePostForm.ts` | 27 | `src/views/series-detail/ui/SeriesDetailPage.tsx` |
| 11 | `src/features/write-post/ui/PostForm.tsx` | 28 | `src/views/series-list/ui/SeriesListPage.tsx` |
| 12 | `src/shared/ui/badge.tsx` | 29 | `src/views/tags/ui/TagsPage.tsx` |
| 13 | `src/shared/ui/breadcrumb.tsx` | 30 | `src/views/tech-detail/ui/TechDetailPage.tsx` |
| 14 | `src/shared/ui/button.tsx` | 31 | `src/views/tech-list/ui/TechListPage.tsx` |
| 15 | `src/shared/ui/card.tsx` | 32 | `src/widgets/footer/ui/Footer.tsx` |
| 16 | `src/shared/ui/dialog.tsx` | 33 | `src/widgets/header/ui/Header.tsx` |
| 17 | `src/shared/ui/separator.tsx` | 34 | `src/widgets/nb-frame/ui/NbFrame.tsx` |

**삭제(8)**: `src/views/about/ui/index.ts` · `src/views/home/ui/index.ts` · `src/views/hobby-detail/ui/index.ts` · `src/views/hobby-list/ui/index.ts` · `src/views/tags/ui/index.ts` · `src/views/tech-detail/ui/index.ts` · `src/views/tech-list/ui/index.ts` · `src/widgets/nb-frame/ui/index.ts`

**문서(5)**: `docs/개발계획서/harness/eslint-migration.md` · `backlog.md` · `lint-baseline.json` · `barrel-1_barrel-consumption-enforcement.md` · `barrel-1_barrel-consumption-enforcement-flow.json`

### 테스트

- **면제** — 두 룰은 eslint 설정(선언적 config)으로 순수 함수/훅이 아님. `*.test.ts` 대상 아님(impl-review #15 lint 설정 예외). 검증은 **회귀 차단 테스트**(의도적 위반 → lint 실패 확인)로 대체.
- **런타임 검증**: import 경로 교체 후 `pnpm tsc --noEmit`(타입 해석 무결) + `pnpm test`(기존 스위트 green) + `pnpm build` 스모크(선택).

### 룰 역할 분담

- **`boundaries/dependencies` + `internalPath`(단일 룰, 구현 확정)**: 기존 레이어 상→하 규칙에 진입점을 결합. `default:"disallow"` + 각 `from`(레이어)마다 `allow: [{ to: { type, internalPath } }]`로 "올바른 하위 레이어 + 공개 진입점"만 통과. entities는 `["index.ts","server.ts"]`, shared는 `["*/index.ts","lib/auth.ts","lib/supabase/*.ts"]`, slice는 `"index.ts"`. same-element(내부 형제)은 `checkInternals:false` 기본값이라 검사 제외 → relative 통과.
- **~~`import/no-internal-modules`(백스톱)~~ 드롭**: `@/` alias가 dependencies 진입점 검사에서 정상 해석돼(회귀 테스트로 `@/views/home/ui/HomePage`·`@/shared/ui/button` 모두 차단 확인) 완전 중복. 추가로 `allow`는 외부 deep import(`next/link` 등) 오탐, `forbid`는 `server.ts` 예외를 extglob으로 처리해야 해 취약 → 미도입.
- ⚠️ 원래 주 룰 후보였던 `boundaries/entry-point`가 **v6.0.2 deprecated**(clean run에도 경고 상시 출력, 향후 major 제거 예정)로 확인돼 채택하지 않고 `dependencies`로 마이그레이션함. §8 참조.

### 인터페이스

- 신규 함수/타입 없음. `shared/ui/index.ts`는 기존 컴포넌트의 re-export 집합(공개 표면 = 기존 개별 파일 export의 합집합).

---

## 7. 에러 & 피드백 처리

- **위반 발생**: CI/로컬 `pnpm lint`에서 error로 빌드 차단. 메시지에 "배럴(index.ts)을 통해 import하세요" 취지 안내. 회복 = 배럴 경로로 수정.
- **server-only 예외**: allow 리스트로 통과 — 개발자가 별도 조치 불필요.
- **성공 피드백**: 없음 — lint green이면 통과. 런타임 동작 불변.

---

## 8. 결정 사항 (Decisions)

- **shared/ui = 단일 세그먼트 배럴**: `@/shared/ui` 하나로 통합(notebook도 `export *`로 re-export). FSD 정석(shared는 세그먼트가 공개 단위). shadcn 파일별 진입점(대안)은 캡슐화 불완전·일관성 저하로 기각.
- **dead 배럴 정리 = 이 PR에 포함**: 소비 0건 확인 + FSD 비표준. 배럴 정비하는 김에 함께 제거(실제 8개 — 아래 정정 참조). diff가 강제규칙+정리로 섞이는 단점은 수용(규모 작음).
- **롤아웃 = 직접 error + 1 PR**: 선례(C-2/S-1)가 신규 룰을 처음부터 error로 도입 + 같은 PR에서 위반 해소. warn ratchet 2단계는 교체 지연 중 우회 재유입 위험이 있어 기각. 68~69건 교체가 한 PR에 몰려 리뷰 부담은 크나 전부 기계적 경로 치환(로직 0)이라 저위험.
- **server-only 예외 = 유지**: `auth`/`supabase/*`/`entities/*/server`는 배럴 제외가 의도(server/client 번들 경계). `boundaries/dependencies`의 `internalPath` allow로 명시.
- **룰 2종 채택 + 백스톱 단서**: (설계 시) `boundaries/entry-point`가 주 강제, `import/no-internal-modules`가 alias 백스톱. 구현 중 완전 중복이면 후자 드롭(§6).
- **[구현 정정] entry-point deprecated → `dependencies`+`internalPath` 단일 룰**: 설계가 주 룰로 지목한 `boundaries/entry-point`는 설치 버전 v6.0.2에서 deprecated(clean run에도 경고 상시 출력 + 향후 major 제거). 플러그인 권고대로 기존 `boundaries/dependencies`에 `internalPath` selector를 붙여 레이어+진입점을 **하나의 modern 룰로 통합**. 사용자 승인하 마이그레이션 진행. 부수로 `import/no-internal-modules` 백스톱은 완전 중복이라 드롭(§6).
- **[구현 정정] dead 배럴 9 → 8**: 설계가 "소비 0"으로 적은 `widgets/nb-frame/lib/index.ts`는 실제로 `NbFrame.tsx`가 `../lib`(슬라이스 내부 relative 배럴)로 소비 中 → 삭제 대상에서 제외. FSD상 정상 패턴이라 유지.
- **[구현 정정] shared 세그먼트 내부는 relative**: `shared/ui/dialog.tsx`→button은 같은 세그먼트라 `@/shared/ui`(배럴) 경유 시 `index→dialog→index` 순환(`import/no-cycle`). 같은 세그먼트 형제는 relative `./button`으로 처리(FSD 표준: 세그먼트 내부는 relative, 외부만 배럴 alias). same-element은 룰 검사 제외라 통과.
- **도메인 슬라이스 교체 0**: entities/features/widgets/views 세그먼트 딥 위반이 0이라, 룰은 좋은 상태를 lock-in하는 역할. churn은 shared에 국한.
