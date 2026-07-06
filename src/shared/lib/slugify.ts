export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replaceAll(/[^a-z0-9가-힣\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}
