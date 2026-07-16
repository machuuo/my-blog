# CLAUDE.md

## 패키지 매니저

이 프로젝트는 **pnpm**을 사용합니다. 패키지 설치 시 반드시 pnpm을 사용하세요.

```bash
pnpm add <package>       # 의존성 추가
pnpm add -D <package>    # devDependency 추가
pnpm remove <package>    # 제거
pnpm install             # 전체 설치
```

`npm install` / `yarn add` 사용 금지 — `pnpm-lock.yaml`과 충돌해 Vercel 빌드가 실패합니다.

## Control Flow & Conditionals

These rules are **enforced by ESLint** (build fails on violation). Follow them when writing or editing code.

### Prefer early returns / guard clauses

Flatten nesting with guard clauses instead of wrapping logic in conditionals. Deep nesting is the main driver of cognitive complexity.

```ts
// ❌ nested
function label(saving: boolean, isEditing: boolean): string {
  if (saving) {
    return "saving...";
  } else {
    if (isEditing) return "edit";
    else return "publish";
  }
}

// ✅ early return
function label(saving: boolean, isEditing: boolean): string {
  if (saving) return "saving...";
  if (isEditing) return "edit";
  return "publish";
}
```

Enforced by `no-else-return` (no `else` after `return`) and `sonarjs/cognitive-complexity` (max 10 — nesting is penalized).

### Ternaries: simple yes, nested no

A **simple** ternary is fine and preferred for JSX conditional rendering and value assignment. **Nested** ternaries are forbidden — replace them with a lookup object or an extracted early-return helper.

```tsx
// ✅ simple ternary — fine (and the required strategy for jsx-no-leaked-render)
{isOpen ? <Panel /> : null}
const label = isEditing ? "edit" : "publish";

// ❌ nested ternary — forbidden
const color = tone === "a" ? "x" : tone === "b" ? "y" : "z";

// ✅ value mapping → lookup object
const COLOR: Record<"a" | "b" | "c", string> = { a: "x", b: "y", c: "z" };
const color = COLOR[tone];
```

Enforced by `no-nested-ternary`. JSX conditional rendering must use the ternary strategy (`react/jsx-no-leaked-render`), never bare `&&` (which can leak `0`/`""`).

### Type-aware rule exceptions: disable the line, not the rule

Type-aware rules (`no-unnecessary-condition`, `prefer-nullish-coalescing`, …) sometimes fire on an **intentional** exception. Never turn the rule off globally. Add a line-level disable **with a reason** after `--`. Keep the directive on **one line** — it applies to the next line only, so a wrapped two-line `//` comment breaks (the directive lands on the comment line and ESLint reports it as an unused directive):

```ts
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is undefined in insecure/legacy contexts (the DOM type lies: declared non-null). Keep the guard.
navigator.clipboard?.writeText(text).catch(() => {});
```

Two recurring exception categories:

1. **The type lies about runtime nullability** — DOM/external types declared non-null but `undefined` at runtime (`navigator.clipboard`, feature-detected APIs). Keep the defensive `?.`.
2. **Empty string / 0 / false is a real fallback target** — `x || fallback` where `""`/`0`/`false` must fall through. `??` would change behavior. Keep `||`.

The reason comment is mandatory — it tells the reviewer the exception is deliberate. In JSX use the single-line `{/* eslint-disable-next-line … -- reason */}` form.

> Every code fence must declare a language identifier (see global `~/.claude/CLAUDE.md` §9).
