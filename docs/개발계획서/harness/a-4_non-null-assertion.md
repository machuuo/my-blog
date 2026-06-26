# A-4: @typescript-eslint/no-non-null-assertion 룰 위반 해소

> baseline 하네스 사이클 A-4.
> `@typescript-eslint/no-non-null-assertion` warn→error 승격(완료) 후 위반 6건 해소.

---

## 1. Background & Goals

- `eslint.config.mjs:96`에서 `@typescript-eslint/no-non-null-assertion`은 이미 **error**로 승격되어 있으나, `process.env.X!` 패턴 6곳이 남아 있어 `pnpm lint`가 6 errors로 실패한다.
- 본 작업의 목표는 `requireEnv(key)` 가드 헬퍼를 도입해 6곳을 일관 교체하고, baseline에서 해당 룰 항목을 0으로 만들어 빌드 가드레일을 회복하는 것이다.
- 더 큰 맥락: non-null assertion은 "내가 더 잘 알아" 식의 무근거 단언이라 런타임 디버깅 비용이 높다. `process.env.X!`는 특히 위험 — env 누락 시 `undefined`가 라이브러리에 전달되어 "URL is invalid" 같은 모호한 에러로 표면화된다. `requireEnv`는 **읽는 그 자리에서 명확한 에러로 실패**시켜 추적 시간을 줄인다.

---

## 2. Functional Requirements

**개발자 관점**:
- 개발자는 `requireEnv("KEY")`를 호출해 환경변수를 안전하게 읽을 수 있다.
- env가 `undefined` 또는 빈 문자열(`""`)이면 즉시 `Error: Missing required env: KEY` 메시지로 throw 된다.
- 호출 위치는 6곳: `auth.ts(SESSION_SECRET × 2)`, `supabase/client.ts(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`, `supabase/server.ts(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`.

### in scope
- `src/shared/lib/env.ts` 신규 (헬퍼) — D1 재고로 `shared/lib`에 배치
- `src/shared/lib/env.test.ts` 신규 (4 케이스)
- `src/shared/lib/index.ts` 수정 — `export * from "./env"` 추가
- 6곳 `process.env.X!` → `requireEnv("X")` 교체 (auth × 2, supabase/client × 2, supabase/server × 2)
- `eslint.config.mjs` 룰 주석 갱신 + `shared/lib` 그룹의 `import/no-relative-parent-imports` 해제 (D6 처리)
- baseline / migration / backlog 메타 갱신

### out of scope
- Zod 기반 `envSchema` 일괄 파싱 — 별도 사이클 (의존성/스코프 폭증)
- 환경변수 기본값 정책 — 별도 (필요해지면 `requireEnvOrDefault` 등으로 확장)
- `.env.example` 갱신 — 별도 (env 자체는 변동 없음)
- `dotenv` 도입/제거 — 본 PR 범위 밖

---

## 3. Acceptance Criteria

- [ ] `pnpm lint` 실행 시 `@typescript-eslint/no-non-null-assertion` error 0건.
- [ ] `pnpm lint` exit 0.
- [ ] 회귀 차단 검증: 일부러 새 `process.env.X!`를 추가하면 lint 실패 → 되돌리면 통과.
- [ ] `pnpm test` 통과 (env.test.ts 4건 + 기존 7건 = 11 passed).
- [ ] `npx tsc --noEmit` error 0건.
- [ ] 모든 호출 6곳이 `requireEnv("X")` 형식.
- [ ] `requireEnv("MISSING")` 호출 시 `Error: Missing required env: MISSING` throw.
- [ ] env 값이 빈 문자열일 때도 동일하게 throw.
- [ ] `requireEnv("KEY")`가 정상 값일 때는 그 값을 반환.

---

## 4. Functional Flow

### 정상 호출 (env 존재)

```text
1. 모듈 import 시점에 함수만 정의 (사이드 이펙트 0)
2. 호출 시점(예: createSessionToken() 진입): const secret = requireEnv("SESSION_SECRET")
3. process.env["SESSION_SECRET"] 읽기
4. 값이 non-empty string이면 반환
5. 호출 부에서 그대로 사용
```

### env 누락 / 빈 문자열

```text
1. requireEnv("SESSION_SECRET") 호출
2. process.env["SESSION_SECRET"] = undefined 또는 ""
3. throw new Error("Missing required env: SESSION_SECRET")
4. 상위 호출(예: createSessionToken)이 그대로 전파 → API 라우트가 500으로 응답
```

### 에러 시나리오
- **빌드 시점**: env 누락은 빌드 자체엔 영향 없음 (헬퍼 호출이 런타임). 빌드는 통과, 첫 요청 시 throw.
- **테스트 시점**: vitest 환경에서 `process.env["KEY"] = undefined` 직접 조작 가능 → 누락/존재/빈값 모두 검증.
- **개발 서버 시점**: API 라우트가 `requireEnv` 호출하는 첫 요청에서 throw → 500 + 명확한 메시지로 .env 누락 즉시 진단.

---

## 5. UI Design

**N/A — UI 변경 없음.** 헬퍼 도입 + 호출부 6곳 교체. 시각 결과물 동일.

### 컴포넌트 트리
N/A — 컴포넌트 없음.

### 접근성
**N/A — 인터랙티브 UI 없음.**

---

## 6. Technical Design

### 파일 변경

| 경로 | 동작 | 역할 |
|---|---|---|
| `src/shared/lib/env.ts` | 신규 | `requireEnv(key: string): string` 가드 헬퍼 |
| `src/shared/lib/env.test.ts` | 신규 | 4 케이스: 정상/undefined/빈문자열/메시지 포맷 |
| `src/shared/lib/index.ts` | 수정 | `export * from "./env"` 추가 (기존 barrel 보강) |
| `src/shared/lib/auth.ts` | 수정 | L32, L38 `process.env.SESSION_SECRET!` → `requireEnv("SESSION_SECRET")` (same-slot `./env` import) |
| `src/shared/lib/supabase/client.ts` | 수정 | L8, L9 `process.env.X!` → `requireEnv("X")` (`../env`) |
| `src/shared/lib/supabase/server.ts` | 수정 | L4, L5 `process.env.X!` → `requireEnv("X")` (`../env`) |
| `eslint.config.mjs` | 수정 | L96 주석 갱신 + `shared/lib` 그룹의 `import/no-relative-parent-imports`를 `off`로 (D6 충돌 해소) + `no-restricted-imports.patterns`에 외부 layer relative-traversal 차단 패턴 5종 추가 (D6 보강) |
| `docs/개발계획서/harness/lint-baseline.json` | 수정 | `no-non-null-assertion` 항목 제거. warn_total 19→13. decreases에 A-4 기록 |
| `docs/개발계획서/harness/eslint-migration.md` | 수정 | Changelog 표에 A-4 행 추가 |
| `docs/개발계획서/harness/backlog.md` | 수정 | A-4 ✅ + Changelog 갱신 |

### 상태 관리
**N/A — 순수 함수, 상태 없음.**

### 핵심 인터페이스

```ts
// src/shared/lib/env.ts
export function requireEnv(key: string): string;
```

- 입력: env 키 문자열
- 출력: env 값 (non-empty string)
- 예외: `Error("Missing required env: <key>")` — `undefined` 또는 빈 문자열일 때

### env.test.ts 테스트 케이스 (4)

1. **정상 반환** — `process.env["TEST_KEY"] = "value"` 설정 후 `requireEnv("TEST_KEY") === "value"`.
2. **undefined 시 throw** — `process.env["TEST_KEY"]` 미설정 시 `Missing required env: TEST_KEY` throw.
3. **빈 문자열 시 throw** — `process.env["TEST_KEY"] = ""` 설정 시 동일 throw.
4. **에러 메시지 포맷 일관성** — throw된 Error의 message가 정확히 `"Missing required env: ${key}"` 형식.

> `beforeEach`/`afterEach`로 `process.env["TEST_KEY"]`를 reset해 테스트 격리.

### API 통합
**N/A — 네트워크 호출 없음.**

---

## 7. Error & Feedback Handling

- 누락 시 throw 외 silent fallback 없음.
- 에러 메시지는 항상 `"Missing required env: <KEY>"` 형식 — 로그/스택트레이스에서 어떤 키가 빠졌는지 즉시 식별.
- 호출 측 try/catch는 안 함 — env 누락은 복구 불가능한 환경 설정 문제라 빠른 실패(fail-fast)가 정답.
- 본 작업은 UI/사용자 피드백 N/A.

---

## 8. Decisions

| ID | 결정 | 선택 | 사유 |
|---|---|---|---|
| D1 | 헬퍼 파일 위치 | `src/shared/lib/env.ts` (재고 — 기존 lib 슬롯) | 최초 결정은 `shared/config`였으나 구현 중 `import/no-relative-parent-imports` 룰 위반 발견(같은 `shared/` 내부라도 디렉토리상 parent traversal로 인식). YAGNI + `auth.ts`/`utils.ts`와 같은 슬롯이 자연스러워 `shared/lib`로 재배치. config 슬롯 신설은 미래에 envSchema/feature-flags 도입 시 재논의. |
| D2 | 빈 문자열 처리 | missing으로 취급 + throw | `.env`에 `KEY=` 한 줄만 어설프게 둔 실수를 silent로 통과시키지 않음. supabaseUrl이 `""`이면 라이브러리에서 "URL is invalid" 모호한 에러 발생 → 사전 차단. |
| D3 | 캐싱 | 매 호출 시 `process.env` 직접 읽기 | Lazy + 단순. Next.js 번들링이 `NEXT_PUBLIC_*`를 인라인하므로 성능 무관. 테스트에서 `process.env` 조작이 즉시 반영되어 격리 쉬움. |
| D4 | 헬퍼 추출 방식 | 가드 헬퍼 (1개 함수) | Zod 기반 envSchema는 의존성/스코프 폭증 → 본 사이클 원칙(1 룰 = 1 PR) 위배. 미래 envSchema 도입 시 본 헬퍼는 그대로 흡수 가능. |
| D5 | barrel 보강 | `src/shared/lib/index.ts`에 `export * from "./env"` 추가 | D1 재고 결과 기존 `shared/lib/index.ts`에 한 줄 추가로 처리. 새 슬롯 불필요. |
| D6 | boundaries / import 룰 충돌 | `shared/lib` 그룹의 `import/no-relative-parent-imports` 해제 + `no-restricted-imports.patterns` 보강 | `supabase/` 서브폴더에서 `../env` import가 룰 위반으로 잡힘. 룰 의도는 외부 layer(app/views/features 등) 차단이라 `shared/lib` 내부 자기참조는 정당. 단순 해제만 하면 `../../views/...` 같은 relative-traversal로 외부 layer 우회 가능 → patterns에 `../**/views/**` 등 5종 추가해 alias + relative 양쪽 모두 차단. |
| D7 | 테스트 작성 | `env.test.ts` 4 케이스 | impl-review #15 — 새 util/hook 추출 시 `*.test.ts` 필수. happy path + undefined + 빈 문자열 + 메시지 포맷. |
| D8 | 호출 측 try/catch | 안 함 | env 누락은 복구 불가능한 환경 설정 문제. fail-fast가 정답 — 묻혀버린 에러보다 명확한 500이 진단 비용 낮음. |

모든 결정 사항이 해소되어 미확정 항목 없음.
