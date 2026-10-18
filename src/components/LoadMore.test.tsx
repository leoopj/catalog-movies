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
