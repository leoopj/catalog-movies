import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { FilterBar } from "./FilterBar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

test("FilterBar troca o gênero mantendo os outros filtros", async () => {
  render(<FilterBar filters={{ ...DEFAULT_FILTERS, servicos: [8] }} genres={[{ id: 28, name: "Ação" }]} />);
  await userEvent.selectOptions(screen.getByLabelText("Gênero"), "28");
  expect(push).toHaveBeenCalledWith("/explorar?servicos=8&genero=28");
});

test("FilterBar marca aluguel/compra", async () => {
  render(<FilterBar filters={DEFAULT_FILTERS} genres={[]} />);
  await userEvent.click(screen.getByLabelText("Aluguel/compra"));
  expect(push).toHaveBeenCalledWith("/explorar?aluguel=1");
});
