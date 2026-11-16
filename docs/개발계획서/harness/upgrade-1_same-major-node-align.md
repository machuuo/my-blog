# upgrade-1 — 같은 메이저 안 의존성 갱신 · Node 24 정렬 · Next 16 잔재 정리

> 유형: 의존성 · 실행 환경 정리 (화면 변경 없음)
> 전체 순서: **① 이 문서** → ② 도구 메이저(pnpm 12 · Supabase CLI 3 · dotenv 18) → ③ Tailwind 4 → ④ ESLint 9 안 플러그인 메이저(boundaries 7) → ⑤ Vitest 5 · happy-dom 21 · jest-dom 7 → ⑥ TypeScript 6.0. 단계마다 설계서 · PR 을 따로 둔다.

---

## 1. 배경 & 목표

의존성이 최신보다 뒤처져 있고, Node 버전이 로컬 24.7 · CI 20 · `@types/node` 20 으로 서로 다르며 고정 파일이 없다. Next 16 으로 올린 뒤 남은 옛 설정(`middleware.ts` 파일 이름, `next.config.mjs` 의 `eslint` 옵션)과 쓰지 않는 파일(`package-lock.json`, 매번 실패하는 GitHub Pages 워크플로)도 있다.

- **목표**: 메이저 업그레이드(②~⑥)를 시작하기 전에, 같은 메이저 안에서 올릴 수 있는 것을 올리고(도구 3개 `supabase` CLI · pnpm · `dotenv` 는 ② 몫) Node 버전을 24 하나로 맞춘 깨끗한 기준점을 만든다.

## 2. 기능 요구사항

개발자 관점:

- 개발자는 로컬 · CI · Vercel 어디서나 Node 24 로 설치 · 검사 · 빌드한다. Node 버전은 `.nvmrc` 한 곳에서 읽는다.
- 개발자는 `pnpm outdated` 에서 새 메이저 버전만 남은 상태를 본다.
- 개발자는 `.env.example` 로 채워야 할 환경변수 키를 안다.
- 사용자(방문자 · 관리자)는 바뀐 점을 느끼지 않는다. `/write` 보호 동작은 그대로다.

**In scope**

- 같은 메이저 안 최신으로 갱신(아래 §6 목록) · `@types/node` 를 24 로
- `.nvmrc` 추가 · `package.json` `engines.node` 추가 · CI 워크플로 2개의 Node 를 `.nvmrc` 로
- `middleware.ts` → `src/proxy.ts` (파일 · 함수 이름)
- `next.config.mjs` 의 `eslint` 블록 제거
- `package-lock.json` 삭제 · `.github/workflows/deploy.yml` 삭제
- `.env.example` 추가 · `README.md` 환경변수 안내를 같은 키 목록으로

**Out of scope**

- 새 메이저 버전 업그레이드 전부 (②~⑥ 단계)

## 3. 완료 조건 (Acceptance Criteria)

- [ ] §6 갱신 대상 표의 패키지가 모두 목표 버전 이상이고, `pnpm outdated` 에 남은 항목은 Latest 의 메이저가 Current 와 다른 것뿐이다
- [ ] `supabase` CLI · `packageManager`(pnpm) · `dotenv` 는 지금 버전 그대로다 (② 단계 몫)
- [ ] `.nvmrc` 가 `24`, `package.json` 의 `engines.node` 가 `24.x`, `@types/node` 가 `^24` 범위다
- [ ] `lint.yml` · `db-types.yml` 이 `node-version-file: .nvmrc` 로 Node 24 를 설치하고 PR 에서 통과한다
- [ ] Vercel preview · 운영 배포가 Node 24.x 로 빌드되고 성공한다
- [ ] `src/proxy.ts` 가 `proxy` 함수와 옛 값 그대로의 `config.matcher` 를 내보내고, `middleware.ts` 는 없다
- [ ] 로그인 쿠키(`blog_session`) 없이 `/write` 이하로 가면 `/login?redirect=<원래 경로>` 로 보내고, 쿠키가 있으면 통과시킨다 (옛 동작과 같음)
- [ ] `pnpm build` 출력에 middleware 사용 중단 경고가 없고 `ƒ Proxy (Middleware)` 가 찍히며, `.next/server/functions-config-manifest.json` 에 `/_middleware`(matcher `/write/:path*`)가 등록된다
- [ ] `src/proxy.ts` 가 진입점 린트 검사(`boundaries/dependencies`)를 `app` 층과 같게 받는다 — 슬라이스 내부 파일을 바로 가져오면 error, 진입점으로 가져오면 통과
- [ ] `next.config.mjs` 에 `eslint` 키가 없다
- [ ] `package-lock.json` · `.github/workflows/deploy.yml` 이 없다
- [ ] `.env.example` 에 코드가 읽는 키 4개(`NEXT_PUBLIC_SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `ADMIN_PASSWORD` · `SESSION_SECRET`)가 값 없이 있고, git 이 무시하지 않는다
- [ ] `README.md` 의 환경변수 안내가 `.env.example` 과 같은 키 4개를 보여 주고, `.env.example` 을 복사해 `.env.local` 로 쓰라고 안내한다
- [ ] `pnpm exec tsc --noEmit` 오류 0 · `pnpm lint` error 0 이고 경고 ≤ 기준선(13) · `pnpm test` 전부 통과 · `pnpm build` 통과
- [ ] 경고 수가 줄었으면 `lint-baseline.json` 을 같은 PR 에서 갱신했다

**Edge cases**

- 빈 값 쿠키(`blog_session=`)는 쿠키 없음과 같게 리다이렉트한다
- Proxy 는 Edge 가 아니라 Node 런타임에서 돈다 — 옛 코드는 쿠키 · URL 만 써서 그대로 동작해야 한다

### 3-1. 테스트 정의

| ID | 단위 | 입력(출처) | 값 · 상황 | 기대 동작 | 테스트 파일 | 근거 |
|---|---|---|---|---|---|---|
| TC-1 | `src/proxy.ts` `proxy` | 요청 경로 · `blog_session` 쿠키 | `/write`, 쿠키 없음 | 리다이렉트, 이동 위치 경로가 `/login` 이고 `redirect` 파라미터가 `/write` | `src/proxy.test.ts` | 요구: §3 |
| TC-2 | `src/proxy.ts` `proxy` | 요청 경로 | `/write/my-post`, 쿠키 없음 | 리다이렉트, `redirect` 파라미터가 `/write/my-post` | `src/proxy.test.ts` | 값: 요청 경로 |
| TC-3 | `src/proxy.ts` `proxy` | `blog_session` 쿠키 | `/write`, 쿠키 값 있음 | 리다이렉트 없이 통과 응답(`NextResponse.next()`) | `src/proxy.test.ts` | 요구: §3 |
| TC-4 | `src/proxy.ts` `proxy` | `blog_session` 쿠키 | `/write`, 쿠키 값이 빈 문자열 | 리다이렉트 (빈 값 = 없음) | `src/proxy.test.ts` | 값: 인증 · 신원 |
| TC-5 | `src/proxy.ts` `config` | 내보낸 설정 | `config` 객체 | `matcher` 가 `["/write/:path*"]` 이고 `runtime` 키가 없다 | `src/proxy.test.ts` | 전제: `middleware.ts` → `src/proxy.ts` |
| TC-6 | `src/proxy.ts` `proxy` | 실행 런타임 | 테스트 환경을 node 로 두고 TC-1~4 실행 | TC-1~4 와 같은 결과. 실제 조합: Next 16 의 proxy 는 항상 Node 런타임으로 돈다 | `src/proxy.test.ts` | 전제: Edge → Node 런타임 |
| TC-7 | `src/proxy.ts` | 빌드 | `pnpm build` | 출력에 `"middleware" file convention is deprecated` 경고가 없고 `ƒ Proxy (Middleware)` 가 찍히며, `.next/server/functions-config-manifest.json` 에 `/_middleware`(runtime `nodejs`, matcher `/write/:path*`)가 있다. 실제 조합: Next 는 proxy 를 app 폴더의 부모(`src/`)에서만 찾고, 운영 서버는 이 등록이 있을 때만 proxy 를 부른다 | 명령 확인 (`pnpm build` · manifest) | 전제: `middleware.ts` → `src/proxy.ts` |
| TC-8 | `src/proxy.ts` | 배포 환경 | Vercel preview 에서 로그아웃 상태로 `/write` 열기 → 로그인 뒤 다시 열기 | `/login` 으로 이동 → 글쓰기 화면이 열림 | 화면 확인 | P6 |
| TC-9 | `package.json` 의존성 | npm 레지스트리 · 설치본 | `pnpm outdated` · `pnpm list --depth 0` | §6 표의 패키지가 목표 버전 이상, `supabase` · `dotenv` · `packageManager` 는 그대로, `pnpm outdated` 의 나머지는 메이저가 다른 것뿐 | 명령 확인 (`pnpm outdated` · `pnpm list --depth 0`) | 요구: §3 |
| TC-10 | `.nvmrc` · `package.json` | 버전 값 | 파일 내용 | `.nvmrc` = `24`, `engines.node` = `24.x`, `@types/node` = `^24` | 명령 확인 (파일 확인) | 요구: §3 |
| TC-11 | `lint.yml` · `db-types.yml` | `node-version-file` | PR 의 CI 실행 | 실행 로그의 Node 가 v24 이고 두 워크플로가 통과 | 명령 확인 (`gh pr checks` · 실행 로그) | 값: 환경 · 설정 |
| TC-12 | Vercel 빌드 | `engines.node` | PR preview 배포 · main 머지 뒤 운영 배포 | 빌드 로그의 Node 가 24.x 이고 배포 성공 | 화면 확인 | 값: 환경 · 설정 (dev · 운영 호스트) |
| TC-13 | `package-lock.json` 삭제 | 잠금 파일 | 저장소 · Vercel 설치 단계 | 파일 없음, `pnpm install --frozen-lockfile` 성공, Vercel 빌드 로그가 pnpm 으로 설치 | 명령 확인 (`pnpm install --frozen-lockfile`) · 화면 확인 (Vercel 로그) | 요구: §3 |
| TC-14 | `deploy.yml` 삭제 | 워크플로 목록 | 저장소 · main 머지 뒤 | Pages 워크플로 파일 없음, 머지 뒤 Pages 실행이 생기지 않음 | 명령 확인 (`gh run list`) | 요구: §3 |
| TC-15 | `next.config.mjs` | 설정 키 | 설정 파일 | `eslint` 키 없음, `pnpm build` 가 설정 경고 없이 통과 | 명령 확인 (`pnpm build`) | 요구: §3 |
| TC-16 | `.env.example` | 키 목록 | 파일 내용 · git 무시 여부 | 키 4개가 값 없이 있고 `git check-ignore .env.example` 이 무시하지 않음 | 명령 확인 (`git check-ignore`) | 요구: §3 |
| TC-17 | 전체 | 검사 명령 | tsc · lint · test · build | tsc 오류 0, lint error 0 · 경고 ≤ 13 (줄면 기준선 갱신), 기존 테스트 8파일 + 새 테스트 통과, build 통과 | 명령 확인 (검사 4종) | 요구: §3 · P7 |
| TC-19 | `eslint.config.mjs` `boundaries/elements` | `src/proxy.ts` 의 import | `src/proxy.ts` 이름으로 `@/features/write-post/ui/PostForm`(깊은 경로) · `@/features/write-post`(진입점)를 린트 | 깊은 경로는 `boundaries/dependencies` error 1건, 진입점은 0건 | 명령 확인 (`eslint --stdin --stdin-filename src/proxy.ts`) | P7 |
| TC-18 | `README.md` | 환경변수 안내 | 환경변수 절 | `.env.example` 과 같은 키 4개, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 없음, `.env.example` 복사 안내 있음 | 명령 확인 (파일 확인) | 요구: §3 |

## 4. 기능 흐름

사용자 대면 흐름 변화 없음. 구현 · 검증 순서 (단계마다 tsc · lint · test 를 돌리고 통과해야 다음으로 간다):

```text
1. Node 정렬   .nvmrc · engines · @types/node ^24 · 워크플로 2개 node-version-file
2. 정리        package-lock.json 삭제 · deploy.yml 삭제 · next.config.mjs eslint 제거 · .env.example 추가 · README 환경변수 안내
3. proxy 이전   src/proxy.test.ts 먼저 작성(옛 middleware 로 통과 확인) → src/proxy.ts 로 옮기며 함수 이름 변경 → 통과 · 빌드 등록 확인
4. 의존성 갱신  같은 메이저 안 최신으로 → 검사 4종 + pnpm build → 경고 줄면 기준선 갱신
5. PR          CI(TC-11) · Vercel preview(TC-12 · TC-13 · TC-8) 확인
```

**에러 시나리오**: 검사가 실패하면 그 단계에서 원인을 고치고 다음 단계로 넘어가지 않는다 (§7).

## 5. UI 설계

- UI 레이아웃: 해당 없음 — 화면 변경 없음
- 컴포넌트 트리: 변경 없음
- 접근성: 해당 없음 — 인터랙티브 UI 변경 없음

## 6. 기술 설계

**변경 파일**

| 파일 | 작업 | 역할 |
|---|---|---|
| `package.json` | 수정 | 같은 메이저 안 최신으로 최소 버전 갱신 · `@types/node` `^24` · `engines.node` `24.x` 추가 |
| `pnpm-lock.yaml` | 갱신 | 직접 의존성만 갱신한다. 잠금 파일을 지우고 다시 풀지 않는다 |
| `package-lock.json` | 삭제 | |
| `.nvmrc` | 신규 | `24` — 로컬 · CI 의 Node 버전 원본 |
| `.github/workflows/lint.yml` | 수정 | `node-version: 20` → `node-version-file: .nvmrc` |
| `.github/workflows/db-types.yml` | 수정 | `node-version: 20` → `node-version-file: .nvmrc`, 실행 조건 `paths` 에 `.nvmrc` 추가 |
| `.github/workflows/deploy.yml` | 삭제 | |
| `middleware.ts` → `src/proxy.ts` | 이름 변경 · 이동 | 함수 이름 `middleware` → `proxy`, 반환 타입 `NextResponse` 명시(`src/**` 린트 규칙). 본문 · `config` 그대로 |
| `src/proxy.test.ts` | 신규 | §3-1 TC-1~6 |
| `eslint.config.mjs` | 수정 | `boundaries/elements` 에 `{ type: "app", pattern: "src/proxy.ts", mode: "file" }` 추가 |
| `next.config.mjs` | 수정 | `eslint` 블록 제거 |
| `.env.example` | 신규 | 키 4개, 값 비움 |
| `README.md` | 수정 | 환경변수 절: `NEXT_PUBLIC_SUPABASE_ANON_KEY` 줄 삭제, `.env.example` 을 복사해 `.env.local` 로 쓰라는 안내. 로컬 개발 절: Node 24(`.nvmrc`) 안내 |
| `docs/개발계획서/harness/lint-baseline.json` | 조건부 수정 | 경고 수가 줄면 `warn_total` · `warn_by_rule` · `decreases` 갱신 |

**같은 메이저 안 갱신 대상** (설계 시점 2026-11-16 기준 최신 — 구현 때 범위 안 최신을 쓴다)

| 구분 | 패키지 | 지금 → 목표 |
|---|---|---|
| 프레임워크 | `next` · `eslint-config-next` | 16.2.9 → 16.4.6 |
| | `react` · `react-dom` | 19.2.7 → 19.3.1 |
| | `@types/react` · `@types/react-dom` | 19.2.x → 19.3.0 |
| 데이터 | `@supabase/supabase-js` | 2.101.1 → 2.119.0 |
| UI | `@base-ui/react` | 1.6.0 → 1.9.0 |
| | `@radix-ui/react-separator` | 1.1.8 → 1.2.0 |
| | `lucide-react` | 1.7.0 → 1.73.0 |
| | `tailwind-merge` | 3.5.0 → 3.7.0 |
| | `sonner` | 2.0.7 → 2.0.8 |
| 스타일 | `postcss` | 8.5.8 → 8.5.33 |
| | `@tailwindcss/typography` | 0.5.19 → 0.5.20 |
| 린트 | `eslint` | 9.39.4 → 9.39.5 |
| | `typescript-eslint` | 8.62.0 → 8.72.2 |
| | `eslint-plugin-sonarjs` | 4.1.0 → 4.2.2 |
| 테스트 · 도구 | `vitest` | 4.1.9 → 4.1.12 |
| | `happy-dom` | 20.10.6 → 20.14.6 |
| | `@vitejs/plugin-react` | 6.0.3 → 6.3.0 |
| | `@testing-library/react` | 16.3.2 → 16.3.3 |
| | `tsx` | 4.21.0 → 4.23.15 |
| 실행 환경 | `@types/node` | 20.19.39 → 24.x 최신 |

`supabase` CLI(2.109.1) · `packageManager` pnpm(10.33.0) · `dotenv`(17.4.0)은 지금 버전에 둔다. `@testing-library/jest-dom` 은 6.9.1 에 둔다 — 6.10.0 은 관리자가 사용 중단 처리했다("Use 6.9.1 for the 6.x line").

**주요 인터페이스**

- `proxy(request: NextRequest): NextResponse` — 옛 `middleware` 와 같은 모양
- `config: { matcher: string[] }` — `["/write/:path*"]`

**상태 관리 / API 연동**: 해당 없음 — 의존성 · 설정 변경

## 7. 에러 & 피드백 처리

- **검사 실패(tsc · lint · test · build)**: 실패한 단계에서 원인을 고친다. 갱신한 패키지가 원인인데 작은 수정으로 안 고쳐지면, 그 패키지만 지금 버전에 두고 PR 본문에 패키지 이름 · 증상을 적는다.
- **새 린트 경고**: `.claude/rules/lint-baseline.md` 대로 이 PR 에서 고친다. 기준선을 올리지 않는다.
- **CI · Vercel preview 실패**: 머지하지 않고 로그를 보고 고친다.
- **사용자 피드백**: 화면 변화가 없어서 따로 없다. `/write` 리다이렉트는 옛 동작 그대로다.

## 8. 결정 사항

- **진행 방식 A** (2026-11-16 사용자 결정): 단계마다 설계서 · PR 분리, 막힌 것은 올릴 수 있는 데까지만. ESLint 10 · `eslint-plugin-unicorn` 80 · TypeScript 7 은 함께 쓰는 도구가 지원할 때 다시 본다.
- **Node 24** (사용자 결정). 버전 원본은 `.nvmrc` (로컬 · CI), Vercel 은 `engines.node` `24.x` 를 읽는다 (Vercel 문서: `engines` 가 대시보드 설정을 덮어씀).
- **도구 메이저(pnpm 12 · Supabase CLI 3 · dotenv 18)는 ② 단계로 따로** (사용자 결정). 이 셋은 같은 메이저 안 새 버전도 ① 에서 올리지 않는다 (사용자 결정).
- **같은 메이저 안 새 버전이 있는 `eslint` · `vitest` · `happy-dom` · `@testing-library/jest-dom` 은 ① 에서 올린다** (사용자 결정). 구현 중 `@testing-library/jest-dom` 6.10.0 이 사용 중단 버전으로 확인돼 6.9.1 에 둔다 (2026-11-16).
- **잠금 파일은 직접 의존성만 갱신** (사용자 결정). 잠금 파일을 지우고 다시 풀지 않는다.
- **`README.md` 환경변수 안내를 이번 PR 에서 `.env.example` 과 맞춘다** (사용자 결정).
- **GitHub Pages 워크플로 삭제** (사용자 결정). 실제 배포는 Vercel.
- **`package-lock.json` 삭제**: `.claude/rules/package-manager.md` (pnpm 만 사용).
- **`.env.example` 을 ① 에 넣음** (사용자 결정). 실제 값은 Vercel 환경변수 · 로컬 `.env.local`. 코드가 읽지 않는 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 는 넣지 않는다.
- **proxy 이전 방법**: Next 공식 안내(`middleware-to-proxy`)대로 파일 · 함수 이름만 바꾼다. `runtime` 설정은 원래 없다.
- **proxy 자리는 `src/proxy.ts`** (2026-11-16 구현 중 리뷰로 확인): app 폴더가 `src/app` 이라 Next 16 빌드는 proxy 를 `src/` 에서만 찾는다. 저장소 루트에 두면 컴파일만 되고 등록되지 않아 운영에서 돌지 않는다.
- **`src/proxy.ts` 를 진입점 린트 검사에 `app` 층으로 넣는다** (2026-11-16 사용자 결정). `boundaries/elements` 가 폴더 단위라 이 파일이 어느 원소에도 속하지 않았다.
- **린트 경고 처리**: `.claude/rules/lint-baseline.md` — 늘면 이 PR 에서 고치고, 줄면 기준선을 갱신한다.
