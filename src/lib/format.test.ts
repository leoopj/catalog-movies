import { formatRuntime, formatVotes } from "./format";

test("formatRuntime e formatVotes", () => {
  expect(formatRuntime(166)).toBe("2h46");
  expect(formatRuntime(45)).toBe("45min");
  expect(formatRuntime(120)).toBe("2h");
  expect(formatRuntime(null)).toBeNull();
  expect(formatVotes(6100)).toBe("6,1 mil votos");
  expect(formatVotes(850)).toBe("850 votos");
});
