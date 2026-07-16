import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import unusedImports from "eslint-plugin-unused-imports"
import boundaries from "eslint-plugin-boundaries"
import sonarjs from "eslint-plugin-sonarjs"
import unicorn from "eslint-plugin-unicorn"

// 점진(1) = 1차 도입 시 warn으로 시작. lint-baseline.json ratchet으로 추적.
// 후속 PR에서 위반 해소 후 error 승격 + baseline 항목 제거.

// ── FSD 슬라이스 내부의 api segment에만 적용 (Next Route Handler 제외) ──
const API_LAYER_PATTERNS = [
  { selector: "CallExpression[callee.property.name='sort']", message: "api segment에서 .sort() 금지. shared/lib 또는 model로 옮기세요." },
  { selector: "CallExpression[callee.property.name='reverse']", message: "api segment에서 .reverse() 금지." },
  { selector: "CallExpression[callee.property.name='reduce']", message: "api segment에서 .reduce() 금지." },
  { selector: "CallExpression[callee.property.name='flat']", message: "api segment에서 .flat() 금지." },
  { selector: "CallExpression[callee.property.name='flatMap']", message: "api segment에서 .flatMap() 금지." },
  { selector: "NewExpression[callee.name='Date']", message: "api segment에서 new Date() 금지." },
  { selector: "MemberExpression[object.name='Math']", message: "api segment에서 Math.* 금지." },
  { selector: "MemberExpression[object.name='localStorage']", message: "api segment에서 localStorage 금지." },
  { selector: "MemberExpression[object.name='sessionStorage']", message: "api segment에서 sessionStorage 금지." },
  { selector: "MemberExpression[object.name='window']", message: "api segment에서 window 금지." },
  { selector: "MemberExpression[object.name='document']", message: "api segment에서 document 금지." },
  {
    selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='parse'][callee.object.name='JSON']",
    message: "api segment에서 JSON.parse() 금지."
  },
]

const IGNORE_TEST = ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"]

// ── FSD 공개 진입점 (배럴 소비 강제, internalPath = element 루트 기준 상대경로) ──
// boundaries/dependencies의 allow selector에 붙여 "어느 레이어냐(상→하)"에 더해
// "그 레이어의 공개 진입점(배럴/2차 진입점)으로 들어왔는가"까지 의미적으로 강제한다.
// same-element(내부 형제) import은 checkInternals 기본 false라 검사 제외 → relative(./button) 통과.
const ENTRY_POINTS = {
  slice: "index.ts", // views/widgets/features: 슬라이스 루트 배럴만
  entities: ["index.ts", "server.ts"], // client-safe(index) ↔ server-only fetcher(server) 이중 진입점
  shared: ["*/index.ts", "lib/auth.ts", "lib/supabase/*.ts"], // 세그먼트 배럴 + server-only 예외
}

export default [
  // ── 전역 무시 ──
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "scripts/**",
      "*.config.{js,mjs,ts}",
      "tsconfig.tsbuildinfo",
      // supabase gen types 산출물. 손으로 수정하지 않으므로 스타일 룰 대상에서 제외.
      "src/shared/lib/supabase/database.types.ts",
    ],
  },

  // ── Next.js 규칙 (eslint-config-next 16 native flat) ──
  // react, react-hooks, import, jsx-a11y, @next/next, @typescript-eslint
  // plugin들이 모두 여기서 등록됨.
  ...nextCoreWebVitals,
  ...nextTypescript,

  // ── Next 규칙 중 App Router 무관 항목 ──
  // no-page-custom-font는 Pages Router 전용. 본 프로젝트는 App Router라 무관.
  {
    rules: {
      "@next/next/no-page-custom-font": "off",
    },
  },

  // ── 공통 설정 (모든 src 파일) ──
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: IGNORE_TEST,
    // c-2: type-aware 룰(prefer-nullish-coalescing/prefer-optional-chain) 전제.
    // projectService는 project 배열보다 빠르고 관리 쉬운 typescript-eslint v8 권장 방식.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      boundaries,
      sonarjs,
      unicorn,
      "unused-imports": unusedImports,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app", mode: "folder" },
        { type: "views", pattern: "src/views/*", mode: "folder", capture: ["view"] },
        { type: "widgets", pattern: "src/widgets/*", mode: "folder", capture: ["widget"] },
        { type: "features", pattern: "src/features/*", mode: "folder", capture: ["feature"] },
        { type: "entities", pattern: "src/entities/*", mode: "folder", capture: ["entity"] },
        { type: "shared", pattern: "src/shared", mode: "folder" },
      ],
    },
    rules: {
      // ── TypeScript 기본 ──
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["error", {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-non-null-assertion": "error", // A-4: requireEnv 헬퍼 도입 후 위반 0
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/set-state-in-effect": "error", // 점진(1), React 19 + react-hooks 7 신규 규칙
      "@typescript-eslint/consistent-type-assertions": ["error", {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "never",
      }],
      // .tsx는 override에서 off, .ts는 error로 강제 (Route Handler/utils/lib 계약 명시).
      // 면제: 화살표 함수 표현식(callback), 부모 타입 있는 표현식, HOF의 안쪽 함수
      // → 명시 강제 대상은 declaration(`function NAME()`)에 한정.
      "@typescript-eslint/explicit-function-return-type": ["error", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }],

      // ── React Hooks ──
      "react-hooks/rules-of-hooks": "error",

      // ── import 순환 ──
      "import/no-cycle": ["error", { maxDepth: 3 }],

      // ── 레이어 경계 + FSD 진입점 강제 (boundaries v6 dependencies, modern selector) ──
      // 상→하 레이어 규칙에 진입점(internalPath)을 결합해 하나의 룰로 통합.
      // default:"disallow" + allow(type+internalPath)만 통과 → 잘못된 레이어/딥 import 모두 error.
      // (boundaries/entry-point는 v6에서 deprecated → dependencies+internalPath로 마이그레이션.)
      "boundaries/dependencies": ["error", {
        default: "disallow",
        rules: [
          {
            from: { type: "app" },
            allow: [
              { to: { type: "app" } },
              { to: { type: ["views", "widgets", "features"], internalPath: ENTRY_POINTS.slice } },
              { to: { type: "entities", internalPath: ENTRY_POINTS.entities } },
              { to: { type: "shared", internalPath: ENTRY_POINTS.shared } },
            ],
          },
          {
            from: { type: "views" },
            allow: [
              { to: { type: ["views", "widgets", "features"], internalPath: ENTRY_POINTS.slice } },
              { to: { type: "entities", internalPath: ENTRY_POINTS.entities } },
              { to: { type: "shared", internalPath: ENTRY_POINTS.shared } },
            ],
          },
          {
            from: { type: "widgets" },
            allow: [
              { to: { type: ["widgets", "features"], internalPath: ENTRY_POINTS.slice } },
              { to: { type: "entities", internalPath: ENTRY_POINTS.entities } },
              { to: { type: "shared", internalPath: ENTRY_POINTS.shared } },
            ],
          },
          {
            from: { type: "features" },
            allow: [
              { to: { type: "features", internalPath: ENTRY_POINTS.slice } },
              { to: { type: "entities", internalPath: ENTRY_POINTS.entities } },
              { to: { type: "shared", internalPath: ENTRY_POINTS.shared } },
            ],
          },
          {
            from: { type: "entities" },
            allow: [
              { to: { type: "entities", internalPath: ENTRY_POINTS.entities } },
              { to: { type: "shared", internalPath: ENTRY_POINTS.shared } },
            ],
          },
          {
            from: { type: "shared" },
            allow: [{ to: { type: "shared", internalPath: ENTRY_POINTS.shared } }],
          },
        ],
      }],

      // ── 복잡도 ──
      // b-1: threshold 10 (기본값 15보다 엄격, 현재 최복잡 함수=9 통과). 8은 자의적+향후 마찰로 기각.
      "sonarjs/cognitive-complexity": ["error", 10],

      // ── 제어흐름 스타일 (b-1: early-return 우선 / 중첩삼항 금지) ──
      // CLAUDE.md "Control Flow & Conditionals" 절과 짝. 단순 삼항은 허용(특히 JSX), 중첩만 금지.
      "no-else-return": "error",
      "no-nested-ternary": "error",

      // ── unicorn (선별) ──
      "unicorn/no-array-for-each": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-useless-undefined": "error",
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/throw-new-error": "error",        // c-1
      "unicorn/no-await-expression-member": "error", // c-1 (위반 0)

      // ── import 정렬·구조 (c-1) ──
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/order": ["error", {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        pathGroups: [
          { pattern: "react", group: "external", position: "before" },
          { pattern: "next/**", group: "external", position: "before" },
          { pattern: "@/**", group: "internal" },
        ],
        pathGroupsExcludedImportTypes: ["react"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      }],

      // ── 코드 스타일 (c-1) ──
      "prefer-template": "error",

      // ── type-aware (c-2) ──
      // ||/&& 함정 차단. nullish 의도엔 ??, 중첩 null 체크엔 ?. 강제.
      // 빈 문자열("")/0/false도 폴백 의도인 || 는 line-level eslint-disable로 예외 명시.
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // ── type-aware (tierD-1) ──
      // 타입상 항상 참/거짓인 dead 조건 차단. typegen-1로 타입이 정직해져 채택.
      // DOM/외부 타입이 non-null로 거짓 선언한 값(navigator.clipboard 등)의 방어 ?. 는
      // line-level eslint-disable + 사유로 예외 명시(룰을 끄지 않음).
      "@typescript-eslint/no-unnecessary-condition": "error",

      // ── async 안전성 (s-1, type-aware) ──
      // unhandled rejection / void 위치 Promise 전달 / 잘못된 await 차단.
      // async 핸들러를 JSX void 위치에 넘길 땐 (e) => void fn(e) 로 명시적 무시.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",
    },
  },

  // ── React 컴포넌트 (.tsx) ──
  {
    files: ["src/**/*.tsx"],
    ignores: IGNORE_TEST,
    rules: {
      // 컴포넌트 반환 타입은 JSX.Element로 거의 고정 → 시그니처 노이즈만 큼.
      // .ts(hooks/utils/lib)에선 룰 살아있어 데이터 계층 타입 안전성은 보존.
      // 컴포넌트 내부 헬퍼 추출 강제는 CLAUDE.md orchestrator 원칙 + 아래 max-lines-per-function으로 간접 강제.
      "@typescript-eslint/explicit-function-return-type": "off",

      // 컴포넌트가 80줄 넘으면 경고 → 헬퍼/훅 추출 압박 (CLAUDE.md orchestrator 원칙 보강).
      "max-lines-per-function": ["warn", { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true }],

      "react/jsx-key": "error",
      "react/no-array-index-key": "error",
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary"] }], // 점진(1)
      "react/jsx-no-useless-fragment": "error", // c-1
      "react/self-closing-comp": "error",       // c-1

      // ── 접근성 ──
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/control-has-associated-label": ["error", {
        ignoreElements: ["audio", "canvas", "embed", "input", "textarea", "tr", "video"],
        ignoreRoles: ["grid", "listbox", "menu", "menubar", "radiogroup", "row", "tablist", "toolbar", "tree", "treegrid"],
      }],
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/click-events-have-key-events": "error", // 점진(1)
      "jsx-a11y/no-static-element-interactions": "error", // 점진(1)
    },
  },

  // ── FSD api segment AST 가드 (Next Route Handler 제외) ──
  {
    files: [
      "src/entities/*/api/**/*.{ts,tsx}",
      "src/features/*/api/**/*.{ts,tsx}",
    ],
    ignores: IGNORE_TEST,
    rules: {
      "no-restricted-syntax": ["error", ...API_LAYER_PATTERNS],
    },
  },

  // ── shared/lib (순수 함수 계층) ──
  {
    files: ["src/shared/lib/**/*.{ts,tsx}"],
    ignores: IGNORE_TEST,
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          { name: "react", message: "shared/lib은 React를 import할 수 없습니다 (순수 함수 유지)." },
          { name: "react-dom", message: "shared/lib은 react-dom을 import할 수 없습니다." },
        ],
        patterns: [
          "react/*",
          // 외부 layer alias 차단 — ** 재귀로 deep subpath까지 차단
          "@/app/**",
          "@/views/**",
          "@/widgets/**",
          "@/features/**",
          "@/entities/**",
          // 외부 layer relative-traversal 차단 — alias 우회 방지.
          // shared/lib 내부에서 ../../views 같은 경로로 외부 layer 접근 불가.
          "../**/app/**",
          "../**/views/**",
          "../**/widgets/**",
          "../**/features/**",
          "../**/entities/**",
        ],
      }],
      // shared/lib 내 슬롯 간 자기 참조(예: supabase/ → ../env)는 허용한다.
      // 외부 layer 차단은 위의 no-restricted-imports.patterns(alias + relative)가
      // 모두 강제하므로 relative-parent-imports 룰 자체는 해제 가능.
      "import/no-relative-parent-imports": "off",
    },
  },
]
