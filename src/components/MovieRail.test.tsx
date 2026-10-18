import { render, screen } from "@testing-library/react";
import { summary, netflixBadge } from "@/test/helpers";
import { MovieRail } from "./MovieRail";

test("carrossel tem link Ver todos e aplica o selo do serviço", () => {
  render(
    <MovieRail
      title="Netflix"
      movies={[summary, { ...summary, id: 2 }]}
      seeAllHref="/explorar?servicos=8"
      badge={netflixBadge}
    />,
  );
  expect(screen.getByRole("link", { name: /ver todos/i })).toHaveAttribute(
    "href",
    "/explorar?servicos=8",
  );
  expect(screen.getAllByLabelText("Serviço: Netflix")).toHaveLength(2);
});

test("carrossel vazio não renderiza", () => {
  const { container } = render(<MovieRail title="X" movies={[]} />);
  expect(container).toBeEmptyDOMElement();
});
