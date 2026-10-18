export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h${String(rest).padStart(2, "0")}`;
}

export function formatVotes(n: number): string {
  if (n >= 1000) {
    const mil = Math.round(n / 100) / 10;
    return `${mil.toFixed(1).replace(".", ",")} mil votos`;
  }
  return `${n} votos`;
}
