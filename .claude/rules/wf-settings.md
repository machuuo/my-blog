# wf 설정

- 성격: wf 스킬(`/wf:design` · `/wf:implement` · `/wf:implement-inline` · `/wf:release` · `impl-review`)이 읽는 이 프로젝트의 설정. 틀 · 확인 절차: `~/.claude/skills/wf-design/wf-settings.md`

## 필수

| 항목 | 값 |
|---|---|
| 설계서 · 계획 자리 | `docs/개발계획서/` — 화면 · 기능은 `fe/<슬라이스>/`, 린트 · CI · 하네스는 `harness/`. 이름은 `<종류>-<번호>_<이름>.md`, 계획은 옆에 `<같은 이름>-flow.json` |
| 타입 검사 | `pnpm exec tsc --noEmit` |
| 린트 | `pnpm lint` (`eslint .`) — CI 는 error 0 · 경고 수 ≤ 기준선(`.claude/rules/lint-baseline.md`) |
| 테스트 | `pnpm test` (`vitest run`) |
| 층 순서 | 레이어: `shared` → `entities` → `features` → `widgets` → `views` → `app` 라우트. 슬라이스 안: `model` → `api` → `lib` → `ui` → 진입점 |
| 진입점 | views · widgets · features 는 슬라이스 루트 `index.ts` 하나. entities 는 `index.ts`(클라이언트) + `server.ts`(서버 전용). shared 는 세그먼트마다 `index.ts` + `lib/auth.ts` · `lib/supabase/*.ts`. 슬라이스 밖에서는 이 진입점으로만 가져온다 |
| 테스트 위치 | 파일 옆 `*.test.ts(x)`. 앱 전체 연기 테스트만 `src/__tests__/` |
| 쓰는 묶음 | `react` — Next.js App Router · Supabase · Tailwind |

## 선택

| 항목 | 값 | 없을 때 |
|---|---|---|
| 파일 지정 린트 | `pnpm exec eslint <파일>` | 린트 전체 |
| 파일 지정 테스트 | `pnpm exec vitest run <파일>` | 테스트 전체 |
| 커버리지 | | 그 옵션을 쓸 때 묻는다 |
| 변경 확인에서 뺄 파일 | | 빼지 않는다 |

## 덧붙임

- 진입점 위반은 ESLint 가 판단한다 — `eslint.config.mjs` 의 `ENTRY_POINTS` 와 `boundaries/dependencies`(error). 세그먼트 파일을 슬라이스 밖에서 바로 가져오면 `pnpm lint` 가 error 를 내고 린트 CI 가 실패한다(`next build` 는 ESLint 를 돌리지 않는다).
- 배럴 훅(`post-barrel.sh`)은 `.claude/no-barrel-hook` 으로 꺼 두었다 — ESLint 가 이미 막으므로 중복이고, 세그먼트에 배럴이 없는 구조에서 잘못 막은 적이 있다(barrel-hook-2).
