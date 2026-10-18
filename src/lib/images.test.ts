import { posterUrl, backdropUrl } from "./images";

test("monta URL de pôster", () => {
  expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
});
test("caminho nulo vira null", () => {
  expect(backdropUrl(null)).toBeNull();
});
