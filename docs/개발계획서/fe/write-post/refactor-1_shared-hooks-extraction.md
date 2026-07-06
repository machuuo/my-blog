# refactor-1: write-post 공용 훅/유틸 추출

> 상태: 설계 완료 · 브랜치(예정): `refactor/write-post-shared-extraction`
> 범위 확정: **A (Tier 1+2 전체)** · 에러 계약: **HttpError 타입 throw**

---

## 1. 배경 & 목표 (WHY)

write-post·auth 피처에 두 종류의 부채가 있다.

1. **fetch 보일러플레이트 실제 중복 3곳** — JSON mutation fetch(`method`/`Content-Type`/`JSON.stringify`/`!res.ok`)가 `LoginForm`(1)·`PostForm`(2)에 동일하게 반복된다.
2. **컴포넌트 비대 (orchestrator 원칙 위반)** — `PostForm.tsx`가 292줄로, useState 11개 + 자동 slug 생성 + 카테고리 필터 + submit/delete가 전부 컴포넌트 body에 있다. `MdxEditor.tsx`도 이미지 붙여넣기 업로드 로직 ~70줄이 body에 있다. 프로젝트 CLAUDE.md는 "컴포넌트는 orchestrator, 로직은 단일 사용이어도 커스텀 훅으로 분리"를 요구한다.

**목표**: (a) JSON mutation을 `shared/api/postJson`으로 단일화하고 에러 처리를 표준화한다. (b) `PostForm`·`MdxEditor`의 로직을 co-located 훅으로 분리해 컴포넌트를 JSX orchestrator로 축소한다. (c) 추출 과정에서 **기존 동작을 100% 보존한다**(리팩터, 기능 변경 없음).

---

## 2. 기능 요구사항 (WHAT)

**In scope (범위 A):**

- `shared/api/postJson<T>(url, body, method?)` — JSON mutation fetch 래퍼. `res.ok` 실패 시 `HttpError` throw, 성공 시 파싱된 `T` 반환.
- `shared/api/HttpError` — `status`를 보유한 에러 클래스. 호출부가 `instanceof`로 HTTP 실패 vs 네트워크 실패를 구분한다.
- `shared/lib/slugify(input)` — 제목 → URL slug 순수 변환 함수.
- `features/write-post/lib/usePostForm` — PostForm의 폼 상태·파생·핸들러 전체를 담는 훅.
- `features/write-post/lib/useImagePasteUpload` — MdxEditor의 커서 삽입 + 이미지 붙여넣기 업로드 훅.
- 소비 컴포넌트 3곳(`PostForm`·`MdxEditor`·`LoginForm`)을 위 유틸/훅 사용으로 교체.

**Out of scope:**

- `useAsyncAction` 등 범용 async 래퍼 (에러 처리 형태가 호출부마다 달라 공통화 부적합 — YAGNI).
- view 계층 필터 훅(useState 1개짜리).
- `MdxEditor`의 업로드 fetch를 `postJson`으로 통합 — **FormData 요청**이라 JSON 래퍼 대상 아님. `useImagePasteUpload` 내부에 자체 fetch 유지.
- 서버 supabase 계층, `/write` 인증 게이트(별도 사이클).
- axios/ky 등 HTTP 라이브러리 도입.

---

## 3. 완료 조건 (Acceptance Criteria)

- [ ] `postJson<T>`가 성공 시 파싱된 JSON을 반환하고, `!res.ok` 시 `HttpError(status, message)`를 throw한다.
- [ ] `HttpError`는 `Error`를 상속하고 `status: number`를 보유한다.
- [ ] `slugify`가 소문자화 + 한글/영숫자 외 제거 + 공백→하이픈 + 연속 하이픈 병합 + trim을 수행한다.
- [ ] **LoginForm 동작 보존**: 잘못된 비밀번호(HTTP 401) → "비밀번호가 올바르지 않습니다", 네트워크 실패 → "로그인 중 오류가 발생했습니다" — 2메시지 구분 유지. 성공 시 `redirectTo`로 push+refresh.
- [ ] **PostForm submit 동작 보존**: 실패 시 서버 `error` 메시지 표시, 성공 시 `/posts/{slug}` push+refresh. 신규일 때만 제목 입력 시 slug 자동 생성.
- [ ] **PostForm delete 동작 보존**: confirm 후 삭제, 성공 시 `/` push+refresh, 실패 시 에러 표시 + `saving` 해제.
- [ ] **PostForm 파생 로직 보존**: 카테고리 선택 시 series 목록 필터 + `seriesId` 초기화, `initialData.series_id`로 초기 카테고리 역추적.
- [ ] **MdxEditor 동작 보존**: 이미지 붙여넣기 시 `![업로드 중...]()` placeholder 삽입 → 업로드 성공 시 실제 URL로 치환 / 실패 시 placeholder 제거. 커서 위치 복원.
- [ ] `PostForm`·`MdxEditor`가 JSX orchestrator로 축소된다(로직은 훅에만 존재).
- [ ] `pnpm lint` 통과(기존 error 룰 전부 — 특히 no-floating-promises: 이벤트 핸들러 `void` 래핑 유지), `tsc --noEmit` 통과.
- [ ] `slugify.test.ts`·`postJson.test.ts` 통과.
- [ ] 접근성: 해당 없음 — UI 변경 0, 기존 마크업/포커스 동작 그대로.

---

## 4. 기능 흐름 (HOW)

**상태 전이는 기존과 동일하며 코드 위치만 이동한다.**

```text
[postJson 요청 흐름]
호출 → fetch(JSON) → res.ok?
  ├─ true  → res.json() 반환 (T)
  └─ false → body의 {error} 파싱 → HttpError(status, error||기본) throw
fetch 자체 실패(네트워크) → 네이티브 TypeError 전파 (HttpError 아님)

[호출부 에러 분기]
try { await postJson(...) ; 성공 네비게이션 }
catch (e) {
  e instanceof HttpError → HTTP 실패 처리
  else                   → 네트워크 실패 처리
}
```

- **LoginForm**: submit → `postJson("/api/auth",{password})` → 성공 push. catch에서 `instanceof HttpError`로 "비밀번호 오류" vs "네트워크 오류" 분기.
- **PostForm submit**: 태그 파싱 → body 구성 → `postJson("/api/posts", body, isEditing?"PUT":"POST")` → 성공 push. catch에서 `e.message`(서버 메시지) 표시.
- **PostForm delete**: confirm → `postJson("/api/posts",{post_id},"DELETE")` → 성공 push. catch에서 에러 표시 + saving 해제.
- **MdxEditor paste**: 이미지 감지 → placeholder 삽입 → FormData fetch(`/api/upload`) → 성공 URL 치환 / 실패 placeholder 제거.

---

## 5. UI 설계

- **UI 레이아웃**: N/A — UI 변경 없음(순수 로직 추출 리팩터).
- **컴포넌트 트리** (구조 변화는 파일 배치이며 렌더 트리는 불변):

```text
PostForm (ui, orchestrator)
  └─ usePostForm(lib)  ← 폼 상태/파생/핸들러
  └─ MdxEditor (ui, orchestrator)
       └─ useImagePasteUpload(lib)  ← ref/붙여넣기 업로드
LoginForm (ui)
  └─ postJson + HttpError (shared/api)

usePostForm → postJson(shared/api) + slugify(shared/lib) 의존
```

- **접근성**: N/A — interactive UI 신규 없음. 기존 form/label/autoFocus/checkbox 마크업 그대로 이동.

---

## 6. 기술 설계

### 신규/변경 파일

| 파일 | 종류 | 역할 |
|---|---|---|
| `src/shared/api/HttpError.ts` | 신규 | `status` 보유 에러 클래스 |
| `src/shared/api/postJson.ts` | 신규 | JSON mutation fetch 래퍼 (`postJson<T>`) |
| `src/shared/api/index.ts` | 신규 | 배럴 — `postJson`, `HttpError` export |
| `src/shared/api/postJson.test.ts` | 신규 | **필수** 테스트 (아래 케이스) |
| `src/shared/lib/slugify.ts` | 신규 | 순수 slug 변환 |
| `src/shared/lib/slugify.test.ts` | 신규 | **필수** 테스트 (아래 케이스) |
| `src/shared/lib/index.ts` | 변경 | `export * from "./slugify"` 추가 |
| `src/features/write-post/lib/usePostForm.ts` | 신규 | PostForm 폼 로직 훅 |
| `src/features/write-post/lib/useImagePasteUpload.ts` | 신규 | MdxEditor 붙여넣기 업로드 훅 |
| `src/features/write-post/ui/PostForm.tsx` | 변경 | orchestrator 축소 |
| `src/features/write-post/ui/MdxEditor.tsx` | 변경 | orchestrator 축소 |
| `src/features/auth/ui/LoginForm.tsx` | 변경 | postJson + HttpError 사용 |

> 피처 배럴(`features/write-post/index.ts`)은 **불변** — 훅은 슬라이스 내부 구현이라 공개 API 미노출(`../lib/`로 상대 import).

### 필수 테스트 케이스

- **`slugify.test.ts`**: (1) 영문 소문자화+공백 하이픈화, (2) 한글 보존, (3) 특수문자 제거, (4) 연속 하이픈 병합, (5) 앞뒤 trim.
- **`postJson.test.ts`**: (1) 성공(200) → 파싱 JSON 반환, (2) `!res.ok`(400/401) → `HttpError` throw + `status` 정확, (3) 에러 body `{error}` → message 전달, (4) 에러 body 없음/빈 error → 기본 메시지 폴백, (5) method 인자 전달 확인(PUT/DELETE).

### 훅 테스트 (선택 · P2 — 근거 명시)

- `usePostForm.test.ts` / `useImagePasteUpload.test.ts`는 **이번 범위에서 선택**. 근거: 두 훅은 이미 테스트되는 단위(`slugify`·`postJson`)와 React 기본 훅(useState/router)의 **오케스트레이션**이며, 고유 테스트에는 renderHook + clipboard/DOM/fetch 목이 필요해 ROI가 낮다. 순수 로직은 `slugify`/`postJson` 테스트가 커버한다. (impl-review #15가 지적할 수 있으나 본 근거로 선택 처리.)

### 상태 관리 · 인터페이스

- `usePostForm(props: { initialData?, categories, seriesList })` → 폼 값 11종 + setter + 파생(`filteredSeries`, `isEditing`) + 핸들러(`handleTitleChange`, `handleCategoryChange`, `handleSubmit`, `handleDelete`) + `saving`, `error` 반환. 상태는 훅 내부 useState에 소유, PostForm은 값/핸들러만 소비.
- `useImagePasteUpload(value, onChange)` → `{ textareaRef, handlePaste }` 반환. `insertAtCursor`는 훅 내부 비공개.
- `postJson<T>(url: string, body: unknown, method?: "POST"|"PUT"|"DELETE"): Promise<T>` — 기본 method `"POST"`.
- `class HttpError extends Error { status: number }`.

### API 연동 방향

- 엔드포인트 불변: `/api/auth`(POST), `/api/posts`(POST/PUT/DELETE), `/api/upload`(POST, FormData — postJson 미사용).
- 실패 응답 계약 `{ error: string }`는 기존 라우트가 이미 일관 제공.

---

## 7. 에러 & 피드백 처리

- **에러 계약**: `postJson`은 `!res.ok`에 `HttpError(status, message)` throw. `message`는 응답 body의 `error`, 없으면 기본 문자열(빈 문자열 `""`도 기본으로 폴백해야 하므로 `d.error || "요청 실패"` — 이 `||`는 의도적이라 `postJson` 내부에 `prefer-nullish-coalescing` line-disable + 사유 주석을 둔다. 기존 PostForm의 disable은 제거되어 이 한 곳으로 이동).
- **네트워크 실패**: fetch의 네이티브 throw는 그대로 전파(HttpError 아님) → 호출부 `else` 분기.
- **호출부별 피드백(전부 기존 보존)**:
  - LoginForm: HTTP → "비밀번호가 올바르지 않습니다", 네트워크 → "로그인 중 오류가 발생했습니다".
  - PostForm submit/delete: `e instanceof Error ? e.message : 기본` — 서버 메시지 노출.
- **성공 피드백**: 기존 그대로 — `router.push` + `router.refresh`(별도 토스트 없음).
- **로딩**: 기존 `saving`/`loading` 플래그 그대로(훅 내부로 이동).

---

## 8. 결정 사항 (Decisions)

- **범위**: A(Tier 1+2 전체) 확정. `usePostForm`이 `slugify`·`postJson`을 흡수하므로 세 조각을 함께 가는 것이 응집적.
- **에러 계약**: `HttpError` 타입 throw 확정. LoginForm의 HTTP vs 네트워크 2메시지 구분을 보존하는 유일한 방식.
- **`HttpError` 위치**: `shared/api`(postJson과 co-located). HTTP 계약의 일부.
- **`slugify` 위치**: `shared/lib`(순수 함수, api 아님). React-import 금지 룰 대상이나 순수라 무관.
- **훅 위치**: `features/write-post/lib`(선례 `widgets/nb-frame/lib/useNbTheme`).
- **훅 배럴 비노출**: 훅은 intra-slice 내부 구현 → 피처 `index.ts`에 넣지 않음.
- **FSD 룰 사전 확인**: `boundaries/elements`는 `shared` folder 단위 단일 element라 `shared/api` 추가에 config 변경 불필요. api segment AST 가드는 `entities/*/api`·`features/*/api`에만 적용되어 `shared/api` 무관. features→shared import 허용.
- **`no-floating-promises` 보존**: 이벤트 핸들러의 `onSubmit={(e) => void handleSubmit(e)}` `void` 래핑은 훅에서 핸들러를 반환해도 그대로 유지.
- **훅 테스트**: 선택(P2). §6 근거 참조.
- **미포함(별도 트랙)**: `/write` 인증 게이트, Tier D 종료(backlog 반영은 완료·미커밋).
