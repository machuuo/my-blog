# C-1: Tier C-1 autofix 8룰 도입

> 하네스 baseline 사이클 c-1. A-1~A-4(Tier A) + b-1(Tier B + 스타일) 완료 후 Tier C 진입.
> autofix 가능한 import·JSX·문자열 스타일 8룰을 도입해 일괄 정리 후 error로 못 박는다.

---

## 1. Background & Goals

- backlog Tier C-1은 **autofix 가능한 미등록 8룰**의 신규 도입이다. A/B(기존 warn 승격)와 달리 룰을 처음 등록한다.
- 측정 결과(main, b-1 머지 상태): `import/order` 89건 + `prefer-template` 3건만 위반, 나머지 6룰은 0건. **두 룰 전부 `lint:fix`로 100% 자동 정리되어 수동 잔여 0.**
- 목표: 8룰을 `error`로 등록하고 autofix로 정리해, import 정렬·JSX 간결성·문자열 표현 일관성을 빌드 차원에서 강제한다. **코드 로직 변경 0** (스타일·정렬만).
- baseline `warn_total`은 13으로 유지된다(승격 룰 전부 0 warning).

---

## 2. Functional Requirements

**개발자/CI 관점**:
- 8룰이 `error`로 등록돼, 위반 시 `pnpm lint`가 즉시 실패한다.
- `import/order`는 그룹 순서(builtin→external→internal→parent→sibling→index) + `react`/`next/**` 맨 앞 고정 + `@/**` internal + 그룹 사이 빈 줄 + **그룹 내부 알파벳 정렬(alphabetize ON)**.
- 기존 위반(import/order, prefer-template)은 `lint:fix`로 해소된다.

### in scope
- `eslint.config.mjs`에 8룰 `error` 등록 + `import/order` 상세 설정(alphabetize ON)
- `pnpm lint:fix` 일괄 적용 — autofix 대상 ~43 파일(import 재정렬 + prefer-template 3곳)
- 메타 갱신: `backlog.md`, `eslint-migration.md`

### out of scope
- **`lint-baseline.json` 변경** — 승격 룰 0 warning이라 13 유지. 검증만 (b-1과 동일).
- **CLAUDE.md 문서화** — import 정렬은 autofix가 자동 강제(저장 시 정리)라 서술 규약 불필요. 룰 자체가 SoT.
- **코드 로직 리팩터** — autofix 외 수동 변경 없음.
- **C-2**(`prefer-nullish-coalescing`, `prefer-optional-chain`), Tier S/D — 별도 사이클.
- **`no-await-expression-member` C-2 분리** — 위반 0건이라 분리 불필요, C-1에 포함.

---

## 3. Acceptance Criteria

- [ ] `eslint.config.mjs`에 8룰 `error` 등록:
  - [ ] `react/jsx-no-useless-fragment`, `react/self-closing-comp`
  - [ ] `import/order`(alphabetize ON + pathGroups react/next/@), `import/first`, `import/newline-after-import`
  - [ ] `prefer-template`
  - [ ] `unicorn/throw-new-error`, `unicorn/no-await-expression-member`
- [ ] `pnpm lint:fix` 적용 후 8룰 위반 0건
- [ ] `pnpm lint` exit 0 (8룰 error + 기존 13 warning만 잔존)
- [ ] `tsc --noEmit` 통과
- [ ] autofix가 코드 로직을 바꾸지 않음 (import 순서/빈 줄/`<Foo/>`/템플릿 리터럴만)
- [ ] 회귀 검증 — 각 룰(또는 대표 룰) 위반 추가 시 error 차단, 되돌리면 통과
- [ ] `lint-baseline.json` `warn_total` 13 유지 (변경 없음 — 검증만)
- [ ] `backlog.md` Tier C-1 ✅ + `eslint-migration.md` Changelog c-1

---

## 4. Functional Flow

순수 설정·autofix 사이클. 런타임 상태 전이 없음.

```text
[도입 절차]
1. 8룰 error 등록 (import/order alphabetize ON 설정 포함)
2. pnpm lint:fix → autofix 일괄 적용 (~43 파일)
3. pnpm lint → exit 0 확인 (8룰 위반 0, 기존 13 warning만)
4. tsc + 회귀 검증

[CI lint 흐름 — 도입 후]
pnpm lint
  ├─ import 그룹/정렬 위반        → ❌ error
  ├─ 불필요 fragment / 비-self-closing → ❌ error
  ├─ 문자열 + 연결                → ❌ error
  ├─ throw Error() / (await x).y  → ❌ error
  └─ 위 전부 통과 + 기존 13 warning → exit 0
```

### 에러 시나리오
- autofix가 못 잡는 잔여 위반 발견 시(측정상 0이지만) → 수동 해소 또는 해당 룰만 C-2로 보류. baseline 임의 상향 금지.

---

## 5. UI Design

**N/A — UI 변경 없음.** import 정렬·`<Foo/>` 축약·템플릿 리터럴은 렌더 출력과 무관한 표현 변경. 접근성 변경 없음.

### 컴포넌트 트리
N/A — 구조 불변.

---

## 6. Technical Design

### 파일 변경

| 경로 | 동작 | 역할 |
|---|---|---|
| `eslint.config.mjs` | 수정 | 8룰 error 등록 + `import/order` 설정(groups + pathGroups[react/next/@] + newlines-between always + alphabetize asc) |
| `docs/개발계획서/harness/c-1_tier-c1-autofix.md` | 신규 | 본 설계서 |
| `docs/개발계획서/harness/c-1_tier-c1-autofix-flow.json` | 신규 | flow tracker |
| `docs/개발계획서/harness/backlog.md` | 수정 | Tier C-1 ✅ + Changelog |
| `docs/개발계획서/harness/eslint-migration.md` | 수정 | Changelog c-1 행 |

> **autofix 대상 ~43 파일**(`src/**` 전반의 import 재정렬 + `prefer-template` 3곳)은 `lint:fix` 일괄 적용분이라 개별 등재하지 않는다. 로직 변경 0. drift 검사(C scope creep)에서 다수 "git에만 있음"으로 표면화될 수 있으나 **의도된 일괄 autofix**이며, Step 7.5에서 그렇게 판정한다.
> **lint-baseline.json은 변경하지 않는다(검증만)** — 승격 룰이 전부 0 warning이라 `warn_total` 13 유지.
> 신규 `*.test.ts` 없음 — 설정·autofix 사이클.

### 상태 관리
**N/A.**

### 핵심 설정 (이름/형태만)

```text
import/order: ["error", {
  groups: [builtin, external, internal, parent, sibling, index],
  pathGroups: [react→external before, next/**→external before, @/**→internal],
  pathGroupsExcludedImportTypes: [react],
  newlines-between: always,
  alphabetize: { order: asc, caseInsensitive: true },
}]
```

### 도입 방식
- 측정상 두 위반 룰(import/order, prefer-template) 모두 100% autofix → 잔여 0. 따라서 **warn 중간 단계 없이 `error` 직접 등록 + `lint:fix`** 한 번에 처리(코드는 fix로 0 달성). baseline 영향 없음.

---

## 7. Error & Feedback Handling

- 런타임 피드백 없음. 피드백 채널은 `pnpm lint` / CI.
- 위반 시 lint error로 즉시 가시화, CI(`lint.yml`) errors=0 게이트가 차단.
- `lint-baseline.json` 수치 변동 없음 — ratchet 영향 없음.

---

## 8. Decisions

| ID | 결정 | 선택 | 사유 |
|---|---|---|---|
| D1 | `import/order` alphabetize | **ON** (asc, caseInsensitive) | 그룹 내부까지 정규화 → 예측 가능·완전 자동. diff는 OFF 대비 +4파일로 차이 작음. |
| D2 | `import/order` pathGroups | `react`/`next/**` 맨 앞, `@/**` internal | 현재 코드의 사실상 순서 규약화 + alias 오분류 방지. |
| D3 | `no-await-expression-member` 분류 | C-1 포함 | 위반 0건 → autofix 우려 무의미, C-2 분리 불필요. |
| D4 | 도입 방식 | error 직접 등록 + lint:fix (warn 중간 생략) | 측정상 autofix로 잔여 0 달성 확인. |
| D5 | `lint-baseline.json` | 변경 없음(검증만) | 승격 룰 0 warning → 13 유지. |
| D6 | CLAUDE.md 문서화 | 안 함 | import 정렬은 autofix가 자동 강제, 룰이 SoT. b-1의 제어흐름(사람 판단 필요)과 성격 다름. |

모든 결정 해소 완료, 미확정 항목 없음.
