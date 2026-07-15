# My Dev Blog

Next.js 16 + React 19 + Supabase 기반 개인 개발 블로그

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, SSR/ISR) |
| 언어 | TypeScript (Supabase 생성 타입 SSOT) |
| 스타일링 | Tailwind CSS + Base UI |
| 아키텍처 | FSD (Feature-Sliced Design) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 이미지 저장 | Supabase Storage |
| 테스트 | Vitest + Testing Library |
| 코드 품질 | ESLint 9 (Flat Config) + boundaries — FSD 진입점 강제 |
| 배포 | Vercel |

## 주요 기능

- MDX 기반 블로그 포스트 작성/수정/삭제
- 웹 에디터에서 이미지 Ctrl+V 붙여넣기 → 자동 업로드
- 환경변수 비밀번호 기반 간단 인증 (`/write` 인증 게이트)
- ISR로 포스트 캐싱 + on-demand revalidation

## 로컬 개발

```bash
pnpm install
pnpm dev
```

| 명령 | 설명 |
|------|------|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | ESLint 검사 |
| `pnpm test` | Vitest 실행 |
| `pnpm db:types` | Supabase 스키마 → `src/shared/lib/supabase/database.types.ts` 재생성 |

### 환경변수 (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
SESSION_SECRET=
```

## Supabase 초기 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `scripts/setup-supabase.sql` 실행
3. Storage에 `images` 버킷 생성 (Public)

## 기존 MDX 마이그레이션

```bash
npx tsx scripts/migrate-posts.ts
```

## 배포

Vercel에 GitHub 레포 연결 → 환경변수 설정 → Deploy

## 프로젝트 구조

```text
src/
├── app/          # 라우팅 + API Routes
├── views/        # 페이지 컴포지션
├── widgets/      # 독립 UI 블록 (Header, Footer, PostList)
├── features/     # 글 작성(write-post), 인증(auth)
├── entities/     # Post / Series / Category 모델 + 매퍼 + UI
└── shared/       # UI 컴포넌트, Supabase 클라이언트 + 생성 타입, 유틸
```
