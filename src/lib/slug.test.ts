import { movieSlug, parseMovieSlug } from "./slug";

test("gera slug sem acentos", () => {
  expect(movieSlug(550, "Clube da Luta")).toBe("550-clube-da-luta");
  expect(movieSlug(1, "Ainda Estou Aqui!")).toBe("1-ainda-estou-aqui");
  expect(movieSlug(2, "Deadpool & Wolverine")).toBe("2-deadpool-wolverine");
});
test("título só com símbolos gera só o id", () => {
  expect(movieSlug(3, "???")).toBe("3");
});
test("lê id do slug", () => {
  expect(parseMovieSlug("550-clube-da-luta")).toEqual({ id: 550, slug: "550-clube-da-luta" });
  expect(parseMovieSlug("550")).toEqual({ id: 550, slug: "550" });
});
test("slug inválido", () => {
  expect(parseMovieSlug("abc")).toBeNull();
  expect(parseMovieSlug("0-x")).toBeNull();
  expect(parseMovieSlug("-5-x")).toBeNull();
});
