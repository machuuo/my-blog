# TODOS

## 테스트 프레임워크 셋업
- **What:** vitest + @testing-library/react 셋업
- **Why:** 현재 프로젝트에 테스트가 전혀 없음. 코드 변경 시 회귀 방지 불가
- **Pros:** 리팩토링/기능 추가 시 안전망, CI 연동 가능
- **Cons:** 초기 셋업 비용 ~30분
- **Context:** jest/vitest/playwright 모두 미설치 상태. Next.js App Router + FSD 구조이므로 vitest + testing-library 조합 권장. 컴포넌트 단위 테스트부터 시작.
- **Identified:** 2026-04-04 /plan-eng-review
