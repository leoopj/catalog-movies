import { expect, test, vi } from "vitest";
import { summary } from "@/test/helpers";
import { firstCuratedBadge, withBadges } from "./availability";
import type { WatchAvailability } from "./tmdb/types";

const opt = (id: number) => ({ providerId: id, name: String(id), logoUrl: null });
const empty: WatchAvailability = { link: null, subscription: [], free: [], rent: [], buy: [] };

test("primeiro serviço curado segue a ordem da lista curada", () => {
  const w = { ...empty, subscription: [opt(119), opt(8)] };
  expect(firstCuratedBadge(w)?.id).toBe(8); // Netflix vem antes na lista curada
});

test("só aluguel ou serviço não curado não conta", () => {
  expect(firstCuratedBadge({ ...empty, rent: [opt(8)] })).toBeNull();
  expect(firstCuratedBadge({ ...empty, subscription: [opt(99999)] })).toBeNull();
  expect(firstCuratedBadge({ ...empty, subscription: [opt(1796)] })?.id).toBe(8); // variante com anúncios conta como Netflix
});

test("withBadges omite indisponíveis e falhas, mantendo a ordem", async () => {
  const movies = [1, 2, 3, 4].map((id) => ({ ...summary, id }));
  const lookup = vi.fn(async (id: number) => {
    if (id === 2) throw new Error("x");
    if (id === 3) return empty;
    return { ...empty, free: [opt(8)] };
  });
  const out = await withBadges(movies, lookup);
  expect(out.map((m) => m.id)).toEqual([1, 4]);
  expect(out[0].badge?.name).toBe("Netflix");
});
