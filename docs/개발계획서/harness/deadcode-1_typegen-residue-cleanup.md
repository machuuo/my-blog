# deadcode-1 — typegen-1 잔재 dead code 정리

> 트랙: 백로그 `dead code 3건`
> 유형: 순수 삭제 리팩터링 (런타임/화면 변경 없음)
> 스코프: **A** (백로그 명시 2건만. `PostFrontmatter` 배럴 export는 정당한 공개 타입이라 유지)

---

## 1. 배경 & 목표

typegen-1(Supabase 타입 생성 도입)으로 `Post` 계열 타입의 정본이 `entities/post/model/types.ts`(DB 생성 타입 `Tables<"posts">` 파생)로 이동했다. 그 과정에서 갱신되지 않은 낡은 정의와 소비처 없는 배럴 진입점이 잔재로 남았다.

- **목표**: 소비처 0으로 확인된 dead code를 제거해 (a) DB 스키마와 어긋난 거짓 타입의 오용 위험을 없애고, (b) 배럴 공개 표면을 실제 소비 항목과 일치시킨다.
- **왜 지금**: 저비용·저위험(전수조사로 소비처 0 확정). typegen-1 후속 정리의 마지막 항목.

## 2. 기능 요구사항

사용자(개발자) 관점:

- 개발자는 `Post`/`PostFrontmatter`를 import할 때 정본(`entities/post/model/types.ts`) 하나만 만난다. 낡은 `shared/types` 버전은 존재하지 않는다.
- 배럴 `@/entities/post`는 실제 외부 소비되는 심볼만 노출한다(죽은 `toPost` re-export 제거).

**In scope**

- `src/shared/types/index.ts` 삭제 + 빈 `src/shared/types/` 디렉토리 제거
- `src/entities/post/index.ts`의 `toPost` re-export 라인(line 3) 삭제
- `docs/개발계획서/harness/backlog.md` 갱신(트랙 완료 처리 + 변경 이력)

**Out of scope**

- 배럴 line 4의 `PostFrontmatter` export 제거 (스코프 B — 미소비이나 dead가 아닌 정당한 공개 타입, 유지)
- `.claude/worktrees` 정리 (이미 비어 있음 — 실효, 작업 없음. 백로그에 ✅ 기록만)
- migration-1 등 여타 백로그 트랙

## 3. 완료 조건 (Acceptance Criteria)

- [ ] `src/shared/types/index.ts` 파일이 삭제되었다
- [ ] `src/shared/types/` 디렉토리가 (빈 상태이므로) 제거되었다
- [ ] `src/entities/post/index.ts`에서 `export { toPost } from "./model/mappers";` 라인이 삭제되었다
- [ ] 배럴에 `Post`·`PostCard`·`PostMeta`·`PostWithSeries`·`PostFrontmatter` export는 그대로 유지된다
- [ ] `npx tsc --noEmit` 타입 에러 0 (신규 발생 없음)
- [ ] `pnpm lint` 위반 0 (신규 발생 없음)
- [ ] `entities/post/api/posts.ts`의 `toPost`/`toPostWithSeries` 사용은 `../model/mappers` 직접 import 그대로 정상 동작
- [ ] `backlog.md`의 `dead code 3건` 트랙이 완료 처리되고, ③ worktrees는 실효로 기록되며, 변경 이력에 엔트리(2026-07-22)가 추가되었다

**Edge cases**

- `shared/types`를 alias(`@/shared/types`)로 참조하는 곳 존재 여부 → 전수조사 결과 0건(재확인 후 삭제)
- 배럴 경유 `toPost` 소비처 존재 여부 → 0건(실사용은 슬라이스 내부 `../model/mappers` 직접 import)

## 4. 기능 흐름

순수 삭제라 상태 전이/사용자 시나리오 없음. 검증 흐름:

```text
삭제 전 소비처 재확인 (grep 0건)
  → 파일/라인 삭제
  → tsc --noEmit (타입 깨짐 없음 = 소비처 0 실증)
  → pnpm lint (import/배럴 위반 없음)
  → backlog 갱신
```

**에러 시나리오**: 만약 tsc가 에러를 낸다면 = 숨은 소비처 존재 → 삭제 롤백 후 소비처 재조사. (전수조사상 발생하지 않을 것으로 예상)

## 5. UI 설계

N/A — UI/화면 변경 없음. 컴포넌트 트리 변경 없음. 접근성: N/A — 인터랙티브 UI 아님.

## 6. 기술 설계

**변경 파일**

| 파일 | 작업 | 역할/사유 |
|---|---|---|
| `src/shared/types/index.ts` | 삭제 | 소비처 0. 정본은 `entities/post/model/types.ts` |
| `src/shared/types/` (디렉토리) | 삭제 | 위 파일 삭제 후 빈 디렉토리 |
| `src/entities/post/index.ts` | 수정(1줄 삭제) | 죽은 `toPost` re-export 제거. 나머지 4개 export 유지 |
| `docs/개발계획서/harness/backlog.md` | 수정 | 트랙 완료 처리 + 변경 이력 |

테스트 파일: 신규 `hooks/*`·`utils/*` 없음 → 추가 테스트 대상 없음. 기존 `mappers.test.ts`는 `../mappers` 직접 import라 영향 없음.

**타입/인터페이스**: 신규 정의 없음. 정본 `Post`/`PostFrontmatter`/`PostWithSeries` 형태 불변.

**상태 관리 / API 연동**: 해당 없음 — 삭제 리팩터링.

## 7. 에러 & 피드백 처리

N/A — 사용자 대면 동작 없음. 유일한 "피드백"은 CI 게이트(tsc/lint)이며, 삭제로 인한 신규 위반 0이 성공 신호다.

## 8. 결정 사항

- **스코프 A 채택**: 백로그 명시 2건(shared/types, 배럴 toPost)만 삭제. `PostFrontmatter` 배럴 export는 미소비이나 엔티티의 정당한 공개 타입이라 유지(dead code 아님, surgical 원칙).
- **③ `.claude/worktrees`**: 조사 결과 이미 비어 있고 `git worktree list`에 main만 존재 → 실효. 별도 삭제 작업 없이 backlog에 ✅로 기록.
- **빈 디렉토리 처리**: `shared/types/`에 `index.ts` 하나뿐 → 파일 삭제 시 디렉토리도 제거해 잔여 빈 폴더를 남기지 않는다.
- **검증 수단**: `tsc --noEmit` + `pnpm lint`로 충분. 소비처 0이 확인되어 별도 테스트 불필요.
