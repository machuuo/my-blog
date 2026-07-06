# gate-1: /write 페이지 인증 게이트

> 상태: 설계 완료 · 브랜치(예정): `feat/write-auth-guard`
> 접근안: **A (app/write/layout.tsx 게이트)** · redirect: **고정 `/login`**

---

## 1. 배경 & 목표 (WHY)

API 라우트(`/api/posts`·`/api/upload` 등)는 모두 `isAuthenticated()`로 401 보호되지만, **페이지(`/write`, `/write/[slug]`)는 인증 체크가 전혀 없다.** 비로그인 사용자가 주소를 직접 입력하면 글쓰기 에디터 UI가 그대로 렌더되고, 저장 시점(POST)에야 401을 받는다.

**목표**: `app/write/` 하위 라우트에 서버 레벨 인증 게이트를 추가해, **미인증 사용자가 에디터에 진입하기 전에 `/login`으로 차단**한다. 데이터 변조는 이미 API가 막고 있으므로 본 작업은 **UI 진입 차단(UX 갭 해소)**이 목적이다.

---

## 2. 기능 요구사항 (WHAT)

**In scope:**

- `src/app/write/layout.tsx`(신규 서버 컴포넌트)에서 `isAuthenticated()` 검사 → 미인증 시 `redirect("/login")`.
- 한 파일로 `/write`(새 글)·`/write/[slug]`(수정) **두 라우트 동시 게이트**.

**Out of scope (별도 트랙):**

- **공개 `/posts/[slug]`의 초안 노출** — `getPostBySlug`가 published 필터 없이 공개 페이지(`app/posts/[slug]/page.tsx:19,33`)에도 쓰여 **미발행 초안이 공개 URL로 노출**된다. 단, 공유 `getPostBySlug`에 필터를 그냥 붙이면 **편집 페이지가 초안을 못 불러와 깨지므로**(편집은 초안 로드 필요), fetch 분리가 필요한 **독립 버그**다. 본 게이트와 분리해 별도 처리한다.
- `middleware.ts` 방식 (Edge 런타임 + Buffer 기반 auth 재작성 필요 → 게이트 1곳엔 과함).
- 로그인 후 원래 경로(특히 `/write/[slug]`)로의 정확 복귀 (`headers()` 경로 추출이 fragile → 고정 `/login`으로 결정).

---

## 3. 완료 조건 (Acceptance Criteria)

- [ ] 비로그인 사용자가 `/write` 접근 시 `/login`으로 redirect된다.
- [ ] 비로그인 사용자가 `/write/[slug]` 접근 시 `/login`으로 redirect된다.
- [ ] 로그인 사용자는 `/write`·`/write/[slug]`에 정상 진입한다.
- [ ] 게이트는 `app/write/layout.tsx` 한 곳에서 두 라우트를 커버한다(각 page.tsx 불변).
- [ ] 인증 판정은 기존 `@/shared/lib/auth`의 `isAuthenticated()`를 사용한다(신규 인증 로직 없음).
- [ ] 로그인 성공 시 `LoginForm`의 기본 `redirectTo`(`/write`)로 복귀한다.
- [ ] 접근성: 해당 없음 — 서버 redirect 로직, 렌더되는 UI 변경 0.

---

## 4. 기능 흐름 (HOW)

```text
[요청 → /write 또는 /write/[slug]]
  layout 렌더(서버)
    → isAuthenticated()
        ├─ true  → children(page) 렌더
        └─ false → redirect("/login")   (Next redirect: 페이지 렌더 중단)

[로그인 페이지]
  로그인 성공 → LoginForm redirectTo 기본 "/write"로 push
```

- **에러 시나리오**: `isAuthenticated()` 내부는 `verifySessionToken → requireEnv("SESSION_SECRET")`을 거치며, `SESSION_SECRET` 누락 시 `MissingEnvError`를 throw할 수 있다. 이 경우 layout이 throw → Next 에러 경계(500)로 전파된다. **게이트는 별도 catch하지 않는다**(API 라우트의 MissingEnvError→500 거동과 일치, 오설정을 조용히 삼키지 않음).

---

## 5. UI 설계

- **UI 레이아웃**: N/A — UI 변경 없음(서버 redirect 게이트).
- **컴포넌트 트리**:

```text
app/write/layout.tsx (신규, 서버 · 인증 게이트)
  ├─ app/write/page.tsx          (새 글 — 불변)
  └─ app/write/[slug]/page.tsx   (수정 — 불변)
```

- **접근성**: N/A — interactive UI 없음. layout은 인증 통과 시 `children`을 그대로 렌더할 뿐이라 기존 페이지 마크업/포커스 동작에 영향 없음.

---

## 6. 기술 설계

### 신규/변경 파일

| 파일 | 종류 | 역할 |
|---|---|---|
| `src/app/write/layout.tsx` | 신규 | 서버 컴포넌트 게이트. `isAuthenticated()` 미인증 시 `redirect("/login")`, 통과 시 `children` 렌더 |

> 변경 파일 없음 — `page.tsx` 2개, `auth.ts`, `LoginForm` 전부 불변.

### 테스트

- `layout.tsx`는 **서버 컴포넌트 + 초기 API 통합**이라 단위 테스트 면제(impl-review #15 예외). 검증은 (a) 로그아웃 상태로 `/write` 진입 시 `/login` 이동, (b) 로그인 상태로 정상 진입을 **런타임 수동 확인**으로 갈음.
- `isAuthenticated()`는 기존 함수라 본 작업에서 신규 테스트 대상 아님.

### 상태 관리 · 인터페이스

- 상태 없음(서버 렌더 시점 판정).
- `WriteLayout({ children }: { children: React.ReactNode })` — `Promise` 반환(async 서버 컴포넌트).
- import: `isAuthenticated`(`@/shared/lib/auth`), `redirect`(`next/navigation`).

### API 연동

- 기존 `isAuthenticated(): Promise<boolean>` 호출만. 신규 엔드포인트 없음.

---

## 7. 에러 & 피드백 처리

- **미인증**: 조용히 `/login`으로 `redirect()`(Next redirect, 별도 메시지·토스트 없음).
- **인증 판정 예외**(`MissingEnvError` 등): catch하지 않고 전파 → Next 500. 오설정을 가시화(API 라우트와 동일 정책).
- **성공 피드백**: 없음 — 인증 통과 시 페이지가 그대로 렌더될 뿐.
- **로딩**: 없음 — 서버 렌더 시점 동기 판정.

---

## 8. 결정 사항 (Decisions)

- **접근안**: A(`app/write/layout.tsx` 게이트) 확정. 한 파일로 두 라우트 커버, 가장 응집적.
- **redirect 대상**: 고정 `/login` 확정. layout은 현재 경로를 깔끔히 알 수 없고(`headers()` fragile), 로그인 후 `LoginForm` 기본값이 `/write`라 실사용상 충분. 정확 복귀는 비용 대비 이득 낮아 제외.
- **`getPostBySlug` published 필터**: 범위 밖. 공개 `/posts/[slug]` 초안 노출은 fetch 분리가 필요한 **독립 버그**로 별도 기록.
- **`middleware.ts`**: 미사용(Edge 런타임 + Buffer 기반 auth 재작성 비용 → YAGNI).
- **인증 예외 처리**: `isAuthenticated()` throw는 별도 catch 없이 전파(500). 오설정 가시화.
