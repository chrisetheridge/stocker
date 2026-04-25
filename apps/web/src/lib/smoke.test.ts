import { describe, expect, it } from "vitest";

describe("workspace smoke test", () => {
  it("runs vitest in the web app", () => {
    expect(1 + 1).toBe(2);
  });
});
