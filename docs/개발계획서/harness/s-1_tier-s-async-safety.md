# S-1: Tier S — async 안전성 type-aware 룰 도입

> 하네스 baseline 강화 후속. backlog.md Tier S(보류 → 활성화). C-2에서 `projectService` 도입으로 전제조건 충족.

---

## 1. 배경 & 목표

C-2(Tier C-2)에서 `parserOptions.projectService`를 도입하면서 type-aware 룰의 전제 인프라가 확보됐다. backlog에서 "보류"였던 **Tier S(async 안전성 룰)**의 블로커("parserOptions.project 사전 점검 필요")가 해소됐으므로 도입한다.

- **목표**: async/Promise 오용을 빌드 차단 가드레일로 만든다. unhandled rejection, void 위치의 Promise 전달, 잘못된 await 등을 즉시 error로 잡는다.
- **범위**: async 안전성 4룰만. `no-unnecessary-condition`(17건, strict-boolean 계열)은 성격이 다르고 위반이 많아 **Tier D로 분리**한다.

---

## 2. 기능 요구사항 (가드레일 관점)

- 개발자가 Promise를 처리하지 않고 방치(floating)하면 빌드가 차단된다.
- 개발자가 async 함수를 void 반환 기대 위치(JSX 이벤트 핸들러 등)에 직접 전달하면 빌드가 차단된다 → 명시적 `void` 래핑을 강제한다.
- 개발자가 thenable이 아닌 값에 `await`하면 빌드가 차단된다.
- `await`를 쓰지 않는 불필요한 `async` 선언이 차단된다.

### in scope
- `eslint.config.mjs`: 4룰 error 등록
  - `@typescript-eslint/no-floating-promises`
  - `@typescript-eslint/no-misused-promises`
  - `@typescript-eslint/await-thenable`
  - `@typescript-eslint/require-await`
- no-misused-promises 위반 4건 해소 (인라인 `void` 래핑)
- baseline/migration/backlog 문서 갱신

### out of scope
- `no-unnecessary-condition` (17건) → **Tier D 별도 사이클**
- Tier D의 다른 룰(`jsx-no-bind`, `strict-boolean-expressions`, `no-duplicate-string` 등)

---

## 3. 완료 조건 (Acceptance Criteria)

- [ ] `eslint.config.mjs`에 4룰 **error** 등록 (공통 `src/**/*.{ts,tsx}` 블록)
- [ ] `@typescript-eslint/no-floating-promises` error — 위반 0 (실측 0)
- [ ] `@typescript-eslint/await-thenable` error — 위반 0 (실측 0)
- [ ] `@typescript-eslint/require-await` error — 위반 0 (실측 0)
- [ ] `@typescript-eslint/no-misused-promises` error — 위반 4건 해소
  - [ ] `src/features/auth/ui/LoginForm.tsx:46` `onSubmit={handleSubmit}` → `onSubmit={(e) => void handleSubmit(e)}`
  - [ ] `src/features/write-post/ui/MdxEditor.tsx:93` `onPaste={handlePaste}` → `onPaste={(e) => void handlePaste(e)}`
  - [ ] `src/features/write-post/ui/PostForm.tsx:146` `onSubmit={handleSubmit}` → `onSubmit={(e) => void handleSubmit(e)}`
  - [ ] `src/features/write-post/ui/PostForm.tsx:283` `onClick={handleDelete}` → `onClick={() => void handleDelete()}`
- [ ] 핸들러 본문은 변경 없음 (내부 try/catch 유지 — 동작 보존)
- [ ] `pnpm lint` 위반 0 확인 (`0 errors, 13 warnings` — 기존 max-lines-per-function 13 유지)
- [ ] 회귀 차단 검증 — floating Promise / void 위치 async 추가 시 lint **error** 확인 후 되돌리기
- [ ] `lint-baseline.json` 갱신 (warn_total 13 유지 — `neutral` 섹션에 `source: "new-rule-as-error"` 항목 기록)
- [ ] `eslint-migration.md` Changelog 갱신
- [ ] `backlog.md` Tier S ✅ + Tier D 분리 명시 + 변경 이력
- [ ] 빌드 검증 — `pnpm build` 통과

---

## 4. 기능 흐름

lint 인프라 작업이라 도입 흐름으로 기술한다.

```text
1. 4룰 error 등록
     ↓ pnpm lint — no-misused 4건 노출 (나머지 3룰 0건)
2. no-misused 4건 인라인 void 래핑
     ↓ pnpm lint — 위반 0 확인
3. 회귀 차단 검증 (의도적 위반 → error → 되돌림)
     ↓
4. 문서 3종 갱신
     ↓ pnpm build — 회귀 없음 확인
```

### 에러 시나리오
- **예상 못한 추가 위반**: 0건 룰 3개가 실제론 위반을 낼 경우 → 각 건 안전성 검토 후 await 수정/처리 추가. (실측상 0이므로 미발생 예상.)
- **void 래핑이 핸들러 시그니처와 불일치**: 이벤트 인자 전달(`(e) => void fn(e)`) 정확히 유지. handleDelete는 인자 없음(`() => void handleDelete()`).

---

## 5. UI 설계

**N/A — UI 변경 없음.** 이벤트 핸들러 래핑은 렌더 결과·동작 불변(핸들러 내부 로직 그대로).

- 컴포넌트 트리: 변경 없음
- 접근성: N/A — 인터랙티브 동작 불변(폼 submit/삭제/붙여넣기 거동 동일)

---

## 6. 기술 설계

### 변경 파일

| 파일 | 역할 | 비고 |
|---|---|---|
| `eslint.config.mjs` | async 안전성 4룰 error 등록 | 공통 블록(`src/**/*.{ts,tsx}`) |
| `src/features/auth/ui/LoginForm.tsx` | onSubmit void 래핑 | L46 |
| `src/features/write-post/ui/MdxEditor.tsx` | onPaste void 래핑 | L93 |
| `src/features/write-post/ui/PostForm.tsx` | onSubmit·onClick void 래핑 | L146, L283 |
| `docs/개발계획서/harness/lint-baseline.json` | ratchet 메타 갱신 | warn_total 13 유지 |
| `docs/개발계획서/harness/eslint-migration.md` | Changelog 갱신 | |
| `docs/개발계획서/harness/backlog.md` | Tier S ✅ + Tier D 분리 | |

> **테스트 파일 면제**: 신규 순수 함수·hooks 추가 없음(룰 설정 + JSX 핸들러 래핑뿐). `*.test.ts` 대상 없음.

### 룰 등록

```text
"@typescript-eslint/no-floating-promises": "error",
"@typescript-eslint/no-misused-promises": "error",
"@typescript-eslint/await-thenable": "error",
"@typescript-eslint/require-await": "error",
```

### 해소 패턴 (no-misused-promises 4건 공통)

`void` 연산자로 Promise를 명시적으로 무시한다. 4건 모두 핸들러 내부에 try/catch(또는 try/catch/finally)가 완비되어 있어 reject 불가 → `void`가 의미상 정확(fire-and-forget).

```text
onSubmit={(e) => void handleSubmit(e)}   // 이벤트 인자 전달
onClick={() => void handleDelete()}      // 인자 없음
onPaste={(e) => void handlePaste(e)}
```

핸들러 함수 본문은 일절 변경하지 않는다.

---

## 7. 에러 & 피드백 처리

런타임 사용자 피드백은 기존과 동일(핸들러 내부 try/catch에서 `setError` 등으로 이미 처리). 개발자 피드백(빌드 차단) 관점:

- **성공**: `pnpm lint` → `0 errors`. floating Promise·void 위치 async·잘못된 await 발생 시 즉시 error 차단.
- **실패(회귀)**: 의도적 위반(처리 안 한 fetch, 핸들러에 async 직접 전달) 추가 → error 확인이 검증 기준(AC).
- **void의 의미**: 룰을 끄지 않고, "이 Promise는 의도적으로 fire-and-forget(내부에서 에러 처리됨)"임을 코드로 명시.

---

## 8. 결정 사항

| # | 쟁점 | 결정 | 근거 |
|---|---|---|---|
| 1 | Tier S 범위 | **async 안전성 4룰(floating/misused/await-thenable/require-await)** | backlog Tier S 정의와 정합. 0건 룰 3개는 공짜 가드 |
| 2 | `no-unnecessary-condition`(17건) | **Tier D로 분리** | async와 무관(strict-boolean 계열), 위반 다수. YAGNI |
| 3 | no-misused-promises 4건 해소 | **인라인 `void` 래핑** | 핸들러가 이미 내부 try/catch 완비 → reject 불가. void가 정확한 의미, 최소 변경 |
| 4 | 핸들러 본문 수정 여부 | **미수정 (동작 보존)** | 에러 처리 이미 완비. 래핑은 호출부만 |
| 5 | 룰 등록 강도 | **처음부터 error** | 위반 즉시 해소 가능. C-2와 동일. baseline warn 미증가 |
| 6 | 0건 룰 3개 도입 가치 | **도입** | 현재 위반 0이라 무비용. 향후 async 오용 회귀 차단 |
| 7 | baseline 영향 | **warn_total 13 유지** | 4룰 error라 warn 미증가. max-lines 13만 잔존(제외 항목) |
