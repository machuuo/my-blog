# migration-1 — Supabase 스키마 버전 관리 + CI 타입 drift 게이트

> 트랙: 백로그 `migration-1` (우선순위 낮음)
> 유형: 인프라/하네스 (런타임·화면 변경 없음)
> 스코프: **B** (스키마 리포화 + CI 타입 게이트 `--local`, 토큰-프리)

---

## 1. 배경 & 목표

typegen-1으로 `database.types.ts`(DB 파생 타입 SSOT)를 도입했지만, 타입 생성이 `--project-id`(원격) 방식이라 **토큰이 있어야만** 돌아간다. 그래서 CI가 스키마 ↔ 코드 타입 drift를 자동 검사하지 못한다(typegen-1 설계서에 "CI 게이트 미도입 — 알려진 한계"로 명시). 또한 DB 스키마가 원격에만 존재해 리포에 변경 이력이 없다(대시보드에서 바꾸면 흔적 0).

- **목표**:
  1. `supabase init` + 스키마 캡처(`db pull` 또는 이력 불일치 시 `db dump`)로 원격 스키마를 `supabase/migrations/*.sql`로 리포에 커밋 → **스키마가 PR에서 리뷰되고 이력이 남는다.**
  2. `db:types:local`(--local) 스크립트를 추가하고, CI가 로컬 스택에서 타입을 재생성해 커밋된 타입과 비교 → **토큰 없이 타입 drift를 차단한다.**
- **왜 지금**: typegen-1이 남긴 CI 게이트 구멍을 메운다. 스키마가 안정적이라 시급하진 않으나(우선순위 낮음), 시스템 정립 기조상 하네스 강화 방향에 부합.
- **B가 A의 상위집합**: `db pull`(스키마 리포화)은 A와 동일. 그 위에 CI 게이트만 얹으므로 버려지는 작업 없음.

## 2. 기능 요구사항

개발자 관점:

- 개발자는 `supabase/migrations/`에서 현재 DB 스키마를 SQL로 읽을 수 있다. 스키마 변경은 마이그레이션 파일 diff로 PR에서 리뷰된다.
- 개발자는 타입을 두 경로로 재생성할 수 있다: `pnpm db:types`(원격, 토큰 필요) 또는 `pnpm db:types:local`(로컬 스택, 도커 필요).
- CI는 매 PR에서 커밋된 마이그레이션으로부터 타입을 재생성해 커밋된 `database.types.ts`와 다르면 **빌드를 실패시킨다**(토큰 불필요).

**In scope**

- `supabase init` → `supabase/config.toml` 생성·커밋
- 원격 스키마를 `supabase/migrations/<timestamp>_baseline_schema.sql`로 캡처·커밋 — `supabase db pull`은 원격 마이그레이션 이력과 로컬 파일 불일치로 막혀(파일 없이 원격에만 이력 기록), 이력을 `reverted`로 표시한 뒤 `supabase db dump --linked --schema public`으로 베이스라인을 뜬다
- `package.json`에 `db:types:local` 스크립트 추가 (기존 `db:types` 원격 스크립트는 유지)
- `.github/workflows/db-types.yml` 신규 — 로컬 스택 기동 → `gen types --local` → 커밋 타입과 diff → drift 시 실패
- `backlog.md` migration-1 트랙 완료 처리 + 변경 이력

**Out of scope**

- `db:types`(원격)를 `--local`로 완전 대체 (원격 병행 유지 — 결정 D2)
- CI 게이트가 **원격 실 스키마**와 비교하는 것 (토큰-프리 유지를 위해 CI는 마이그레이션↔타입 내부 정합만 검사 — §8 한계로 명시)
- RLS 정책·시드 데이터 관리, 여러 환경(staging/prod) 분리
- 로컬 개발용 상시 Supabase 스택 운영

## 3. 완료 조건 (Acceptance Criteria)

- [ ] `supabase/config.toml`이 생성·커밋되었다
- [ ] `supabase/migrations/<timestamp>_baseline_schema.sql`이 원격 스키마를 반영해 커밋되었다
- [ ] `supabase/.temp/`는 `.gitignore`로 계속 무시되고, `migrations/`·`config.toml`은 추적된다
- [ ] `package.json`에 `db:types:local`(--local) 스크립트가 추가되고, 기존 `db:types`(원격)는 그대로 유지된다
- [ ] `.github/workflows/db-types.yml`이 추가되어 `supabase start` → `gen types --local` → 커밋 타입과 diff를 수행한다
- [ ] 커밋된 `database.types.ts`와 마이그레이션 재생성 타입이 일치할 때 게이트가 **통과**한다
- [ ] 마이그레이션과 타입을 일부러 어긋나게 하면 게이트가 **실패(exit 1)**한다 (회귀 검증)
- [ ] CI 게이트는 Supabase 토큰 없이 동작한다(러너 도커 + 커밋된 마이그레이션만 사용)
- [ ] db-types 워크플로우는 스키마 관련 경로 변경 시에만 트리거된다(불필요한 실행 방지)
- [ ] `backlog.md`의 migration-1 트랙이 완료 처리되고 변경 이력 엔트리(2026-07-29)가 추가된다

**Edge cases**

- `db pull`이 `public` 외 스키마(예: `auth`)의 객체를 참조하는 RLS 정책/함수를 포함하는 경우 → 구현 시 `supabase start`로 마이그레이션이 깨끗이 적용되는지 실제 검증(정규 이미지에 `auth` 스키마·role 존재). 필요 시 `db pull --schema` 범위 조정.
- CI에서 `supabase start`가 이미지 pull로 느려질 경우 → 불필요 서비스 `-x`(studio/realtime/storage 등) 제외로 경량화.
- 개발자가 도커 없이 타입을 재생성해야 할 때 → `pnpm db:types`(원격) 경로가 병행 유지되므로 가능(토큰 필요).

## 4. 기능 흐름

UI 없음. 두 개의 운영 흐름으로 기술한다.

**흐름 A — 스키마 변경 캡처 (개발자, 로컬, 드묾)**

```text
원격 스키마 변경 (대시보드/SQL)
  → (최초 베이스라인) 원격 이력이 로컬과 어긋나면
       supabase migration repair --status reverted <versions>  (이력 장부만 정리, 스키마 불변)
     → supabase db dump --linked --schema public   (OrbStack 기동, 현재 스키마 덤프)
     → supabase/migrations/<ts>_baseline_schema.sql 생성
     (이력 정합 시엔 supabase db pull로 증분 마이그레이션 생성도 가능)
  → pnpm db:types:local          (로컬 스택 타입 재생성)
  → migrations + database.types.ts 함께 커밋 → PR
```

**흐름 B — CI 타입 drift 게이트 (자동, 매 PR)**

```text
PR push (스키마 관련 경로 변경)
  → 러너: pnpm install → supabase start (커밋된 migrations 자동 적용)
  → supabase gen types --local > fresh.ts
  → diff fresh.ts  src/shared/lib/supabase/database.types.ts
      ├─ 동일 → 통과
      └─ 상이 → exit 1 (drift 차단, 무엇이 다른지 diff 출력)
```

**에러 시나리오**:
- `db pull` 실패(도커 미기동/연결 실패) → 로컬에서 원인 해소 후 재실행(커밋 안 됨).
- CI diff 불일치 → "마이그레이션과 커밋된 타입이 어긋남. `pnpm db:types:local` 재실행 후 커밋" 안내 메시지와 함께 실패. 개발자가 로컬에서 동기화 후 재푸시.

## 5. UI 설계

N/A — 인프라/하네스 작업. 화면·컴포넌트·상태 전이(UI) 없음.

- **컴포넌트 트리**: N/A — React 컴포넌트 변경 없음.
- **접근성**: N/A — 인터랙티브 UI 아님.

## 6. 기술 설계

**변경/신규 파일**

| 파일 | 작업 | 역할/사유 |
|---|---|---|
| `supabase/config.toml` | 신규 | `supabase init` 산출물. 프로젝트 로컬 설정(포트·서비스). 커밋 대상 |
| `supabase/migrations/<ts>_baseline_schema.sql` | 신규 | `supabase db dump` 산출물(원격 이력 불일치로 `db pull` 대신). 원격 스키마의 SSOT. PR 리뷰·이력의 핵심 |
| `package.json` | 수정 | `db:types:local`(--local) 스크립트 추가. 기존 `db:types`(원격) 유지 |
| `.github/workflows/db-types.yml` | 신규 | CI 타입 drift 게이트(정규 이미지 `supabase start` → `--local` → diff) |
| `.gitignore` | 확인 | 이미 `supabase/.temp/`만 무시·`migrations/` 추적 예고됨(50-51행). 변경 불필요 예상 |
| `docs/개발계획서/harness/backlog.md` | 수정 | 트랙 완료 처리 + 변경 이력 |

테스트 파일: 신규 `hooks/*`·`utils/*` 없음(순수 인프라) → 추가 유닛 테스트 대상 없음. 검증은 **CI 게이트 자체의 통과/실패 회귀**로 갈음(완료 조건의 "일부러 어긋내면 실패" 항목).

**스크립트 정의 (형태만, 구현은 /wf:implement)**

```text
db:types        : supabase gen types typescript --project-id spbgcnyqdgxhsouofeno --schema public  (기존 유지)
db:types:local  : supabase gen types typescript --local --schema public                            (신규)
```

- 두 스크립트 모두 출력 경로는 `src/shared/lib/supabase/database.types.ts`로 동일. 기존 `db:types`의 tmp→mv 원자적 쓰기 패턴을 `db:types:local`도 동일하게 따른다.

**CI 워크플로우 설계 (형태만)**

- 트리거: `supabase/migrations/**`, `src/shared/lib/supabase/database.types.ts`, `package.json`, 워크플로우 자신 변경 시(`paths` 필터). `deploy.yml`/`lint.yml`의 pnpm 셋업 패턴 재사용(`pnpm/action-setup@v4` + `setup-node@v4` node 20, `pnpm install --frozen-lockfile`).
- 러너: `ubuntu-latest`(도커 내장). supabase CLI는 devDep이므로 `pnpm exec supabase` 사용(별도 setup-cli 액션 불요).
- 단계: `supabase start`(필요 시 `-x`로 불필요 서비스 제외) → `pnpm exec supabase gen types typescript --local --schema public > /tmp/fresh.types.ts` → `diff /tmp/fresh.types.ts src/shared/lib/supabase/database.types.ts`(불일치 시 diff 출력 후 exit 1).
- 토큰: **사용 안 함.** 커밋된 마이그레이션만으로 로컬 스키마를 재현하므로 secret 불필요.

**상태 관리 / API 연동**: 해당 없음 — 인프라 작업.

## 6.1 선행 조건 (로컬 도구 설치)

`db pull` / `db:types:local`은 로컬 도커 런타임을 요구한다. 현재 미설치이므로 착수 전 1회 수행한다.

1. OrbStack 설치 (Docker Desktop보다 경량):

   ```bash
   brew install --cask orbstack
   # 설치 후 OrbStack 앱을 1회 실행해 도커 데몬을 기동
   ```

2. 도커 동작 확인 (클라이언트+서버 모두 응답해야 함):

   ```bash
   docker version
   ```

3. supabase CLI는 devDep(2.109.1)이라 별도 설치 불요:

   ```bash
   pnpm exec supabase --version
   ```

- CI(러너)는 도커 내장이라 이 로컬 설치와 무관하다.
- 최초 `db pull` 이후에는 스키마 변경을 캡처할 때만 도커를 재기동한다(빈도 낮음).

## 7. 에러 & 피드백 처리

- **로컬 `db pull` 실패**: 도커 미기동·원격 연결 실패가 주 원인. CLI 에러 메시지로 원인 노출, 커밋 없이 재시도. 사용자 대면 UI 없음.
- **CI 게이트 실패(drift)**: `diff` 출력으로 **어떤 타입이 어긋났는지** 그대로 보여주고, 잡 로그에 복구 안내("`pnpm db:types:local` 실행 후 커밋") 출력. 성공 신호는 diff 0(exit 0).
- **비밀 취급**: `db pull` 시 원격 연결에 DB 비밀번호/토큰이 필요하나 **로컬에서만** 쓰고 리포·CI에 넣지 않는다. `--project-id spbgcnyqdgxhsouofeno`는 비밀 아님. `SUPABASE_SERVICE_ROLE_KEY` 등 secret은 커밋·스크립트 하드코딩 금지.

## 8. 결정 사항

- **스코프 B 채택**: 스키마 리포화(A) + CI 타입 게이트(`--local`, 토큰-프리). A는 B의 부분집합이라 버려지는 작업 없음.
- **D1 — CI 게이트 실행 방식 = supabase 정규 이미지**: `supabase start`로 정규 이미지(auth 스키마·role·extension 포함) 위에 마이그레이션을 적용해 타입 생성. 경량 Postgres 컨테이너는 RLS/`auth` 참조 스키마에서 적용 실패 위험이 있어 배제. 다소 무겁지만(~1-2분) 견고성 우선.
- **D2 — db:types 전환 방식 = 원격 병행 유지**: 기존 `db:types`(원격) 유지 + `db:types:local`(--local) 신규 추가. 개발자가 도커 없이도 원격 경로로 타입 재생성 가능하게 유연성 확보. CI는 `--local` 사용해 토큰-프리.
- **전제 — 로컬 OrbStack 설치**: 최초 스키마 캡처(`db dump`은 pg_dump 컨테이너, `db pull`은 shadow DB diff)에 로컬 도커가 필요. 현재 미설치 → OrbStack 1회 설치가 착수 선행 조건. 이후 스키마 변경 캡처 시에만 재사용(안정적이라 빈도 낮음).
- **알려진 한계 — CI는 "마이그레이션 ↔ 타입" 내부 정합만 검사**: 토큰-프리를 위해 CI는 커밋된 마이그레이션에서 타입을 재생성해 커밋 타입과 비교할 뿐, **원격 실 스키마와는 비교하지 않는다.** 원격 ↔ 마이그레이션 동기화는 개발자가 `db pull`로 보장하는 사람 책임 영역. (원격 대조까지 원하면 토큰을 쓰는 별도 후속 트랙.)
- **검증 수단**: CI 게이트의 통과(정합 시) + 실패(일부러 어긋낼 시 exit 1) 회귀로 충분. 별도 유닛 테스트 불요.
