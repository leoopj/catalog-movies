import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { ProviderStrip } from "./ProviderStrip";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

test("ProviderStrip alterna serviço e Todos limpa", async () => {
  render(<ProviderStrip filters={{ ...DEFAULT_FILTERS, servicos: [8] }} />);
  await userEvent.click(screen.getByRole("button", { name: "Prime Video" }));
  expect(push).toHaveBeenLastCalledWith("/explorar?servicos=8,119");
  await userEvent.click(screen.getByRole("button", { name: "Todos" }));
  expect(push).toHaveBeenLastCalledWith("/explorar");
});
