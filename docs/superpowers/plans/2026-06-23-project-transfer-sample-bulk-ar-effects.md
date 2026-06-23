# Project Transfer, Sample Bulk Actions, and AR Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project import/export, sample delete undo and batch delete, plus a first set of AR feedback effects.

**Architecture:** Keep project transfer logic in a focused utility that serializes both project metadata and camera sample blobs. Extend sample storage with project-level listing and restore operations. Keep UI changes local to the project library, capture screen, and test screen.

**Tech Stack:** React, TypeScript, IndexedDB-backed repositories, Vitest, Testing Library, browser Blob/File APIs.

---

### Task 1: Project Import and Export

**Files:**
- Create: `src/features/projects/projectTransfer.ts`
- Test: `src/features/projects/projectTransfer.test.ts`
- Modify: `src/features/capture/sampleStore.ts`
- Modify: `src/features/capture/sampleStore.test.ts`
- Modify: `src/features/projects/ProjectLibraryPanel.tsx`
- Modify: `src/features/projects/ProjectLibraryPanel.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

- [ ] Write failing tests for project bundles containing project metadata and sample blobs.
- [ ] Add `listByProject` and `saveSampleRecord` to `SampleStore`.
- [ ] Implement export bundle creation and import bundle parsing with new project/sample ids.
- [ ] Add home-page buttons for exporting a saved project and importing a `.json` file.

### Task 2: Sample Undo and Batch Delete

**Files:**
- Modify: `src/features/capture/CaptureScreen.tsx`
- Modify: `src/features/capture/CaptureScreen.test.tsx`
- Modify: `src/styles.css`

- [ ] Write failing tests for single delete undo.
- [ ] Write failing tests for selecting multiple samples and deleting them together.
- [ ] Add selection mode, selected count, batch delete, and undo restore.
- [ ] Keep the sample list bounded and mobile-friendly.

### Task 3: AR Feedback Effects

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Modify: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/styles.css`

- [ ] Write failing tests for vibration on newly confirmed state.
- [ ] Write failing tests for visual overlay transition class.
- [ ] Add an injectable vibration function with browser default `navigator.vibrate`.
- [ ] Add CSS animation for AR overlay entry.

### Task 4: Docs, Verification, Commit, Push

**Files:**
- Modify: `docs/CURRENT_PROGRESS.md`
- Modify: `docs/PRD.md`
- Modify: `docs/DEVELOPMENT_MANUAL.md`
- Modify: `docs/REAL_DEVICE_TEST_PLAN.md`

- [ ] Document the new beginner-facing behavior in Chinese.
- [ ] Run focused tests for changed areas.
- [ ] Run `pnpm.cmd test`.
- [ ] Run `pnpm.cmd run build`.
- [ ] Commit and push to `main`.
