import type { Category, CategoryRow } from "./types";

export function toCategory(row: CategoryRow): Category {
  return {
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    display_order: row.display_order,
  };
}
