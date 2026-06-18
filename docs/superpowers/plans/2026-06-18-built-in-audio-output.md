# Built-In Audio Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a built-in audio output type so each detected state can trigger a short sound effect.

**Architecture:** Extend the existing state output draft model with `audio`, save it as an `audio` asset plus `playAudio` binding, and trigger playback in `TestScreen` only when entering a confirmed state. Keep Web Audio details in a small AR module so authoring, state management, and testing stay separated.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Web Audio API.

---

## File Structure

- Create `src/features/ar/audioCatalog.ts`: built-in sound options, default lookup, and Web Audio playback.
- Create `src/features/ar/audioCatalog.test.ts`: catalog tests for option lookup and fallback.
- Modify `src/features/projects/projectTypes.ts`: add `BuiltInAudioId`, `AudioOutputDraft`, and `Asset.audioId`.
- Modify `src/app/appState.ts`: persist audio output drafts as audio assets and `playAudio` bindings.
- Modify `src/app/appState.test.ts`: cover audio asset/binding creation and replacement.
- Modify `src/features/authoring/AuthoringScreen.tsx`: add audio output selection and loading of saved audio bindings.
- Modify `src/features/authoring/AuthoringScreen.test.tsx`: cover saving and loading audio output.
- Modify `src/features/testing/TestScreen.tsx`: resolve `playAudio` bindings and trigger playback once per state entry.
- Modify `src/features/testing/TestScreen.test.tsx`: cover manual/automatic playback, no repeated playback, and playback failure message.

## Task 1: Audio Catalog

**Files:**
- Create: `src/features/ar/audioCatalog.test.ts`
- Create: `src/features/ar/audioCatalog.ts`

- [ ] **Step 1: Write failing catalog tests**

```ts
import { BUILT_IN_AUDIO_OPTIONS, getBuiltInAudioOption } from "./audioCatalog";

describe("audioCatalog", () => {
  it("lists the built-in audio options", () => {
    expect(BUILT_IN_AUDIO_OPTIONS.map((option) => option.label)).toEqual([
      "提示音",
      "成功音",
      "警告音"
    ]);
  });

  it("falls back to the default audio option for an unknown id", () => {
    expect(getBuiltInAudioOption("missing").id).toBe("beep");
  });
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/ar/audioCatalog.test.ts`

Expected: fail because `audioCatalog.ts` does not exist.

- [ ] **Step 3: Implement catalog and player**

Create `BuiltInAudioId`, `BUILT_IN_AUDIO_OPTIONS`, `getBuiltInAudioOption`, and `playBuiltInAudio`. `playBuiltInAudio` should use `AudioContext`/`webkitAudioContext`, resume suspended contexts, schedule short oscillator tones, and reject with a clear error if Web Audio is unavailable.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/ar/audioCatalog.test.ts`

Expected: pass.

## Task 2: Project Types And Reducer Persistence

**Files:**
- Modify: `src/features/projects/projectTypes.ts`
- Modify: `src/app/appState.ts`
- Test: `src/app/appState.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Add tests that:
- Save an audio output draft and expect `asset_audio_state_a` plus a `playAudio` binding.
- Save a text output for a state that previously had `asset_audio_state_a` and expect the old audio asset to be replaced.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/app/appState.test.ts`

Expected: fail because `StateOutputDraft` does not support `audio` and the reducer does not create `playAudio`.

- [ ] **Step 3: Implement types and reducer mapping**

Add `BuiltInAudioId`, `AudioOutputDraft`, `Asset.audioId`, and include audio in `StateOutputDraft`. Update output normalization, asset ID creation, asset creation, binding creation, and replacement IDs.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/app/appState.test.ts`

Expected: pass.

## Task 3: Authoring UI

**Files:**
- Modify: `src/features/authoring/AuthoringScreen.tsx`
- Test: `src/features/authoring/AuthoringScreen.test.tsx`

- [ ] **Step 1: Write failing authoring tests**

Add tests that:
- Select `音效`, choose `成功音`, save, and expect an audio draft.
- Load an existing `playAudio` binding and expect output type `audio` with the saved audio option.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: fail because the UI does not have the audio output type.

- [ ] **Step 3: Implement authoring audio controls**

Import the audio catalog, add `audio` to the output type select, add `updateAudioOutput`, render a built-in audio select, hide anchor controls for audio outputs, and load existing `playAudio` bindings.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: pass.

## Task 4: Test Screen Playback

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`

- [ ] **Step 1: Write failing playback tests**

Add tests that:
- A manual audio state calls the injected player once.
- Clicking the same active state again does not replay.
- Automatic recognition plays again after two missed frames clear the state.
- A rejected playback promise shows `音效播放被浏览器阻止，请点一下页面后重试。`.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: fail because `TestScreen` has no audio player integration.

- [ ] **Step 3: Implement playback**

Add optional `playAudio` prop for tests, default it to `playBuiltInAudio`, resolve `playAudio` actions separately from visual outputs, and use a ref to play only on state entry. Clear the ref when recognition disappears.

- [ ] **Step 4: Run GREEN**

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

- [ ] **Step 3: Check diff**

Run: `git diff --check`

Expected: no whitespace errors.
