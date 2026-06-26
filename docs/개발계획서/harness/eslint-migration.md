# ESLint 마이그레이션 및 적용 설계서

> **Scope 확장 (eng review + 구현 단계 결과)**:
> - Next.js 14.2 → **16** 메이저 업그레이드를 본 작업에 포함.
> - 이유: ① ESLint 9 + flat config는 Next 15까지 미완성, **Next 16의 `eslint-config-next` 16부터 정식 지원**, ② Next 14.2 라인의 누적 CVE 노출 해소.
> - 구현 중 추가 발견: `eslint-config-next@15.5`는 ESLint 9에서 `context.getAncestors` 등 제거된 API를 호출해 다수 규칙이 동작 불가 → Next 16으로 점프 불가피.

---

## 변경 이력 (Changelog)

본 설계서는 결정 변경 시 반드시 함께 갱신한다. PR 머지 전 다음 항목 확인:

- [ ] `eslint.config.mjs`의 룰 강도 변경 → §6 표 갱신
- [ ] `lint-baseline.json` 갱신 → §6 baseline 구조 + §3 AC 갱신
- [ ] CI 워크플로 변경 → §6 CI 표 갱신
- [ ] 의존성 메이저 변경 → §1, §2, §8 갱신

### 이력

| 날짜 | 변경 | 영향 |
|---|---|---|
| 2026-06-24 | Next 14.2 → 16.2 메이저 + ESLint 9 + flat config + FSD boundaries 도입 | 25 파일, baseline 87 |
| 2026-06-24 | `explicit-function-return-type` `.tsx` off 적용 | 76건 추적 외부, baseline 87→26 |
| 2026-06-25 | `explicit-function-return-type` `.ts` warn→error 승격 + 15건 해소 | Route Handler 11 + lib 4 시그니처 명시, baseline 26→11 |
| 2026-06-25 | `max-lines-per-function: warn 80` 추가 (`.tsx`) | 컴포넌트 비대화 간접 강제, baseline 11→24 (정책 강화 의도) |
| 2026-06-25 | `SessionCookieConfig` interface export | `auth.ts`의 인라인 반환 타입 → 명명 타입 |
| 2026-06-25 | **A-1**: `jsx-a11y/click-events-have-key-events` + `jsx-a11y/no-static-element-interactions` warn→error 승격 + 위반 1건 해소 (Dialog 도입) | `HobbyDetailPage.tsx:196` 인라인 라이트박스 div → shadcn `Dialog` + `DialogContent` + `DialogTitle` 구조로 교체 (`DialogContent` className으로 박스→풀스크린 reset, `showCloseButton={false}`). role=dialog + aria-modal + focus trap + autoFocus + Esc 닫기 모두 자동. `@base-ui/react@1.6.0` 추가, `src/shared/ui/dialog.tsx` 신규. baseline 24→22 |

---

## 1. Background & Goals

### 왜 도입하는가
- 현재: ESLint 8 + `.eslintrc.json` + `extends: ["next/core-web-vitals", "next/typescript"]`. Next 기본 외 코드 품질·구조 가드 부재.
- 목표: `oh-my-configs/shell/personal-lint/eslint.config.js`의 개인 표준(레이어 경계, 미사용 import, 복잡도, 접근성, 타입 안전성)을 my-blog에 적용.
- 외부 설정은 전통적 layered 구조 가정 / 본 프로젝트는 **FSD** 구조 → 재작성 필요.
- Next 14.2.35는 ESLint 8 시대 설계로 flat config 정식 지원 부재.
- Next 15.5의 `eslint-config-next`도 ESLint 9 호환성 미완성. **Next 16부터 native flat 진입점 정상 동작**.

### 해결할 문제
- ESLint config 포맷 불일치(legacy `.eslintrc` ↔ flat `eslint.config.mjs`)
- 레이어 매핑 불일치(전통 layered ↔ FSD)
- `eslint-plugin-boundaries`/`sonarjs`/`unicorn` 등 미설치
- `next lint`의 flat config 미지원
- **Next 14.2 라인 누적 CVE 노출** (middleware 사용 중)

### 목표
- Next 14.2.35 → **16.2.9+** 메이저 업그레이드 (React 19 동반)
- ESLint 9 + flat config 마이그레이션
- FSD 구조에 맞춘 boundaries 재정의 (boundaries v6 `dependencies` API)
- 점진적 도입(warn → error) + ratchet 메커니즘으로 마찰 최소화
- 별도 CI lint 워크플로로 강제력 확보
- CodeRabbit과 역할 분담 명시

---

## 2. Functional Requirements

### In Scope
- **Next.js 14.2.35 → 16.2.9+ 업그레이드**
- **React 19 정렬** (Next 16 요구사항)
- Next 16 breaking changes 대응 (async request APIs, caching 변경점, tsconfig 자동 조정)
- ESLint 8 → 9 업그레이드
- `.eslintrc.json` 제거, `eslint.config.mjs`(flat, ESM 명시) 신설
- 필요한 ESLint 플러그인 설치
- `package.json` scripts에 `lint`, `lint:fix`, `lint:report` 정의
- FSD 레이어 매핑으로 `boundaries/dependencies` 재작성 (v6 API)
- api 레이어 AST 가드를 `src/{entities,features}/*/api/**`로 한정
- `src/utils/**` 규칙 블록을 `src/shared/lib/**`로 재타깃
- 마찰 큰 규칙은 `warn`으로 시작, `lint-baseline.json` ratchet 메커니즘 도입
- `.github/workflows/lint.yml` 신설 (push/PR 트리거 + concurrency 그룹)
- **`next.config.mjs`에 `eslint.ignoreDuringBuilds: true` 추가** — lint는 별도 워크플로로 분리하므로 `next build`가 lint를 호출하지 않게 함
- **lint:fix 자동 수정 적용** — `&&` → `? : null`, `replace` → `replaceAll`, `unicorn/no-useless-undefined` 등 ESLint가 자동 수정 가능한 항목은 1차 도입 시 함께 적용 (이후 PR에서 분리 시 노이즈 커짐 방지)
- CodeRabbit과의 역할 분담 명시 (`.coderabbit.yaml` 유지)

### Out of Scope
- 위반 사항 일괄 수정 (warn → 코드 수정은 후속 PR)
- 기존 코드 리팩토링 (Next 16 breaking change 대응 + ESLint 자동 수정 가능 항목 제외)
- Prettier 도입 / 통합
- Husky 등 pre-commit hook 설치
- 기존 GitHub Pages 배포 워크플로(`deploy.yml`)의 lint 단계 통합
- 외부 설정 원본(`oh-my-configs/...`) 수정

---

## 3. Acceptance Criteria

### Next.js 업그레이드
- [x] `next` 버전 16.2.9 이상
- [x] `react`, `react-dom` 19.x로 정렬
- [x] `pnpm build` 통과
- [ ] `pnpm dev` 동작 확인 (로컬)
- [ ] [middleware.ts](middleware.ts) 동작 확인 (CVE 패치 적용된 라인)
- [ ] App Router 라우트(`src/app/**`) 모두 정상 렌더
- [ ] MDX(`content/**`) 빌드 정상
- [ ] GitHub Pages 정적 배포 정상

### 환경 구축
- [x] `pnpm eslint --version` → 9.x 출력
- [x] `pnpm lint` 실행 시 flat config(`eslint.config.mjs`) 인식
- [x] `.eslintrc.json` 삭제됨
- [x] 필수 플러그인 모두 `devDependencies`에 존재
- [x] `pnpm-lock.yaml` 갱신
- [ ] GitHub Pages 빌드 통과 (PR 머지 후 검증)

### 설정 정합성
- [x] `eslint.config.mjs`의 `boundaries/elements`가 FSD 6계층으로 정의됨
- [x] `boundaries/dependencies` (v6 API) 사용 — deprecated `element-types`/`no-private` 미사용
- [x] api AST 가드의 `files`가 `src/{entities,features}/*/api/**`만 매칭
- [x] `src/app/api/**`는 AST 가드 제외(ignore) 처리됨
- [x] `src/app/**`은 boundaries상 `app` 타입으로 분류 (Next Route Handler 포함)
- [x] `src/shared/lib/**`에 utils 제약(`no-restricted-imports`) 적용
- [x] `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`로 Next 규칙 보존
- [x] `@next/next/*` 규칙이 lint 출력에 등장하는지 검증

### 도입 강도
- [x] `explicit-function-return-type` 강도 분기: `.ts: error` / `.tsx: off` — 자세한 정책은 §6 "룰 강도 정책" 참고
- [x] 위반 예상이 큰 규칙은 `warn`으로 시작 + ratchet 추적 (§6 마찰 큰 규칙 표 참고)
- [x] 기존 `next/core-web-vitals` 통과하던 규칙은 `error` 유지
- [x] `max-lines-per-function: warn 80` 추가 (`.tsx`) — 컴포넌트 비대화 간접 강제
- [x] `docs/개발계획서/harness/lint-baseline.json` 생성 및 커밋
- [x] baseline 갱신 PR에서 warn 수 감소만 허용 (ratchet) — 감소/증가 출처는 `decreases`/`increases` 필드로 추적

### 실행 / CI
- [x] `pnpm lint` → flat config 기반 정상 실행
- [x] `pnpm lint:fix` → 자동 수정 가능 항목 fix
- [x] `.github/workflows/lint.yml` 존재, push & PR 트리거, concurrency 그룹 적용
- [x] CI: 현재 warn 수 > baseline이면 실패 (ratchet)
- [x] CI: ESLint 크래시 (lint-result.json 미생성) 시 명시적 실패
- [x] error 0 유지

---

## 4. Functional Flow

### 마이그레이션 시나리오 (실제 진행 순서)

```text
[Phase A] Next 16 + React 19 업그레이드
  pnpm up --dry-run으로 peer dep 사전 점검 → 미지원 (직접 확인 대체)
  pnpm up next@^16 react@^19 react-dom@^19 @types/react@^19 @types/react-dom@^19 eslint-config-next@^16
  Next 16 breaking changes 대응
   - async params/searchParams (Page/Layout)
   - default caching 변화 (fetch, route handler)
   - tsconfig.json 자동 조정 (jsx: react-jsx, target: ES2017)
  pnpm build → 통과 확인
  pnpm dev → 로컬 동작 확인

[Phase B] ESLint 9 + flat config
  pnpm remove eslint (v8)
  pnpm add -D eslint@^9 + 플러그인들
  .eslintrc.json 삭제
  eslint.config.mjs 생성 (FSD 매핑, FlatCompat 불필요 — Next 16 native flat)
  next.config.mjs에 eslint.ignoreDuringBuilds: true 추가

[Phase C] 베이스라인 측정
  pnpm lint > 결과 확인
  error 0 만들기 (warn 다운그레이드 또는 코드 수정)
  pnpm lint:fix → 자동 수정 가능 항목 적용
  warn 카운트를 lint-baseline.json에 기록

[Phase D] CI 통합
  .github/workflows/lint.yml 신설
  concurrency 그룹 + ratchet 검증 + 크래시 감지

[Phase E] 점진 강화 (후속)
  warn 항목 PR 분할 수정
  baseline 갱신 (감소만 허용)
  warn 0 → error 승격 → --max-warnings 0
```

### 에러 시나리오

| 상황 | 대응 |
|---|---|
| Next 16 마이그레이션 중 빌드 실패 | breaking change 가이드 따라 패치 / async API 적용 / tsconfig 자동 조정 수용 |
| middleware.ts 동작 변화 | Next 16 미들웨어 명세 확인 후 조정 |
| `pnpm lint` flat config 미인식 | ESLint 9.x 확인, `eslint.config.mjs` 루트 위치 확인 |
| `eslint-plugin-unicorn`이 ESLint 9 미지원 (최신 68은 ESLint 10 요구) | `eslint-plugin-unicorn@^65`로 핀 |
| eslint-config-next의 `@next/next/*` 규칙이 ESLint 9에서 크래시 | eslint-config-next 16+ 사용 (Next 16 동반 업그레이드) |
| `next build` 시 lint 충돌 | `next.config.mjs`의 `eslint.ignoreDuringBuilds: true`로 분리 |
| 위반 폭발 (수백 개 error) | 해당 규칙 일시 `warn` 다운그레이드 → 베이스라인 0 → 점진 승격 |
| `boundaries`가 import 전체 금지 | `dependencies` `default` 임시 `allow` → 점진 강화 |
| CI ratchet 실패 (warn 증가) | 새 코드 위반 수정 또는 baseline 의도 갱신 PR |

---

## 5. UI Design

N/A — UI 변경 없음 (도구/구성 + Next 메이저 업그레이드).

### Component tree

N/A — 컴포넌트 추가/삭제 없음. 단 Next 16 async params와 ESLint 자동 수정(`&&` → `? : null` 변환)으로 일부 컴포넌트 본문은 변경됨.

### Accessibility

N/A — no interactive UI change.

---

## 6. Technical Design

### 신규 / 변경 파일

| 파일 | 종류 | 역할 |
|---|---|---|
| `package.json` | 변경 | next/react/eslint 메이저 버전 갱신, scripts |
| `pnpm-lock.yaml` | 변경 | 의존성 트리 갱신 |
| `.eslintrc.json` | 삭제 | legacy config 제거 |
| `eslint.config.mjs` | 신규 | flat config(ESM 명시), FSD boundaries v6 매핑 |
| `next.config.mjs` | 변경 | `eslint.ignoreDuringBuilds: true` 추가 (lint 분리) |
| `tsconfig.json` | 변경 | Next 16 자동 조정 (`jsx: react-jsx`, `target: ES2017`) |
| `.github/workflows/lint.yml` | 신규 | push/PR lint CI + concurrency + ratchet + 크래시 감지 |
| `.gitignore` | 변경 | `lint-result.json` 추가 |
| `docs/개발계획서/harness/lint-baseline.json` | 신규 | warn 카운트 베이스라인 |
| `docs/개발계획서/harness/eslint-migration.md` | 신규 | 본 설계서 |
| `docs/개발계획서/harness/eslint-migration-flow.json` | 신규 | 구현 단계 추적 |
| `src/app/hobby/[slug]/page.tsx` | 변경 | async params 패턴 |
| `src/app/tech/[slug]/page.tsx` | 변경 | async params 패턴 |
| `src/app/api/upload/route.ts` 외 11개 src 파일 | 변경 | `pnpm lint:fix` 자동 수정 (`&&` → `? : null`, `replace` → `replaceAll`, `() => undefined` → `() => {}`) |

> 테스트 파일: 본 작업은 마이그레이션으로 단위 테스트 추가 없음. 검증은 `pnpm build` + 로컬 dev + CI lint job으로 대체.

### Next 업그레이드 (Phase A)

| 패키지 | 변경 전 | 변경 후 |
|---|---|---|
| `next` | 14.2.35 | `^16.2.9` (CVE-2026-23870, 44578 등 패치 포함) |
| `react` | ^18 | `^19.0.0` |
| `react-dom` | ^18 | `^19.0.0` |
| `@types/react` | ^18 | `^19.0.0` |
| `@types/react-dom` | ^18 | `^19.0.0` |
| `eslint-config-next` | 14.2.35 | `^16.2.9` (Next와 정렬, ESLint 9 native 지원) |

#### Next 16 주요 breaking change 대응 체크포인트

| 변경 | 영향 부위 | 대응 |
|---|---|---|
| `params`, `searchParams` async화 | Page/Layout | `await params` 패턴 — `src/app/{hobby,tech}/[slug]/page.tsx` 수정 |
| fetch caching 기본 변경 | API 호출 | 현재 코드에 영향 없음 (Server Component fetch 미사용 패턴) |
| Route Handler caching 기본 변경 | `src/app/api/**` | 동적 동작 유지 — 영향 없음 |
| tsconfig 자동 조정 | `tsconfig.json` | Next 16이 `jsx: preserve → react-jsx`, `target: ES2017` 자동 적용 (수용) |
| React 19 정렬 | 전 컴포넌트 | 빌드 통과 확인 ✅ |

### ESLint 의존성 (devDependencies 추가)

```text
eslint                          ^9.39.4
eslint-config-next              ^16.2.9   (Next 16 정렬, ESLint 9 native 지원)
typescript-eslint               ^8.62.0
eslint-plugin-react             ^7.37.5
eslint-plugin-react-hooks       ^7.1.1
eslint-plugin-jsx-a11y          ^6.10.2
eslint-plugin-import            ^2.32.0
eslint-import-resolver-typescript ^4.4.5
eslint-plugin-unused-imports    ^4.4.1
eslint-plugin-boundaries        ^6.0.2
eslint-plugin-sonarjs           ^4.1.0
eslint-plugin-unicorn           ^65.0.1   (66+는 ESLint 10 요구 → 9 호환 최신으로 핀)
```

> **`@eslint/eslintrc`(FlatCompat) 불필요** — eslint-config-next 16의 `core-web-vitals`/`typescript` 진입점이 native flat config 객체를 반환. 구현 중 잠시 시도했으나 최종 제거됨.

### 핵심 설정 구조 (eslint.config.mjs)

#### Next 통합 (Native Flat)

```js
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

export default [
  { ignores: [...] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  { rules: { "@next/next/no-page-custom-font": "off" } }, // Pages Router 전용 규칙, App Router 무관
  // ...
]
```

> `eslint-config-next 16`이 `react`, `react-hooks`, `import`, `jsx-a11y`, `@next/next`, `@typescript-eslint` plugin을 모두 등록. 우리 config에서는 boundaries/sonarjs/unicorn/unused-imports만 추가 등록.

#### boundaries/elements (FSD 6계층)

| type | pattern | mode | capture |
|---|---|---|---|
| `app` | `src/app` | folder | — |
| `views` | `src/views/*` | folder | `view` |
| `widgets` | `src/widgets/*` | folder | `widget` |
| `features` | `src/features/*` | folder | `feature` |
| `entities` | `src/entities/*` | folder | `entity` |
| `shared` | `src/shared` | folder | — |

> **`src/app/api/**`(Next Route Handler)는 `app` 타입에 포함된다.** `src/app` 폴더 매칭이 하위 전체를 덮음. Route Handler가 entities/features/shared로 의존하는 것은 `app → *` 허용 규칙으로 자연스럽게 통과.

#### boundaries/dependencies (v6 API, 상→하 의존만 허용)

| from | allow |
|---|---|
| `app` | `app`, `views`, `widgets`, `features`, `entities`, `shared` |
| `views` | `views`, `widgets`, `features`, `entities`, `shared` |
| `widgets` | `widgets`, `features`, `entities`, `shared` |
| `features` | `features`, `entities`, `shared` |
| `entities` | `entities`, `shared` |
| `shared` | `shared` |

- `default: "disallow"` 유지
- v6에서 `element-types`/`no-private` deprecated → `dependencies` 통합 API 사용

#### api 레이어 AST 가드

- **적용 범위**: `src/entities/*/api/**/*.{ts,tsx}`, `src/features/*/api/**/*.{ts,tsx}`
- **제외**: `src/app/api/**` (Next.js Route Handler — 가드 의도와 의미 다름)
- **규칙**: 외부 설정 `API_LAYER_PATTERNS` 그대로 `no-restricted-syntax`로 적용

#### shared/lib 제약 (외부 utils 블록 재타깃)

- **적용 범위**: `src/shared/lib/**/*.{ts,tsx}`
- **금지 import**: `react`, `react-dom`, `react/*`, `@/app/*`, `@/views/*`, `@/widgets/*`, `@/features/*`, `@/entities/*`
- **이유**: shared/lib은 순수 함수 계층
- `import/no-relative-parent-imports: error`

#### import resolver

- `tsconfig.json`의 `paths: { "@/*": ["./src/*"] }` 반영
- `eslint-import-resolver-typescript`, `project: "./tsconfig.json"`

#### 룰 강도 정책 — 파일 확장자별 차등

UI 계층(`.tsx`)과 데이터/로직 계층(`.ts`)에 다른 강도를 적용한다.

- **`.ts` (hooks/utils/lib/Route Handler)**: 타입 안전성 가치 큼 → 룰 강하게 (error 우선)
- **`.tsx` (UI 컴포넌트)**: 반환 타입이 거의 고정 + 컴포넌트 노이즈 큼 → 일부 룰 off
- **공통 룰 (양쪽 적용)**: 점진 도입(warn) + baseline ratchet

원칙: 룰의 가치가 한 계층에서만 크다면 그 계층에만 적용. 데이터 계층은 항상 더 엄격하게.

#### 마찰 큰 규칙 — 실제 적용 기준 (2026-06-25 시점)

| 규칙 | 외부 원본 | .ts | .tsx | 사유 / 상태 |
|---|---|---|---|---|
| `@typescript-eslint/explicit-function-return-type` | error | **error** ✅ | **off** | .ts: 본 PR에서 15건 해소 + 승격 / .tsx: 반환 JSX.Element로 고정, 노이즈 |
| `@typescript-eslint/no-non-null-assertion` | error | **warn** | warn | `process.env.X!` 6건 — 후속 가드 추가 PR |
| `react/jsx-no-leaked-render` | error | — | **warn** | 위반 1건 — 후속 |
| `jsx-a11y/click-events-have-key-events` | error | — | **warn** | 위반 1건 — 후속 (라이트박스 div) |
| `jsx-a11y/no-static-element-interactions` | error | — | **warn** | 위반 1건 — 동일 위치 |
| `react-hooks/set-state-in-effect` | (신규) | — | **warn** | React 19 + react-hooks 7 신규, 위반 1건 (테마 영속화 — useSyncExternalStore/script 주입 결정 필요) |
| `max-lines-per-function` (max: 80) | — | — | **warn** | 컴포넌트 비대화 간접 강제 (CLAUDE.md orchestrator) — baseline 13건 |
| `unicorn/prefer-string-replace-all` | error | warn | warn | 1차 도입 |
| `sonarjs/cognitive-complexity` | error 15 | warn 15 | warn 15 | 1차 도입 |
| `react/no-array-index-key` | warn | — | warn | breadcrumb 등 안정 순서 1~2건 |
| `no-console` | error (warn/error 허용) | warn | warn | 1차 도입 |
| `@next/next/no-page-custom-font` | (next) | — | **off** | Pages Router 전용, App Router 무관 |

#### 보존 규칙 (외부 그대로 / error 유지)

`eqeqeq`, `no-var`, `unused-imports/*`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/consistent-type-assertions`, `react-hooks/rules-of-hooks`, `import/no-cycle`, `react/jsx-key`, `jsx-a11y/alt-text`, `jsx-a11y/control-has-associated-label`, `jsx-a11y/aria-role`, `unicorn/no-array-for-each`, `unicorn/prefer-node-protocol`, `unicorn/no-useless-undefined`, `boundaries/dependencies`.

#### ignores

```text
.next/**, node_modules/**, next-env.d.ts,
scripts/**, *.config.{js,mjs,ts}, tsconfig.tsbuildinfo,
**/*.test.ts, **/*.test.tsx, **/*.stories.tsx
```

### lint-baseline.json (ratchet 메커니즘)

#### 구조 (실제 값)

```json
{
  "generated_at": "2026-06-24T00:00:00Z",
  "warn_total": 87,
  "warn_by_rule": {
    "@typescript-eslint/explicit-function-return-type": 76,
    "@typescript-eslint/no-non-null-assertion": 6,
    "react/no-array-index-key": 2,
    "jsx-a11y/click-events-have-key-events": 1,
    "jsx-a11y/no-static-element-interactions": 1,
    "react-hooks/set-state-in-effect": 1
  },
  "note": "ratchet baseline — CI fails if warn_total exceeds this value. Decreases only via PRs that also update this file."
}
```

#### 동작 규칙

| 시점 | 동작 |
|---|---|
| 1차 도입 | `pnpm lint:report` 실행 → 결과로 baseline 생성 후 커밋 |
| CI (PR/push) | 현재 warn 수 vs baseline 비교 — 초과 시 실패 |
| 감소 시 | 동일 PR에서 baseline JSON도 함께 갱신 (감소 방향만 허용) |
| 증가 시 | CI 실패 — 새 위반 수정 또는 의도 갱신 별도 PR |
| warn → error 승격 | baseline의 해당 규칙 항목 제거, 코드는 0 위반 상태 |

### CodeRabbit 역할 분담

| 도구 | 책임 영역 |
|---|---|
| **ESLint** | 규칙 기반 자동 검증 — boundaries, a11y, unused, type, syntax, complexity |
| **CodeRabbit** | 의미론적 리뷰 — 로직 정합성, 명명, PR 맥락 의도 파악, 누수 패턴 |
| **중복 감지 시** | `.coderabbit.yaml`에서 ESLint와 겹치는 규칙은 CodeRabbit 측 억제 |

→ `.coderabbit.yaml`은 본 작업 범위에서 변경하지 않음. 운영 중 중복 코멘트가 잦으면 후속 PR로 조정.

### package.json scripts

| script | 명령 |
|---|---|
| `lint` | `eslint .` |
| `lint:fix` | `eslint . --fix` |
| `lint:report` | `eslint . --format json -o lint-result.json` (CI용) |
| `build` | `next build` (기존 유지) |
| `dev` | `next dev` (기존 유지) |
| `start` | `next start` (기존 유지) |

### next.config.mjs 변경 (Out of Scope에서 In Scope로 이동)

```js
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

**근거**: lint를 별도 워크플로(`.github/workflows/lint.yml`)로 분리하는 설계 의도. `next build`가 내부적으로 `next lint`를 호출해 flat config와 충돌 → 빌드 시 lint 검증 비활성화 + CI 전용 lint job에서 검증.

### CI 워크플로 (.github/workflows/lint.yml)

| 항목 | 값 |
|---|---|
| trigger | `push`, `pull_request` |
| concurrency | `lint-${{ github.ref }}` + `cancel-in-progress: true` |
| runs-on | `ubuntu-latest` |
| node | 20 |
| pnpm | 10 (`packageManager` 필드와 정렬) |
| step | install → `pnpm lint:report \|\| true` → ratchet 검증 (lint-result.json 존재 확인 포함) |
| 강도 | 1차: ratchet / 후속: `--max-warnings 0` 승격 |

배포 워크플로(`deploy.yml`)는 변경하지 않음.

---

## 7. Error & Feedback Handling

### 에러 발생 시 대응

| 발생 | 대응 |
|---|---|
| Next 16 빌드 실패 | breaking change 가이드 추적, async API 패턴 적용 |
| middleware 동작 변화 | Next 16 미들웨어 명세 점검 |
| 신규 lint 규칙 위반 폭발 | 일시 `warn` 다운그레이드 → 베이스라인 0 → 점진 승격 |
| boundaries 위반 다수 | `dependencies`의 `default`를 임시 `allow` → FSD 위반 issue 추적 → 점진 금지 |
| CI ratchet 실패 | warn 증가 원인 수정 또는 baseline 의도 갱신 PR |
| GitHub Pages 빌드 실패 | 로컬 `pnpm build` 재현 → Next 16 정적 export 호환성 확인 |

### 성공 / 실패 피드백

- **성공**: 로컬 `pnpm lint` error 0 / `pnpm build` 통과 / `lint.yml` job ✅ / `deploy.yml` 정상 배포
- **실패**: GitHub Actions의 lint job ❌ → PR 머지 차단 (branch protection로 강제 시)

### 도입 후 점진 강화 일정

1. **W1 (완료)**: Next 16 + ESLint 9 + baseline(87) 측정
2. **W1 후속 1 (완료)**: `.tsx` `explicit-function-return-type` off → baseline 87→26
3. **W1 후속 2 (완료, 본 PR)**: `.ts` `explicit-function-return-type` error 승격 + 15건 해소 → 26→11
4. **W1 후속 3 (완료, 본 PR)**: `max-lines-per-function` 추가 → 11→24 (정책 강화 의도)
5. **W2~3 (잔여)**: 아래 규칙별 점진 수정 PR 분할
   - `no-non-null-assertion` 6건 (env 가드 추가) → error 승격
   - `react/no-array-index-key` 2건 (안정 키 / B 분류)
   - `jsx-a11y/click-events-have-key-events` + `no-static-element-interactions` 각 1건 (라이트박스 div 키보드 핸들러)
   - `react-hooks/set-state-in-effect` 1건 (테마 영속화 패턴 결정 → useSyncExternalStore/script 주입)
   - `max-lines-per-function` 13건 (큰 컴포넌트 헬퍼/훅 추출)
6. **W4**: warn 0 달성 → 잔여 warn 규칙 모두 error 승격
7. **W5**: CI에 `--max-warnings 0` 활성화 (baseline 무용화 → 단일 게이트)

> 주의: `.tsx` off 처리된 룰(`explicit-function-return-type`)은 점진 일정 대상 외. `.ts`에서만 진행.

---

## 8. Decisions

| 항목 | 결정 | 이유 |
|---|---|---|
| **Next 메이저 버전** | **14.2.35 → 16.2.9+** | flat config 정식 지원은 Next 16+, 누적 CVE 해소 |
| **PR scope** | Next 16 + ESLint 동시 1 PR | 사용자 결정 — 단일 변경 단위 |
| **React 버전** | 19.x | Next 16 요구사항 |
| ESLint 버전 | 9.x | flat config 정식 지원 |
| Config 포맷 | flat (`eslint.config.mjs`, ESM 명시) | 외부 원본 형식 그대로, 명시적 |
| **Next 호환 어댑터** | **FlatCompat 불필요 (최종)** | eslint-config-next 16의 `/core-web-vitals` + `/typescript` 진입점이 native flat |
| **boundaries API** | **v6 `dependencies` 통합 API** | v5의 `element-types`/`no-private` deprecated |
| **unicorn 핀** | `^65.0.1` | 66+는 ESLint 10 요구, 9 호환 최신 |
| **`@next/next/no-page-custom-font`** | **off** | Pages Router 전용, App Router 무관 |
| lint 명령 | `eslint .` 직접 사용 | `next lint` deprecated 방향 |
| **`next build`의 lint 호출** | **`eslint.ignoreDuringBuilds: true`로 분리** | lint를 CI 워크플로 단일 책임으로 |
| 도입 강도 | 점진 (warn → error) + ratchet | 마찰 최소화, 회귀 차단 |
| **warn 규칙 확장** | **non-null-assertion, jsx-no-leaked-render, click-events, no-static-interactions, set-state-in-effect 추가** | 1차 도입 시 위반 0~6건씩 — 점진 해소 후 error 승격 |
| **lint:fix 자동 수정 포함** | **In Scope에 포함** | 분리 시 PR 노이즈 ↑, 의미적 동등 변환만 적용 |
| **진척 추적** | `lint-baseline.json` ratchet | warn 증가 자동 차단, 점진 감소 강제 |
| CI 통합 | 별도 lint 워크플로 신설 | 배포와 분리, push/PR 모두 검증 |
| **CI concurrency** | `lint-${{ github.ref }}` + cancel-in-progress | 연속 push 시 잡 중첩 방지 |
| **CI 크래시 감지** | `lint-result.json` 부재 시 명시적 실패 | `continue-on-error: true`의 신호 약화 보완 |
| boundaries 매핑 | FSD 정석 6계층 상→하 | 프로젝트 구조 정합 |
| **`src/app/api` 분류** | `app` 타입에 포함 | folder mode로 자연스럽게 매칭, 별도 타입 불필요 |
| api 가드 범위 | `src/{entities,features}/*/api/**` | Next Route Handler 오탐 방지 |
| utils 규칙 재타깃 | `src/shared/lib/**` | FSD 순수 함수 계층 |
| **`explicit-function-return-type` 강도 분기** | **`.ts: error` / `.tsx: off`** | UI는 추론으로 충분, 데이터/로직 계층은 계약 명시 강제. 본 PR에서 .ts 15건 해소 + 승격 완료 |
| **`max-lines-per-function` 추가 (`.tsx`)** | **`warn 80`** | 컴포넌트 비대화 자동 감지 → CLAUDE.md orchestrator 원칙 보강 |
| **`SessionCookieConfig` 명명 타입** | **interface export** | 인라인 7줄 → 호출자 재사용 가능, auth 도메인 명세 |
| **baseline에 `decreases`/`increases` 필드** | **JSON 구조 확장** | 감소가 코드 청소인지 룰 off인지 추적 (ratchet 의미 보존) |
| 기존 `.eslintrc.json` | 삭제 | flat과 공존 불가 |
| **CodeRabbit 통합** | 역할 분리 (변경 없음) | ESLint=규칙/CodeRabbit=의미론 |
| Prettier 통합 | 미포함 | 본 작업 범위 외 |
| pre-commit hook | 미포함 | 본 작업 범위 외 |
| 배포 워크플로 통합 | 미통합 | GitHub Pages 배포 영향 분리 |
| 위반 일괄 수정 | 별도 작업으로 분리 (warn → 코드 수정만) | 본 PR은 ratchet 도입까지 |
