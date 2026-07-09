# guard-1: 공개 포스트 페이지 미발행 초안 노출 차단

> 상태: 설계 완료 · 브랜치(예정): `fix/published-only-public`
> 접근안: **A (공개용 `getPublishedPostBySlug` 신규)** · 테스트: **면제(API 통합)**

---

## 1. 배경 & 목표 (WHY)

공개 페이지 `/posts/[slug]`가 `getPostBySlug`(published 필터 없음)로 조회한 뒤 **존재 여부만** 확인(`if (!post) notFound()`)하고 발행 여부는 보지 않는다. 그 결과 **미발행 초안(`published=false`)도 slug만 알면 공개 URL에서 본문·메타데이터가 전체 렌더된다.**

`gate-1`이 "쓰기 진입"을 막았다면, 본 작업은 짝을 이루는 **"읽기 노출"**을 막는다. `getAllSlugs`는 이미 published 필터가 있어 사이트맵·목록엔 초안이 안 뜨므로, 남은 노출 경로는 **직접 URL 접근**뿐이다.

**목표**: 공개 `/posts/[slug]`가 **발행 글만** 렌더하고 미발행 초안은 404(`notFound`)로 처리한다. **편집 페이지 `/write/[slug]`의 초안 로드는 깨지 않는다.**

---

## 2. 기능 요구사항 (WHAT)

**In scope:**

- `getPublishedPostBySlug(slug)` 신규 — `getPostBySlug`와 동일하되 `.eq("published", true)` 필터 추가. 미발행/없음/에러 시 `null`.
- 공개 페이지 [posts/[slug]/page.tsx](src/app/posts/[slug]/page.tsx)의 **2개 호출부**(`generateMetadata:19`, `PostPage:33`)를 `getPublishedPostBySlug`로 교체.
- `server.ts` 배럴에 신규 함수 export 추가.

**Out of scope:**

- `getPostBySlug` 시그니처/동작 변경 — **불변**(편집 `/write/[slug]:15`가 초안 로드에 계속 사용).
- 편집 페이지 인증(이미 `gate-1`에서 처리).
- 사이트맵/`getAllSlugs`(이미 published 필터 有).

---

## 3. 완료 조건 (Acceptance Criteria)

- [ ] 미발행 초안 slug로 `/posts/[slug]` 접근 시 `notFound()`(404)로 처리된다.
- [ ] 발행 글 slug로 접근 시 정상 렌더된다.
- [ ] `generateMetadata`도 미발행 slug에 대해 "Not Found" 메타를 반환한다(본문과 동일 판정, 제목/설명 미노출).
- [ ] 편집 `/write/[slug]`는 여전히 초안을 불러온다(`getPostBySlug` 불변).
- [ ] `getPublishedPostBySlug`는 `published=true` 필터로 조회하고, 미발행/없음/에러 시 `null`을 반환한다.
- [ ] 접근성: 해당 없음 — 데이터 계층 변경, 렌더 UI 불변.

---

## 4. 기능 흐름 (HOW)

```text
[공개 /posts/[slug] 요청]
  generateMetadata → getPublishedPostBySlug(slug)
      ├─ 발행 글 → title/description 메타
      └─ null(미발행/없음/에러) → { title: "Not Found" }
  PostPage → getPublishedPostBySlug(slug)
      ├─ 발행 글 → <PostDetailPage post={post} />
      └─ null → notFound()   (404)

[편집 /write/[slug] 요청]  ← 불변
  getPostBySlug(slug)  → 초안 포함 로드 (편집 대상)
```

- **에러 시나리오**: Supabase 조회 에러도 `null`로 귀결 → `notFound()`. 기존 `getPostBySlug`의 `if (error || !data) return null` 패턴을 그대로 따라 별도 에러 UI 없음(발행글이 아니면 일괄 404).

---

## 5. UI 설계

- **UI 레이아웃**: N/A — UI 변경 없음. 발행 글은 기존과 동일 렌더, 미발행/없음은 기존 `notFound()` 화면(404) 재사용.
- **컴포넌트 트리** (불변):

```text
app/posts/[slug]/page.tsx
  └─ PostDetailPage (views/post-detail)   ← 발행 글일 때만
  └─ notFound()                            ← 미발행/없음
```

- **접근성**: N/A — interactive UI 없음, 데이터 판정만 변경.

---

## 6. 기술 설계

### 신규/변경 파일

| 파일 | 종류 | 역할 |
|---|---|---|
| `src/entities/post/api/posts.ts` | 수정 | `getPublishedPostBySlug(slug)` 신규 — `getPostBySlug`와 동일 쿼리 + `.eq("published", true)` |
| `src/entities/post/server.ts` | 수정 | 배럴 export에 `getPublishedPostBySlug` 추가 |
| `src/app/posts/[slug]/page.tsx` | 수정 | `generateMetadata:19`, `PostPage:33`의 `getPostBySlug` → `getPublishedPostBySlug` |

### 테스트

- **면제** — `getPublishedPostBySlug`는 Supabase fetch(API 통합) 계층으로 순수 로직이 없고, 레포의 기존 `posts.ts` fetcher들도 전부 무테스트(Supabase 목 인프라 부재). 목킹 테스트는 동작이 아닌 쿼리 체인을 단언하는 brittle 방식이라 가치 낮음(impl-review #15 "initial API integration" 예외).
- **검증**: 런타임 수동 — (a) 미발행 초안 slug URL → 404, (b) 발행 글 slug URL → 정상 렌더, (c) 편집 `/write/[slug]`에서 초안 여전히 로드.

### 인터페이스

- `getPublishedPostBySlug(slug: string): Promise<PostWithSeries | null>` — 반환 타입은 `getPostBySlug`와 동일(`toPostWithSeries` 매핑 재사용).

### 구현 방향

- `getPostBySlug` 본문을 병렬로 두되 `.eq("slug", slug)` 다음에 `.eq("published", true)` 추가. select(series/categories join)·`.single()`·`toPostWithSeries` 매핑은 동일. **소폭 쿼리 중복은 수용**(옵션 파라미터보다 명시적 2함수가 안전 — 누락 시 노출 방지).
- 코드 스니펫은 구현 단계(`/wf:implement-inline`)에서.

### API 연동

- 신규 엔드포인트 없음. Supabase `posts` 테이블 조회에 `published` 필터만 추가.

---

## 7. 에러 & 피드백 처리

- **미발행/없음/조회 에러**: 일괄 `null` → `notFound()`(404). 발행 글이 아니면 "없는 것"으로 취급(존재 여부 자체를 숨겨 초안 유무 노출 방지).
- **성공 피드백**: 없음 — 발행 글은 기존과 동일하게 렌더.
- **로딩**: 없음 — 서버 렌더 시점 조회(ISR `revalidate = 60` 유지).

---

## 8. 결정 사항 (Decisions)

- **접근안**: A(공개용 `getPublishedPostBySlug` 신규) 확정. 함수명이 곧 "published-only" 계약이라 옵션 플래그보다 누락·오설정 위험이 낮음.
- **테스트**: 면제 확정(API 통합 계층, 런타임 검증). §6 근거.
- **`getPostBySlug` 불변**: 편집 페이지가 초안 로드에 계속 사용. 공유 함수에 필터 붙이면 편집이 깨지므로 fetch 분리.
- **함수 성격**: data-access(fetcher)이지 순수 유틸 아님 — 테스트 seam 없음.
- **에러 = 404 통일**: 미발행/없음/에러를 구분 없이 404로 처리해 초안 존재 여부를 감춤.
