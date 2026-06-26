# A-2: react/no-array-index-key

**브랜치**: `chore/lint/array-index-key`
**부모 백로그**: [backlog.md](./backlog.md)
**룰 승격**: 사용자가 사전 처리 완료 (`eslint.config.mjs`에서 `react/no-array-index-key` warn → error)
**관련 PR**: TBD

---

## 1. 배경 및 목표

baseline 22건 중 `react/no-array-index-key` 2건을 해소. 사용자가 사전에 룰을 error로 승격해 `pnpm lint`가 error 2건으로 빌드 차단 중.

**왜 이 룰이 중요한가**: 배열 인덱스를 React key로 쓰면 — 배열 순서가 바뀌거나(정렬/필터), 중간 삽입/삭제가 일어날 때 React가 잘못된 컴포넌트 인스턴스를 재사용해 상태 누수/렌더 오류가 발생한다. 안정적인 unique key가 정공법.

**본 PR 목표**: 두 위반을 안정 key로 교체 + baseline 카운트 정정 + 룰 가드 활성.

---

## 2. 기능 요구사항

### In scope
- `breadcrumb.tsx`의 `<span key={index}>` → 안정 key로 교체
- `TagsPage.tsx`의 `<li key={j}>` → 안정 key로 교체
- 두 위반 error 0건 달성
- baseline `warn_total: 22 → 20` 정정

### Out of scope
- 다른 컴포넌트의 잠재적 key 문제 — 본 룰이 잡지 않은 부분은 본 PR 외
- 데이터 구조 변경 (예: `TagsPage` items에 slug 필드 추가) — 본 PR 외
- breadcrumb 컴포넌트 API 변경 — `BreadcrumbItem` 인터페이스 그대로 유지

---

## 3. 인수 기준

기능
- [ ] breadcrumb 렌더 시각 동일 (기존 유지)
- [ ] TagsPage 월별 리스트 렌더 시각 동일 (기존 유지)

코드
- [ ] `src/shared/ui/breadcrumb.tsx:23` `key={index}` → `key={item.href ?? item.label}`
- [ ] `src/views/tags/ui/TagsPage.tsx:199` `key={j}` → `key={t}`

하네스
- [ ] `pnpm lint` 실행 시 `react/no-array-index-key` error 0건
- [ ] `pnpm lint` 전체 통과 (exit 0)
- [ ] `lint-baseline.json`에서 `react/no-array-index-key` 항목 제거
- [ ] `lint-baseline.json` `warn_total: 22 → 20`
- [ ] `eslint-migration.md` Changelog 갱신
- [ ] `backlog.md` A-2 ✅
- [ ] 회귀 차단 검증 — 일부러 위반 추가 시 lint 실패 후 되돌리기

---

## 4. 기능 흐름

### 시나리오 1: breadcrumb 렌더
```text
[입력]
  items: BreadcrumbItem[] = [
    { label: "홈", href: "/" },
    { label: "시리즈", href: "/series" },
    { label: "React 19 시리즈" }  ← 마지막(현재 페이지)은 href 없음
  ]
  ↓ 각 item 렌더
[key 부여]
  span key="/" (홈)
  span key="/series" (시리즈)
  span key="React 19 시리즈" (마지막, label 사용)
  ↓
[시각] 기존과 동일
```

### 시나리오 2: TagsPage 월별 리스트
```text
[입력]
  MONTHS: [
    { m: "5월", items: ["React 19의 use() Hook", "맨시티의 3-2-4-1", ...] },
    { m: "4월", items: ["CSS @container 쿼리", ...] },
    { m: "3월", items: ["Suspense 비동기 패턴", "주말의 책 한 권"] }
  ]
  ↓ mo.items.map((t, j) => <li>)
[key 부여]
  li key="React 19의 use() Hook"
  li key="맨시티의 3-2-4-1"
  ...
[시각] 기존과 동일
```

### 엣지 케이스
- **breadcrumb**: 같은 호스트 내 href 중복 거의 없음 (경로는 unique). 마지막 항목(href 없음)도 label이 unique (현재 페이지 타이틀)
- **breadcrumb 만약 label 중복**: 가능성 매우 낮으나 발생 시 React 콘솔 경고. 데이터 입력 측에서 잡아야 할 일이지 key 전략 책임 아님
- **TagsPage**: 같은 ul(같은 달) 안에서 같은 제목 글이 두 번 들어올 일 거의 없음. 서로 다른 달은 별도 ul이라 무관

---

## 5. UI 디자인

**UI 시각 변화 없음** — `key` 속성만 교체. ASCII 레이아웃 N/A.

### 컴포넌트 트리

```text
Breadcrumb (변경)
└─ <nav aria-label="breadcrumb">
    └─ items.map((item, index) => (
        <span key={item.href ?? item.label}>      ← change (이전: key={index})
          {index > 0 && <ChevronRight />}
          {isLast || !item.href ? <span> : <Link>}
        </span>
       ))

TagsPage (변경 부분만)
└─ <section>
    └─ MONTHS.map((mo, i) => (
        <div>
          <div>{mo.m}</div>
          <ul>
            mo.items.map((t, j) => (
              <li key={t}>· {t}</li>                ← change (이전: key={j})
            ))
          </ul>
        </div>
       ))
```

### 접근성
N/A — interactive UI 변화 없음. key 속성은 React 내부용이라 a11y 무관.

---

## 6. 기술 설계

### 신규 파일
없음.

### 변경 파일

| 경로 | 변경 |
|---|---|
| `src/shared/ui/breadcrumb.tsx` | `:23` `key={index}` → `key={item.href ?? item.label}` |
| `src/views/tags/ui/TagsPage.tsx` | `:199` `key={j}` → `key={t}` |
| `docs/개발계획서/harness/lint-baseline.json` | `react/no-array-index-key` 항목 제거. `warn_total: 22 → 20`. `decreases`에 A-2 기록 |
| `docs/개발계획서/harness/eslint-migration.md` | Changelog: A-2 — 룰 승격 + 위반 2건 해소 |
| `docs/개발계획서/harness/backlog.md` | A-2 ⬜ → ✅ |

### 상태 관리
변경 없음 — 두 곳 다 props/데이터 변화 없음. key 속성만 교체.

### 주요 인터페이스
변경 없음. `BreadcrumbItem` 그대로 유지.

---

## 7. 에러 및 피드백 처리

해당 없음 — 외부 데이터/API 없음.

---

## 8. 결정 사항

| # | 결정 | 선택 | 근거 |
|---|---|---|---|
| D1 | breadcrumb key 전략 | `item.href ?? item.label` | href 있으면 unique (경로는 항상 서로 다름), 마지막 항목만 label 사용. 현재 데이터 구조에서 충돌 없음. `${label}-${href}` 같은 조합은 보수적이지만 본 케이스엔 과임. |
| D2 | TagsPage key 전략 | `t` (제목 자체) | 같은 달(같은 ul) 안에서 동일 제목 글 두 번 올릴 가능성 거의 없음. 다른 달은 별도 ul이라 무관. `${mo.m}-${t}` 같은 조합 불필요. |
| D3 | breadcrumb 컴포넌트 출처 | 자체 작성 커스텀 (shadcn 표준 아님) | 코드 검토 결과 shadcn 생성 파일이 아니라 우리가 직접 작성한 simple breadcrumb. shadcn 컨벤션 부담 없이 자유 수정. |
| D4 | 회귀 차단 검증 방식 | 일부러 `key={i}` 추가 → lint error 확인 → 되돌림 | A-1과 동일 패턴. 가드 작동 1회 확인. |
| D5 | baseline 갱신 시점 | 코드 수정 후 위반 0 확인 직후 | warn_total 정확성 유지 |

---

## 부록: 작업 체크리스트

PR 작업 순서:

1. [ ] 브랜치 생성 `chore/lint/array-index-key`
2. [ ] `breadcrumb.tsx:23` key 교체
3. [ ] `TagsPage.tsx:199` key 교체
4. [ ] `pnpm lint` 통과 확인 (`react/no-array-index-key` error 0)
5. [ ] 회귀 차단 검증: 다른 .tsx에 `key={i}` 임시 추가 → lint 실패 확인 → 되돌리기
6. [ ] `lint-baseline.json` 갱신 (`warn_total: 20`, decreases A-2)
7. [ ] tsc 통과 확인
8. [ ] `eslint-migration.md` Changelog 추가
9. [ ] `backlog.md` A-2 ✅
10. [ ] 수동 테스트 (옵션): breadcrumb 페이지 + TagsPage 렌더 확인
11. [ ] 커밋 + PR
