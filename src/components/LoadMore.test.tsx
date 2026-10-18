import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { mockFetchJson, mockFetchStatus, summary } from "@/test/helpers";
import { LoadMore } from "./LoadMore";

test("LoadMore some na última página", async () => {
  mockFetchJson({ items: [summary], page: 2, totalPages: 2 });
  render(<LoadMore endpoint="/api/filmes?servicos=8" initialPage={1} totalPages={2} />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(fetch).toHaveBeenCalledWith("/api/filmes?servicos=8&page=2");
  expect(await screen.findByRole("link")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
});

test("LoadMore não aparece quando já está na última página", () => {
  render(<LoadMore endpoint="/api/filmes" initialPage={1} totalPages={1} />);
  expect(screen.queryByRole("button")).toBeNull();
});

test("LoadMore em erro mostra mensagem e tentar de novo", async () => {
  mockFetchStatus(503);
  render(<LoadMore endpoint="/api/filmes" initialPage={1} totalPages={5} />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByText("Não foi possível carregar mais filmes.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
});

test("LoadMore reseta itens acumulados quando remontado com key diferente (troca de filtro/termo)", async () => {
  mockFetchJson({ items: [summary], page: 2, totalPages: 3 });

  const { rerender } = render(
    <LoadMore key="/api/filmes?servicos=8" endpoint="/api/filmes?servicos=8" initialPage={1} totalPages={3} />,
  );

  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findAllByRole("link")).toHaveLength(1);

  // Simula a troca de filtro: a página pai passa um endpoint novo e uma key
  // diferente (igual ao padrão usado em explorar/page.tsx e busca/page.tsx),
  // forçando o React a desmontar e remontar o componente.
  mockFetchJson({ items: [summary], page: 2, totalPages: 5 });
  rerender(
    <LoadMore
      key="/api/filmes?servicos=8,119"
      endpoint="/api/filmes?servicos=8,119"
      initialPage={1}
      totalPages={5}
    />,
  );

  // Com o estado resetado, o botão "Carregar mais" volta a aparecer e não há
  // nenhum item acumulado do filtro anterior (nenhum link na tela).
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByRole("button", { name: "Carregar mais" })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(fetch).toHaveBeenLastCalledWith("/api/filmes?servicos=8,119&page=2");
  expect(await screen.findAllByRole("link")).toHaveLength(1);
});
