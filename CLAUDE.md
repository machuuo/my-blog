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
