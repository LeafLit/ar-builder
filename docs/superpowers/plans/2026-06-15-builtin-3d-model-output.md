# Built-in 3D Model Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add built-in 3D model outputs that can be bound to recognition states and rendered in the mobile camera-overlay test view.

**Architecture:** Extend the existing `StateOutputDraft` and `Asset` model with built-in 3D model IDs, then reuse the current `show` binding path. Keep 3D mesh creation in the AR module and keep Three.js canvas lifecycle isolated in one React component.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Three.js.

---

## File Structure

- Modify `src/features/projects/projectTypes.ts`: add built-in model ID and `Model3DOutputDraft`.
- Modify `src/app/appState.ts`: save `model3d` drafts as assets and bindings.
- Modify `src/app/appState.test.ts`: cover model3d save behavior.
- Create `src/features/ar/model3dCatalog.ts`: built-in model metadata and Three.js mesh factory.
- Create `src/features/ar/model3dCatalog.test.ts`: verify catalog and fallback.
- Create `src/features/ar/Model3DPreview.tsx`: Three.js preview component.
- Modify `src/features/authoring/AuthoringScreen.tsx`: add 3D output type and model selector.
- Modify `src/features/authoring/AuthoringScreen.test.tsx`: cover choosing and saving 3D outputs.
- Modify `src/features/testing/TestScreen.tsx`: render `model3d` assets through `Model3DPreview`.
- Modify `src/features/testing/TestScreen.test.tsx`: cover the 3D output path.
- Modify `src/styles.css`: style the 3D overlay and fallback.

## Task 1: Data Model And Reducer

**Files:**
- Modify: `src/features/projects/projectTypes.ts`
- Modify: `src/app/appState.ts`
- Test: `src/app/appState.test.ts`

- [ ] **Step 1: Write the failing reducer test**

Add a test in `src/app/appState.test.ts` that dispatches `saveTextOutputs` with a `model3d` draft:

```ts
it("saves built-in 3D model outputs as show bindings", () => {
  const nextState = appReducer(initialAppState, {
    type: "saveTextOutputs",
    outputs: {
      state_a: {
        assetType: "model3d",
        modelId: "tree",
        name: "小树",
        transform: {
          position: [0.2, -0.1, 0],
          rotation: [0, 0, 0],
          scale: [1.3, 1.3, 1]
        }
      }
    }
  });

  expect(nextState.assets).toContainEqual({
    id: "asset_model3d_state_a",
    type: "model3d",
    name: "小树",
    modelId: "tree"
  });
  expect(nextState.bindings[0]).toMatchObject({
    id: "binding_state_a",
    stateId: "state_a",
    action: {
      type: "show",
      assetId: "asset_model3d_state_a",
      transform: {
        position: [0.2, -0.1, 0],
        rotation: [0, 0, 0],
        scale: [1.3, 1.3, 1]
      },
      visible: true
    }
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm.cmd test src/app/appState.test.ts`

Expected: fail because `model3d` is not part of `StateOutputDraft`.

- [ ] **Step 3: Implement model types and reducer save path**

Add to `projectTypes.ts`:

```ts
export type BuiltInModel3DId = "cube" | "sphere" | "cone" | "tree";

export type Model3DOutputDraft = {
  assetType: "model3d";
  modelId: BuiltInModel3DId;
  name: string;
  transform: Transform;
};
```

Extend `StateOutputDraft` to include `Model3DOutputDraft`, and add optional `modelId?: BuiltInModel3DId` to `Asset`.

In `appState.ts`, update `normalizeStateOutput`, `createOutputAssetId`, `createOutputAsset`, and the replacement ID set so `model3d` uses `asset_model3d_${stateId}`.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm.cmd test src/app/appState.test.ts`

Expected: pass.

## Task 2: Built-in 3D Catalog

**Files:**
- Create: `src/features/ar/model3dCatalog.ts`
- Test: `src/features/ar/model3dCatalog.test.ts`

- [ ] **Step 1: Write the failing catalog tests**

Create `model3dCatalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BUILT_IN_MODEL_3D_OPTIONS, createBuiltInModelMesh, getBuiltInModel3DOption } from "./model3dCatalog";

describe("model3dCatalog", () => {
  it("provides friendly built-in model options", () => {
    expect(BUILT_IN_MODEL_3D_OPTIONS.map((option) => option.id)).toEqual([
      "cube",
      "sphere",
      "cone",
      "tree"
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
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm.cmd test src/features/ar/model3dCatalog.test.ts`

Expected: fail because the file does not exist.

- [ ] **Step 3: Implement the catalog**

Create the option list with Chinese labels and implement mesh factories using `BoxGeometry`, `SphereGeometry`, `ConeGeometry`, and a simple tree group with trunk plus cone canopy.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm.cmd test src/features/ar/model3dCatalog.test.ts`

Expected: pass.

## Task 3: Authoring Screen 3D Selection

**Files:**
- Modify: `src/features/authoring/AuthoringScreen.tsx`
- Test: `src/features/authoring/AuthoringScreen.test.tsx`

- [ ] **Step 1: Write the failing authoring test**

Add a test that selects `3D 模型`, chooses `小树`, saves bindings, and verifies `onSaveTextOutputs` receives a `model3d` draft with the existing transform shape.

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: fail because the 3D output option is missing.

- [ ] **Step 2: Implement the UI**

Update the output type select to include:

```tsx
<option value="model3d">3D 模型</option>
```

When selected, render a model selector based on `BUILT_IN_MODEL_3D_OPTIONS`. Default to `cube`. Preserve the current transform when switching output types.

- [ ] **Step 3: Run the authoring test and verify GREEN**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: pass.

## Task 4: Test Screen 3D Rendering Path

**Files:**
- Create: `src/features/ar/Model3DPreview.tsx`
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test screen test**

Add a test that passes a `model3d` asset and binding to `TestScreen`, clicks manual state detection, and expects a labelled 3D preview region.

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: fail because `model3d` assets are not rendered yet.

- [ ] **Step 2: Implement `Model3DPreview`**

Create a React component that:

- Checks WebGL support.
- Creates a transparent Three.js renderer.
- Adds camera, lights, and `createBuiltInModelMesh(modelId)`.
- Animates slow rotation.
- Disposes renderer and scene resources on unmount.
- Shows `当前浏览器暂不支持 3D 预览` when WebGL is unavailable.

- [ ] **Step 3: Wire it into `TestScreen`**

Update `renderOutput` so `asset.type === "model3d"` renders `Model3DPreview` with `asset.modelId`.

- [ ] **Step 4: Add CSS**

Add stable dimensions for the 3D overlay:

```css
.ar-test-model3d-output {
  width: clamp(120px, 34vw, 220px);
  aspect-ratio: 1;
}
```

- [ ] **Step 5: Run the test and verify GREEN**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: pass.

## Task 5: Full Verification

**Files:**
- All changed files

- [ ] **Step 1: Run full tests**

Run: `pnpm.cmd test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `pnpm.cmd run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Run local browser verification**

Run: `pnpm.cmd run dev -- --host 127.0.0.1`

Open the local URL in the in-app browser. Verify desktop and mobile viewport screenshots show the authoring option and the 3D test output. If WebGL is available, verify the 3D canvas has nontransparent pixels.

