# barrel-hook-2 — 전역 배럴 하네스의 "폴더마다 배럴" 전제 정정

> 상태: 설계 완료 / 구현 대기
> 선행: barrel-1(FSD 배럴 소비 강제), typegen-1(훅에 실차단당한 사례)
> 유형: 하네스(전역 도구) 수정 — 코드/UI 아님

---

## 1. 배경 & 목표

전역 배럴 하네스 2개가 **feature-folder 관례("폴더마다 `index.ts`")**를 전제로 만들어졌다. 그러나 이 프로젝트는 **FSD 슬라이스-루트 배럴만 진입점으로 두는** 구조라(barrel-1이 `eslint.config.mjs`의 `boundaries`+`internalPath`로 진입점을 error 강제, dead 세그먼트 배럴 8개 삭제) 두 하네스가 오작동한다.

- **`~/.claude/hooks/post-barrel.sh`** (전역 PostToolUse 훅, write 모드 30-33행): 새 `.ts` 파일 저장 시 같은 디렉토리에 `index.ts`가 없으면 **차단**. typegen-1에서 `entities/post/model/types.ts` 작성을 **실제로 막았다**. FSD 세그먼트(`model/`, `api/`)에 배럴이 없는 건 정상이므로 정면 충돌.
- **`~/.claude/skills/impl-review/SKILL.md:138`** 체크리스트 #16: 세 조항 중 (a)"폴더에 `index.ts` 없으면 FAIL", (b)"배럴이 폴더의 모든 public API를 노출하지 않으면 PARTIAL"이 FSD에서 오탐. (c)"배럴 우회 딥 import는 FAIL"만 유효.

**근본 원인**: 두 하네스가 "배럴 = 폴더의 전부를 노출"을 전제하나, FSD에서 배럴은 "**밖에서 쓰는 것만**" 노출하는 진입점이다(`toCategory` 미노출, `toPost` re-export가 dead가 된 전례). 그리고 이 프로젝트에선 진입점 계약을 **lint `boundaries`가 이미 error로 강제**하므로 런타임 훅은 순수 중복이다.

**목표**:
1. 전역 훅을 FSD-적대적이지 않게 완화한다(생성 강제 제거, 동기화 넛지는 보존).
2. 이 프로젝트에선 lint가 SSOT이므로 훅을 완전히 무력화해 잔여 오차단 가능성을 0으로 만든다.
3. impl-review #16을 "진입점 계약" 프레이밍으로 재작성하고 lint-enforced 프로젝트는 이중 지적하지 않는다.
4. **나머지 5개 프로젝트의 기존 동작을 훼손하지 않는다.**

---

## 2. 기능 요구사항

사용 주체는 "하네스를 사용하는 개발자(=사용자 본인, 6개 프로젝트)"다.

**In scope**:
- (전역 훅) 배럴이 없는 폴더에 새 파일을 저장해도 훅이 차단하지 않는다.
- (전역 훅) 배럴이 이미 있는 폴더에서는 심볼 동기화 검사(누락/stale)를 **그대로 유지**한다.
- (이 프로젝트) 프로젝트 루트에 마커가 있으면 훅이 어떤 경우에도 개입하지 않는다(조기 종료).
- (impl-review) #16이 FSD 슬라이스 배럴을 오탐하지 않고, lint로 진입점을 강제하는 프로젝트는 `N/A (lint-enforced)`로 보고한다.

**Out of scope**:
- `~/.claude/settings.json`의 훅 등록부 변경 없음(전역 등록 유지 — 다른 프로젝트가 계속 쓴다).
- feature-folder 프로젝트의 "배럴 심볼 동기화" 강제 제거 없음(그 가치는 보존).
- 다른 프로젝트에 마커 배포 없음(이 프로젝트에만 생성).
- 배럴 정책을 다단계(`require-all`/`consistency-only`/`off`)로 일반화하는 config 스키마 — YAGNI. 지금 필요한 건 "on/off" 마커 하나뿐.

---

## 3. 완료 조건 (Acceptance Criteria)

**전역 훅 (`post-barrel.sh`)**
- [ ] write 모드: 같은 디렉토리에 `index.ts`가 **없으면** 차단하지 않고 통과(exit 0)한다. (기존 30-33행 제거)
- [ ] write 모드: `index.ts`가 **있고** 새 파일 basename을 export하지 않으면 기존대로 차단한다. (34-36행 유지)
- [ ] edit 모드: 기존 동작(배럴이 파일을 참조할 때만 심볼 누락/stale 검사) 불변.
- [ ] 회귀: 배럴이 있는 폴더에서 심볼 누락 상황을 만들면 여전히 차단됨을 확인.

**마커 가드 (이 프로젝트 무력화)**
- [ ] 훅 최상단에 조기 종료 가드: 프로젝트 루트 `.claude/`에 마커 파일이 있으면 `exit 0`.
- [ ] 프로젝트 루트 탐색: `$CLAUDE_PROJECT_DIR`(Claude Code가 훅에 주입)을 우선 사용, 비어 있으면 `FILE_PATH`에서 상위로 올라가며 `.claude/` 디렉토리를 탐색.
- [ ] 이 프로젝트 루트에 마커 파일 생성.
- [ ] 검증: 이 프로젝트에서 배럴 없는 폴더/있는 폴더 모두에 파일을 저장해도 훅이 개입하지 않음(마커 임시 제거 시엔 완화된 로직대로 동작).
- [ ] 검증: 마커가 없는(가정) 다른 경로에선 완화된 로직이 정상 동작.

**impl-review #16 재작성**
- [ ] (a)"폴더에 `index.ts` 없으면 FAIL", (b)"배럴이 모든 public API 노출 안 하면 PARTIAL" 삭제.
- [ ] (c)를 "진입점 계약 위반: 슬라이스/모듈 밖에서 공개 진입점(`index.ts`/`server.ts`)을 우회한 내부 세그먼트 딥 import = FAIL"로 재작성.
- [ ] "lint(`boundaries`/entry-point)가 error로 강제하는 프로젝트에서는 `N/A (lint-enforced)`로 보고"를 명시(이중 지적 방지).
- [ ] 기존 exempt 조항(app 진입점, 페이지 컴포넌트, 단일 파일 모듈)은 의미 보존.

**공통**
- [ ] 마커 임시 제거 후 이 프로젝트에서 훅이 완화 로직대로 동작함을 실증(마커 가드와 완화 로직이 독립적으로 검증됨).

---

## 4. 기능 흐름

**시나리오 A — 이 프로젝트에서 FSD 세그먼트 파일 저장** (핵심 회귀)
```text
Write(entities/post/model/types.ts)
  → 훅 발동 → [마커 가드] .claude/no-barrel-hook 존재 → exit 0
  → 차단 없음 ✅ (typegen-1 실차단 재현 방지)
```

**시나리오 B — 다른(가정) FSD 프로젝트, 마커 없음** (전역 완화 효과)
```text
Write(some/segment/thing.ts)  (같은 폴더에 index.ts 없음)
  → 훅 발동 → 마커 없음 → 완화 로직 진입
  → write 모드: index.ts 없음 → (구) 차단 / (신) exit 0 통과 ✅
```

**시나리오 C — feature-folder 프로젝트, 배럴 있는 폴더에 export 누락** (동기화 보존)
```text
Write(components/Button.tsx)  (components/index.ts 존재, Button 미export)
  → 마커 없음 → 완화 로직 → index.ts 있음 + basename 미export
  → 차단(기존과 동일) ✅ "동기화 넛지" 보존
```

**시나리오 D — impl-review 실행, lint-enforced 프로젝트**
```text
리뷰어가 #16 점검 → 슬라이스 배럴에 특정 심볼 미노출 발견
  → (구) PARTIAL 오탐 / (신) 정상: 배럴은 밖에서 쓰는 것만 노출
  → 진입점 계약(딥 import)만 점검 → lint가 error 강제 → "N/A (lint-enforced)" 보고 ✅
```

---

## 5. UI 설계

N/A — UI 변경 없음(bash 훅 + 마크다운 체크리스트 + 마커 파일).

**변경 대상 트리**
```text
~/.claude/
├── hooks/
│   └── post-barrel.sh              [수정] 마커 가드 추가 + write 모드 30-33행 제거
├── skills/impl-review/
│   └── SKILL.md                    [수정] 체크리스트 #16 재작성
└── settings.json                    [불변] 훅 등록 유지

/Users/lee/dev/my-blog/.claude/
└── no-barrel-hook                   [신규] 빈 sentinel 마커 파일
```

접근성: N/A — 인터랙티브 UI 없음.

---

## 6. 기술 설계

### 변경 파일

| 파일 | 역할 | 변경 |
|---|---|---|
| `~/.claude/hooks/post-barrel.sh` | PostToolUse 배럴 검사 훅(전역) | ① 최상단 마커 가드 조기 종료 ② write 모드 "index.ts 없으면 차단"(30-33행) 제거 |
| `~/.claude/skills/impl-review/SKILL.md` | 구현 리뷰 체크리스트(전역) | #16을 진입점 계약 프레이밍으로 재작성 + `N/A (lint-enforced)` 규정 |
| `/Users/lee/dev/my-blog/.claude/no-barrel-hook` | 이 프로젝트 훅 무력화 sentinel | 신규(빈 파일) |

> bash 훅과 마크다운 체크리스트는 순수 로직이 아닌 하네스 산출물이라 `*.test.ts` 대상 아님. 검증은 §3 회귀 항목의 수동 실증(마커 유/무 × 배럴 유/무 조합)으로 대체.

### 마커 가드 설계 (post-barrel.sh 최상단)

- 프로젝트 루트 결정 우선순위:
  1. `$CLAUDE_PROJECT_DIR`가 비어 있지 않으면 그 값을 루트로 사용.
  2. 비어 있으면 `FILE_PATH`의 디렉토리에서 시작해 상위로 올라가며 `.claude/` 디렉토리를 가진 첫 조상을 루트로 사용(파일시스템 루트 도달 시 중단).
     - **폴백은 `FILE_PATH`가 절대경로일 때만** 수행한다. 상대/빈 경로는 `dirname`이 `.`에서 고정점에 걸려 무한루프가 되므로 즉시 `return`(가드 미발동). 절대경로 순회에도 `parent == dir` 고정점 방어를 둔다. (코드리뷰 Important #1 반영)
- 결정된 루트에 `.claude/no-barrel-hook`(파일)이 존재하면 `exit 0`.
- 가드는 `.ts/.tsx` 필터·`index.ts` 스킵보다 **먼저** 두어(스크립트 최상단), 어떤 경로든 이 프로젝트에선 개입 0.
- **알려진 한계**: `CLAUDE_PROJECT_DIR`가 없고 마커 있는 프로젝트 하위에 자체 `.claude/` 없는 중첩 프로젝트가 있으면 walk-up이 상위 마커를 집어 훅이 함께 비활성될 수 있다(오발화). 정상 실행에선 `CLAUDE_PROJECT_DIR`가 주입돼 미발생하는 엣지라 수용. (코드리뷰 Minor #2)

### 마커 파일

- 이름: `no-barrel-hook` (의도가 파일명에 드러남). 위치: 프로젝트 `.claude/`.
- 내용: 훅은 존재 여부만(`-f`) 검사하므로 동작상 내용 무관. **자기설명 주석 3줄**(비활성 사유·설계서 경로)을 넣어 유지보수성을 높인다. 다단계 정책 값은 도입하지 않음(YAGNI, §2 out of scope).

### 상태 관리

해당 없음 — 상태 없는 bash 훅 + 정적 마크다운.

### 핵심 인터페이스/타입

해당 없음 — 타입 정의 없음(bash + md).

---

## 7. 에러 & 피드백 처리

- **훅 차단 메시지**: 기존 write 모드 34-36행(배럴 있는데 심볼 미노출)·edit 모드의 `decision:"block"` + `reason` 메시지는 그대로 유지. 완화로 제거되는 건 "index.ts 없음" 차단 경로 하나뿐이라 새 메시지 불필요.
- **마커 가드**: 조용히 `exit 0`(피드백 없음). 훅이 개입하지 않는 것이 정상 동작이므로 별도 알림 불필요.
- **impl-review**: `N/A (lint-enforced)`는 리포트에 명시적으로 남겨 "점검 누락"이 아니라 "lint가 강제 중"임을 리뷰 근거로 드러낸다.

---

## 8. 결정 사항

1. **훅 완화 범위**: write 모드의 "index.ts 없으면 차단"(30-33행)만 제거. 34-36행(배럴 존재 시 심볼 동기화)·edit 모드는 보존 → "생성 강제"만 버리고 "동기화 넛지"는 유지. (B안)
2. **이 프로젝트 무력화 = 마커 가드**: settings로는 전역 훅을 프로젝트별로 뺄 수 없음(Claude Code 훅은 additive). 따라서 훅 내부 조기 종료 가드 + 프로젝트 마커 파일이 유일하게 견고한 방법. 접근 A(마커)를 "완전 off"로 사용.
3. **왜 완화(B)와 무력화를 둘 다 하나**: 완화는 훅 자체를 FSD-적대적이지 않게 고쳐 나머지 5개 프로젝트를 위한 근본 수정, 무력화는 lint가 SSOT인 이 프로젝트에서 중복 실행 자체를 없애 잔여 오차단(슬라이스 루트에 raw 파일 생성 등)까지 0으로. 상호보완적.
4. **마커 이름/형식**: `.claude/no-barrel-hook`, 빈 파일(존재 여부만). 다단계 정책 스키마는 미도입(YAGNI).
5. **루트 탐색 폴백**: `$CLAUDE_PROJECT_DIR` 우선 + `.claude/` 상향 탐색 폴백 → 훅이 수동 실행/비정상 컨텍스트에서도 견고.
6. **#16은 config 없이 전역 재작성**: (a)/(b)는 FSD뿐 아니라 "배럴=진입점" 관점에서 **보편적으로 틀린** 전제라 모든 프로젝트에서 정정이 옳음. (c)=진입점 계약만 유효. `N/A (lint-enforced)`로 lint 강제 프로젝트의 이중 지적 방지.
7. **settings.json 불변**: 훅 등록을 지우면 6개 전부에서 사라짐 → "이 프로젝트만"이 안 됨. 마커 방식이 정답.
8. **backlog 반영**: 완료 시 backlog.md "전역 하네스의 폴더마다 배럴 전제 정정" 트랙을 ✅ 처리 + 변경 이력 추가.
