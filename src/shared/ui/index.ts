// shared/ui 세그먼트 공개 배럴 (FSD 진입점).
// shadcn primitive 6종 + notebook 컴포넌트를 단일 진입점(@/shared/ui)으로 노출한다.
// 세그먼트 내부 형제 참조는 relative(./button 등)를 쓰고, 외부 소비자만 이 배럴을 경유한다.
export * from "./badge";
export * from "./breadcrumb";
export * from "./button";
export * from "./card";
export * from "./dialog";
export * from "./separator";
export * from "./notebook";
