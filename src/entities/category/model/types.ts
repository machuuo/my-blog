import type { Tables } from "@/shared/lib/supabase/database.types";

/** 매퍼 입력 = DB 로우. categories는 전 컬럼 NOT NULL이라 폴백이 없다. */
export type CategoryRow = Tables<"categories">;

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
}
