# State Trigger Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight state trigger counter to the test screen so users can see how many times each trained state has been entered.

**Architecture:** Keep counting rules in a small pure helper and let `TestScreen` update it from the same confirmed state that drives AR output. The counter is session-only for now, with a reset button and no project persistence.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS.

---

## File Structure

- Create `src/features/testing/stateTriggerCounter.ts`: pure counter state, initial state creation, transition update, reset behavior.
- Create `src/features/testing/stateTriggerCounter.test.ts`: pure logic tests for entry counting, repeated active states, lost recognition, and reset.
- Modify `src/features/testing/TestScreen.tsx`: connect confirmed recognition state to the counter and render the counter panel.
- Modify `src/features/testing/TestScreen.test.tsx`: cover manual counting, reset, and automatic lost-then-found counting.
- Modify `src/styles.css`: add compact mobile-friendly counter panel styles.

## Task 1: Pure Counter Helper

**Files:**
- Create: `src/features/testing/stateTriggerCounter.ts`
- Test: `src/features/testing/stateTriggerCounter.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests with this behavior:

```ts
import {
  createInitialStateTriggerCounter,
  resetStateTriggerCounter,
  updateStateTriggerCounter
} from "./stateTriggerCounter";

describe("stateTriggerCounter", () => {
  it("increments only when entering a state", () => {
    let counter = createInitialStateTriggerCounter(["state_a", "state_b"]);

    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, "state_b");

    expect(counter.counts).toEqual({ state_a: 1, state_b: 1 });
    expect(counter.activeStateId).toBe("state_b");
  });

  it("clears the active state when recognition disappears", () => {
    let counter = createInitialStateTriggerCounter(["state_a"]);

    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, undefined);
    counter = updateStateTriggerCounter(counter, "state_a");

    expect(counter.counts.state_a).toBe(2);
    expect(counter.activeStateId).toBe("state_a");
  });

  it("resets all known counts to zero", () => {
    let counter = createInitialStateTriggerCounter(["state_a", "state_b"]);

    counter = updateStateTriggerCounter(counter, "state_a");
    counter = updateStateTriggerCounter(counter, "state_b");

    expect(resetStateTriggerCounter(counter).counts).toEqual({
      state_a: 0,
      state_b: 0
    });
    expect(resetStateTriggerCounter(counter).activeStateId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/testing/stateTriggerCounter.test.ts`

Expected: fail because `stateTriggerCounter.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create:

```ts
export type StateTriggerCounterState = {
  counts: Record<string, number>;
  activeStateId?: string;
};

export function createInitialStateTriggerCounter(
  stateIds: string[]
): StateTriggerCounterState {
  return {
    counts: Object.fromEntries(stateIds.map((stateId) => [stateId, 0]))
  };
}

export function updateStateTriggerCounter(
  current: StateTriggerCounterState,
  nextStateId: string | undefined
): StateTriggerCounterState {
  if (!nextStateId) {
    return current.activeStateId === undefined
      ? current
      : { ...current, activeStateId: undefined };
  }

  if (current.activeStateId === nextStateId) {
    return current;
  }

  return {
    counts: {
      ...current.counts,
      [nextStateId]: (current.counts[nextStateId] ?? 0) + 1
    },
    activeStateId: nextStateId
  };
}

export function resetStateTriggerCounter(
  current: StateTriggerCounterState
): StateTriggerCounterState {
  return {
    counts: Object.fromEntries(Object.keys(current.counts).map((stateId) => [stateId, 0]))
  };
}
```

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/testing/stateTriggerCounter.test.ts`

Expected: pass.

## Task 2: Test Screen Counter UI

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing UI tests**

Add tests that:
- Click `模拟识别状态 A` twice and expect `状态 A 触发 1 次`.
- Click `模拟识别状态 B` and expect `状态 B 触发 1 次`.
- Click `重置计数` and expect both known states to return to `0 次`.

Use labels like:

```ts
expect(screen.getByLabelText("状态 A 触发 1 次")).toBeInTheDocument();
```

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: fail because the counter panel is not rendered.

- [ ] **Step 3: Implement UI**

In `TestScreen.tsx`:
- Import `createInitialStateTriggerCounter`, `resetStateTriggerCounter`, and `updateStateTriggerCounter`.
- Add counter state initialized from `TEST_STATES.map((state) => state.id)`.
- Add a `useEffect` that calls `updateStateTriggerCounter` with `confirmedDetectedState?.id`.
- Render a `状态计数` panel below the sensitivity slider.
- Add `重置计数` button that calls `resetStateTriggerCounter`.

Add CSS for:

```css
.counter-panel { ... }
.counter-panel-header { ... }
.counter-list { ... }
.counter-row { ... }
```

- [ ] **Step 4: Run GREEN**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: pass.

## Task 3: Automatic Lost-Then-Found Counting

**Files:**
- Modify: `src/features/testing/TestScreen.test.tsx`

- [ ] **Step 1: Write failing automatic recognition test**

Add a test that:
- Starts automatic recognition.
- Emits two confident `state_a` predictions and expects `状态 A 触发 1 次`.
- Emits two low-confidence `state_a` predictions and expects AR output to disappear.
- Emits two confident `state_a` predictions again and expects `状态 A 触发 2 次`.

- [ ] **Step 2: Run RED**

Run: `pnpm.cmd test src/features/testing/TestScreen.test.tsx`

Expected: fail until the counter is wired to clear active state when recognition disappears.

- [ ] **Step 3: Adjust implementation if needed**

Ensure the counter effect receives `undefined` when `confirmedDetectedState` becomes empty. If needed, keep the dependency as:

```ts
useEffect(() => {
  setTriggerCounter((current) =>
    updateStateTriggerCounter(current, confirmedDetectedState?.id)
  );
}, [confirmedDetectedState?.id]);
```

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
