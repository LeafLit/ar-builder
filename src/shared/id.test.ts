import { createId } from "./id";

describe("createId", () => {
  it("creates readable unique ids with a prefix", () => {
    const first = createId("project");
    const second = createId("project");

    expect(first).toMatch(/^project_/);
    expect(second).toMatch(/^project_/);
    expect(first).not.toBe(second);
  });
});
