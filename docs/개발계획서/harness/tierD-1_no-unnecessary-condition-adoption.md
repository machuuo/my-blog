# tierD-1: Tier D 룰 재판정 — no-unnecessary-condition 채택 + prefer-nullish disable 재확인

> 하네스 baseline 강화 후속 트랙. backlog.md "현재 백로그 > tierD-1". typegen-1에서 파생.

---

## 1. 배경 & 목표

Tier D는 2026-07-06에 **도입 기각**됐다. 핵심 근거는 "`no-unnecessary-condition`(당시 17건)이 untyped Supabase 계층의 방어 가드를 '불필요'로 오판한다"였다. 당시 `mappers`/`api` 계층은 거짓 `as` 단언으로 응답을 `Record<string, unknown>`처럼 다뤘고, `if (error || !data)` 같은 가드가 **타입상으론 dead지만 런타임상으론 진짜**였다.

그 후 **typegen-1(2026-07-10)**이 Supabase 생성 타입 SSOT를 도입해 `as` 단언을 31→0으로 없앴다. 타입이 정직해지자 Tier D 기각의 전제가 사라졌다. tierD-1은 이 변화를 반영해 두 대상을 재판정한다:

1. Tier D가 기각한 `@typescript-eslint/no-unnecessary-condition` (재측정 결과 **12건**)
2. C-2가 `eslint-disable`로 덮은 `@typescript-eslint/prefer-nullish-coalescing` **5건**

- **목표**: 정직해진 타입 위에서 `no-unnecessary-condition`을 **error**로 채택해, 진짜 dead가 된 조건 가드를 제거하고 향후 가드레일을 확보한다. `prefer-nullish` 5건은 재판정 결과를 문서화한다.
- **선행 조건**: type-aware 파서(`projectService`)는 C-2에서 이미 확보됨. 인프라 추가 작업 없음.

---

## 2. 기능 요구사항 (가드레일 관점)

- 개발자가 **타입상 항상 참/거짓인 조건**(dead branch)을 작성하면 빌드가 차단된다 → 죽은 방어 코드 누적을 막는다.
- 단, **DOM/외부 타입이 거짓말하는 값**(런타임엔 nullable인데 타입은 non-null)에 대한 방어 `?.`는 정당하다. 이 경우 line-level `eslint-disable` + 사유 주석으로 의도를 명시한다 (C-2와 동일 전략).
- 이 룰은 값이 **실제로 nullable인 곳**(예: `.maybeSingle()`)에서는 `!data` 가드를 오히려 **요구**하므로, 채택은 미래의 방어 코드까지 자기일관적으로 보호한다.

### in scope

- `eslint.config.mjs`: `no-unnecessary-condition` **error** 등록 (type-aware 블록)
- `no-unnecessary-condition` 위반 12건 처리:
  - **11건 단순화** (dead 가드 제거) — `if (error || !data)` → `if (error)` 10건, `Number(row.post_count ?? 0)` → `Number(row.post_count)` 1건
  - **1건 유지 + disable** — `navigator.clipboard?.` (DOM 타입 거짓)
- `prefer-nullish-coalescing` disable 5건 **재확인** (변경 없음 — 근거를 §8에 명문화)
- **프로젝트 `CLAUDE.md`에 "type-aware 룰 예외" 컨벤션 절 추가** — 룰별 나열 대신 메타 패턴("룰을 끄지 말고 그 줄만 disable + `--` 사유")으로 문서화. clipboard(DOM 거짓)·빈 문자열 폴백 2범주를 예시로. C-2의 기존 5건에도 소급 근거 제공
- baseline / migration / backlog 문서 갱신

### out of scope

- Tier D가 함께 기각한 나머지 3룰(`jsx-no-bind` 28·`no-duplicate-string` 20·`strict-boolean-expressions` 28) — 재판정 대상 아님. typegen-1과 무관하게 기각 사유(ROI/노이즈/비용) 유효.
- `migration-1`(스키마 SQL 버전 관리) — 별도 트랙.
- 신규 기능/UI 변경 — 없음.

---

## 3. 완료 조건 (Acceptance Criteria)

- [ ] `eslint.config.mjs` type-aware 블록에 `@typescript-eslint/no-unnecessary-condition: "error"` 추가
- [ ] `no-unnecessary-condition` 위반 11건 단순화 (동작 보존):
  - [ ] `src/entities/post/api/posts.ts` — `if (error || !data)` → `if (error)` 6건 (:18, :32, :47, :62, :77, :90)
  - [ ] `src/entities/series/api/series.ts` — 3건 (:12, :26, :38)
  - [ ] `src/entities/category/api/categories.ts` — 1건 (:14)
  - [ ] `src/entities/series/model/mappers.ts:23` — `Number(row.post_count ?? 0)` → `Number(row.post_count)` (Number() 래핑 + bigint 주석은 유지)
- [ ] `src/views/tech-detail/ui/TechDetailPage.tsx:102` — `navigator.clipboard?.` 유지 + `eslint-disable-next-line` + 사유 주석
- [ ] 단순화 후 `pnpm tsc --noEmit` 통과 — `if (error)` 만으로 `data`가 non-null로 좁혀져 `.map()` 타입 에러 없음 확인
- [ ] `prefer-nullish` disable 5건 그대로 유지 (route.ts×2, login/page.tsx, StripePlaceholder.tsx, postJson.ts) — 코드 변경 0
- [ ] 프로젝트 `CLAUDE.md`의 "Control Flow & Conditionals" 절 아래 "Type-aware rule exceptions" 하위 절 추가 (§6의 제안 텍스트대로)
- [ ] `pnpm lint` 위반 0 확인 (`0 errors, 13 warnings` — 기존 max-lines-per-function 13 유지)
- [ ] 회귀 차단 검증 — 일부러 dead 조건(예: `if (error || !data)` 복원) 추가 시 lint **error** 확인 후 되돌리기
- [ ] `lint-baseline.json` 갱신 (warn_total 13 유지 — 룰 error라 warn 미증가. `neutral`에 `source: "new-rule-as-error"` 기록)
- [ ] `eslint-migration.md` Changelog 갱신
- [ ] `backlog.md` tierD-1 ✅ 처리 + 변경 이력 추가
- [ ] `pnpm build` 통과 (회귀 없음 확인)

---

## 4. 기능 흐름

lint 재판정 작업이라 사용자 시나리오 대신 **도입 흐름**으로 기술한다.

```text
1. 룰 error 등록 (no-unnecessary-condition)
     ↓ pnpm lint — 위반 12건 노출 (재측정 확인)
2. 11건 dead 가드 단순화 (if(error||!data)→if(error), ?? 0 제거)
     ↓ pnpm tsc --noEmit — data 좁힘 유지, .map() 타입 에러 0 확인
3. clipboard 1건 disable + 사유 주석
     ↓ pnpm lint — 위반 0 확인
4. prefer-nullish 5건 재확인 (변경 없음 — 그대로 통과하는지 확인)
     ↓
5. 회귀 차단 검증 (dead 조건 복원 → error → 되돌림)
     ↓
6. 문서 3종 갱신 (baseline / migration / backlog)
     ↓ pnpm build — 빌드 회귀 없음 확인
```

### 에러 시나리오

- **`if (error)`만으로 `data`가 non-null로 안 좁혀지는 쿼리**: 조인 select(`POST_WITH_SERIES_SELECT`)나 RPC 반환이 discriminated union으로 정확히 좁혀지지 않으면 `data.map()`에서 `TS2531`. → 그 쿼리에 한해 `if (error || !data)` 유지 + 해당 줄만 disable(A-4로 non-null 단언은 금지). 측정 시 12건이 `!data`를 "always falsy"로 판정했으므로 좁힘은 성립하나, tsc로 최종 확인한다.
- **예상 못한 추가 위반**: 룰 등록 시 12건 외 신규 노출 → 각 건 "진짜 dead vs 타입 거짓" 판별 후 단순화 또는 disable.

---

## 5. UI 설계

**N/A — UI 변경 없음.** lint 룰 채택 + 서버 계층 조건식 단순화(동작 불변) 작업이다.

- 컴포넌트 트리: 해당 없음 — 컴포넌트 추가/변경 없음 (TechDetailPage는 `?.` 1줄에 주석만 추가, 렌더 불변)
- 접근성: N/A — 인터랙티브 UI 변경 없음

---

## 6. 기술 설계

### 변경 파일

| 파일 | 역할 | 비고 |
|---|---|---|
| `eslint.config.mjs` | `no-unnecessary-condition` error 등록 | type-aware 블록(prefer-nullish 옆) |
| `src/entities/post/api/posts.ts` | `if (error \|\| !data)` → `if (error)` 6건 | :18, :32, :47, :62, :77, :90 |
| `src/entities/series/api/series.ts` | 동일 단순화 3건 | :12, :26, :38 |
| `src/entities/category/api/categories.ts` | 동일 단순화 1건 | :14 |
| `src/entities/series/model/mappers.ts` | `?? 0` 제거 (Number() + bigint 주석 유지) | :23 |
| `src/views/tech-detail/ui/TechDetailPage.tsx` | `clipboard?.` 유지 + disable 주석 | :102 |
| `CLAUDE.md` (프로젝트 루트) | "Type-aware rule exceptions" 컨벤션 절 추가 | "Control Flow & Conditionals" 절 아래 |
| `docs/개발계획서/harness/lint-baseline.json` | ratchet 메타 갱신 | warn_total 13 유지 |
| `docs/개발계획서/harness/eslint-migration.md` | Changelog 갱신 | |
| `docs/개발계획서/harness/backlog.md` | tierD-1 ✅ + 이력 | |

> **테스트 파일 면제**: 신규 `hooks/*.ts`·`utils/*.ts` 순수 함수 추가 없음(설정/조건식 치환뿐). 기존 특성화 테스트(entities 매퍼 37케이스)가 동작 보존을 회귀 검증한다 — 단순화 후 `pnpm test` GREEN 유지가 안전망.

### 단순화 원리 (핵심)

Supabase 생성 타입은 discriminated union이다:

```text
{ data: T[]; error: null } | { data: null; error: PostgrestError }   // list/rpc
{ data: T;   error: null } | { data: null; error: PostgrestError }   // .single()
```

`if (error) return …` 로 error 브랜치를 걷어내면 남는 건 `error: null` 브랜치뿐이라 `data`가 non-null로 좁혀진다. 따라서 `|| !data`는 타입상 도달 불가(룰이 "always falsy"로 판정한 근거). `.single()`도 0행이면 `error`(PGRST116)가 서므로 동일하게 성립한다.

### disable 주석 형태 (clipboard 1건)

```text
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard는
//   비-HTTPS/구형 브라우저에서 undefined (DOM 타입이 non-null로 거짓 선언). ?. 방어 유지.
navigator.clipboard?.writeText(CODE_SNIPPET).catch(() => {});
```

### DOM-거짓 패턴 선조사 결과 (C안 요구)

`no-unnecessary-condition`과 충돌할 수 있는 "타입은 non-null, 런타임은 nullable" 사용처 전수 조사:

| 패턴 | 사용처 | 룰 충돌? |
|---|---|---|
| `navigator.clipboard?.` | TechDetailPage.tsx:102 | ⚠️ **충돌 (유일)** — `?.` 방어라 룰이 "불필요"로 잡음 → disable |
| `localStorage` / `window.*` / `document.*` | useNbTheme.ts, NbFrame.tsx | ✅ 무관 — `?.`/조건 없이 직접 호출, 룰이 건드리지 않음 |
| `JSON.parse` / `matchMedia` / observer류 | 사용처 0 | ✅ 해당 없음 |

→ **추가 disable 후보 없음. 범위는 단순화 11 + disable 1로 확정.**

### 프로젝트 CLAUDE.md 컨벤션 추가 (제안 텍스트)

C-2(빈 문자열 폴백)와 tierD-1(DOM 거짓)이 같은 전략을 반복하므로, 룰별 나열 대신 **메타 패턴**으로 프로젝트 `CLAUDE.md`의 "Control Flow & Conditionals" 절 아래 다음을 추가한다. 구현 단계에서 이 텍스트를 그대로 반영한다 (설계 단계에서는 미수행).

````markdown
### Type-aware rule exceptions: disable the line, not the rule

Type-aware rules (`no-unnecessary-condition`, `prefer-nullish-coalescing`, …)
sometimes fire on an **intentional** exception. Never turn the rule off globally.
Add a line-level disable **with a reason** after `--`. Keep it on **one line** — a
directive on the next line only, so a wrapped two-line `//` comment breaks (the
directive targets the comment line, ESLint reports it as unused):

```ts
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is undefined in insecure/legacy contexts (the DOM type lies: declared non-null). Keep the guard.
navigator.clipboard?.writeText(text).catch(() => {});
```

Two recurring exception categories:

1. **The type lies about runtime nullability** — DOM/external types declared
   non-null but `undefined` at runtime (`navigator.clipboard`, feature-detected
   APIs). Keep the defensive `?.`.
2. **Empty string / 0 / false is a real fallback target** — `x || fallback`
   where `""`/`0`/`false` must fall through. `??` would change behavior. Keep `||`.

The reason comment is mandatory — it tells the reviewer the exception is deliberate.
In JSX use the `{/* … */}` form.
````

---

## 7. 에러 & 피드백 처리

가드레일 재판정 작업이라 런타임 사용자 피드백은 없음. **개발자 피드백(빌드 차단)** 관점:

- **성공**: `pnpm lint` → `0 errors`. 타입상 dead인 조건 작성 시 즉시 error로 차단.
- **실패(회귀)**: 의도적 dead 조건 추가 → lint error 확인이 검증 기준(AC).
- **disable의 의미**: 룰을 끄는 게 아니라 "이 줄은 DOM 타입이 거짓이라 방어가 필요"임을 코드에 문서화. 리뷰어가 의도를 즉시 식별.
- **동작 보존 안전망**: entities 매퍼 특성화 테스트 37케이스가 `if (error)` 단순화 후에도 GREEN이어야 한다.

---

## 8. 결정 사항

| # | 쟁점 | 결정 | 근거 |
|---|---|---|---|
| 1 | 룰 채택 여부 | **채택 (error)** | typegen-1로 타입이 정직해져 Tier D 기각 전제("타입이 거짓") 소멸. 12건 중 11건이 진짜 dead로 전환 |
| 2 | 채택 방식(A/B/C안) | **C — 채택 + DOM 선조사** | 사용자 선택. 단순화 전 타입-거짓 패턴 전수 조사 → 추가 disable 없음 확인, 범위를 A와 동일하게 확정 |
| 3 | `if (error \|\| !data)` 처리 | **`if (error)`로 단순화 (10건)** | discriminated union상 `!data`는 dead. 룰이 nullable인 곳(`.maybeSingle`)에선 오히려 `!data`를 요구하므로 미래 방어까지 자기일관 |
| 4 | `Number(post_count ?? 0)` 처리 | **`?? 0` 제거, `Number()`·bigint 주석 유지** | RPC 반환 타입 `post_count: number` non-null + Postgres `count()`는 null 미반환 → `?? 0` dead. bigint→문자열 대비 `Number()`는 이 룰과 무관 |
| 5 | `navigator.clipboard?.` 처리 | **유지 + line-level disable** | DOM 타입은 non-null이나 비-HTTPS/구형에서 undefined. `?.` 제거 시 런타임 TypeError. C-2와 동일 예외 전략 |
| 6 | `prefer-nullish` disable 5건 재판정 | **전부 유지 (변경 0)** | 5건 모두 빈 문자열("") 폴백이 실제 의도. typegen-1은 nullability만 바꿨고 "문자열이 비었는가"는 무관 → `??` 치환 시 동작 변경(FK 빈값 저장 등). 재확인만 |
| 7 | 나머지 Tier D 3룰 | **재판정 안 함 (기각 유지)** | typegen-1과 무관한 기각 사유(jsx-no-bind ROI 음수, no-duplicate-string 노이즈, strict-boolean 비용). out of scope |
| 8 | 룰 등록 강도 | **처음부터 error** (warn 경유 안 함) | 위반을 즉시 해소 가능. C-2/S-1과 동일. baseline warn 미증가 |
| 9 | baseline 영향 | **warn_total 13 유지** | 룰 error라 warn 미증가. max-lines-per-function 13만 잔존(제외 항목) |
| 10 | disable 컨벤션 문서화 위치 | **프로젝트 `CLAUDE.md`** (글로벌 아님) | 특정 type-aware 룰이 `error`인 레포에서만 실행 가능한 조언. 글로벌은 행동 지침 테마라 부적합, 다른 5개 프로젝트엔 비활성. 반복 실수 아니므로 corrections.md도 아님 |
| 11 | 문서화 형태 | **메타 패턴 1개** (룰별 나열 X) | C-2·tierD-1이 같은 전략 반복 → "룰 끄지 말고 그 줄만 disable + `--` 사유" 원칙 하나로 향후 케이스까지 커버 |
| 12 | 컨벤션 수행 시점 | **구현 단계에서 반영** (설계 단계 미수행) | 사용자 지시 — 설계서엔 명시하되 CLAUDE.md 편집은 /wf:implement에서 |
