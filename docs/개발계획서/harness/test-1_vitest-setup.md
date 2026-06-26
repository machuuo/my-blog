# Test-1: vitest + @testing-library 도입

> 테스트 인프라 0→1. A-3(`react-hooks/set-state-in-effect` 위반 해소) 재개를 위한 선결 작업.

---

## 1. Background & Goals

- 본 프로젝트는 ESLint 하네스 사이클 운영 중이며, A-3에서 `useNbTheme` 커스텀 훅 추출 → `useNbTheme.test.ts` 4 케이스 작성이 설계된 상태였다. 그러나 package.json 점검 결과 **`vitest`/`jest`/`@testing-library/*` 모두 미설치**, `pnpm test` 스크립트 부재. 인프라 0 상태에서 TDD를 강제하면 A-3 작업이 막힌다.
- 본 PR의 목표는 **테스트 러너 + DOM 환경 + React 테스트 유틸**을 최소 구성으로 도입하고, `pnpm test` 명령이 통과하는 스모크 테스트 1개를 추가하여 후속 사이클(A-3 이상)에서 즉시 TDD를 시작할 수 있도록 만드는 것이다.
- 더 큰 맥락: 이 인프라는 향후 [[lint-baseline-ratchet]] 기반 baseline 사이클의 hook/util 추출 사이클 전반에서 표준 인프라가 된다. 또한 [[superpowers-trial]] 도입 시 TDD 강제 기능과도 호환된다.

---

## 2. Functional Requirements

**개발자 관점**:
- 개발자는 `pnpm test`로 vitest를 한 번 실행할 수 있다 (CI 모드).
- 개발자는 `pnpm test:watch`로 파일 변경 감시 모드로 vitest를 실행할 수 있다.
- 개발자는 테스트 파일에서 `import` 없이 `describe`, `it`, `expect`를 사용할 수 있다 (`globals: true`).
- 개발자는 테스트 파일에서 `@/...` 경로 alias를 그대로 사용할 수 있다.
- 개발자는 `@testing-library/react`의 `render`, `renderHook`, `screen` 등을 사용할 수 있고, `expect(el).toBeInTheDocument()` 같은 `jest-dom` 매처를 사용할 수 있다 (실제 사용은 후속 사이클에서, 본 PR은 도입만).

### in scope
- `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `happy-dom`, `@testing-library/react`, `@testing-library/jest-dom` 설치 (devDependencies).
- `vitest.config.ts` 작성.
- `vitest.setup.ts` 작성 (jest-dom 매처 확장).
- `tsconfig.json` types 갱신.
- `package.json` scripts 추가 (`test`, `test:watch`).
- `.gitignore`에 coverage 디렉토리 추가.
- `eslint.config.mjs`에 테스트 파일 룰 완화 / boundaries 예외 추가 (필요 시).
- 스모크 테스트 1개 (`src/__tests__/smoke.test.ts`).

### out of scope
- `useNbTheme.test.ts` 작성 → A-3 재개 사이클.
- Husky pre-commit hook 통합 → 별도 사이클.
- GitHub Actions CI 통합 → 별도 사이클.
- 커버리지 임계치 정책 → 인프라 안정 후 별도.
- 컴포넌트 테스트 (RTL `render`) 실사용 → 후속 사이클.
- MSW(Mock Service Worker) 도입 → 후속 사이클.

---

## 3. Acceptance Criteria

- [ ] `pnpm install` 성공.
- [ ] `pnpm test` 실행 시 스모크 테스트 1건 통과, exit 0.
- [ ] `pnpm test:watch` 실행 시 감시 모드 진입 (수동 확인 후 Ctrl+C로 종료).
- [ ] `pnpm lint` exit 0 유지 (테스트 파일이 boundaries / no-unused / 기타 룰 위반하지 않음).
- [ ] `npx tsc --noEmit` 통과 (vitest globals 타입 인식).
- [ ] 스모크 테스트가 `describe`/`it`/`expect`를 `import` 없이 사용해도 타입 에러 없음.
- [ ] `tsconfig.json#compilerOptions.types`에 `vitest/globals`, `@testing-library/jest-dom` 포함.
- [ ] `.gitignore`에 `coverage/` 포함.

---

## 4. Functional Flow

### 개발자 시나리오

```
1. 개발자: pnpm install (lockfile 갱신, 의존성 추가)
2. 개발자: pnpm test
   → vitest 1회 실행
   → vitest.config.ts 로드 → react plugin + tsconfigPaths + happy-dom 환경
   → setupFiles(vitest.setup.ts) 실행 → @testing-library/jest-dom 매처 확장
   → src/__tests__/smoke.test.ts 발견 및 실행
   → 1 passed, exit 0
3. (선택) pnpm test:watch
   → 동일 설정으로 감시 모드 진입
```

### 에러 시나리오
- 의존성 충돌 시: `pnpm install` 단계에서 실패. peerDependencies 충돌 가능성(특히 React 19 + RTL 호환 버전). 발생 시 호환 버전 명시(`@testing-library/react@^16` 등).
- happy-dom 초기화 실패: setupFiles 누락 또는 environment 미설정. vitest.config.ts 점검.
- paths 해석 실패: tsconfigPaths 플러그인 미적용. 본 PR 스모크는 alias 미사용이라 직접 영향은 없으나, 후속 작업 대비.

---

## 5. UI Design

**N/A — 인프라 도입, UI 변경 없음.**

### 컴포넌트 트리
N/A.

### 접근성
**N/A — 인터랙티브 UI 없음.**

---

## 6. Technical Design

### 파일 변경

| 경로 | 동작 | 역할 |
|---|---|---|
| `package.json` | 수정 | devDependencies 6개 추가 + scripts(`test`, `test:watch`) |
| `vitest.config.ts` | 신규 | vitest 설정 — plugins(react, tsconfigPaths), test.environment, globals, setupFiles |
| `vitest.setup.ts` | 신규 | `@testing-library/jest-dom` 매처 확장 import |
| `tsconfig.json` | 수정 | `compilerOptions.types`에 `vitest/globals`, `@testing-library/jest-dom` 추가 |
| `.gitignore` | 수정 | `coverage/` 추가 |
| `eslint.config.mjs` | 수정 (필요 시) | 테스트 파일 glob(`**/*.test.ts(x)`, `**/__tests__/**`)에 boundaries / unused-imports 예외 |
| `src/__tests__/smoke.test.ts` | 신규 | `1 + 1 === 2` 스모크 테스트 |

> 스모크 테스트는 **인프라 도입 PR 검증용**이며 영구 보존(인프라 동작 회귀 가드).

### 의존성 추가

| 패키지 | 종류 | 사유 |
|---|---|---|
| `vitest` | devDep | 테스트 러너 |
| `@vitejs/plugin-react` | devDep | JSX 변환 |
| `vite-tsconfig-paths` | devDep | tsconfig의 `@/*` paths 자동 해석 (단일 소스) |
| `happy-dom` | devDep | DOM 환경 (jsdom 대비 빠름, localStorage 구현 있음 → A-3에서 useNbTheme 검증 가능) |
| `@testing-library/react` | devDep | `render`/`renderHook` 등. React 19 호환 버전(`^16.x`) 명시 |
| `@testing-library/jest-dom` | devDep | `toBeInTheDocument` 등 매처 |

### 상태 관리

N/A.

### 핵심 인터페이스

`vitest.config.ts` 형태:

```ts
// 명세만, 구현은 /wf:implement에서
defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

`tsconfig.json` 갱신 형태:

```jsonc
{
  "compilerOptions": {
    // ... 기존 유지
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

`package.json` scripts 추가:

```jsonc
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 스모크 테스트 케이스 (1)

1. `expect(1 + 1).toBe(2)` — 러너 실행, globals 타입 인식, exit 0 검증.

### API 통합

**N/A.**

---

## 7. Error & Feedback Handling

- 설치 실패(peerDependencies 충돌) 시: 에러 로그 분석 → `@testing-library/react` 버전을 React 19 호환(`^16.x`)으로 명시 후 재시도.
- vitest 실행 실패 시: `vitest.config.ts` 설정 → environment, setupFiles 경로 확인.
- 사용자 피드백: 본 PR은 인프라 도입이라 UI 피드백 N/A. 검증은 터미널의 `pnpm test` 출력으로 충분.

---

## 8. Decisions

| ID | 결정 | 선택 | 사유 |
|---|---|---|---|
| D1 | DOM 환경 | `happy-dom` | jsdom 대비 빠름(2~5배). React 19 호환. localStorage 구현 보유 → A-3 useNbTheme 검증 가능. |
| D2 | JSX/TS 변환 + paths 해석 | `@vitejs/plugin-react` + `vite-tsconfig-paths` | tsconfig의 paths를 단일 소스로. 수동 alias drift 위험 회피. |
| D3 | 테스트 API 스타일 | `globals: true` (jest 스타일) | 파일마다 import 보일러플레이트 제거. tsconfig types에 `vitest/globals` 추가. |
| D4 | 첫 검증 범위 | 스모크 1개 (`1 + 1 === 2`) | PR 1개 = 인프라 도입만. React/DOM 경로 검증은 A-3 재개 시 useNbTheme 테스트로. |
| D5 | CI/Husky 통합 | 본 PR 미포함 | 별도 사이클로 분리. PR 범위·리뷰 명확성 우선. |
| D6 | RTL 버전 | `@testing-library/react@^16` 명시 | React 19와 호환되는 메이저 버전. v15 이하는 React 18 전용. |
| D7 | 커버리지 임계치 | 본 PR 미포함 | 인프라 안정 후 별도 정책 사이클. `coverage/` `.gitignore`만 추가. |
| D8 | 테스트 파일 위치 컨벤션 | `src/__tests__/*.test.ts` (스모크) + 후속은 hook/util과 같은 디렉토리에 `*.test.ts` 동거 | 스모크는 도메인 무관이라 `__tests__` 분리. 도메인 테스트는 FSD 슬라이스 안에 동거(useNbTheme.test.ts와 useNbTheme.ts 같은 디렉토리). |
| D9 | eslint boundaries 예외 | 필요 시 추가 | 테스트 파일이 `import('@/...')`로 다른 슬라이스 접근 시 boundaries 룰 위반 가능. 발생하면 `**/*.test.ts(x)` glob에 예외. 스모크는 alias 미사용이라 본 PR에선 미발생 예상. |

모든 결정 사항이 해소되어 미확정 항목 없음.
