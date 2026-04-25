import { describe, expect, it } from "vitest";

import { createWorkerRuntime } from "./runtime";

describe("createWorkerRuntime", () => {
  it("returns the worker name and idle mode", () => {
    expect(createWorkerRuntime()).toEqual({
      name: "@stocker/worker",
      mode: "idle",
    });
  });
});
