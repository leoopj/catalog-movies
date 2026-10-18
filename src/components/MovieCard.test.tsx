import { render, screen } from "@testing-library/react";
import { summary, netflixBadge } from "@/test/helpers";
import { MovieCard } from "./MovieCard";

test("card leva ao slug e mostra nota e selo", () => {
  render(
    <MovieCard
      movie={{ ...summary, id: 550, title: "Clube da Luta", rating: 8.4, badge: netflixBadge }}
    />,
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/550-clube-da-luta");
  expect(screen.getByText("★ 8.4")).toBeInTheDocument();
  expect(screen.getByLabelText("Serviço: Netflix")).toBeInTheDocument();
});

test("card sem pôster mostra placeholder com o título", () => {
  render(<MovieCard movie={{ ...summary, title: "Sem Pôster", posterUrl: null }} />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("Sem Pôster")).toBeInTheDocument();
});
