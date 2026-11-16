# Control Flow & Conditionals

- 성격: ESLint 가 강제하는 제어 흐름 · 조건문 규칙 — 코드를 쓰거나 고칠 때
- 출처: 2026-11-16 `CLAUDE.md` 에서 옮김 (처음 만든 작업: `docs/개발계획서/harness/b-1_tier-b-style-standards.md`)

These rules are **enforced by ESLint** — `pnpm lint` reports violations and the lint CI (`.github/workflows/lint.yml`) fails on any error. `next build` does not run ESLint. Follow them when writing or editing code.

## Early returns and ternaries

The rules themselves (early return, simple ternaries only, no nested ternaries) come from the global React pack rule `~/.claude/rules/react.md` §1 and are not repeated here. In this project ESLint enforces them:

- `no-else-return` (no `else` after `return`) and `sonarjs/cognitive-complexity` (max 10 — nesting is penalized).
- `no-nested-ternary` — replace a nested ternary with a lookup object or an extracted early-return helper.
- JSX conditional rendering must use the ternary strategy (`react/jsx-no-leaked-render`), never bare `&&` (which can leak `0`/`""`).

## Type-aware rule exceptions: disable the line, not the rule

Type-aware rules (`no-unnecessary-condition`, `prefer-nullish-coalescing`, …) sometimes fire on an **intentional** exception. Never turn the rule off globally. Add a line-level disable **with a reason** after `--`. Keep the directive on **one line** — it applies to the next line only, so a wrapped two-line `//` comment breaks (the directive lands on the comment line and ESLint reports it as an unused directive):

```ts
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is undefined in insecure/legacy contexts (the DOM type lies: declared non-null). Keep the guard.
navigator.clipboard?.writeText(text).catch(() => {});
```

Two recurring exception categories:

1. **The type lies about runtime nullability** — DOM/external types declared non-null but `undefined` at runtime (`navigator.clipboard`, feature-detected APIs). Keep the defensive `?.`.
2. **Empty string / 0 / false is a real fallback target** — `x || fallback` where `""`/`0`/`false` must fall through. `??` would change behavior. Keep `||`.

The reason comment is mandatory — it tells the reviewer the exception is deliberate. In JSX use the single-line `{/* eslint-disable-next-line … -- reason */}` form.
