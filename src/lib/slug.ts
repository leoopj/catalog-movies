export function movieSlug(id: number, title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${id}-${base}` : `${id}`;
}

export function parseMovieSlug(
  slug: string,
): { id: number; slug: string } | null {
  const match = /^([1-9]\d*)(?:-|$)/.exec(slug);
  if (!match) return null;
  return { id: Number(match[1]), slug };
}
