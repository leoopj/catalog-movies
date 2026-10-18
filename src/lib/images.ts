const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

function imageUrl(size: string, path: string | null): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

export function posterUrl(path: string | null): string | null {
  return imageUrl("w342", path);
}

export function backdropUrl(path: string | null): string | null {
  return imageUrl("w1280", path);
}

export function profileUrl(path: string | null): string | null {
  return imageUrl("w185", path);
}

export function logoUrl(path: string | null): string | null {
  return imageUrl("w92", path);
}
