# Multi-State MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow AR Builder projects to use up to 4 editable recognition states across capture, training, authoring, testing, save, import, and export.

**Architecture:** Extend the existing `states` array helpers instead of introducing a second state model. Add reducer actions for adding and deleting states, pass callbacks into the capture page, and keep downstream pages array-driven.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, IndexedDB sample store.

---

### Task 1: State Helpers

**Files:**
- Modify: `src/features/projects/projectStates.ts`
- Test: `src/features/projects/projectStates.test.ts`

- [ ] Add tests for preserving extra project states, capping normalized states at 4, creating the next state, and detecting whether a state can be deleted.
- [ ] Implement `MAX_PROJECT_STATES`, `createNextProjectState`, `canDeleteProjectState`, and update `normalizeEditableProjectStates`.
- [ ] Run `pnpm.cmd test src\features\projects\projectStates.test.ts`.

### Task 2: App Reducer

**Files:**
- Modify: `src/app/appState.ts`
- Modify: `src/app/appProjectSnapshot.ts`
- Test: `src/app/appState.test.ts`
- Test: `src/app/appProjectSnapshot.test.ts`

- [ ] Add failing reducer tests for adding up to 4 states and deleting only extra states.
- [ ] Add failing snapshot tests proving extra states are saved and restored.
- [ ] Implement `addState` and `deleteState` actions.
- [ ] Clean deleted state sample counts, assets, bindings, and recognition model.
- [ ] Run targeted reducer and snapshot tests.

### Task 3: Capture UI

**Files:**
- Modify: `src/features/capture/CaptureScreen.tsx`
- Test: `src/features/capture/CaptureScreen.test.tsx`

- [ ] Add failing UI tests for the add-state button, max-state limit, and deleting an extra state.
- [ ] Add optional `onAddState` and `onDeleteState` props.
- [ ] Render state management controls in the existing state-name panel.
- [ ] Keep default two states non-deletable.
- [ ] Run capture tests.

### Task 4: App Wiring And Docs

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `docs/CURRENT_PROGRESS.md`
- Modify: `docs/PRD.md`
- Modify: `docs/DEVELOPMENT_MANUAL.md`
- Modify: `docs/REAL_DEVICE_TEST_PLAN.md`

- [ ] Wire capture callbacks to reducer actions.
- [ ] Add an app-level test that creates an extra state and sees it in the flow.
- [ ] Update Chinese docs with the new real-device test scope.
- [ ] Run `pnpm.cmd test`, then `pnpm.cmd run build`.
- [ ] Commit and push after all checks pass.
