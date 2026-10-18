import { DEFAULT_FILTERS, parseFilters, serializeFilters, toDiscoverParams } from "./filters";

test("URL vazia dá os padrões", () => {
  expect(parseFilters(new URLSearchParams(""))).toEqual(DEFAULT_FILTERS);
  expect(DEFAULT_FILTERS).toEqual({ servicos: [], aluguel: false, genero: null, anoDe: null, anoAte: null, nota: null, ordem: "popularidade" });
});
test("lê todos os filtros", () => {
  const f = parseFilters(new URLSearchParams("servicos=8,119&genero=28&ano=2020-2024&nota=7&ordem=nota&aluguel=1"));
  expect(f).toEqual({ servicos: [8, 119], aluguel: true, genero: 28, anoDe: 2020, anoAte: 2024, nota: 7, ordem: "nota" });
});
test("ano único vira faixa de um ano", () => {
  const f = parseFilters(new URLSearchParams("ano=2020"));
  expect([f.anoDe, f.anoAte]).toEqual([2020, 2020]);
});
test("valores inválidos voltam ao padrão", () => {
  const f = parseFilters(new URLSearchParams("servicos=abc,999,8&genero=-3&ano=3000-1000&nota=99&ordem=xpto&aluguel=talvez"));
  expect(f).toEqual({ ...DEFAULT_FILTERS, servicos: [8] });
});
test("aceita Record de searchParams do Next", () => {
  expect(parseFilters({ servicos: "8", ordem: ["nota", "x"] }).ordem).toBe("nota");
});
test("serialização omite padrões e faz ida e volta", () => {
  expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
  const q = "servicos=8,119&genero=28&ano=2020-2024&nota=7&ordem=nota&aluguel=1";
  expect(serializeFilters(parseFilters(new URLSearchParams(q)))).toBe(q);
});
test("parâmetros do discover com padrões", () => {
  expect(toDiscoverParams(DEFAULT_FILTERS, 1)).toEqual({
    watch_region: "BR", language: "pt-BR", include_adult: "false",
    with_watch_providers: "8|1796|119|2100|337|1899|307|350|531|2303|2302|484|283|47",
    with_watch_monetization_types: "flatrate|free|ads",
    sort_by: "popularity.desc", page: "1",
  });
});
test("parâmetros do discover com todos os filtros", () => {
  const p = toDiscoverParams(parseFilters(new URLSearchParams("servicos=8,119&genero=28&ano=2020-2024&nota=7&aluguel=1&ordem=lancamento")), 3);
  expect(p).toMatchObject({
    with_watch_providers: "8|1796|119|2100", with_genres: "28",
    "primary_release_date.gte": "2020-01-01", "primary_release_date.lte": "2024-12-31",
    "vote_average.gte": "7", "vote_count.gte": "100",
    with_watch_monetization_types: "flatrate|free|ads|rent|buy",
    sort_by: "primary_release_date.desc", page: "3",
  });
});
test("ID de variante na URL é descartado (só IDs principais valem)", () => {
  expect(parseFilters(new URLSearchParams("servicos=1796,8")).servicos).toEqual([8]);
});
test("ordenar por nota exige 100 votos mesmo sem nota mínima", () => {
  const p = toDiscoverParams({ ...DEFAULT_FILTERS, ordem: "nota" }, 1);
  expect(p.sort_by).toBe("vote_average.desc");
  expect(p["vote_count.gte"]).toBe("100");
});
