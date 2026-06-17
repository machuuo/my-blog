# 디자인 시스템 구축·적용 트렌드 리서치 (2025–2026)

> 조사 방법: deep-research 워크플로 (20개 소스 → 94개 주장 추출 → 25개 검증, 24개 확정 / 1개 기각)
> 조사일: 2026-06-09
> 목적: 업계 트렌드 정리 후 Next.js + Tailwind 1인 블로그(커스텀 notebook/journal 디자인 시스템) 맥락에 적용

---

## 핵심 요약

업계는 **토큰 우선(token-first) · 표준 기반(standards-based) · CSS-first**로 수렴 중이다.
JS 설정 파일에 색을 박아두는 방식에서, **CSS 변수로 토큰을 정의하고 그게 곧 디자인 시스템의 단일 소스**가 되는 방향으로 이동했다.

---

## 1. 디자인 토큰 아키텍처 — 3계층이 사실상 표준 (confidence: high)

```
primitive (원시값)      →  semantic (의도)        →  component (요소 특화)
colors.amber.100           bg.surface                 card.background
#F9F1DE                    = {colors.amber.100}       = {bg.surface}
"이 색이 뭔지"             "어디에 쓰는 색인지"        "이 컴포넌트의 이 부분"
```

- **단방향 캐스케이드**: 상위가 하위를 별칭(alias)으로 참조. 역방향·순환 참조 금지.
- **semantic 계층은 절대 생략 금지** — "리팩터를 안전하게 만드는 게 바로 이 계층". primitive를 컴포넌트가 직접 쓰면 색 하나 바꿀 때 전부 추적해야 함.
- **component 계층은 소규모에선 선택적.**

> ⚠️ 'primitive/semantic/component' 용어 자체는 W3C 스펙 본문에 없다. 스펙은 이를 *가능하게* 하는 메커니즘(별칭·상속)만 정의하고, 3계층은 그 위에 업계가 얹은 관례다.

근거: Penpot, Supernova, Maviklabs("Never skip semantic tokens — they're what makes refactors safe"), IBM Carbon, EightShapes(Nathan Curtis), Martin Fowler, Contentful, Rangle 독립 확인.

## 2. W3C 디자인 토큰 표준이 production-ready (confidence: high)

- **2025-10-28, W3C DTCG 첫 안정 버전(v2025.10) 발표** — JSON 기반 벤더 중립 토큰 포맷.
- `$value` / `$type` / `$description` 등 `$`-접두 예약어, `{group.token}` 중괄호 별칭 참조 표준화.
- 동반 **Resolver Module**로 라이트/다크·접근성·멀티브랜드 테마를 **파일 중복 없이** 관리.
- Figma·Penpot·Sketch·Framer 등 10+ 도구 구현.

> ⚠️ 주의: ① 정식 W3C *Recommendation*이 아니라 **Community Group stable spec** (URL이 아직 `/drafts/`). ② 테마 기능은 코어 Format이 아니라 **Resolver Module 소관**.

## 3. Tailwind v4 + shadcn/ui — CSS-first 도구체인 (confidence: high)

- **Tailwind v4**: 설정이 `tailwind.config.js`(JS) → **CSS의 `@theme` 디렉티브**로 이동이 기본값. `@theme` 변수가 **유틸 클래스 + 런타임 CSS 변수**를 동시 생성. 공식 문서가 이 변수를 *"디자인 토큰의 저장 메커니즘"*으로 규정.
- **shadcn/ui**: `:root`에 원시 변수(`--background`) + `@theme inline` 매핑(`--color-background: var(--background)`). forwardRef 제거, 모든 프리미티브에 `data-slot` 추가. **비파괴적 업데이트**.

> ⚠️ **기각된 주장(1-2)**: "@theme의 *모든* 토큰이 자동으로 런타임 CSS 변수로 노출된다"는 거짓. 사용되지 않는 일부 토큰은 방출 안 될 수 있음 → "var()로 항상 참조 가능"이라 단정 금지.

**변형(variants) 관리**:
- **CVA** — 단순 변형용. 슬롯/합성/클래스 충돌해소 없음.
- **Tailwind Variants** — 슬롯·compound·합성·`tailwind-merge` 충돌해소 지원.
- 저자 권고: *"추가 기능 안 쓸 거면 CVA 써라."* → **1인 블로그는 CVA로 충분.**

## 4. 컴포넌트 설계·문서화·거버넌스 (confidence: high~medium)

- "규격 준수 기여"는 단순 코드 납품과 다름 — **문서화 + 사용 예시(쓰지 말아야 할 예시 포함)** 필수.
- **거버넌스는 성숙도 낮아도 어떤 형태로든 필요**하되, 영구적일 필요 없이 진화 (medium, 단일 secondary 출처).
- ⚠️ 이 영역 출처는 대부분 **다인 팀 조직 맥락** — 1인 운영으로 그대로 전이되는지 미검증.

---

## my-blog 적용 분석 (현재 코드 기준)

현재 상태: **Tailwind v3 (JS config) + shadcn 기본 토큰 + 커스텀 `--nb-*` 토큰이 globals.css에 공존.**

| 트렌드 | 현재 my-blog | 격차 |
|--------|-------------|------|
| 3계층 토큰 (semantic 필수) | `--nb-paper` 등이 **primitive=semantic 혼재** (색값이 곧 이름) | semantic 계층 부재 |
| nb 토큰이 Tailwind 유틸로 노출 | `var(--nb-paper)` 인라인으로만 사용 | `bg-nb-paper` 불가 |
| CVA로 변형 관리 | 미사용(추정) | 버튼 등 변형 산재 가능 |
| Tailwind v4 CSS-first | v3 JS config | 선택적 마이그레이션 |

> ⚠️ **과잉 경고**: Style Dictionary + DTCG JSON + CI 파이프라인은 **2인 이하엔 과잉** (caveat 확인). 1인 블로그엔 부적합.

### 권장 우선순위 (경량 → 무거움)

1. **지금 당장 (저비용·고효과)** — semantic 토큰 계층 + Tailwind 노출. `--nb-paper`(primitive)에 의도 기반 semantic을 한 겹 얹고 `theme.extend.colors.nb`에 등록 → `bg-nb-surface text-nb-ink`.
2. **그다음** — 폰트 토큰화. Caveat/Kalam 손글씨 폰트를 `fontFamily.hand` 등으로 등록 (현재 로드만 됨).
3. **변형이 쌓이면** — `button` 등에 CVA 도입.
4. **선택 (지금 불필요)** — Tailwind v4 마이그레이션. 비파괴적이나 v3로도 토큰화 핵심은 달성 가능 → 급하지 않음.

---

## Caveats (조사 한계)

- **시간 민감성**: DTCG(2025.10)·Tailwind v4·shadcn(2025-02) 업데이트 모두 최근이며 활발히 진화 중. designtokens.org는 아직 `drafts`/Community Group 경로.
- **출처 품질 편차**: 토큰 표준·Tailwind·shadcn 핵심 주장은 1차 공식 문서로 강함(high). 거버넌스·운영은 secondary(Figma designsystems.com, zeroheight) 및 일부 단일 출처 의존(medium).
- **마케팅 색채**: Penpot 'first native DTCG', Supernova '2026 future-proof'는 벤더 자기이익 있으나 사실관계는 W3C 1차 출처로 교차 확인됨.
- **추론 표시**: '3계층 primitive/semantic/component' 용어와 'DTCG가 3계층을 가능케 한다'는 부분은 스펙 본문 용어가 아닌 업계 합의 위의 해석적 종합.
- **적용 맥락 주의**: 'semantic 토큰 절대 생략 금지'의 'never'는 일반론으로 타당하나, 단일 페이지/사소한 1인 블로그엔 다소 절대적. 무거운 토큰 파이프라인은 소규모에 과잉이라는 비평(designsystemscollective, goodpractices.design) 존재.

## 미해결 질문

1. 1인 블로그에서 `@theme` CSS 변수만 관리 vs DTCG JSON SoT + Style Dictionary 파이프라인 — 유지보수 비용 손익분기점 미규명 (조사는 후자가 소규모엔 과잉이라는 비평만 확인).
2. 커스텀 notebook 미감을 3계층으로 인코딩할 때 component 계층(card/note-paper/marginalia 등)을 어디까지 둘지 — 구체 기준 부재.
3. 1인 블로그에 스토리북 등 별도 문서화 도구가 필요한지, MDX/라이브 페이지가 문서 역할을 대신할 수 있는지.
4. shadcn `:root` + `@theme inline` 패턴을 그대로 채택할지, 기존 커스텀 토큰과 충돌 없이 점진 마이그레이션하는 구체 전략.

---

## 주요 출처

| 출처 | 품질 | 영역 |
|------|------|------|
| [W3C DTCG 안정 버전 발표](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) | primary | 토큰 표준 |
| [W3C DTCG Format Module](https://www.designtokens.org/tr/drafts/format/) | primary | 토큰 표준 |
| [Tailwind v4 발표](https://tailwindcss.com/blog/tailwindcss-v4) | primary | Tailwind v4 |
| [Tailwind theme 문서](https://tailwindcss.com/docs/theme) | primary | Tailwind v4 |
| [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) | primary | 도구체인 |
| [shadcn/ui theming](https://ui.shadcn.com/docs/theming) | primary | 도구체인 |
| [Tailwind Variants vs CVA 비교](https://www.tailwind-variants.org/docs/comparison) | primary | 변형 관리 |
| [CVA 컴포넌트 합성 문서](https://cva.style/docs/getting-started/composing-components) | primary | 변형 관리 |
| [Penpot: 디자인 토큰 & CSS 변수 가이드](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/) | secondary | 토큰 아키텍처 |
| [Supernova: 2026 트렌드](https://www.supernova.io/blog/the-future-of-enterprise-design-systems-2026-trends-and-tools-for-success) | blog | 업계 트렌드 |
| [Maviklabs: Design Tokens + Tailwind v4](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/) | blog | 토큰 아키텍처 |
| [designsystems.com: 기여 거버넌스](https://www.designsystems.com/keeping-design-system-contributions-in-check/) | secondary | 거버넌스 |
| [zeroheight: 거버넌스 모델](https://help.zeroheight.com/hc/en-us/articles/36474270188699-Design-system-governance-models-and-which-is-right-for-your-organization) | secondary | 거버넌스 |
