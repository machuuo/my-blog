# GitHub Blog 설계서 — Next.js 14 + Vercel + Supabase CMS

## 1. 프로젝트 개요

| 항목         | AS-IS (현재)                        | TO-BE (전환 후)                              |
| ------------ | ----------------------------------- | -------------------------------------------- |
| **스택**     | Next.js 14 + TypeScript + Tailwind  | + Supabase (PostgreSQL + Storage)            |
| **아키텍처** | FSD (Feature-Sliced Design)         | FSD 유지                                     |
| **배포**     | GitHub Actions → GitHub Pages       | Vercel (SSR/ISR)                             |
| **콘텐츠**   | MDX 파일 기반 (파일시스템 = CMS)    | Supabase DB 기반 (웹 에디터 = CMS)          |
| **이미지**   | public/ 디렉토리                    | Supabase Storage (영구 퍼블릭 URL)          |
| **인증**     | 없음                                | 환경변수 비밀번호 + 세션 쿠키               |

### 전환 목적

MDX 파일 생성 → git push → 빌드 대기의 반복을 제거하고, 웹 브라우저에서 바로 글을 작성/수정/삭제할 수 있는 CMS 구조로 전환한다.

---

## 2. 전체 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│                        Vercel                            │
│                                                          │
│  ┌────────────┐   ┌─────────────┐   ┌─────────────────┐ │
│  │ 블로그 읽기 │   │ /write      │   │ API Routes      │ │
│  │ (ISR)      │   │ (보호됨)    │   │                 │ │
│  │            │   │             │   │ POST /api/posts  │ │
│  │ /          │   │ MDX 에디터   │   │ POST /api/upload│ │
│  │ /posts/*   │   │ 이미지 붙여  │   │ POST /api/auth  │ │
│  │            │   │ 넣기        │   │                 │ │
│  └─────┬──────┘   └──────┬──────┘   └───────┬─────────┘ │
│        │                 │                   │           │
│        │     서버 사이드 (service_role key)   │           │
└────────┼─────────────────┼───────────────────┼───────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                       Supabase                           │
│                                                          │
│  ┌────────────────────┐   ┌────────────────────────────┐ │
│  │ PostgreSQL          │   │ Storage                    │ │
│  │                    │   │                            │ │
│  │ posts 테이블        │   │ images 버킷                │ │
│  │ - id               │   │ - /2026/04/image.png       │ │
│  │ - slug             │   │ - /2026/04/photo.jpg       │ │
│  │ - title            │   │                            │ │
│  │ - content (MDX)    │   │ 영구 퍼블릭 URL             │ │
│  │ - tags[]           │   │                            │ │
│  │ - published        │   │                            │ │
│  └────────────────────┘   └────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 3. FSD 아키텍처

### 레이어 구조 (상위 → 하위, 상위는 하위만 import 가능)

```
app → views → widgets → features → entities → shared
```

| 레이어     | 역할                            | 블로그에서의 용도                         |
| ---------- | ------------------------------- | ----------------------------------------- |
| `app`      | Next.js App Router, 글로벌 설정 | 라우팅, 레이아웃, API Routes              |
| `views`    | 페이지 단위 컴포지션            | HomePage, PostDetailPage, WritePage        |
| `widgets`  | 독립적 UI 블록                  | Header, Footer, PostList                  |
| `features` | 사용자 인터랙션 단위            | write-post (MDX 에디터), auth (로그인)    |
| `entities` | 비즈니스 엔티티                 | Post (모델, UI, Supabase 쿼리)            |
| `shared`   | 재사용 기반 코드                | UI(shadcn), lib, Supabase 클라이언트      |

### Import 규칙

```
app       → views, widgets, shared
views     → widgets, features, entities, shared
widgets   → features, entities, shared
features  → entities, shared
entities  → shared
shared    → (외부 패키지만)
```

**절대 금지:**

- 같은 레이어 내 cross-slice import
- 하위 → 상위 import
- barrel export(`index.ts`)를 우회한 내부 직접 import

---

## 4. 디렉토리 구조

```
git-blog/
├── docs/
│   └── DESIGN.md                     # 이 문서
├── src/
│   ├── app/                          # [Layer] App — 라우팅 + API
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # 홈
│   │   ├── globals.css
│   │   ├── posts/
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # 포스트 상세 (ISR)
│   │   ├── write/                    # 🆕 글 작성 (보호됨)
│   │   │   ├── page.tsx              # 새 글
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # 기존 글 수정
│   │   └── api/                      # 🆕 Route Handlers
│   │       ├── posts/
│   │       │   └── route.ts          # POST(생성), PUT(수정), DELETE(삭제)
│   │       ├── upload/
│   │       │   └── route.ts          # POST(이미지 업로드)
│   │       └── auth/
│   │           └── route.ts          # POST(로그인)
│   │
│   ├── views/                        # [Layer] Views — 페이지 컴포지션
│   │   ├── home/
│   │   │   ├── ui/
│   │   │   │   └── HomePage.tsx
│   │   │   └── index.ts
│   │   ├── post-detail/
│   │   │   ├── ui/
│   │   │   │   └── PostDetailPage.tsx
│   │   │   └── index.ts
│   │   └── write/                    # 🆕
│   │       ├── ui/
│   │       │   └── WritePage.tsx     # PostForm + MdxEditor 조합
│   │       └── index.ts
│   │
│   ├── widgets/                      # [Layer] Widgets (기존 유지)
│   │   ├── header/
│   │   ├── footer/
│   │   └── post-list/
│   │
│   ├── features/                     # [Layer] Features — 🆕
│   │   ├── write-post/
│   │   │   ├── ui/
│   │   │   │   ├── MdxEditor.tsx     # MDX 텍스트 에디터 + 이미지 붙여넣기
│   │   │   │   ├── PostForm.tsx      # 메타데이터 폼 (title, slug, tags 등)
│   │   │   │   └── ImageUploader.tsx # Ctrl+V 이미지 업로드 + URL 삽입
│   │   │   ├── model/
│   │   │   │   └── use-post-form.ts  # 폼 상태 관리 훅
│   │   │   └── index.ts
│   │   └── auth/
│   │       ├── ui/
│   │       │   └── LoginForm.tsx     # 비밀번호 입력 폼
│   │       ├── model/
│   │       │   └── use-auth.ts       # 인증 상태 훅
│   │       └── index.ts
│   │
│   ├── entities/                     # [Layer] Entities
│   │   └── post/
│   │       ├── model/
│   │       │   ├── types.ts          # Post 타입 (id, updated_at 추가)
│   │       │   └── posts.ts          # 🔄 fs → Supabase 쿼리로 교체
│   │       ├── ui/
│   │       │   ├── PostCard.tsx      # (기존 유지)
│   │       │   └── PostMeta.tsx      # (기존 유지)
│   │       ├── server.ts
│   │       └── index.ts
│   │
│   └── shared/                       # [Layer] Shared
│       ├── ui/                       # shadcn/ui 컴포넌트
│       │   ├── badge.tsx
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── separator.tsx
│       ├── lib/
│       │   ├── utils.ts
│       │   ├── constants.ts
│       │   └── supabase/             # 🆕
│       │       ├── server.ts         # 서버용 클라이언트 (service_role)
│       │       └── client.ts         # 브라우저용 클라이언트 (anon key)
│       └── types/
│           └── index.ts
│
├── content/posts/                    # 마이그레이션 후 제거 가능
├── next.config.mjs                   # output: "export" 제거
├── middleware.ts                      # 🆕 /write 경로 보호
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. 데이터베이스 스키마

### posts 테이블

```sql
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  content     TEXT DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published, created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### RLS 정책

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 공개된 글만 읽기 허용 (anon key 사용 시)
CREATE POLICY "Public read published posts" ON posts
  FOR SELECT USING (published = true);
```

쓰기(INSERT/UPDATE/DELETE)는 API Route에서 `service_role` 키로 접근하므로 RLS를 우회한다.

### Supabase Storage

```
images 버킷 (public)
├── 2026/
│   ├── 04/
│   │   ├── screenshot-abc123.png
│   │   └── photo-def456.jpg
│   └── 05/
│       └── diagram-ghi789.png
```

- 버킷 정책: **퍼블릭 읽기**, 쓰기는 서버 사이드만
- 파일명: `{원본명}-{랜덤6자}.{확장자}` (충돌 방지)
- URL 형식: `https://<project>.supabase.co/storage/v1/object/public/images/2026/04/screenshot-abc123.png`

---

## 6. API 설계

### 인증

#### `POST /api/auth`

로그인 (세션 쿠키 발급)

```ts
// 요청
{ password: string }

// 성공 응답 (200)
// Set-Cookie: session=<signed-token>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
{ success: true }

// 실패 응답 (401)
{ error: "Invalid password" }
```

### 포스트 CRUD

모든 쓰기 API는 세션 쿠키 검증 필수.

#### `POST /api/posts` — 생성

```ts
// 요청
{
  slug: string,
  title: string,
  description: string,
  content: string,        // MDX 원본
  tags: string[],
  published: boolean
}

// 응답 (201)
{ post: Post }

// 사이드 이펙트
// revalidatePath('/') + revalidatePath(`/posts/${slug}`)
```

#### `PUT /api/posts` — 수정

```ts
// 요청
{
  id: string,             // UUID
  slug: string,
  title: string,
  description: string,
  content: string,
  tags: string[],
  published: boolean
}

// 응답 (200)
{ post: Post }

// 사이드 이펙트: revalidatePath
```

#### `DELETE /api/posts` — 삭제

```ts
// 요청
{ id: string }

// 응답 (200)
{ success: true }

// 사이드 이펙트: revalidatePath
```

### 이미지 업로드

#### `POST /api/upload` — 이미지 업로드

```ts
// 요청 (multipart/form-data)
FormData { file: File }

// 응답 (200)
{ url: "https://<project>.supabase.co/storage/v1/object/public/images/..." }
```

---

## 7. 인증 플로우

```
/write 접근
  → middleware.ts에서 세션 쿠키 확인
    → 쿠키 없음 또는 무효 → /write로 접근 시 LoginForm 표시
    → 쿠키 유효 → WritePage 렌더

LoginForm에서 비밀번호 입력
  → POST /api/auth
    → process.env.ADMIN_PASSWORD와 비교
      → 일치 → HttpOnly 쿠키 발급 (24시간 유효)
      → 불일치 → 에러 메시지
```

### 환경변수

```
# Vercel 환경변수 설정
ADMIN_PASSWORD=<관리자 비밀번호>
SESSION_SECRET=<쿠키 서명 키 (랜덤 문자열)>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

| 변수 | 노출 범위 | 용도 |
|------|----------|------|
| `ADMIN_PASSWORD` | 서버만 | 로그인 비교 |
| `SESSION_SECRET` | 서버만 | 쿠키 서명/검증 |
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 + 서버 | Supabase 연결 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 + 서버 | 공개 읽기용 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버만 | DB 쓰기, Storage 업로드 |

---

## 8. 데이터 흐름

### 블로그 읽기 (공개)

```
사용자 → GET /posts/[slug]
  → Server Component (ISR, revalidate: 60)
    → Supabase SELECT (service_role, 서버 사이드)
      → Post 데이터 반환
        → MDXRemote로 렌더링
          → 캐싱된 HTML 응답
```

### 글 작성 (보호됨)

```
작성자 → /write (세션 쿠키 인증 통과)
  → WritePage 렌더
    → 메타데이터 폼 입력 (title, slug, description, tags)
    → MDX 에디터에서 본문 작성
    → 이미지 Ctrl+V
      → POST /api/upload → Supabase Storage → 영구 URL 반환
        → 에디터에 ![image](URL) 자동 삽입
    → "저장" 클릭
      → POST /api/posts → Supabase INSERT
        → revalidatePath → ISR 캐시 무효화
          → 블로그에 즉시 반영
```

### 글 수정

```
작성자 → /write/[slug] (세션 쿠키 인증 통과)
  → Supabase에서 기존 글 fetch → 폼에 채움
    → 수정 후 "저장"
      → PUT /api/posts → Supabase UPDATE
        → revalidatePath → 즉시 반영
```

---

## 9. 핵심 컴포넌트 설계

### shared/lib/supabase

| 파일 | 용도 | 키 |
|------|------|-----|
| `server.ts` | Server Component, API Route에서 사용 | `SUPABASE_SERVICE_ROLE_KEY` |
| `client.ts` | Client Component에서 사용 (읽기 전용) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### features/write-post

| 컴포넌트 | 타입 | 역할 |
|----------|------|------|
| `PostForm` | Client | title, slug, description, tags, published 입력 |
| `MdxEditor` | Client | MDX 본문 textarea + paste 이벤트 핸들러 |
| `ImageUploader` | Client | Ctrl+V 감지 → /api/upload 호출 → URL 삽입 |
| `use-post-form` | Hook | 폼 상태 관리 + API 호출 |

### features/auth

| 컴포넌트 | 타입 | 역할 |
|----------|------|------|
| `LoginForm` | Client | 비밀번호 입력 + /api/auth 호출 |
| `use-auth` | Hook | 인증 상태 관리 |

### views/write

| 컴포넌트 | 타입 | 역할 |
|----------|------|------|
| `WritePage` | Client | PostForm + MdxEditor 조합, 저장/삭제 액션 |

### 기존 컴포넌트 (변경 없음)

| 컴포넌트 | 레이어 | 비고 |
|----------|--------|------|
| `PostCard` | entities | UI 변경 없음 |
| `PostMeta` | entities | UI 변경 없음 |
| `PostDetailPage` | views | UI 변경 없음 |
| `Header` | widgets | UI 변경 없음 |
| `Footer` | widgets | UI 변경 없음 |
| `PostList` | widgets | UI 변경 없음 |

---

## 10. 이미지 붙여넣기 상세 동작

```
사용자: Ctrl+V (이미지가 클립보드에 있음)
  ↓
MdxEditor: paste 이벤트 감지
  ↓
clipboardData.files[0] 에서 이미지 File 추출
  ↓
POST /api/upload (FormData로 전송)
  ↓
API Route (서버):
  1. 세션 쿠키 검증
  2. 파일명 생성: {원본명}-{랜덤6자}.{확장자}
  3. 경로 생성: {연}/{월}/{파일명}
  4. supabase.storage.from('images').upload(경로, 파일)
  5. 퍼블릭 URL 생성 후 반환
  ↓
MdxEditor: 커서 위치에 ![image](URL) 삽입
```

---

## 11. 변경 영향도

### 변경되는 파일

| 파일 | 변경 내용 |
|------|----------|
| `next.config.mjs` | `output: "export"` 제거, `images.unoptimized` 제거 |
| `entities/post/model/types.ts` | `id: string`, `updated_at: string` 필드 추가 |
| `entities/post/model/posts.ts` | `fs.readFileSync` → `supabase.from('posts').select()` |
| `entities/post/server.ts` | async 함수로 변경 |
| `app/posts/[slug]/page.tsx` | `generateStaticParams` → ISR dynamic fetch |
| `app/page.tsx` | async 데이터 fetch |

### 삭제되는 파일

| 파일 | 사유 |
|------|------|
| `.github/workflows/deploy.yml` | Vercel이 CI/CD 대체 |
| `content/posts/*.mdx` | DB 마이그레이션 완료 후 |

### 신규 파일

| 파일 | 용도 |
|------|------|
| `src/shared/lib/supabase/server.ts` | 서버용 Supabase 클라이언트 |
| `src/shared/lib/supabase/client.ts` | 클라이언트용 Supabase 클라이언트 |
| `src/features/write-post/**` | 글 작성 기능 전체 |
| `src/features/auth/**` | 인증 기능 |
| `src/views/write/**` | 글 작성 페이지 뷰 |
| `src/app/write/**` | 글 작성 라우트 |
| `src/app/api/**` | API Route Handlers |
| `middleware.ts` | /write 경로 보호 |

---

## 12. 패키지 의존성

### 기존 유지

```json
{
  "next": "^14.2",
  "react": "^18",
  "react-dom": "^18",
  "next-mdx-remote": "^6",
  "reading-time": "^1",
  "class-variance-authority": "^0.7",
  "clsx": "^2",
  "tailwind-merge": "^3",
  "lucide-react": "^1",
  "@radix-ui/react-separator": "^1",
  "tailwindcss": "^3",
  "@tailwindcss/typography": "^0.5"
}
```

### 추가

```json
{
  "@supabase/supabase-js": "^2",
  "@supabase/ssr": "^0"
}
```

### 제거 가능

```json
{
  "gray-matter": "^4"   // DB에서 frontmatter를 별도 컬럼으로 관리하므로 불필요
}
```

---

## 13. 마이그레이션 계획

기존 MDX 파일을 Supabase DB로 이관하는 일회성 스크립트.

```ts
// scripts/migrate-posts.ts (일회성 실행)
// 1. content/posts/*.mdx 파일 읽기
// 2. gray-matter로 frontmatter 파싱
// 3. Supabase posts 테이블에 INSERT
// 4. 검증 후 content/posts/ 디렉토리 제거
```

---

## 14. 구현 순서

### Phase 1: 인프라 전환

1. Supabase 프로젝트 생성 + posts 테이블 + Storage 버킷 설정
2. `@supabase/supabase-js`, `@supabase/ssr` 설치
3. `shared/lib/supabase/` 클라이언트 생성
4. `next.config.mjs` 수정 (`output: "export"` 제거)
5. `entities/post/model/posts.ts`를 Supabase 쿼리로 교체
6. 기존 MDX 파일 → Supabase DB 마이그레이션
7. 블로그 읽기 기능 검증 (홈, 포스트 상세)

### Phase 2: 글 작성 기능

8. `features/auth/` — LoginForm, use-auth
9. `middleware.ts` — /write 경로 보호
10. `app/api/auth/route.ts` — 로그인 API
11. `features/write-post/` — PostForm, MdxEditor, ImageUploader
12. `views/write/` — WritePage
13. `app/api/posts/route.ts` — CRUD API
14. `app/api/upload/route.ts` — 이미지 업로드 API
15. `app/write/page.tsx`, `app/write/[slug]/page.tsx`

### Phase 3: 배포

16. Vercel 프로젝트 연결 + 환경변수 설정
17. GitHub Pages 배포 제거 (`.github/workflows/deploy.yml` 삭제)
18. 최종 검증 (글 작성 → 블로그 반영 → 수정 → 삭제)

---

## 15. 무료 티어 제한

### Vercel Hobby

| 항목 | 한도 |
|------|------|
| 대역폭 | 100GB/월 |
| Function 호출 | 1M/월 |
| 이미지 최적화 | 5,000회/월 |

### Supabase Free

| 항목 | 한도 |
|------|------|
| DB 저장소 | 500MB |
| Storage | 1GB |
| 대역폭 | DB 5GB + Storage 5GB/월 |
| 프로젝트 | 2개 |
| 비활성 정지 | 7일 미사용 시 (ISR 호출로 방지) |

개인 블로그 규모에서 두 서비스 모두 무료 티어 범위 내에서 충분히 운영 가능하다.
