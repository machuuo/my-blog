# 설계서 — PR #1: semantic 토큰 계층 + Tailwind 색상 노출

> 상위 로드맵: [design-system-pr-roadmap.md](./design-system-pr-roadmap.md)
> 근거 리서치: [research-design-system-trends-2026.md](./research-design-system-trends-2026.md)
> 작성일: 2026-06-09
> 전략: 하이브리드 토큰 (shadcn 값 오버라이드 + nb 확장)

---

## 1. 배경 & 목표

**배경**: notebook 디자인 시스템의 색이 `globals.css`에 두 체계로 분열돼 있다 — shadcn 기본 토큰(`--background` 등, 실사용 중)과 커스텀 `--nb-*` 토큰(인라인 121회). 같은 의미(본문 텍스트, 표면 배경)를 두 체계가 따로 표현해 일관성이 깨진다. 또 `--nb-*`는 Tailwind 유틸로 노출되지 않아 매번 `var(--nb-*)` 인라인을 써야 한다.

**목표**: 하이브리드 토큰 전략으로 두 체계를 정리한다. ① shadcn에 있는 역할색은 표준 네이밍을 유지하고 값만 notebook 색으로 오버라이드(중립색 한정), ② shadcn에 없는 notebook 고유색은 `nb-` 확장 토큰으로 Tailwind에 노출. 이로써 #2(인라인 치환)의 전제를 만든다.

## 2. 기능 요구사항

**In scope**
- `globals.css`: shadcn 중립 토큰(`--background`/`--foreground`/`--muted-foreground`/`--border`/`--card`)의 값을 nb 색으로 오버라이드 (라이트/다크 양쪽)
- `tailwind.config.ts`: `theme.extend.colors.nb`에 nb 전용색 등록 → `text-nb-sage` 등 사용 가능
- 기존 `var(--nb-*)` primitive 토큰은 그대로 유지(비파괴)

**Out of scope**
- 인라인 `var(--nb-*)` → 유틸 클래스 치환 (→ PR #2)
- `primary`/`secondary`/`accent`(강조색) 오버라이드 (→ 향후 확장 PR)
- 폰트 토큰화 (→ PR #3)
- component 토큰 계층

## 3. 완료 기준 (체크리스트)

- [ ] shadcn 중립 토큰 5종이 라이트/다크 모두 nb 색으로 렌더된다 (`bg-background`가 종이색, `text-foreground`가 잉크색)
- [ ] `text-nb-sage` `bg-nb-highlight` `border-nb-rule` 등 nb 유틸이 빌드되고 렌더된다
- [ ] 기존 `var(--nb-*)` 인라인 사용처 121곳이 **시각적 회귀 없이** 동일하게 보인다 (비파괴 검증)
- [ ] `.dark`와 `[data-nb-theme="dark"]` 두 다크 모드에서 색이 깨지지 않는다
- [ ] alpha 포함 토큰(`--nb-rule`, `--nb-highlight`)이 의도대로 반투명 렌더된다
- [ ] `pnpm build` 통과, 신규 미사용 토큰으로 인한 경고 없음

## 4. 기능 흐름

런타임 사용자 인터랙션 없음 (빌드타임 토큰 정의). 색 해소 흐름:

```
shadcn 컴포넌트 (bg-background)
  → tailwind colors.background = var(--background)
    → [semantic 별칭, globals.css] --background: var(--nb-paper)
      → [primitive] --nb-paper 색값 (라이트/다크 분기)

직접 컴포넌트 (text-nb-sage)
  → tailwind colors.nb.sage
    → CSS var(--nb-sage)
      → [nb 확장] nb 색값 (라이트/다크 분기)
```

## 5. UI 설계

**ASCII 레이아웃: 해당 없음** — 토큰 인프라 작업이라 화면 레이아웃 변경 없음.

**토큰 계층 구조도** (하이브리드 경계):

```
┌─ primitive (원시 색값, 기존 유지) ──────────────────────┐
│  --nb-paper #F9F1DE   --nb-ink #2D2117                  │
│  --nb-ink-soft        --nb-rule(rgba)  --nb-sage 등     │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
   ┌───────────▼──────────┐  ┌────────▼─────────────┐
   │ shadcn 표준(접두어 X)│  │ nb 확장 (nb- 접두어) │
   │ 값만 오버라이드       │  │ 그대로 노출          │
   │ --background ← paper  │  │ colors.nb.sage       │
   │ --foreground ← ink    │  │ colors.nb.highlight  │
   │ --muted-fg   ← ink-sft│  │ colors.nb.rule       │
   │ --border     ← rule   │  │ colors.nb.pink/sky.. │
   │ --card       ← paper  │  │                      │
   └──────────┬───────────┘  └──────────┬───────────┘
   bg-background/text-foreground   text-nb-sage/bg-nb-highlight
   (shadcn 컴포넌트가 자동 사용)    (직접 컴포넌트가 사용)
```

**영향 컴포넌트**: 직접 변경 없음. 간접 영향 — `bg-background`/`text-foreground` 등을 쓰는 shadcn 기반 컴포넌트(약 40여 사용처)가 자동으로 notebook 색으로 전환됨.

**접근성**: 해당 없음 — 인터랙티브 UI 없음. (단 완료 기준에 색 대비는 기존과 동일하게 유지되므로 대비 회귀 없음)

## 6. 기술 설계

**변경 파일**

| 파일 | 역할 | 변경 내용 |
|------|------|----------|
| `src/app/globals.css` | semantic 별칭 SoT | `:root`의 중립 6종(`--background`/`--foreground`/`--card`/`--card-foreground`/`--muted-foreground`/`--border`)을 `var(--nb-*)` 별칭으로 정의. `.dark`·nb primitive는 미변경 |
| `tailwind.config.ts` | 유틸 생성 | 중립색을 `var(--semantic)` 노출 + `theme.extend.colors.nb`에 nb 전용색 등록 |

**① primitive → semantic(역할) 매핑표** (중립색은 shadcn 네이밍이 semantic 역할 담당)

| 의미(semantic 역할) | 토큰 (shadcn 표준) | 값 출처(primitive) |
|---|---|---|
| 표면 배경 | `--background` | `--nb-paper` |
| 본문 텍스트 | `--foreground` | `--nb-ink` |
| 보조 텍스트 | `--muted-foreground` | `--nb-ink-soft` |
| 구분선/테두리 | `--border` | `--nb-rule` |
| 카드 배경 | `--card` | `--nb-paper` |

**② shadcn 오버라이드 vs nb 확장 분류표**

| 토큰 | 처리 | Tailwind 사용 |
|---|---|---|
| background/foreground/muted-foreground/border/card | shadcn 값 오버라이드 | `bg-background` 등 (기존 유틸) |
| primary/secondary/accent | **건드리지 않음** (shadcn 기본 회색조 유지) | — |
| sage/pink/sky/butter | nb 확장 | `text-nb-sage` 등 |
| highlight | nb 확장 | `bg-nb-highlight` |
| rule | nb 확장 (+ border에도 매핑) | `border-nb-rule` |
| edge | primitive 유지 (유틸 전용, 노출 안 함) | — |

**⚠️ 기술 리스크 — 색 형식 불일치 (해결됨: 제3안 (c) 채택)**

- shadcn 토큰은 `hsl(var(--background))` **채널 컨벤션**(값이 `H S L`)인데, nb는 **hex/rgba**다. 해법 3가지를 검토:
  - **(a)** nb 색을 HSL 채널로 변환해 shadcn 토큰에 기입 — shadcn 컨벤션 유지, 단 nb hex와 값 이중 관리 + alpha 비호환
  - **(b)** `tailwind.config`에서 `hsl()` 벗기고 `var(--nb-*)` 직접 참조 — 동작하나 semantic 역할명이 config에만 떠 CSS 추적 끊김·런타임 `var(--background)` 접근 불가
  - **(c) 채택: CSS에서 완성형 별칭** — `:root`에 `--background: var(--nb-paper)` 별칭을 두고, config는 `var(--background)` 노출. semantic을 CSS에 유지(정석), alpha 호환, 런타임 접근 가능, shadcn 이름 보존. 다크 분기는 `[data-nb-theme]`에서 `--nb-*`만 바뀌면 자동 추종.
- `--nb-rule`/`--nb-highlight` alpha 토큰도 완성형 `var()`라 (c)에서 정상 렌더.
- `.dark`(shadcn) vs `[data-nb-theme="dark"]`(nb): 실측 결과 `.dark`는 **dead**(NbFrame이 `[data-nb-theme]`만 토글). (c)는 `:root`만 수정하고 `.dark`는 미변경 → 향후 `.dark`를 실제 사용하게 되면 중립 6종을 그 블록에도 재정의해야 함(현재는 비활성 리스크).

**타입/인터페이스**: 해당 없음 — CSS/설정 변경, TS 타입 없음.

**테스트 파일**: 해당 없음 — 순수 함수/훅 없음. 검증은 빌드 + 시각 회귀(완료 기준)로 대체.

## 7. 에러 & 피드백 처리

**대부분 해당 없음** — 런타임 토큰 작업이라 에러 시나리오·사용자 피드백 없음. 단 빌드타임 실패 경로만:
- 잘못된 색 형식(예: rgba를 hsl로 래핑) → 색이 투명/검정으로 깨짐 → 완료 기준의 시각 회귀 검증으로 포착.

## 8. 결정사항

| 항목 | 결정 | 근거 |
|------|------|------|
| 토큰 전략 | 하이브리드 (shadcn 값 오버라이드 + nb 확장) | shadcn 채택 프로젝트의 업계 표준 (리서치 확인) |
| shadcn 오버라이드 범위 | **중립색만** (background/foreground/muted-fg/border/card) | 사용자 결정. primary/secondary/accent는 향후 확장 PR |
| 강조색 회색조 잔존 | 허용 (의도적 범위 한정) | `bg-secondary/primary/accent` 일부 UI는 회색으로 남음 — 향후 PR |
| nb Tailwind 노출 | **등록함** (colors.nb.*) | 사용자 결정. #2 치환의 전제 |
| 토큰 계층 | 2계층 (primitive→semantic), component 생략 | 소규모라 트렌드상 component 선택적 |
| 라이트/다크 | 기존 `:root`+`.dark`/`[data-nb-theme]` 구조 유지, semantic도 양쪽 정의 | 비파괴 |
| 비파괴 | 기존 `var(--nb-*)` 인라인 미변경, 정의/등록만 추가 | #2에서 치환 |
| 색 형식 충돌 해법 | **CSS semantic 별칭 (제3안 c)** — globals.css에 `--background: var(--nb-paper)` 별칭, config는 `var(--semantic)` 노출 | semantic in CSS(정석)·런타임 접근·alpha 호환·shadcn 이름 보존 |

**미해결: 0건** (색 형식 해법은 권장안 (b) 제시 + 구현 검증으로 종결)
