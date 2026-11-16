# 린트 기준선 (ratchet)

- 성격: 린트 경고 수를 늘리지 않게 하는 CI 규칙 — 린트 경고 수가 바뀌거나 규칙 단계를 바꿀 때
- 출처: 2026-11-16 메모리 `lint-baseline-ratchet` 에서 옮김 (처음 만든 작업: `docs/개발계획서/harness/eslint-migration.md`)

CI(`.github/workflows/lint.yml`)는 ESLint error 가 하나라도 있거나, 경고 수가 `docs/개발계획서/harness/lint-baseline.json` 의 `warn_total` 보다 많으면 실패한다.

- 새 경고를 늘리지 않는다. 고치거나, 기준선을 올려야 하면 의도를 밝힌 별도 PR 로 올린다.
- 변경으로 경고 수가 줄면 같은 PR 에서 `lint-baseline.json` 을 갱신한다(`warn_total` · `warn_by_rule` · `decreases` 기록) — 줄어든 수를 잠근다.
- 규칙을 `warn` → `error` 로 올리면 `warn_by_rule` 에서 그 항목을 지운다.
