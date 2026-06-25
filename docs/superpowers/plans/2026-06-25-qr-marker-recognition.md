# QR Marker Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a QR marker input mode to the test screen so users can trigger states with explicit QR codes like `ARBUILDER:1`.

**Architecture:** Use `jsqr` for decoding, isolate QR parsing in a focused recognizer module, and extend `TestScreen` input mode selection without changing existing camera classifier or color marker behavior.

**Tech Stack:** React, TypeScript, Vitest, jsQR, existing `CameraService`.

---

### Task 1: Dependency

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] Add `jsqr`.
- [x] Confirm package install completes.

### Task 2: QR Recognizer

**Files:**
- Create: `src/features/testing/qrMarkerRecognizer.test.ts`
- Create: `src/features/testing/qrMarkerRecognizer.ts`

- [x] Test `ARBUILDER:1`, `ARBUILDER:2`, and invalid/out-of-range QR data.
- [x] Test camera recognizer startup, first-frame detection, and stop.
- [x] Implement pure detector and recognizer.

### Task 3: Test Screen Integration

**Files:**
- Modify: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/features/testing/TestScreen.tsx`

- [x] Add a radio option named “二维码标记”.
- [x] Add helper text explaining `ARBUILDER:1 / 2 / 3`.
- [x] Use QR recognizer factory when the QR mode is selected.

### Task 4: Docs and Release

**Files:**
- Modify: `docs/CURRENT_PROGRESS.md`
- Modify: `docs/DEVELOPMENT_MANUAL.md`
- Modify: `docs/PRD.md`
- Modify: `docs/REAL_DEVICE_TEST_PLAN.md`

- [x] Document the QR marker test flow.
- [x] Run `pnpm.cmd test`.
- [x] Run `pnpm.cmd run build`.
- [ ] Commit, push, and confirm GitHub Pages deployment.
