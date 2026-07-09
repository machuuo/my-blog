# 하네스 후속 작업 백로그

ESLint 마이그레이션(PR #7) 머지 후 baseline 강화 트래커.

**목표**: 가드레일이 될 수 있는 룰을 식별하여 `warn → error` 승격으로 하네스 엔지니어링을 고도화한다. 룰 위반은 즉시 빌드 차단되도록 만든다.

**제외**: `max-lines-per-function`, `no-console`은 본 사이클에서 다루지 않는다.

진행 상태: ⬜ 대기 / 🟡 진행 중 / ✅ 완료 / ❌ 보류

---

## Tier A — baseline 잡혀 있음, 코드 수정 후 승격

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

---

## Tier B — 즉시 승격 (코드 수정 0)

| 상태 | 브랜치 | 룰 | 현재 강도 |
|---|---|---|---|
| ✅ | `fix/check-design-sync` (b-1) | `sonarjs/cognitive-complexity` | error **10** (15→10) |
| ✅ | (위와 묶음) | `unicorn/prefer-string-replace-all` | error |
| ✅ | (위와 묶음) | `react/jsx-no-leaked-render` | error (ternary) |

**b-1로 완료** (사이클 추적). 더불어 제어흐름 스타일 표준 2룰을 함께 도입:
- ✅ `no-else-return` error (early-return 강제, 위반 0)
- ✅ `no-nested-ternary` error (중첩삼항 금지, 위반 3건 해소)
- 프로젝트 `CLAUDE.md`에 영어 "Control Flow & Conditionals" 절 + cognitive-complexity threshold 10 결정. 설계서 `b-1_tier-b-style-standards.md`.

---

## Tier C — 미등록, 추가 도입 (autofix 가능 우선)

도입 방식: warn으로 등록 → `pnpm lint:fix` 일괄 정리 → 위반 0 확인 → error 승격.

### C-1: autofix만 (한 PR로 묶음) — ✅ 완료 (c-1)

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

### C-2: 부분 autofix + 수동 — ✅ 완료 (c-2)

> type-aware 룰. 전제로 `parserOptions.projectService` 도입(향후 Tier S 인프라도 확보). 두 룰 처음부터 error. optional-chain 위반 0. nullish 위반 5건은 전부 빈 문자열("") 폴백 의도라 `??` 치환 시 동작 변경 → line-level `eslint-disable` + 사유 주석으로 처리(동작 보존). baseline 13 유지. 설계서 `c-2_tier-c2-type-aware.md`.

| 룰 | 가치 |
|---|---|
| `@typescript-eslint/prefer-nullish-coalescing` | `\|\|` 대신 `??` (0/''/false 함정 차단) |
| `@typescript-eslint/prefer-optional-chain` | `a && a.b` 대신 `a?.b` |

---

## 진행 순서

```text
A-1 (jsx-a11y 묶음) → A-2 (array-index-key) → A-3 (set-state-in-effect) → A-4 (non-null-assertion)
  → Tier B 묶음 PR
  → Tier C-1 autofix 묶음 PR
  → Tier C-2 부분 autofix PR
```

---

## Tier S, Tier D

- **Tier S** (async 안전성 type-aware 룰): ✅ **완료 (s-1)** — `no-floating-promises`·`no-misused-promises`·`await-thenable`·`require-await` error 도입. C-2의 `projectService` 인프라 활용. no-misused 4건 인라인 `void` 래핑(동작 보존), 나머지 3룰 위반 0. 설계서 `s-1_tier-s-async-safety.md`.
- **Tier D** (❌ 종료 — 도입 기각): 2026-07-06 현황 측정 + 실제 위반 코드 검토 후 **프로그램 종결**. 근거:
  - `no-unnecessary-condition`(17건) — **전부 지우면 안 되는 방어 코드**. `mappers.ts`가 untyped Supabase 응답(`Record<string, unknown>`)에 거짓 `as` 단언 + `?? ""`/`?? []` 런타임 가드를 쓰는데, 룰은 "타입상 불필요"라며 가드 제거를 요구(`if (error || !data)`를 "always falsy"로 오판). 도입 시 위험한 가드 제거 or 17건 `eslint-disable` 도배 → **음의 가치**. C-2의 `?? ""` 폴백 5건 보존 결정과 동일한 함정.
  - `react/jsx-no-bind`(28건, autofix 0) — 인라인 핸들러 useCallback화. 모던 React에서 가치 논쟁 큼 + churn 큼(PostForm 10). 개인 블로그 규모에 **ROI 음수**.
  - `sonarjs/no-duplicate-string`(20건) — 대부분 `"var(--nb-ink)"` 등 inline-style CSS 변수 문자열(HomePage 11회 등). 중복이 아니라 inline-style 증상 → 상수 추출 **대부분 노이즈**.
  - `strict-boolean-expressions`(28건) — 4개 중 유일하게 실질 가치 있으나 위반이 data 계층에 몰려 같은 untyped-DB 패턴과 충돌 + 28건 수동. 비용 대비 보류.
  - **근본 원인**: 위 2룰이 싸우는 건 룰 부재가 아니라 **Supabase 클라이언트가 untyped(거짓 `as` 단언)**라는 점. 진짜 레버리지는 룰 추가가 아니라 Supabase 타입 생성(별도 트랙). lint ratchet 프로그램은 **A~S로 완료**.

---

## 후속 리팩터 (lint 외, 별도 트랙)

- **클라이언트 fetch 유틸 `postJson` 추출** (S-1 논의에서 파생, 별도 PR): JSON mutation fetch가 `LoginForm`·`PostForm`(×2) 3곳에서 동일 보일러플레이트(`method`/`Content-Type`/`JSON.stringify`/`res.ok`/`res.json`)를 반복. `shared/api`에 얇은 `postJson<T>(url, body)` 유틸로 추출 + `res.ok→throw` 표준화. MdxEditor(FormData)·서버 supabase 계층은 제외. axios/ky 등 라이브러리는 도입하지 않음(Next App Router fetch 확장 유지 + 4곳 규모엔 과함).
  - 부기(미확정, 필요 시에만): `useAsyncHandler`(pending/error 상태 표준화)는 opt-in이라 rejection을 '강제'하진 못함 → 보일러플레이트가 실제로 거슬릴 때 재검토. TanStack Query는 현 규모(fetch 4곳)에 over-engineering.
  - ⚠️ **추출 후보 전수 분석은 하지 않는다** — 중복이 실제로 아플 때 추출. 위 `postJson`만 실재 중복(3곳)이라 기록.

---

## 변경 이력

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
