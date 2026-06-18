# Combined Visual Audio Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a state to show a visual AR output and play one built-in audio cue at the same time.

**Architecture:** Extend visual output drafts with an optional audio cue, have `appState` expand one draft into one visual binding plus an optional audio binding, and have authoring/testing query visual and audio bindings independently by action type. Keep pure audio output behavior unchanged.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing Web Audio helper.

---

## File Structure

- Modify `src/features/projects/projectTypes.ts`: add `AudioCueDraft` and optional `audio` on text, image, and model output drafts.
- Modify `src/app/appState.ts`: expand visual drafts with optional audio into two assets and two bindings.
- Modify `src/app/appState.test.ts`: cover visual + audio saving and removal of stale attached audio.
- Modify `src/features/authoring/AuthoringScreen.tsx`: add “附加音效” select for visual outputs and load existing visual + audio bindings.
- Modify `src/features/authoring/AuthoringScreen.test.tsx`: cover saving/loading attached audio.
- Modify `src/features/testing/TestScreen.tsx`: resolve visual `show` and audio `playAudio` bindings independently.
- Modify `src/features/testing/TestScreen.test.tsx`: cover simultaneous visual rendering and audio playback.

## Task 1: Project Types And Reducer

**Files:**
- Modify: `src/features/projects/projectTypes.ts`
- Modify: `src/app/appState.ts`
- Test: `src/app/appState.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Add a test that saves:

```ts
state_a: {
  content: "显示文字",
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  },
  audio: {
    audioId: "success",
    name: "成功音"
  }
}
```

Expect two assets: `asset_text_state_a` and `asset_audio_state_a`.

Expect two bindings: `binding_state_a` with `show`, and `binding_audio_state_a` with `playAudio`.

Add another test that starts with an existing `asset_audio_state_a` plus `binding_audio_state_a`, saves plain text for `state_a`, and expects the stale audio asset and binding to be removed.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/app/appState.test.ts`

Expected: fail because visual drafts do not support attached audio and the reducer only creates one binding per state.

- [ ] **Step 3: Implement reducer support**

Add:

```ts
export type AudioCueDraft = {
  audioId: BuiltInAudioId;
  name: string;
};
```

Add `audio?: AudioCueDraft` to text, image, and model drafts. Update normalization so visual outputs preserve `audio`.

Change output asset and binding creation to return arrays:

```ts
function createOutputAssets(stateId: string, output: StateOutputDraft): Asset[] {
  // primary asset plus optional attached audio asset
}

function createOutputBindings(stateId: string, output: StateOutputDraft): StateBinding[] {
  // primary show/playAudio binding plus optional binding_audio_stateId
}
```

Keep pure audio output using `binding_state_a` as before.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/app/appState.test.ts`

Expected: pass.

## Task 2: Authoring Attached Audio UI

**Files:**
- Modify: `src/features/authoring/AuthoringScreen.tsx`
- Test: `src/features/authoring/AuthoringScreen.test.tsx`

- [ ] **Step 1: Write failing authoring tests**

Add a test that enters text for state A, selects `成功音` from `状态 A 的附加音效`, saves, and expects the saved draft to include:

```ts
audio: {
  audioId: "success",
  name: "成功音"
}
```

Add a test that loads existing visual and audio bindings for state A and expects:

```ts
screen.getByLabelText("状态 A 的输出类型")).toHaveValue("text");
screen.getByLabelText("状态 A 的附加音效")).toHaveValue("alert");
```

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: fail because the attached audio select does not exist and loading only reads one binding.

- [ ] **Step 3: Implement authoring support**

Add an attached audio select for non-audio outputs:

```tsx
<label className="stack compact-stack">
  <span>{state.name} 的附加音效</span>
  <select
    aria-label={`${state.name} 的附加音效`}
    onChange={(event) => updateAttachedAudio(state.id, event.target.value)}
    value={getAttachedAudioValue(output)}
  >
    <option value="none">不播放音效</option>
    {BUILT_IN_AUDIO_OPTIONS.map((option) => (
      <option key={option.id} value={option.id}>{option.label}</option>
    ))}
  </select>
</label>
```

Update `getStateOutputDraft` to find the visual `show` binding and audio `playAudio` binding separately.

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/authoring/AuthoringScreen.test.tsx`

Expected: pass.

## Task 3: Test Screen Independent Resolution

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`

- [ ] **Step 1: Write failing test screen tests**

Add a test with state A having both:

```ts
{
  id: "binding_state_a",
  stateId: "state_a",
  action: { type: "show", assetId: "asset_text_state_a", visible: true, transform }
}
```

and:

```ts
{
  id: "binding_audio_state_a",
  stateId: "state_a",
  action: { type: "playAudio", assetId: "asset_audio_state_a" }
}
```

Expect manual recognition to show the text output and call `playAudio("success")` once.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: fail because `resolveStateAudio` currently only checks the first binding returned by the rule engine.

- [ ] **Step 3: Implement independent binding lookup**

Update `resolveStateOutput` and `resolveStateAudio` to directly search `bindings` by both `stateId` and `action.type`.

Keep pure audio output returning no visual output.

- [ ] **Step 4: Run GREEN**

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
