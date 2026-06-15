import { describe, expect, it } from "vitest";
import {
  BUILT_IN_MODEL_3D_OPTIONS,
  createBuiltInModelMesh,
  getBuiltInModel3DOption
} from "./model3dCatalog";

describe("model3dCatalog", () => {
  it("provides friendly built-in model options", () => {
    expect(BUILT_IN_MODEL_3D_OPTIONS.map((option) => option.id)).toEqual([
      "cube",
      "sphere",
      "cone",
      "tree"
    ]);
    expect(BUILT_IN_MODEL_3D_OPTIONS.map((option) => option.label)).toEqual([
      "立方体",
      "球体",
      "圆锥",
      "小树"
    ]);
  });

  it("falls back to cube for unknown model ids", () => {
    expect(getBuiltInModel3DOption("missing").id).toBe("cube");
  });

  it("creates a mesh group for a built-in model", () => {
    const mesh = createBuiltInModelMesh("tree");

    expect(mesh.type).toBe("Group");
    expect(mesh.children.length).toBeGreaterThan(0);
  });
});
