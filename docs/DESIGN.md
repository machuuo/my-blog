# GitHub Blog 설계서 — Next.js 14 + GitHub Pages

## 1. 프로젝트 개요

| 항목         | 내용                                                            |
| ------------ | --------------------------------------------------------------- |
| **목적**     | 마크다운 기반 개인 블로그, GitHub Pages로 정적 배포             |
| **스택**     | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **아키텍처** | FSD (Feature-Sliced Design)                                     |
| **배포**     | GitHub Actions → GitHub Pages (static export)                   |
| **콘텐츠**   | MDX 파일 기반 (파일시스템 = CMS)                                |

---

## 2. FSD 아키텍처

### 레이어 구조 (상위 → 하위, 상위는 하위만 import 가능)

```
app → pages → widgets → features → entities → shared
```

| 레이어     | 역할                            | 블로그에서의 용도                       |
| ---------- | ------------------------------- | --------------------------------------- |
| `app`      | Next.js App Router, 글로벌 설정 | `layout.tsx`, 프로바이더, 글로벌 스타일 |
| `pages`    | 페이지 단위 컴포지션            | 홈, 포스트 상세 페이지 구성             |
| `widgets`  | 독립적 UI 블록                  | Header, Footer, PostList                |
| `features` | 사용자 인터랙션 단위            | 태그 필터, 검색 (향후 확장)             |
| `entities` | 비즈니스 엔티티                 | Post (모델, UI, 유틸)                   |
| `shared`   | 재사용 기반 코드                | UI(shadcn), lib, types, constants       |

### Slice 내부 구조 (Segment)

```
entities/post/
├── model/        # 타입, 파싱 로직
├── ui/           # PostCard, PostMeta 등
└── index.ts      # Public API (barrel export)
```

---

## 3. 디렉토리 구조

```
git-blog/
├── content/
│   └── posts/                    # 마크다운 포스트 (.mdx)
│       ├── hello-world.mdx
│       └── second-post.mdx
├── public/
│   └── images/
├── src/
│   ├── app/                      # [Layer] App — Next.js 라우팅
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── page.tsx              # 홈 (위젯 조합만)
│   │   ├── globals.css
│   │   └── posts/
│   │       └── [slug]/
│   │           └── page.tsx      # 포스트 상세
│   │
│   ├── pages/                    # [Layer] Pages — 페이지 컴포지션
│   │   ├── home/
│   │   │   ├── ui/
│   │   │   │   └── HomePage.tsx
│   │   │   └── index.ts
│   │   └── post-detail/
│   │       ├── ui/
│   │       │   └── PostDetailPage.tsx
│   │       └── index.ts
│   │
│   ├── widgets/                  # [Layer] Widgets — 독립 UI 블록
│   │   ├── header/
│   │   │   ├── ui/
│   │   │   │   └── Header.tsx
│   │   │   └── index.ts
│   │   ├── footer/
│   │   │   ├── ui/
│   │   │   │   └── Footer.tsx
│   │   │   └── index.ts
│   │   └── post-list/
│   │       ├── ui/
│   │       │   └── PostList.tsx
│   │       └── index.ts
│   │
│   ├── features/                 # [Layer] Features — 인터랙션 (향후 확장)
│   │   └── .gitkeep
│   │
│   ├── entities/                 # [Layer] Entities — 비즈니스 모델
│   │   └── post/
│   │       ├── model/
│   │       │   ├── types.ts      # Post 타입 정의
│   │       │   └── posts.ts      # MDX 파싱, 조회 유틸
│   │       ├── ui/
│   │       │   ├── PostCard.tsx   # 목록용 카드
│   │       │   └── PostMeta.tsx   # 날짜, 태그, 읽기시간
│   │       └── index.ts
│   │
│   └── shared/                   # [Layer] Shared — 공통 기반
│       ├── ui/                   # shadcn/ui 컴포넌트
│       │   ├── badge.tsx
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── separator.tsx
│       ├── lib/
│       │   ├── utils.ts          # cn() 유틸
│       │   └── constants.ts      # 블로그 메타 정보
│       └── types/
│           └── index.ts          # 공통 타입
│
├── components.json               # shadcn/ui 설정
├── .github/
│   └── workflows/
│       └── deploy.yml
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Import 규칙

```
app       → pages, widgets, shared
pages     → widgets, features, entities, shared
widgets   → features, entities, shared
features  → entities, shared
entities  → shared
shared    → (외부 패키지만)
```

**절대 금지:**

- 같은 레이어 내 cross-slice import (예: `entities/post` → `entities/tag`)
- 하위 → 상위 import (예: `shared` → `entities`)
- barrel export(`index.ts`)를 우회한 내부 직접 import

**Import alias** (`tsconfig.json`):

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

사용 예: `import { PostCard } from "@/entities/post"`

---

## 5. 핵심 데이터 흐름

```
content/posts/*.mdx
       ↓  (빌드 타임)
  entities/post/model/posts.ts — gray-matter로 frontmatter 파싱
       ↓
  generateStaticParams() → 각 slug별 정적 페이지 생성
       ↓
  next-mdx-remote → MDX → React 컴포넌트 렌더링
       ↓
  output: 'export' → /out 디렉토리에 정적 HTML
       ↓
  GitHub Actions → GitHub Pages 배포
```

---

## 6. 포스트 Frontmatter 스펙

```mdx
---
title: "포스트 제목"
description: "포스트 설명"
date: "2026-04-04"
tags: ["next.js", "blog"]
published: true
---
```

---

## 7. 주요 컴포넌트 설계

### shared/ui (shadcn/ui)

| 컴포넌트    | 용도             |
| ----------- | ---------------- |
| `Card`      | 포스트 카드 래퍼 |
| `Badge`     | 태그 표시        |
| `Button`    | 네비게이션 버튼  |
| `Separator` | 구분선           |

> shadcn/ui 컴포넌트는 `shared/ui/`에 설치되며 **직접 수정 금지**. 확장 필요 시 상위 레이어에서 래퍼 생성.

### entities/post

| 컴포넌트   | 역할                            | 타입   |
| ---------- | ------------------------------- | ------ |
| `PostCard` | 목록용 카드 (Card + Badge 조합) | Server |
| `PostMeta` | 날짜, 태그, 읽기시간 표시       | Server |

### widgets

| 컴포넌트   | 역할                      | 타입   |
| ---------- | ------------------------- | ------ |
| `Header`   | 블로그 타이틀, 네비게이션 | Server |
| `Footer`   | 저작권, 소셜 링크         | Server |
| `PostList` | 포스트 목록 렌더링        | Server |

### pages

| 컴포넌트         | 역할                                   | 타입   |
| ---------------- | -------------------------------------- | ------ |
| `HomePage`       | 위젯 조합 (Header + PostList + Footer) | Server |
| `PostDetailPage` | 포스트 상세 + MDX 렌더링               | Server |

---

## 8. 패키지 의존성

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18",
    "react-dom": "^18",
    "next-mdx-remote": "^5",
    "gray-matter": "^4",
    "reading-time": "^1",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

> `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`는 shadcn/ui 필수 의존성

---

## 9. GitHub Actions 배포 플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**필요 설정**: GitHub 리포지토리 → Settings → Pages → Source: "GitHub Actions"

---

## 10. SEO / 메타데이터

- 루트 `layout.tsx`에 기본 메타데이터 설정
- 각 포스트 `page.tsx`에서 `generateMetadata()`로 동적 메타데이터
- `sitemap.ts`로 사이트맵 자동 생성 (선택)

---

## 11. 구현 순서

1. Next.js 프로젝트 생성 (`pnpm create next-app`)
2. shadcn/ui 초기화 (`pnpm dlx shadcn@latest init`)
3. FSD 디렉토리 구조 생성 + tsconfig paths 설정
4. shared 레이어 (shadcn 컴포넌트, utils, constants)
5. entities/post (타입, 파싱 유틸, PostCard, PostMeta)
6. widgets (Header, Footer, PostList)
7. pages 레이어 (HomePage, PostDetailPage)
8. app 레이어 (라우팅, 레이아웃 연결)
9. `next.config.mjs`에 `output: 'export'` 설정
10. GitHub Actions 워크플로우
11. 샘플 포스트 2개
12. 빌드 검증
