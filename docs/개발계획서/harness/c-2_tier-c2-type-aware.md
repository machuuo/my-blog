# C-2: Tier C-2 — type-aware 룰 도입 (prefer-nullish-coalescing / prefer-optional-chain)

> 하네스 baseline 강화 사이클. backlog.md Tier C-2.

---

## 1. 배경 & 목표

ESLint baseline 승격 사이클(Tier A/B/C-1)이 모두 완료된 상태에서, 마지막 활성 Tier인 **C-2(type-aware 룰)**를 도입한다.

- **목표**: `@typescript-eslint/prefer-nullish-coalescing`, `@typescript-eslint/prefer-optional-chain` 두 룰을 **error**로 등록해, `||`/`&&` 함정(0/''/false truthy 오판, 중첩 null 체크)을 빌드 차단 가드레일로 만든다.
- **선행 조건**: 두 룰 모두 **타입 정보(type-aware)**가 필요하다. 현재 `eslint.config.mjs`에는 `parserOptions.project`/`projectService`가 없어, 이 인프라 도입이 C-2의 실질적 본체다.
- **부수 효과**: type-aware 파서가 켜지면 향후 Tier S(`no-floating-promises` 등)의 전제도 함께 확보된다. (Tier S 룰 도입은 본 작업 범위 아님.)

---

## 2. 기능 요구사항 (가드레일 관점)

- 개발자가 nullable 값에 `||` 폴백을 쓰면 (의도가 nullish 폴백인 경우) 빌드가 차단된다 → `??` 사용을 강제한다.
- 개발자가 `a && a.b && a.b.c` 형태의 중첩 null 체크를 쓰면 빌드가 차단된다 → `a?.b?.c` 사용을 강제한다.
- **단, 빈 문자열("")/0/false도 폴백 대상으로 의도한 `||`는 정당하다.** 이 경우 line-level `eslint-disable` + 사유 주석으로 의도를 명시한다 (룰을 끄지 않고 예외만 표시).

### in scope
- `eslint.config.mjs`: type-aware 파서 설정 + 룰 2종 error 등록
- 기존 위반 5건 처리 (전부 `||` 유지 + disable, Phase 2 "Best" 결정)
- baseline/migration/backlog 문서 갱신

### out of scope
- Tier S 룰 도입 (파서 인프라만 확보, 룰은 미도입)
- `max-lines-per-function` 13건 (backlog 제외 항목)
- `prefer-nullish-coalescing`의 `ignorePrimitives` 옵션 사용 (B안 선택으로 기본옵션 사용 — A안 기각됨)

---

## 3. 완료 조건 (Acceptance Criteria)

- [ ] `eslint.config.mjs`에 `languageOptions.parserOptions.projectService: true` + `tsconfigRootDir` 추가
- [ ] `pnpm lint` 정상 동작 (type-aware 파싱 에러 없음, 전체 src 커버)
- [ ] `prefer-optional-chain` **error** 등록 — 위반 0 (실측 0건)
- [ ] `prefer-nullish-coalescing` **error** 등록
- [ ] 위반 5건 전부 line-level `eslint-disable-next-line` + 사유 주석으로 처리 (동작 변화 0)
  - [ ] `src/app/api/posts/route.ts:32` `series_id || null`
  - [ ] `src/app/api/posts/route.ts:62` `series_id || null`
  - [ ] `src/app/login/page.tsx:13` `redirect || "/write"`
  - [ ] `src/features/write-post/ui/PostForm.tsx:108` `data.error || "저장 실패"`
  - [ ] `src/shared/ui/notebook/StripePlaceholder.tsx:87` `label || "image →"`
- [ ] `pnpm lint` 위반 0 확인 (`0 errors, 13 warnings` — 기존 max-lines-per-function 13 유지)
- [ ] 회귀 차단 검증 — 일부러 nullable `||`/중첩 `&&` 추가 시 lint **error**로 실패 확인 후 되돌리기
- [ ] `lint-baseline.json` 갱신 (warn_total 13 유지 — 두 룰 error라 warn 미증가. `neutral` 섹션에 `source: "new-rule-as-error"` 항목 기록)
- [ ] `eslint-migration.md` Changelog 갱신
- [ ] `backlog.md` Tier C-2 항목 ✅ + 변경 이력 추가
- [ ] 빌드 검증 — `pnpm build` 통과 (type-aware lint와 별개로 회귀 없음 확인)

---

## 4. 기능 흐름

lint 인프라 작업이라 사용자 시나리오 대신 **도입 흐름**으로 기술한다.

```text
1. 파서 설정 추가 (projectService)
     ↓ pnpm lint  — 파싱 정상? (실패 시 tsconfig include/exclude 조정)
2. 두 룰 error 등록
     ↓ pnpm lint  — 위반 5건(nullish) + 0건(optional-chain) 노출
3. 위반 5건 disable 주석 처리
     ↓ pnpm lint  — 위반 0 확인
4. 회귀 차단 검증 (의도적 위반 → error 확인 → 되돌림)
     ↓
5. 문서 3종 갱신 (baseline / migration / backlog)
     ↓ pnpm build — 빌드 회귀 없음 확인
```

### 에러 시나리오
- **파싱 에러/속도 급증**: `projectService`가 tsconfig include 밖 파일을 만나면 에러. → `tsconfigRootDir` 명시 + 필요 시 `eslint.config.mjs`의 `ignores`로 비대상 제외. 측정 시 정상 동작 확인됨(임시 검증).
- **예상 못한 추가 위반**: optional-chain이 0이 아닐 경우 → 각 건 안전성 검토 후 `?.` 치환 또는 disable.

---

## 5. UI 설계

**N/A — UI 변경 없음.** lint 설정 + 로직 표현 치환(동작 불변) 작업이다.

- 컴포넌트 트리: 해당 없음 — 컴포넌트 추가/변경 없음
- 접근성: N/A — 인터랙티브 UI 변경 없음

---

## 6. 기술 설계

### 변경 파일

| 파일 | 역할 | 비고 |
|---|---|---|
| `eslint.config.mjs` | type-aware 파서 설정 + 룰 2종 error 등록 | 공통 설정 블록(`files: ["src/**/*.{ts,tsx}"]`)에 `languageOptions.parserOptions` 추가 |
| `src/app/api/posts/route.ts` | 위반 2건 disable 주석 | :32, :62 `series_id \|\| null` |
| `src/app/login/page.tsx` | 위반 1건 disable 주석 | :13 `redirect \|\| "/write"` |
| `src/features/write-post/ui/PostForm.tsx` | 위반 1건 disable 주석 | :108 `data.error \|\| "저장 실패"` |
| `src/shared/ui/notebook/StripePlaceholder.tsx` | 위반 1건 disable 주석 | :87 `label \|\| "image →"` |
| `docs/개발계획서/harness/lint-baseline.json` | ratchet 메타 갱신 | warn_total 13 유지 |
| `docs/개발계획서/harness/eslint-migration.md` | Changelog 갱신 | |
| `docs/개발계획서/harness/backlog.md` | Tier C-2 ✅ + 이력 | |

> **테스트 파일 면제**: 신규 `hooks/*.ts`·`utils/*.ts` 순수 함수 추가 없음(설정/주석 변경뿐). `*.test.ts` 대상 없음.

### 파서 설정 (핵심 인터페이스)

`eslint.config.mjs` 공통 설정 블록에 추가:

```text
languageOptions: {
  parserOptions: {
    projectService: true,        // typescript-eslint v8 권장 방식 (project 배열보다 빠르고 관리 쉬움)
    tsconfigRootDir: import.meta.dirname,
  },
}
```

- **`projectService` 선택 이유**: `project: ["./tsconfig.json"]` 대비 v8 권장. 파일별 프로그램 자동 매칭 + 성능 우수. 측정 시 정상 동작 확인.
- **적용 범위**: 공통 블록(`src/**/*.{ts,tsx}`, `IGNORE_TEST` 제외)에 한정. 테스트/스토리 파일은 기존대로 제외.

### 룰 등록

```text
"@typescript-eslint/prefer-nullish-coalescing": "error",   // 기본옵션 (B안)
"@typescript-eslint/prefer-optional-chain": "error",
```

### disable 주석 형태 (위반 5건 공통)

```text
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
<기존 || 표현식 그대로>
```

- 사유 주석은 위치별 맥락에 맞게 1줄 (예: "빈 문자열도 null로 저장 의도", "빈 redirect는 기본 경로로").

---

## 7. 에러 & 피드백 처리

가드레일 도입 작업이라 런타임 사용자 피드백은 없음. **개발자 피드백(빌드 차단)** 관점:

- **성공**: `pnpm lint` → `0 errors`. nullable `||`/중첩 `&&` 위반 시 즉시 error로 빌드 차단.
- **실패(회귀)**: 의도적 위반 추가 → lint error 발생 확인이 검증 기준(AC). disable 주석 없는 nullable `||`는 통과 불가.
- **disable의 의미**: 룰을 끄는 게 아니라 "이 줄은 빈값 폴백이 의도"임을 코드에 문서화. 리뷰어가 의도를 즉시 식별.

---

## 8. 결정 사항

| # | 쟁점 | 결정 | 근거 |
|---|---|---|---|
| 1 | 도입 범위(A/B/C안) | **B — 두 룰 전체 기본옵션 도입** | 사용자 선택. 모든 `\|\|` 사용을 명시 검토 |
| 2 | 위반 5건 처리(치환 vs 유지) | **5건 전부 `\|\|` 유지 + line-level eslint-disable** | Phase 2 "Best". 5건 모두 빈 문자열 폴백이 의도 → `??` 치환 시 동작 변경(빈 redirect 이동, 빈 토스트, 빈 라벨, DB 빈 FK 저장) |
| 3 | 파서 설정 방식 | **`projectService: true`** (project 배열 아님) | typescript-eslint v8 권장. 성능·관리 우수 |
| 4 | 룰 등록 강도 | **처음부터 error** (warn 경유 안 함) | 위반을 즉시 해소(disable) 가능하므로 C-1과 동일하게 직접 error. baseline warn 미증가 |
| 5 | `ignorePrimitives` 옵션(A안) | **미사용** | B 선택으로 기각. 단, route/data.error는 `any`라 string 무시로도 안 걸러져 A였어도 일부는 disable 필요했음 |
| 6 | prefer-optional-chain 위반 | **0건 → 코드 수정 없이 error** | 실측 0 |
| 7 | baseline 영향 | **warn_total 13 유지** | 두 룰 error라 warn 미증가. max-lines-per-function 13만 잔존(제외 항목) |
