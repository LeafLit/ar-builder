# Color Marker Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an experimental color-marker input mode to the test screen so real devices can trigger states more reliably than pure camera classification in simple demos.

**Architecture:** Keep color detection in a focused testing module. The pure detector reads `ImageData`; the recognizer owns camera startup and periodic frame analysis; `TestScreen` selects between the existing trained camera recognizer and the new color-marker recognizer.

**Tech Stack:** React, TypeScript, Vitest, existing `CameraService`.

---

### Task 1: Pure Color Detection

**Files:**
- Create: `src/features/testing/colorMarkerRecognizer.test.ts`
- Create: `src/features/testing/colorMarkerRecognizer.ts`

- [ ] Write tests for red, green, blue, and low-confidence/no marker frames.
- [ ] Run the test and confirm it fails because the module does not exist.
- [ ] Implement `detectColorMarker(imageData, stateIds)`.
- [ ] Run the color marker test and confirm it passes.

### Task 2: Camera Recognizer

**Files:**
- Modify: `src/features/testing/colorMarkerRecognizer.test.ts`
- Modify: `src/features/testing/colorMarkerRecognizer.ts`

- [ ] Add a test that starts the recognizer, captures a fake red frame, and emits the first state.
- [ ] Add a test that stops the camera stream and interval.
- [ ] Implement `createColorMarkerRecognizer`.
- [ ] Run the color marker test and confirm it passes.

### Task 3: Test Screen Integration

**Files:**
- Modify: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/features/testing/TestScreen.tsx`
- Modify: `src/styles.css`

- [ ] Add tests for the input mode control and color-marker recognizer factory selection.
- [ ] Run `TestScreen` tests and confirm they fail for missing UI/props.
- [ ] Add the mode selector and recognizer factory prop.
- [ ] Run `TestScreen` tests and confirm they pass.

### Task 4: Docs, Verification, Release

**Files:**
- Modify: `docs/CURRENT_PROGRESS.md`
- Modify: `docs/DEVELOPMENT_MANUAL.md`
- Modify: `docs/PRD.md`
- Modify: `docs/REAL_DEVICE_TEST_PLAN.md`

- [ ] Document the color-marker experiment and real-device test steps.
- [ ] Run `pnpm.cmd test`.
- [ ] Run `pnpm.cmd run build`.
- [ ] Commit and push to `main`.
- [ ] Confirm GitHub Pages deployment and provide the cache-busting test URL.
