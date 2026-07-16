# 하네스 후속 작업 백로그

lint ratchet 프로그램(**Tier A~S 완료**, Tier D 기각)은 종결됐다. 이 문서는 이제 **남은 후속 트랙 추적**이 주 역할이며, 완료된 lint 이력은 하단 [완료 아카이브](#완료-아카이브-lint-ratchet-프로그램)로 보존한다.

진행 상태: ⬜ 대기 / 🟡 진행 중 / ✅ 완료 / ❌ 보류

---

## 현재 백로그 (남은 작업)

typegen-1에서 파생된 후속 트랙 + 별도 정리 항목.

### ~~tierD-1 — Tier D 룰 재평가~~ ✅ 완료 (2026-07-16)

`no-unnecessary-condition`을 error로 채택. 위반 12건 중 11건 단순화(`if (error \|\| !data)` → `if (error)` 10건, `Number(post_count ?? 0)` → `Number(post_count)` 1건), `navigator.clipboard?.` 1건은 DOM 타입 거짓이라 line-level disable. `prefer-nullish` disable 5건은 빈 문자열 폴백 의도로 재확인(변경 0). 프로젝트 `CLAUDE.md`에 "Type-aware rule exceptions" 컨벤션 신설. 설계서 `tierD-1_no-unnecessary-condition-adoption.md`. → 상세는 [완료 아카이브 변경 이력](#변경-이력) 참조.

### dead code 3건 ⬜

저비용 정리. typegen-1이 남긴 잔재 포함.

- `src/shared/types/index.ts` — `Post`/`PostFrontmatter` 중복 정의, 소비처 0, entities 버전보다 낡음
- `entities/post/index.ts:3`의 `toPost` re-export — 소비처 0
- `.claude/worktrees/fix+ci+pnpm-version-ssot` — locked 잔재

### ~~전역 하네스의 "폴더마다 배럴" 전제 정정~~ ✅ 완료 (2026-07-16)

전역 훅을 완화(B: 배럴 생성 강제 제거, 동기화 넛지 보존)하고, 이 프로젝트는 lint(boundaries)가 진입점을 error 강제하는 SSOT라 마커(`.claude/no-barrel-hook`) + 훅 내부 가드로 무력화. impl-review #16은 "진입점 계약" 프레이밍으로 재작성 + `N/A (lint-enforced)` 규정. 설계서 `barrel-hook-2_folder-barrel-premise-correction.md`. → 상세는 [변경 이력](#변경-이력) 참조.

### migration-1 — Supabase 스키마 버전 관리 ⬜ (우선순위 낮음)

`supabase init` + `db pull`로 스키마를 SQL로 리포에 넣는다. typegen-1(A안)의 상위집합이라 버려지는 작업 없음. 도입 시 (a) `db:types`가 `--local`로 전환되어 CI가 토큰 없이 타입 drift를 검사할 수 있고, (b) 스키마 변경이 PR에서 리뷰된다. 스키마가 안정적이라 우선순위 낮음.

---

## 완료 아카이브 (lint ratchet 프로그램)

> ESLint 마이그레이션(PR #7) 머지 후 baseline 강화 트래커. **A~S 완료로 종결.**
>
> **목표**: 가드레일이 될 수 있는 룰을 식별하여 `warn → error` 승격으로 하네스 엔지니어링을 고도화한다. 룰 위반은 즉시 빌드 차단되도록 만든다.
>
> **제외**: `max-lines-per-function`, `no-console`은 본 사이클에서 다루지 않았다.

### Tier A — baseline 잡혀 있음, 코드 수정 후 승격

룰별 1 PR. 비용 오름차순.

| # | 상태 | 브랜치 | 룰 | 위반 | 작업 |
|---|---|---|---|---|---|
| A-1 | ✅ | `chore/lint/a11y-lightbox` | `jsx-a11y/click-events-have-key-events` + `jsx-a11y/no-static-element-interactions` | 1 + 1 (같은 위치) | HobbyDetailPage:196 인라인 라이트박스 div를 shadcn `Dialog`/`DialogContent`로 전환 (role=dialog + focus trap + autoFocus + Esc 닫기 모두 base-ui 자동) |
| A-2 | ✅ | `chore/lint/array-index-key` | `react/no-array-index-key` | 2 | breadcrumb path segment + TagsPage 데이터 안정 key |
| A-3 | ✅ | `chore/lint/set-state-in-effect` | `react-hooks/set-state-in-effect` | 1 | NbFrame 테마 영속화 패턴을 `useSyncExternalStore` 기반 `useNbTheme` hook으로 분리 + `<html suppressHydrationWarning>` |
| A-4 | ✅ | `chore/lint/non-null-assertion` | `@typescript-eslint/no-non-null-assertion` | 6 | `shared/lib/env.ts`에 `requireEnv` 가드 헬퍼 도입 + auth/supabase 6곳 교체. 부수로 `shared/lib` 그룹의 `import/no-relative-parent-imports` 해제(슬롯 자기참조 허용) |

각 PR 공통 마무리:
1. 룰 위반 0 확인 (`pnpm lint`)
2. `lint-baseline.json`에서 해당 룰 항목 제거 + `warn_total` 갱신
3. `eslint.config.mjs`에서 해당 룰 `warn → error` 승격
4. 회귀 차단 검증 — 일부러 위반 추가 시 lint 실패하는지 확인 후 되돌리기
5. `eslint-migration.md` Changelog 갱신
6. `backlog.md` 해당 항목 ✅

### Tier B — 즉시 승격 (코드 수정 0)

| 상태 | 브랜치 | 룰 | 현재 강도 |
|---|---|---|---|
| ✅ | `fix/check-design-sync` (b-1) | `sonarjs/cognitive-complexity` | error **10** (15→10) |
| ✅ | (위와 묶음) | `unicorn/prefer-string-replace-all` | error |
| ✅ | (위와 묶음) | `react/jsx-no-leaked-render` | error (ternary) |

**b-1로 완료** (사이클 추적). 더불어 제어흐름 스타일 표준 2룰을 함께 도입:
- ✅ `no-else-return` error (early-return 강제, 위반 0)
- ✅ `no-nested-ternary` error (중첩삼항 금지, 위반 3건 해소)
- 프로젝트 `CLAUDE.md`에 영어 "Control Flow & Conditionals" 절 + cognitive-complexity threshold 10 결정. 설계서 `b-1_tier-b-style-standards.md`.

### Tier C — 미등록, 추가 도입 (autofix 가능 우선)

도입 방식: warn으로 등록 → `pnpm lint:fix` 일괄 정리 → 위반 0 확인 → error 승격.

#### C-1: autofix만 (한 PR로 묶음) — ✅ 완료 (c-1)

> error 직접 등록 + `pnpm lint:fix` 일괄 정리(~43 파일, 로직 0). 위반은 import/order 89 + prefer-template 3뿐, 전부 autofix. `no-await-expression-member`는 위반 0이라 C-1 유지. import/order는 alphabetize ON. 설계서 `c-1_tier-c1-autofix.md`.

| 룰 | 가치 |
|---|---|
| `react/jsx-no-useless-fragment` | 무의미 fragment 차단 |
| `react/self-closing-comp` | 빈 컴포넌트 자가 닫기 |
| `import/order` | import 그룹별 정렬 |
| `import/first` | import 맨 위 강제 |
| `import/newline-after-import` | import 다음 빈 줄 |
| `prefer-template` | 문자열 + 대신 템플릿 리터럴 |
| `unicorn/throw-new-error` | `new Error()` 강제 |
| `unicorn/no-await-expression-member` | `(await x).y` 직접 접근 금지 |

#### C-2: 부분 autofix + 수동 — ✅ 완료 (c-2)

> type-aware 룰. 전제로 `parserOptions.projectService` 도입(향후 Tier S 인프라도 확보). 두 룰 처음부터 error. optional-chain 위반 0. nullish 위반 5건은 전부 빈 문자열("") 폴백 의도라 `??` 치환 시 동작 변경 → line-level `eslint-disable` + 사유 주석으로 처리(동작 보존). baseline 13 유지. 설계서 `c-2_tier-c2-type-aware.md`.

| 룰 | 가치 |
|---|---|
| `@typescript-eslint/prefer-nullish-coalescing` | `\|\|` 대신 `??` (0/''/false 함정 차단) |
| `@typescript-eslint/prefer-optional-chain` | `a && a.b` 대신 `a?.b` |

### 진행 순서 (당시)

```text
A-1 (jsx-a11y 묶음) → A-2 (array-index-key) → A-3 (set-state-in-effect) → A-4 (non-null-assertion)
  → Tier B 묶음 PR
  → Tier C-1 autofix 묶음 PR
  → Tier C-2 부분 autofix PR
```

### Tier S, Tier D

- **Tier S** (async 안전성 type-aware 룰): ✅ **완료 (s-1)** — `no-floating-promises`·`no-misused-promises`·`await-thenable`·`require-await` error 도입. C-2의 `projectService` 인프라 활용. no-misused 4건 인라인 `void` 래핑(동작 보존), 나머지 3룰 위반 0. 설계서 `s-1_tier-s-async-safety.md`.
- **Tier D** (❌ 종료 — 도입 기각): 2026-07-06 현황 측정 + 실제 위반 코드 검토 후 **프로그램 종결**. 근거:
  - `no-unnecessary-condition`(17건) — **전부 지우면 안 되는 방어 코드**. `mappers.ts`가 untyped Supabase 응답(`Record<string, unknown>`)에 거짓 `as` 단언 + `?? ""`/`?? []` 런타임 가드를 쓰는데, 룰은 "타입상 불필요"라며 가드 제거를 요구(`if (error || !data)`를 "always falsy"로 오판). 도입 시 위험한 가드 제거 or 17건 `eslint-disable` 도배 → **음의 가치**. C-2의 `?? ""` 폴백 5건 보존 결정과 동일한 함정.
  - `react/jsx-no-bind`(28건, autofix 0) — 인라인 핸들러 useCallback화. 모던 React에서 가치 논쟁 큼 + churn 큼(PostForm 10). 개인 블로그 규모에 **ROI 음수**.
  - `sonarjs/no-duplicate-string`(20건) — 대부분 `"var(--nb-ink)"` 등 inline-style CSS 변수 문자열(HomePage 11회 등). 중복이 아니라 inline-style 증상 → 상수 추출 **대부분 노이즈**.
  - `strict-boolean-expressions`(28건) — 4개 중 유일하게 실질 가치 있으나 위반이 data 계층에 몰려 같은 untyped-DB 패턴과 충돌 + 28건 수동. 비용 대비 보류.
  - **근본 원인**: 위 2룰이 싸우는 건 룰 부재가 아니라 **Supabase 클라이언트가 untyped(거짓 `as` 단언)**라는 점. 진짜 레버리지는 룰 추가가 아니라 Supabase 타입 생성(typegen-1로 진행됨). lint ratchet 프로그램은 **A~S로 완료**.

### 후속 리팩터 — `postJson` 추출 ✅ 완료

> `shared/api/{postJson,HttpError,index}.ts` + `postJson.test.ts`(6케이스). 소비처 3곳(`LoginForm`·`usePostForm`×2) 교체. 설계 대비 `HttpError` 표준화가 추가됐고 `useImagePasteUpload`(FormData)는 예정대로 제외.
>
> (원 계획 기록) JSON mutation fetch가 `LoginForm`·`PostForm`(×2) 3곳에서 동일 보일러플레이트(`method`/`Content-Type`/`JSON.stringify`/`res.ok`/`res.json`)를 반복 → `shared/api`에 얇은 `postJson<T>(url, body)` 유틸로 추출 + `res.ok→throw` 표준화. MdxEditor(FormData)·서버 supabase 계층 제외. axios/ky 미도입(Next App Router fetch 확장 유지 + 4곳 규모엔 과함). TanStack Query도 현 규모엔 over-engineering.
>
> ⚠️ **추출 후보 전수 분석은 하지 않는다** — 중복이 실제로 아플 때 추출.

### 변경 이력

- 2026-06-25: 첫 백로그 폐기 → 새 방향성. baseline 승격 중심으로 재정의 (Tier A/B/C).
- 2026-06-25: 작업 순서 A-1 시작.
- 2026-06-25: **A-1 완료** — jsx-a11y 2룰 warn→error 승격 + HobbyDetailPage:196 위반 해소. baseline 24→22.
- 2026-06-26: **A-2 완료** — `react/no-array-index-key` warn→error 승격 + breadcrumb/TagsPage 위반 2건 해소. baseline 22→20.
- 2026-06-26: **Test-1 완료** — vitest + @testing-library 인프라 도입. PR #10 머지.
- 2026-06-26: **A-3 완료** — `react-hooks/set-state-in-effect` warn→error 승격 + NbFrame을 `useSyncExternalStore` 기반 `useNbTheme` hook으로 분리. useNbTheme.test.ts 6 케이스. baseline 20→19.
- 2026-06-26: **A-4 완료** — `@typescript-eslint/no-non-null-assertion` warn→error 승격 + `requireEnv` 가드 헬퍼 도입(`shared/lib/env.ts`, 4 테스트 케이스), auth/supabase 6곳 교체. 설계 D1은 `shared/config` → `shared/lib`로 재고(lint 룰 충돌 회피). `shared/lib` 그룹의 `import/no-relative-parent-imports` 해제. baseline 19→13.
- 2026-06-29: **B-1 완료** — Tier B 3룰 승격(cognitive-complexity warn15→error**10**, prefer-string-replace-all·jsx-no-leaked-render warn→error) + 제어흐름 표준 2룰 신규 error(no-else-return, no-nested-ternary). 중첩삼항 3곳 해소(HomePage·TechDetail `tapeColor`→Record, PostForm 라벨→`submitLabel` early-return). 프로젝트 CLAUDE.md 영어 제어흐름 절 신설. baseline 13 유지(승격 룰 0 warning). 설계서 `b-1_tier-b-style-standards.md`.
- 2026-06-29: **C-1 완료** — autofix 8룰 신규 error 도입(react/jsx-no-useless-fragment, react/self-closing-comp, import/{order,first,newline-after-import}, prefer-template, unicorn/{throw-new-error,no-await-expression-member}). `lint:fix` 일괄 정리(~43 파일, 로직 0). import/order alphabetize ON + pathGroups(react/next 앞, @/ internal). baseline 13 유지. 설계서 `c-1_tier-c1-autofix.md`.
- 2026-06-30: **C-2 완료** — type-aware 룰 2종 신규 error(`@typescript-eslint/prefer-nullish-coalescing`, `prefer-optional-chain`). 전제로 `parserOptions.projectService: true` + `tsconfigRootDir` 도입(typescript-eslint v8 권장, Tier S 인프라도 확보). optional-chain 위반 0. nullish 위반 5건은 전부 빈 문자열 폴백 의도(route.ts×2 series_id, login redirect, PostForm data.error, StripePlaceholder label)라 `??` 치환 시 동작 변경 → line-level `eslint-disable` + 사유 주석으로 처리(동작 보존). 회귀 차단 검증 완료. baseline 13 유지. 설계서 `c-2_tier-c2-type-aware.md`. **Tier A/B/C 사이클 전체 완료.**
- 2026-06-30: **S-1 완료** — Tier S(async 안전성) 4룰 신규 error(`no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`). C-2의 `projectService` 인프라 활용. no-misused 위반 4건은 async 핸들러를 JSX void 위치에 전달한 케이스(LoginForm onSubmit, MdxEditor onPaste, PostForm onSubmit·onClick)라 인라인 `void` 래핑으로 해소(핸들러 내부 try/catch 완비, 동작 보존). 나머지 3룰 위반 0. 회귀 차단 검증 완료. `no-unnecessary-condition`(17건)은 Tier D로 분리. baseline 13 유지. 설계서 `s-1_tier-s-async-safety.md`.
- 2026-07-06: **Tier D 종료(도입 기각)** — 4룰 현황 측정(no-unnecessary-condition 17·strict-boolean 28·no-duplicate-string 20·jsx-no-bind 28) + 실제 위반 코드 검토 결과 전 룰 도입 부적합 판정. 핵심: untyped Supabase 계층의 방어 가드를 `no-unnecessary-condition`이 "불필요"로 오판(음의 가치). 근본 해법은 룰이 아닌 Supabase 타입 생성. **lint ratchet 프로그램 A~S 완료로 종결.** 다음 트랙은 후속 리팩터(`postJson` 추출).
- 2026-07-09: **barrel-1 완료 — FSD 배럴 소비(진입점) 강제** — 기존 레이어 `boundaries/dependencies`에 `internalPath` 진입점 규칙을 통합(신규 error, baseline 13 유지). 슬라이스는 `index.ts`(entities는 +`server.ts`), shared는 세그먼트 배럴(`*/index.ts`)+server-only 예외(`lib/auth.ts`, `lib/supabase/*.ts`)로만 진입. `src/shared/ui/index.ts` 신설(shadcn 6종 + notebook re-export), shared 딥 import 69건(`@/shared/ui/*` 42·`@/shared/lib/{design-data,utils,constants,env,slugify}` 27) 배럴 경유 교체, dead 세그먼트 배럴 **8개** 제거(설계서 9개 중 `widgets/nb-frame/lib/index.ts`는 `NbFrame.tsx`가 `../lib`로 소비 중이라 유지). 결정: (1) `boundaries/entry-point`는 v6.0.2 deprecated → `dependencies`+`internalPath`로 마이그레이션(경고 0). (2) `import/no-internal-modules` 백스톱은 `@/` alias 해석이 entry-point에서 정상 동작해 완전 중복 → 드롭. (3) `shared/ui/dialog.tsx`→button은 같은 세그먼트라 relative `./button`(배럴 경유 시 순환). 회귀 차단 검증 완료. 설계서 `barrel-1_barrel-consumption-enforcement.md`.
- 2026-07-10: **typegen-1 완료 — Supabase 타입 SSOT 도입** — `supabase gen types`로 `database.types.ts` 생성(커밋, lint 제외) + `createServerSupabaseClient`에 `<Database>` 제네릭 주입. `post`/`series`/`category` 3개 엔티티를 **매퍼 경유로 통일**(series 매퍼 dead→부활, category 매퍼 신규 TDD). `src/entities` 프로덕션 코드의 `as` 단언 **31 → 0**. 특성화 테스트를 리팩터 **전에** 작성해 동작 보존을 증명(신규 15케이스, 총 37 테스트 GREEN). 발견: `posts.created_at`/`published`/`updated_at`이 DB상 nullable인데 도메인 타입은 non-null + 폴백 없음 → `PostMeta`가 null일 때 `new Date(null)`로 **1970-01-01을 렌더링하던 버그** 확인, 도메인 타입을 nullable로 정직화하고 가드 추가. 설계의 `QueryData` 방식은 `import/no-cycle`과 양립 불가해 `Pick<Tables<...>>` 파생으로 변경(select 컬럼 누락 drift는 `TS2345`로 차단됨을 회귀 검증). dead code 정리: `shared/lib/supabase/client.ts` 삭제, `@supabase/ssr` 제거. drift 방어는 `pnpm db:types` 스크립트까지(CI 게이트 미도입 — 알려진 한계). baseline 13 유지, `pnpm build` 통과. 설계서 `typegen-1_supabase-type-ssot.md`. **후속: tierD-1, migration-1.**
- 2026-07-16: **백로그 재구조화** — lint ratchet 프로그램(A~S) 완료로 완료 이력을 하단 아카이브로 접고, 남은 후속 트랙 4개(tierD-1, dead code 3건, 전역 하네스 배럴 전제 정정, migration-1)를 "현재 백로그"로 상단 배치.
- 2026-07-16: **barrel-hook-2 완료 — 전역 배럴 하네스 "폴더마다 배럴" 전제 정정** — 전역 파일 2개(`~/.claude/hooks/post-barrel.sh`, `~/.claude/skills/impl-review/SKILL.md`)가 feature-folder 관례를 전제해 FSD 슬라이스-루트 배럴 프로젝트를 오차단/오탐하던 문제 수정. ① 훅 **전역 완화(B)**: write 모드 "index.ts 없으면 차단"(30-33행) 제거 → 배럴 없는 폴더(FSD 세그먼트)는 통과, 배럴 있을 때 심볼 동기화 넛지(34-36·edit)는 보존. ② **이 프로젝트 무력화(마커 가드)**: settings로는 전역 훅을 프로젝트별로 뺄 수 없어(훅 additive) 훅 최상단에 조기 종료 가드 추가(`$CLAUDE_PROJECT_DIR` 우선 + `FILE_PATH` 절대경로에서 `.claude/` 상향 탐색 폴백, 고정점 방어) + `.claude/no-barrel-hook` sentinel 생성. 근거: 진입점 계약을 lint `boundaries`가 error 강제(SSOT)라 런타임 훅 중복. ③ **impl-review #16 재작성**: (a)"폴더에 index.ts 없으면 FAIL"·(b)"배럴이 모든 public API 노출 안 하면 PARTIAL" 삭제(FSD 오탐) → (c) "진입점 계약 위반(밖에서 배럴 우회 딥 import=FAIL)"으로 재프레이밍 + lint 강제 프로젝트는 `N/A (lint-enforced)` 규정. 코드리뷰로 폴백 무한루프(상대/빈 경로) Important 1건 수정. 마커 유/무 × 배럴 유/무 5개 시나리오 수동 실증. settings.json 불변(다른 5개 프로젝트 동작 보존). 설계서 `barrel-hook-2_folder-barrel-premise-correction.md`. **남은 후속: dead code 3건, migration-1.**
- 2026-07-16: **tierD-1 완료 — Tier D 재판정, `no-unnecessary-condition` 채택** — Tier D가 기각(untyped Supabase 방어 가드 오판)했던 룰을 **typegen-1로 타입이 정직해진 뒤 재판정** → error 채택. 위반 12건 중 **11건이 진짜 dead로 전환**되어 단순화: `entities/{post,series,category}/api`의 `if (error \|\| !data)` → `if (error)` 10건(discriminated union상 error 검사 후 `data` non-null 좁힘, tsc 검증), `series/model/mappers.ts`의 `Number(post_count ?? 0)` → `Number(post_count)` 1건(RPC 반환 타입 non-null + `count()` null 미반환). **1건은 `navigator.clipboard?.`**(DOM 타입이 non-null로 거짓, 비-HTTPS/구형에서 undefined) → line-level `eslint-disable` + 사유로 예외(**단일행 형태만 유효** — 2줄 `//`는 지시어가 코드가 아닌 다음 주석줄을 가리켜 unused-directive 경고, 실증 확인). `prefer-nullish` disable 5건은 빈 문자열 폴백 의도로 **재확인(변경 0)**. C-2·tierD-1이 같은 예외 전략을 반복하므로 프로젝트 `CLAUDE.md`에 **"Type-aware rule exceptions" 메타 컨벤션 신설**("룰 끄지 말고 그 줄만 disable + `--` 사유"). 회귀 차단 검증(dead 조건 복원 시 error) + 매퍼 특성화 테스트 15/15 GREEN(동작 보존). baseline 13 유지. 설계서 `tierD-1_no-unnecessary-condition-adoption.md`. **남은 후속: dead code 3건, 전역 하네스 배럴 전제 정정, migration-1.**
