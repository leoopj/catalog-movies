import { render, screen } from "@testing-library/react";
import { opt } from "@/test/helpers";
import { WatchProviders } from "./WatchProviders";

test("agrupa na ordem da spec e omite grupos vazios", () => {
  render(
    <WatchProviders
      watch={{
        link: "https://www.themoviedb.org/movie/1/watch?locale=BR",
        subscription: [opt(1899)],
        free: [],
        rent: [opt(2)],
        buy: [],
      }}
    />,
  );
  expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual(["Assinatura", "Aluguel"]);
  expect(screen.getAllByRole("link")[0]).toHaveAttribute(
    "href",
    "https://www.themoviedb.org/movie/1/watch?locale=BR",
  );
  expect(screen.getByText("Dados de disponibilidade fornecidos por JustWatch.")).toBeInTheDocument();
});

test("sem opções mostra aviso", () => {
  render(<WatchProviders watch={{ link: null, subscription: [], free: [], rent: [], buy: [] }} />);
  expect(
    screen.getByText("Este filme não está disponível em streaming no Brasil no momento."),
  ).toBeInTheDocument();
});
