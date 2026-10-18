import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBox } from "./SearchBox";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

test("Enter navega para a busca com termo codificado", async () => {
  render(<SearchBox />);
  await userEvent.type(screen.getByRole("searchbox"), "  Amélie & cia {enter}");
  expect(push).toHaveBeenCalledWith("/busca?q=Am%C3%A9lie+%26+cia");
});

test("termo vazio não navega", async () => {
  render(<SearchBox />);
  await userEvent.type(screen.getByRole("searchbox"), "   {enter}");
  expect(push).not.toHaveBeenCalled();
});
