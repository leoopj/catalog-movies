import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trailer } from "./Trailer";

test("trailer só carrega o player depois do clique", async () => {
  const { container } = render(<Trailer youtubeKey="abcdefghijk" />);
  expect(container.querySelector("iframe")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: /trailer/i }));
  expect(document.querySelector("iframe")?.getAttribute("src")).toContain("youtube-nocookie.com/embed/abcdefghijk");
});

test("fecha com o botão Fechar", async () => {
  render(<Trailer youtubeKey="abcdefghijk" />);
  await userEvent.click(screen.getByRole("button", { name: /trailer/i }));
  expect(document.querySelector("iframe")).not.toBeNull();
  await userEvent.click(screen.getByRole("button", { name: /fechar/i }));
  expect(document.querySelector("iframe")).toBeNull();
});

test("fecha com Esc", async () => {
  render(<Trailer youtubeKey="abcdefghijk" />);
  await userEvent.click(screen.getByRole("button", { name: /trailer/i }));
  expect(document.querySelector("iframe")).not.toBeNull();
  await userEvent.keyboard("{Escape}");
  expect(document.querySelector("iframe")).toBeNull();
});
