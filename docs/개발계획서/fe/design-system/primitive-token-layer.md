# PR A — Design Token Primitive 계층 정의

> 작성일: 2026-06-16  
> 브랜치: feat/semantic-tokens  
> 변경 파일: `src/app/globals.css`, `tailwind.config.ts`

---

## 1. 배경 및 목표

### 문제

현재 `--nb-*` 토큰은 **semantic 이름으로 raw hex 값을 직접 보유**한다.
이는 W3C DTCG·Radix·Material 3이 공통적으로 정의하는 primitive 원칙을 위반한다.

```css
/* 현재 — semantic 이름이 원시값을 직접 보유 */
--nb-paper: #F9F1DE;   /* "종이" 라는 의도가 이름에 있는데 값도 직접 */
--nb-rule:  rgba(45, 33, 23, 0.16);  /* alpha 내장 — primitive에 허용 안 됨 */
```

추가로:
- `#FCF8EE` 등 14종의 hex 값이 토큰 체계 밖 하드코딩으로 존재
- `--nb-tape`, `--nb-memo`, `--nb-shadow-*` 등 의도 기반 토큰이 아예 없음
- 폰트 패밀리가 JS 상수(`NB_HAND`)로만 존재하고 CSS 변수가 없음

### 목표

**Primitive 계층을 신설**하여 아래 3-계층 구조를 완성한다.

```
Primitive  →  Semantic (--nb-*)  →  Component (Tailwind 유틸)
  값 기반        의도 기반             클래스 이름
  이름 없음      --nb-paper            bg-nb-paper
  --sand-2       → var(--sand-2)
```

### 비파괴 보장

기존 `--nb-*` 이름을 **그대로 유지**하되 값만 primitive 참조로 교체한다.
`globals.css`·`tailwind.config.ts`만 변경하며 화면 출력은 픽셀 단위로 동일해야 한다.

---

## 2. 기능 요구사항

### In Scope

- **색상 primitive**: 6개 계열(sand/brown/green/pink/sky/yellow) 각 5-step CSS 변수 신설
- **그림자 primitive**: `--shadow-ink-rgb` RGB 값 분리 (alpha는 semantic에서 결정)
- **폰트 primitive**: `--font-hand/hand2/body/sans/mono` CSS 변수 신설
- **Semantic 재정의**: 기존 `--nb-*` 값을 primitive 참조로 교체
- **Semantic 신규**: `--nb-paper-hi`, `--nb-tape`, `--nb-memo`, `--nb-photo`, `--nb-shadow-sm/md/lg`, `--nb-font-*`
- **Dark mode**: `[data-nb-theme="dark"]` 하위에서 같은 primitive 변수를 dark 값으로 재정의
- **Tailwind 노출**: `nb.*` semantic 토큰에 신규 키 추가 (primitive 미노출)

### Out of Scope

- `var(--nb-*)` 인라인 160회 치환 → PR B
- `next/font` 전환 + 폰트 인라인 109회 치환 → PR C
- StickyNote/Polaroid hex prop 교체 + CVA 정리 → PR D
- Tailwind v4 마이그레이션 → 선택 PR

---

## 3. 인수 기준

### 색상 Primitive

- [ ] `--sand-1` ~ `--sand-5` 5개 변수가 `:root`에 존재
- [ ] `--brown-1` ~ `--brown-5` 5개 변수가 `:root`에 존재
- [ ] `--green-1` ~ `--green-3`, `--pink-1` ~ `--pink-3`, `--sky-1` ~ `--sky-2`, `--yellow-1` ~ `--yellow-3` 존재
- [ ] `[data-nb-theme="dark"]`에서 모든 primitive 변수가 dark 값으로 재정의됨

### Shadow Primitive

- [ ] `--shadow-ink-rgb: 45 33 23` (light), `243 233 210` (dark)가 각 scope에 존재
- [ ] primitive에 `rgba(...)` 형태 값이 없음 (alpha는 semantic에서만 사용)

### Font Primitive

- [ ] `--font-hand` 등 5개 폰트 패밀리 CSS 변수가 `:root`에 존재

### Semantic 재정의

- [ ] `grep '#F9F1DE' src/app/globals.css` → 0건 (primitive 참조로 교체됨)
- [ ] `grep 'rgba(' src/app/globals.css` → 0건 (alpha → `rgb(... / ...)` 형식으로 교체)
- [ ] `--nb-paper: var(--sand-2)` 형태로 모든 기존 semantic이 primitive 참조
- [ ] `--nb-paper-hi`, `--nb-tape`, `--nb-memo`, `--nb-photo` 신규 semantic 존재
- [ ] `--nb-shadow-sm`, `--nb-shadow-md`, `--nb-shadow-lg` 존재

### Tailwind

- [ ] `bg-nb-paper`, `text-nb-ink`, `bg-nb-tape` 등 신규 유틸 클래스 빌드 성공
- [ ] `bg-sand-2` 등 primitive 직접 참조 클래스는 존재하지 않음 (미노출)

### 시각적 회귀

- [ ] light 모드: `--nb-paper`, `--nb-ink`, `--nb-rule` 렌더 값이 변경 전과 동일
- [ ] dark 모드: `[data-nb-theme="dark"]`에서 동일
- [ ] `nb-paper-bg`, `nb-paper-ruled`, `nb-paper-edge` helper 유틸이 정상 렌더

---

## 4. 기능 흐름

### CSS 변수 Cascade

```
:root
├── Primitive (전역, 값 기반)
│   ├── --sand-2: #F9F1DE
│   ├── --brown-3: #2D2117
│   └── --shadow-ink-rgb: 45 33 23
│
├── Semantic (nb- 네임스페이스, 의도 기반)
│   ├── --nb-paper:  var(--sand-2)
│   ├── --nb-ink:    var(--brown-3)
│   └── --nb-shadow-sm: 3px 5px 12px rgb(var(--shadow-ink-rgb) / 0.10)
│
└── shadcn bridge (기존 유지)
    ├── --background: var(--nb-paper)
    └── --border: var(--nb-rule)

[data-nb-theme="dark"]
└── Primitive 재정의만
    ├── --sand-2: #22201A   ← 같은 스텝, dark 값
    ├── --brown-3: #F3E9D2
    └── --shadow-ink-rgb: 243 233 210
    (semantic/shadcn bridge는 변경 없음 — cascade 자동 추종)
```

### Dark Mode 스텝 의미론

Primitive 스텝은 **의미적 강도(intensity)**를 나타내며, 절대 밝기(luminance)가 아니다.

| 스텝 | Light 의미 | Dark 의미 |
|---|---|---|
| sand-1 | 가장 밝은 표면 (카드) | 가장 밝은 어두운 표면 (카드) |
| sand-2 | 기본 배경 | 기본 어두운 배경 |
| sand-4 | edge/구분선 | edge/구분선 (더 어두움) |
| brown-1 | 보조 텍스트 (낮은 대비) | 보조 텍스트 (낮은 대비) |
| brown-3 | 기본 텍스트 (높은 대비) | 기본 텍스트 (높은 대비) |

---

## 5. UI 설계

N/A — UI 변경 없음. `globals.css`·`tailwind.config.ts` CSS/TS 파일만 변경.

### 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/app/globals.css` | Primitive 블록 신설, Semantic 재정의, Dark mode 재정의 |
| `tailwind.config.ts` | `nb` 색상 키에 신규 semantic 토큰 추가 |

---

## 6. 기술 설계

### globals.css 구조

```
@layer base {
  :root {
    /* ── 1. Primitive (값 기반, 전역) ── */
    /* Color */
    --sand-1 ~ --sand-5
    --brown-1 ~ --brown-5
    --green-1 ~ --green-3
    --pink-1 ~ --pink-3
    --sky-1 ~ --sky-2
    --yellow-1 ~ --yellow-3
    /* Shadow */
    --shadow-ink-rgb
    /* Font family */
    --font-hand / --font-hand2 / --font-body / --font-sans / --font-mono

    /* ── 2. Semantic (의도 기반, nb- 네임스페이스) ── */
    /* Surface */
    --nb-paper / --nb-paper-hi / --nb-edge
    /* Text */
    --nb-ink / --nb-ink-soft
    /* Border */
    --nb-rule
    /* Accent */
    --nb-tape / --nb-memo / --nb-photo / --nb-highlight
    /* Elevation */
    --nb-shadow-sm / --nb-shadow-md / --nb-shadow-lg
    /* Typography */
    --nb-font-hand / --nb-font-hand2 / --nb-font-body

    /* ── 3. shadcn bridge (기존 유지) ── */
    --background / --foreground / --border / ...
  }

  [data-nb-theme="dark"] {
    /* Primitive 재정의만 */
  }
}
```

### Primitive 전체 값 정의

#### Light

```css
/* Sand — 종이/배경 계열 (warm neutral) */
--sand-1: #FCF8EE;
--sand-2: #F9F1DE;
--sand-3: #F1E7D6;
--sand-4: #EFE4C9;
--sand-5: #C7B89A;

/* Brown — 잉크/텍스트 계열 */
--brown-1: #6E5A45;
--brown-2: #3A2C1E;
--brown-3: #2D2117;
--brown-4: #1F1813;
--brown-5: #1F1410;

/* Green — sage 계열 */
--green-1: #CFDDB6;
--green-2: #BCCFA4;
--green-3: #8FA678;

/* Pink — 코랄 계열 */
--pink-1: #F1C8B9;
--pink-2: #E6BAA9;
--pink-3: #C58C7A;

/* Sky — 하늘 계열 */
--sky-1: #C7DCE6;
--sky-2: #8FAFBE;

/* Yellow — butter 계열 */
--yellow-1: #F1E1A3;
--yellow-2: #E3CB87;
--yellow-3: #C9B47A;

/* Shadow */
--shadow-ink-rgb: 45 33 23;

/* Font family */
--font-hand:  'Caveat', 'Gowun Dodum', cursive;
--font-hand2: 'Kalam', 'Gaegu', cursive;
--font-body:  'Lora', 'Gowun Batang', Georgia, serif;
--font-sans:  'Gowun Dodum', system-ui, sans-serif;
--font-mono:  'IBM Plex Mono', ui-monospace, monospace;
```

#### Dark (재정의 대상)

```css
[data-nb-theme="dark"] {
  /* Sand */
  --sand-1: #2B2823;
  --sand-2: #22201A;
  --sand-3: #1D1B16;
  --sand-4: #171612;
  --sand-5: #0F0E0C;

  /* Brown (dark에서 텍스트는 밝아짐 — 동일 스텝, 반전된 대비) */
  --brown-1: #B9A682;
  --brown-2: #CFC0A0;
  --brown-3: #F3E9D2;
  --brown-4: #F7F1E3;
  --brown-5: #FCF8EE;

  /* Green */
  --green-1: #8FA678;
  --green-2: #6B8B5A;
  --green-3: #4D6640;

  /* Pink */
  --pink-1: #C58C7A;
  --pink-2: #A87060;
  --pink-3: #8A5548;

  /* Sky */
  --sky-1: #8FAFBE;
  --sky-2: #6B92A5;

  /* Yellow */
  --yellow-1: #C9B47A;
  --yellow-2: #A89058;
  --yellow-3: #8A7040;

  /* Shadow */
  --shadow-ink-rgb: 243 233 210;

  /* Font — 재정의 불필요 (폰트 패밀리는 테마 무관) */
}
```

### Semantic 전체 정의

```css
/* Surface */
--nb-paper:    var(--sand-2);
--nb-paper-hi: var(--sand-1);   /* 카드 등 raised surface */
--nb-edge:     var(--sand-4);

/* Text */
--nb-ink:      var(--brown-3);
--nb-ink-soft: var(--brown-1);

/* Border */
--nb-rule: rgb(var(--shadow-ink-rgb) / 0.16);

/* Accent — 장식 요소별 의도 명시 */
--nb-tape:      var(--green-1);   /* 와시테이프 */
--nb-memo:      var(--pink-1);    /* 스티커/메모 */
--nb-photo:     var(--sky-1);     /* 폴라로이드 틴트 */
--nb-highlight: var(--yellow-1);  /* 형광펜 배경 */

/* Elevation */
--nb-shadow-sm: 3px 5px 12px rgb(var(--shadow-ink-rgb) / 0.10);
--nb-shadow-md: 4px 6px 14px rgb(var(--shadow-ink-rgb) / 0.12);
--nb-shadow-lg: 6px 10px 22px rgb(var(--shadow-ink-rgb) / 0.18);

/* Typography */
--nb-font-hand:  var(--font-hand);
--nb-font-hand2: var(--font-hand2);
--nb-font-body:  var(--font-body);
```

### tailwind.config.ts 신규 nb 키

```ts
nb: {
  // 기존 유지
  paper:      "var(--nb-paper)",
  ink:        "var(--nb-ink)",
  "ink-soft": "var(--nb-ink-soft)",
  rule:       "var(--nb-rule)",
  sage:       "var(--nb-tape)",    // 기존 nb-sage → nb-tape 별칭 유지
  pink:       "var(--nb-memo)",    // 기존 nb-pink → nb-memo 별칭 유지
  sky:        "var(--nb-photo)",   // 기존 nb-sky → nb-photo 별칭 유지
  butter:     "var(--nb-highlight)", // 기존 nb-butter → nb-highlight 별칭 유지
  highlight:  "var(--nb-highlight)",

  // 신규
  "paper-hi":  "var(--nb-paper-hi)",
  tape:        "var(--nb-tape)",
  memo:        "var(--nb-memo)",
  photo:       "var(--nb-photo)",
  edge:        "var(--nb-edge)",
  "shadow-sm": "var(--nb-shadow-sm)",
  "shadow-md": "var(--nb-shadow-md)",
  "shadow-lg": "var(--nb-shadow-lg)",
}
```

> **주의**: 기존 `nb-sage`/`nb-pink`/`nb-sky`/`nb-butter` 키를 제거하면 PR B 대상 코드가 즉시 깨짐.  
> 기존 키는 그대로 유지하고, 신규 semantic 이름을 병렬로 추가한다.

---

## 7. 에러 및 피드백 처리

해당 없음 — CSS 변수 정의 작업이므로 런타임 에러 경로가 없다.

시각적 회귀를 인수 기준(§3)의 체크리스트로 검증한다.  
확인 방법: 변경 전후 `localhost:3000` 스크린샷 비교 또는 브라우저 CSS 변수 값 DevTools 확인.

---

## 8. 결정 사항

| 결정 | 선택 | 이유 |
|---|---|---|
| Primitive 네임스페이스 | **글로벌 (prefix 없음)** | W3C DTCG·Radix 표준. primitive는 테마 독립적 원자값이므로 `nb-` 스코프 불필요. `nb-`는 semantic 전용. |
| 색상 스텝 수 | **5-step per family** | 현재 하드코딩된 14종 hex 전부 흡수 가능. 3-step은 일부 누락, 9-step은 블로그 규모에 과잉. |
| Tailwind 노출 범위 | **Semantic만 노출** | 컴포넌트 코드가 primitive를 직접 참조하는 계층 혼용 방지. `bg-nb-paper` ✅, `bg-sand-2` ❌. |

### 기존 Tailwind 키 유지 결정

`nb-sage`/`nb-pink`/`nb-sky`/`nb-butter`를 제거하지 않고 유지한다.  
제거 시 PR B 대상 코드 전체가 즉시 타입 에러 발생 → PR B에서 새 semantic 키로 전환 후 구키 제거.
