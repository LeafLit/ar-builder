# WebXR Spatial AR Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe experimental WebXR spatial AR entry that can start immersive AR and place a simple demo object on supported devices.

**Architecture:** Keep WebXR isolated in a dedicated adapter and UI panel. The existing test screen remains the main camera-overlay flow and renders the experiment as an optional section.

**Tech Stack:** React, TypeScript, Three.js, WebXR Device API, Vitest, Testing Library.

---

### Task 1: Spatial AR UI Contract

**Files:**
- Create: `src/features/ar/SpatialARExperiment.tsx`
- Test: `src/features/ar/SpatialARExperiment.test.tsx`

- [ ] Write failing tests for unsupported fallback, supported start flow, placing a demo object, start failure, and stop cleanup.
- [ ] Implement a UI component that depends on an injected adapter.
- [ ] Run the component test file and make it pass.

### Task 2: WebXR Adapter

**Files:**
- Create: `src/features/ar/webxrSpatialAdapter.ts`
- Test: `src/features/ar/webxrSpatialAdapter.test.ts`
- Modify: `src/features/ar/arTypes.ts`

- [ ] Write failing tests for `isSupported`, `requestSession("immersive-ar")`, appending a renderer canvas, placing a demo object, and stopping.
- [ ] Implement a small Three.js adapter with cleanup.
- [ ] Keep WebXR-specific browser objects behind local lightweight types.

### Task 3: Test Screen Integration And Docs

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Modify: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/styles.css`
- Modify: `docs/CURRENT_PROGRESS.md`
- Modify: `docs/REAL_DEVICE_TEST_PLAN.md`

- [ ] Inject/render the spatial AR experiment from the test screen.
- [ ] Add a test that the test screen shows the spatial AR experiment without changing normal overlay behavior.
- [ ] Add mobile-friendly styling.
- [ ] Document the real-device test scope and fallback expectations.
- [ ] Run `pnpm.cmd test` and `pnpm.cmd run build`.
