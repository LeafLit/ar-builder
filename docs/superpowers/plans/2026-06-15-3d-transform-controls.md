# 3D Transform Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3D rotation slider for built-in model outputs and smooth AR overlay transitions in the test view.

**Architecture:** Reuse the existing `Transform.rotation` tuple, converting UI degrees to radians at the authoring boundary. Pass resolved transform rotation from `TestScreen` into `Model3DPreview`, and keep visual smoothing in CSS.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Three.js, CSS transitions.

---

## File Structure

- Modify `src/features/authoring/AuthoringScreen.tsx`: add model-only rotation slider and conversion helpers.
- Modify `src/features/authoring/AuthoringScreen.test.tsx`: cover saving and restoring model rotation.
- Modify `src/features/ar/Model3DPreview.tsx`: accept and apply a rotation prop.
- Modify `src/features/testing/TestScreen.tsx`: pass output rotation to `Model3DPreview`.
- Modify `src/features/testing/TestScreen.test.tsx`: cover rotation metadata in the 3D preview.
- Modify `src/styles.css`: add smooth overlay transitions.

## Task 1: Authoring Rotation Control

**Files:**
- Modify: `src/features/authoring/AuthoringScreen.tsx`
- Test: `src/features/authoring/AuthoringScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Add one test that selects a 3D model, changes `状态 A 的旋转角度` to `90`, saves, and expects `rotation[1]` to equal `Math.PI / 2`.

Add one test that loads an existing `model3d` binding with `rotation[1] === Math.PI` and expects `状态 A 的旋转角度` to have value `180`.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: fail because the rotation slider does not exist.

- [ ] **Step 3: Implement rotation slider**

Add a model-only range field:

```tsx
{output.assetType === "model3d" && (
  <label className="range-field">
    <span>旋转角度：{anchorValues.rotationY}°</span>
    <input
      aria-label={`${state.name} 的旋转角度`}
      max="360"
      min="0"
      onChange={(event) => updateAnchor(state.id, "rotationY", event.target.value)}
      step="15"
      type="range"
      value={anchorValues.rotationY}
    />
  </label>
)}
```

Update `updateAnchor` and `createAnchorControlValues` so `rotationY` maps between degrees and radians.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: pass.

## Task 2: Pass Rotation Into 3D Preview

**Files:**
- Modify: `src/features/ar/Model3DPreview.tsx`
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Update the existing 3D test so the binding has `rotation: [0, Math.PI / 2, 0]` and the preview is expected to expose `data-rotation-y="1.5708"`.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: fail because `Model3DPreview` does not expose or receive rotation.

- [ ] **Step 3: Implement preview rotation**

Add a `rotation` prop to `Model3DPreview`, apply it in the render loop, and expose `data-rotation-y={rotation[1].toFixed(4)}` for tests.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: pass.

## Task 3: Overlay Transition

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add CSS transition**

Update `.ar-test-overlay` with:

```css
transition:
  left 180ms ease,
  top 180ms ease,
  transform 180ms ease,
  opacity 140ms ease;
```

- [ ] **Step 2: Run focused tests**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: pass.

## Task 4: Full Verification

**Files:**
- All changed files

- [ ] **Step 1: Run full tests**

Run: `pnpm.cmd test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `pnpm.cmd run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Check diff**

Run: `git diff --check`

Expected: no whitespace errors.

