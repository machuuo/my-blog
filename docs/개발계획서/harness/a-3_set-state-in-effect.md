# A-3: react-hooks/set-state-in-effect 룰 위반 해소

> baseline 하네스 사이클 A-3.
> `react-hooks/set-state-in-effect` warn→error 승격(완료) 후 위반 1건 해소.

---

## 1. Background & Goals

- `eslint.config.mjs:98`에서 `react-hooks/set-state-in-effect`는 이미 **error**로 승격되어 있으나, `src/widgets/nb-frame/ui/NbFrame.tsx:50`에서 위반 1건이 남아 있어 `pnpm lint`가 exit 1로 실패한다.
- 본 작업의 목표는 해당 위반을 정석 패턴으로 해소하여 baseline에서 해당 룰 항목을 0으로 만들고, 빌드 가드레일을 회복시키는 것이다.
- 더 큰 맥락: `useEffect` 안의 동기 `setState` 호출은 cascading render를 유발하고 React 19의 권장 패턴(외부 시스템과 React state를 명시적으로 동기화하라)에 어긋난다. 본 사이클의 슬로건 "warn → error 가드레일" 원칙과 직결.

---

## 2. Functional Requirements

**사용자 관점**:
- 사용자는 헤더 우측 ☾/☼ 버튼을 눌러 라이트/다크 테마를 토글할 수 있다 (기존 기능 유지).
- 사용자가 새로고침해도 마지막으로 선택한 테마가 유지된다 (기존 기능 유지).
- 다른 탭에서 테마를 변경하면 현재 탭에도 반영된다 (신규 — `storage` 이벤트 구독 부수 효과).

### in scope
- `NbFrame.tsx`의 테마 영속화 로직을 `useSyncExternalStore` 기반 커스텀 훅으로 분리.
- SSR 환경에서 hydration mismatch 회피.

### out of scope
- 시스템 prefers-color-scheme 감지.
- 테마 종류 확장(sepia 등).
- 테마 외 다른 localStorage 동기화 대상.
- `next-themes` 등 라이브러리 도입.

---

## 3. Acceptance Criteria

- [ ] `pnpm lint` 실행 시 `react-hooks/set-state-in-effect` error 0건.
- [ ] `pnpm lint` exit 0.
- [ ] 회귀 차단 검증: 일부러 `useEffect` 안에 동기 `setState`를 추가하면 lint 실패 → 되돌리면 통과.
- [ ] ☾/☼ 토글 시 즉시 테마가 전환된다 (DOM `data-nb-theme` 속성 변경 확인).
- [ ] 다크로 설정 후 새로고침해도 다크가 유지된다.
- [ ] 다른 탭에서 테마를 바꾸면 현재 탭도 반영된다 (`storage` 이벤트 구독).
- [ ] SSR 초기 렌더 시 hydration 경고가 나오지 않는다 (`<html suppressHydrationWarning>` 부착).
- [ ] tsc 통과.

---

## 4. Functional Flow

### 초기 로드 (SSR → hydration)

```
1. 서버: useSyncExternalStore.getServerSnapshot() → 'light'
2. 서버 렌더: <html data-nb-theme 미설정>
3. HTML 전송 → 브라우저 파싱 (모두 라이트로 보임)
4. JS hydrate 시작
5. 클라이언트: getSnapshot() → localStorage.getItem('nb-theme')
6. theme === 'dark'면 useEffect에서 dataset.nbTheme = 'dark' 설정
7. 사용자에게 다크가 표시됨 (수십 ms 깜빡임 허용)
```

### 사용자 토글

```
사용자: ☾ 클릭
→ setTheme(dark === 'dark' ? 'light' : 'dark')
→ localStorage.setItem + storage 이벤트 디스패치 (수동)
→ useSyncExternalStore subscribe 콜백 발화
→ getSnapshot 재호출 → 새 값
→ React 리렌더 → useEffect → dataset 갱신
```

### 외부 탭 변경

```
다른 탭: localStorage.setItem('nb-theme', 'dark')
→ 현재 탭: window 'storage' 이벤트 수신
→ subscribe 콜백 발화 → getSnapshot 재호출 → 리렌더 → dataset 갱신
```

### 에러 시나리오
- `localStorage` 접근 실패(프라이빗 브라우징 등): try/catch로 감싸 'light' fallback. 사용자 인지 가능한 에러 표시 불필요.

---

## 5. UI Design

**N/A — UI 변경 없음.** 시각 결과물은 기존과 동일. 깜빡임 ~50ms는 허용 (Acceptance Criteria에 명시되지 않음 — 별 사이클에서 inline script로 개선 가능).

### 컴포넌트 트리

```
NbFrame (변경)
└─ useNbTheme()  ← 신규 hook (extract)
   └─ useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
```

### 접근성
**N/A — 인터랙티브 UI 변경 없음.** 기존 `<button aria-label="theme">` 유지.

---

## 6. Technical Design

### 파일 변경

| 경로 | 동작 | 역할 |
|---|---|---|
| `src/widgets/nb-frame/lib/useNbTheme.ts` | 신규 | localStorage 기반 테마 동기화 커스텀 훅 |
| `src/widgets/nb-frame/lib/useNbTheme.test.ts` | 신규 | useNbTheme 단위 테스트 (4 케이스) |
| `src/widgets/nb-frame/ui/NbFrame.tsx` | 수정 | `useState + 2x useEffect` → `useNbTheme()` + `1x useEffect(dataset 동기화)` |
| `src/app/layout.tsx` | 수정 | `<html lang="ko" suppressHydrationWarning>` 부착 |

> `widgets/nb-frame/lib/`가 없다면 신규 디렉토리. FSD에서 `lib`은 widget 내부 보조 로직 슬롯.

### 상태 관리

- 테마 상태는 `useSyncExternalStore`로 localStorage를 single source of truth로 삼는다.
- React state는 store의 스냅샷에 불과 — 직접 setState 호출 없음.
- DOM `data-nb-theme` 갱신은 별도 `useEffect(theme)`에서 부수 효과로 수행 (외부 시스템 = DOM, 정당한 useEffect 사용).

### 핵심 인터페이스

```ts
// useNbTheme.ts
type NbTheme = 'light' | 'dark';
function useNbTheme(): {
  theme: NbTheme;
  setTheme: (next: NbTheme) => void;
  toggle: () => void;
};
```

- `subscribe`: `window.addEventListener('storage', cb)` 등록 + cleanup.
- `getSnapshot`: `localStorage.getItem('nb-theme') === 'dark' ? 'dark' : 'light'`. try/catch로 fallback.
- `getServerSnapshot`: 항상 `'light'` 반환 (SSR 안전).
- `setTheme`: localStorage 쓰기 + 같은 탭에 수동 `storage` 이벤트 디스패치 (브라우저는 다른 탭에만 보냄).

### useNbTheme 테스트 케이스 (4)

1. 초기값 — localStorage가 비어있으면 `'light'` 반환.
2. 영속화 — `setTheme('dark')` 호출 후 `localStorage.getItem('nb-theme') === 'dark'`.
3. 외부 변경 동기화 — `storage` 이벤트 디스패치 시 새 값 반영.
4. SSR safe — `window` 미정의 환경(`getServerSnapshot`)에서 `'light'` 반환.

### API 통합
**N/A — 네트워크 호출 없음.**

---

## 7. Error & Feedback Handling

- localStorage 접근 실패 시 `'light'`로 silent fallback. 토스트/에러 UI 불필요.
- hydration mismatch는 `suppressHydrationWarning`로 콘솔 경고 억제 (의도된 클라이언트 전용 상태).
- 성공 피드백: 사용자가 토글 즉시 시각 결과(테마 색)로 피드백 받음. 별도 토스트 불필요.

---

## 8. Decisions

| ID | 결정 | 선택 | 사유 |
|---|---|---|---|
| D1 | localStorage ↔ state 동기화 패턴 | `useSyncExternalStore` | React 18+ 정석. SSR-safe(getServerSnapshot). 룰 통과 확실. 외부 시스템 동기화 의도 코드에 드러남. |
| D2 | SSR hydration 처리 | 서버 light 고정 + `suppressHydrationWarning` | 깜빡임 ~50ms 허용. inline script 부채 회피. 산책 노트 1인 사용에 충분. |
| D3 | hook 추출 위치 | `widgets/nb-frame/lib/useNbTheme.ts` | FSD에서 widget 내부 보조 로직은 `lib` 슬롯. `shared/lib`는 도메인 중립 코드용. |
| D4 | 테스트 작성 | `useNbTheme.test.ts` 신규 4 케이스 | 새 hook 추출 → impl-review 체크리스트 #15 충족. |
| D5 | 다탭 동기화 | `storage` 이벤트 구독 포함 | `useSyncExternalStore` 채택 시 자연스럽게 따라오는 부수 효과. 비용 0. |

모든 결정 사항이 해소되어 미확정 항목 없음.
