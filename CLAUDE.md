# CLAUDE.md

이 파일은 이정표다. 규칙 본문은 `.claude/rules/` 에 있고 세션 시작 때 함께 읽힌다 — 여기에 옮겨 적지 않는다. 새로 정한 규칙도 `.claude/rules/` 의 맞는 파일에 적는다.

| 이런 작업이면 | 볼 파일 |
|---|---|
| 패키지를 설치 · 제거할 때 (pnpm 만) | `.claude/rules/package-manager.md` |
| 코드를 쓰거나 고칠 때 — 조건문 · 삼항 · ESLint 예외 처리 | `.claude/rules/control-flow.md` |
| 린트 경고 수가 바뀌거나 규칙 단계를 바꿀 때 | `.claude/rules/lint-baseline.md` |
| 설계 · 구현 · 리뷰 · 릴리스(wf 스킬) — 설계서 자리 · 검사 명령 · 층 순서 · 진입점 | `.claude/rules/wf-settings.md` |

> Every code fence must declare a language identifier (see global `~/.claude/CLAUDE.md` §9).
