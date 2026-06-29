# B-1: Tier B 승격 + 제어흐름 스타일 표준

> 하네스 baseline 사이클 b-1. A-1~A-4(Tier A) 완료 후 Tier B 진입 + 제어흐름 스타일(early-return / 중첩삼항) 표준화.

---

## 1. Background & Goals

- backlog의 **Tier B 3룰**(`sonarjs/cognitive-complexity`, `unicorn/prefer-string-replace-all`, `react/jsx-no-leaked-render`)은 `warn`으로 등록만 돼 있고 위반 0건이라 승격 대기 상태였다. 가드레일로 만들려면 `error` 승격이 필요하다.
- 동시에 **제어흐름 스타일 표준**(early-return 우선 / 중첩삼항 금지)이 문서·린트 어디에도 명문화돼 있지 않다. 측정 결과 `no-else-return` 위반 0건(= early-return이 이미 사실상 표준), `no-nested-ternary` 위반 3건. 표준을 **프로젝트 CLAUDE.md(영어)에 명시 + 린트로 강제**해 다음 사이클부터 회귀를 자동 차단한다.
- 본 사이클은 코드 동작을 바꾸지 않는다(중첩삼항 해소는 렌더 결과 보존 리팩터). baseline `warn_total`은 13으로 유지된다(승격 룰 전부 0 warning).

---

## 2. Functional Requirements

**개발자/CI 관점**:
- Tier B 3룰이 `error`로 승격돼, 위반 시 `pnpm lint`가 즉시 실패한다.
- `cognitive-complexity`는 threshold **10**으로 승격된다(기본값 15보다 엄격, React 일상 컴포넌트는 통과, 현재 최복잡 PostForm=9 통과).
- early-return 표준이 `no-else-return`(error)로 강제된다.
- 중첩삼항 금지가 `no-nested-ternary`(error)로 강제되며, 기존 위반 3곳은 해소된다.
- 제어흐름 스타일 규칙이 프로젝트 `CLAUDE.md`에 영어로 문서화돼, 사람·AI가 동일 기준을 따른다.

### in scope
- `eslint.config.mjs` 5룰 변경 (3 승격 + 2 신규 error)
- 중첩삼항 3곳 해소: HomePage / TechDetailPage(값 매핑 → 로컬 Record), PostForm(다조건 라벨 → 모듈 레벨 early-return 헬퍼)
- 프로젝트 `CLAUDE.md`에 영어 "Control Flow & Conditionals" 절 신설
- 메타 갱신: `backlog.md`, `eslint-migration.md`
- `lint-baseline.json` 검증 (변경 없음 — `warn_total` 13 유지만 확인, 승격 룰 전부 0 warning)

### out of scope
- **PostForm cognitive-complexity 리팩터** — threshold 10에서 9는 통과. 중첩삼항(라벨)만 surgical 수정, 컴포넌트 훅 추출은 안 함 (CLAUDE.md §3).
- **tapeColor 공용 헬퍼 추출(DRY)** — surgical 유지 결정. 각 파일 로컬 Record.
- **글로벌 `~/.claude/CLAUDE.md` 수정** — 본 표준은 프로젝트 한정.
- **Tier C 룰**(`import/order` 등) — 별도 사이클.

---

## 3. Acceptance Criteria

- [ ] `eslint.config.mjs`에서 다음 5룰이 적용됨:
  - [ ] `sonarjs/cognitive-complexity`: `["error", 10]`
  - [ ] `unicorn/prefer-string-replace-all`: `"error"`
  - [ ] `react/jsx-no-leaked-render`: `["error", { validStrategies: ["ternary"] }]`
  - [ ] `no-else-return`: `"error"`
  - [ ] `no-nested-ternary`: `"error"`
- [ ] 중첩삼항 3곳 해소 후 `no-nested-ternary` 위반 0건:
  - [ ] HomePage.tsx — `tapeColor`가 로컬 `TAPE_COLOR` Record lookup
  - [ ] TechDetailPage.tsx — `tapeColor`가 로컬 `TAPE_COLOR` Record lookup
  - [ ] PostForm.tsx — 버튼 라벨이 모듈 레벨 `submitLabel(saving, isEditing)` early-return 헬퍼
- [ ] 리팩터 후 렌더 결과 동일 (라벨 문자열·CSS 변수 매핑 보존)
- [ ] `pnpm lint` exit 0 (5룰 error 상태에서 위반 0)
- [ ] `tsc --noEmit` 통과
- [ ] 회귀 검증 — 각 룰 위반을 일부러 추가 시 error로 차단, 되돌리면 통과
- [ ] 프로젝트 `CLAUDE.md`에 영어 제어흐름 절 존재 (early-return 우선 / 단순삼항 허용 / 중첩삼항 금지 + 강제 룰 명시)
- [ ] `lint-baseline.json` `warn_total` 13 유지 (승격 룰 0 warning 확인)
- [ ] `backlog.md` Tier B ✅ + 신규 2룰 기록, `eslint-migration.md` Changelog b-1 추가

---

## 4. Functional Flow

순수 설정·리팩터 사이클이라 런타임 상태 전이 없음.

```text
[CI/로컬 lint 흐름 — 승격 후]
pnpm lint
  ├─ cognitive-complexity > 10        → ❌ error (빌드 차단)
  ├─ prefer-string-replace-all 위반    → ❌ error
  ├─ jsx-no-leaked-render(ternary 외)  → ❌ error
  ├─ else-after-return                → ❌ error (early-return 강제)
  ├─ 중첩삼항                          → ❌ error
  └─ 위 전부 통과                      → ✅ exit 0
```

### 에러 시나리오
- 승격 직후 예상치 못한 위반이 남아 lint 실패 → 해당 위반 해소 또는(복잡도 한정) 함수 분리. 임의 baseline 상향 금지.

---

## 5. UI Design

**N/A — UI 변경 없음.** 중첩삼항 해소는 동작 보존 리팩터로 렌더 출력이 동일하다(버튼 라벨 3상태, tape 색상 매핑 그대로). 접근성 변경 없음.

### 컴포넌트 트리
N/A — 컴포넌트 구조 불변.

---

## 6. Technical Design

### 파일 변경

| 경로 | 동작 | 역할 |
|---|---|---|
| `eslint.config.mjs` | 수정 | 5룰: cognitive-complexity `["error",10]`, prefer-string-replace-all `error`, jsx-no-leaked-render `error`(ternary), no-else-return `error`, no-nested-ternary `error` |
| `src/views/home/ui/HomePage.tsx` | 수정 | `tapeColor` 중첩삼항 → 모듈 레벨 `TAPE_COLOR` Record + `TAPE_COLOR[tape]` |
| `src/views/tech-detail/ui/TechDetailPage.tsx` | 수정 | `tapeColor` 중첩삼항 → 로컬 `TAPE_COLOR` Record (HomePage와 동일 선언, 로컬 유지) |
| `src/features/write-post/ui/PostForm.tsx` | 수정 | 버튼 라벨 중첩삼항 → 모듈 레벨 `submitLabel(saving, isEditing)` early-return 헬퍼 |
| `CLAUDE.md` | 수정 | 영어 "Control Flow & Conditionals" 절 신설 |
| `docs/개발계획서/harness/b-1_tier-b-style-standards.md` | 신규 | 본 설계서 |
| `docs/개발계획서/harness/b-1_tier-b-style-standards-flow.json` | 신규 | flow tracker |
| `docs/개발계획서/harness/backlog.md` | 수정 | Tier B ✅ + no-else-return/no-nested-ternary 기록 |
| `docs/개발계획서/harness/eslint-migration.md` | 수정 | Changelog b-1 행 추가 |

> **lint-baseline.json은 변경하지 않는다(검증만).** 승격 룰이 전부 0 warning이라 `warn_total` 13이 그대로 유지된다. ratchet 수치 변동이 없어 파일 편집 불필요 — `pnpm lint`로 13 유지만 확인한다.
> 신규 `*.test.ts` 없음 — `submitLabel`/`TAPE_COLOR`는 UI 컴포넌트 파일 내 로컬 선언(별도 util/hook 파일 아님)이라 TDD 테스트 대상 제외.

### 상태 관리
**N/A — 상태 변경 없음.**

### 핵심 인터페이스 (이름/형태만)

```text
# HomePage.tsx / TechDetailPage.tsx (각 로컬)
TAPE_COLOR: Record<"sage" | "pink" | "sky", string>   // enum → CSS 변수 매핑
tapeColor = TAPE_COLOR[tape]

# PostForm.tsx (모듈 레벨)
submitLabel(saving: boolean, isEditing: boolean): string
  // if (saving) return "저장 중..."; if (isEditing) return "수정"; return "발행";
```

### CLAUDE.md 추가 절 (영어, 요지)
- **Early returns / guard clauses** preferred over nested conditionals (enforced: `no-else-return`, indirectly `sonarjs/cognitive-complexity` ≤ 10).
- **Ternary**: simple ternary OK and preferred for JSX conditional render (`react/jsx-no-leaked-render` ternary strategy); **nested ternaries forbidden** (`no-nested-ternary`) — use a lookup object or an extracted early-return helper.
- 코드펜스 언어 식별자 규칙(글로벌 §9)과 동일하게 모든 예시 펜스에 언어 명시.

---

## 7. Error & Feedback Handling

- 런타임 사용자 피드백 없음(설정·리팩터). 피드백 채널은 **`pnpm lint` / CI**.
- 승격 룰 위반 시 lint error로 즉시 가시화. CI(`.github/workflows/lint.yml`)의 errors=0 게이트가 차단.
- `lint-baseline.json`은 본 사이클에서 수치 변동 없음 — 승격 룰이 0 warning이므로 ratchet 영향 없음.

---

## 8. Decisions

| ID | 결정 | 선택 | 사유 |
|---|---|---|---|
| D1 | cognitive-complexity threshold | **10** | 기본값 15보다 엄격하되 React 일상 컴포넌트는 통과. 현재 0건. 8은 자의적(최복잡 9의 -1) + 향후 마찰 큼. |
| D2 | 중첩삼항 해소 방식 | 의미별 혼합 — 매핑은 Record, 다조건 라벨은 early-return 헬퍼 | 매핑은 분기보다 데이터가 명확, 라벨은 표준인 early-return 시연. |
| D3 | tapeColor 중복 처리 | 로컬 유지 (각 파일 Record) | surgical(§3). 공용 헬퍼는 FSD 배치 결정 + 스코프 확대. 3줄 중복 허용. |
| D4 | 스타일 표준 문서화 위치/방식 | 프로젝트 CLAUDE.md(영어) + 린트 강제 | 사용자 지시. 글로벌 미수정. |
| D5 | 글로벌 CLAUDE.md | 미수정 | 본 표준은 프로젝트 한정. |
| D6 | PostForm 복잡도 리팩터 | 안 함 | threshold 10에서 9 통과. 중첩삼항만 surgical. |
| D7 | SonarSource 외부 문서 참조 | 제외 | 사용자 지시(범위 외). |

모든 결정 사항 해소 완료, 미확정 항목 없음.
