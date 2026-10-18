import { parsePage } from "./paging";

test("parsePage", () => {
  expect(parsePage("2")).toBe(2);
  expect(parsePage("500")).toBe(500);
  for (const v of [null, "0", "-1", "501", "abc", "1.5"]) expect(parsePage(v)).toBeNull();
});
