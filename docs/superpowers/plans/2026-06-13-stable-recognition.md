# Stable Recognition Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 2-frame confirmation and 2-frame lost-clear mechanism for automatic recognition output in AR Builder.

**Architecture:** Introduce a small pure module, `stableRecognition`, that turns raw automatic predictions into a confirmed state id. `TestScreen` keeps the latest confidence for status text, but renders AR output only from the confirmed state id. Manual simulated recognition remains immediate and bypasses the stabilizer.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library.

---

## File Structure

- Create `src/features/testing/stableRecognition.ts`: pure recognition stabilizer state, defaults, and update function.
- Create `src/features/testing/stableRecognition.test.ts`: unit tests for 2-frame match, state switching, and lost-clear behavior.
- Modify `src/features/testing/TestScreen.tsx`: route automatic recognizer predictions through the stabilizer.
- Modify `src/features/testing/TestScreen.test.tsx`: component tests for first-frame suppression, second-frame display, lost-clear, and manual immediacy.

## Stable Recognition API

Use this public API:

```ts
export type StableRecognitionInput = {
  stateId?: string;
  confidence?: number;
};

export type StableRecognitionState = {
  candidateStateId?: string;
  candidateCount: number;
  confirmedStateId?: string;
  missedCount: number;
};

export type StableRecognitionConfig = {
  requiredMatches: number;
  requiredMisses: number;
};

export const DEFAULT_STABLE_RECOGNITION_CONFIG: StableRecognitionConfig = {
  requiredMatches: 2,
  requiredMisses: 2
};

export function createInitialStableRecognitionState(): StableRecognitionState;

export function updateStableRecognition(
  state: StableRecognitionState,
  input: StableRecognitionInput,
  threshold: number,
  config?: StableRecognitionConfig
): StableRecognitionState;
```

Core rules:

- A prediction counts as matched only when `stateId` exists and `confidence >= threshold`.
- First matched frame sets or increments a candidate, but does not confirm unless the candidate count reaches `requiredMatches`.
- Matching a different state resets the candidate count for that new state.
- Missed frames increment `missedCount`.
- When `missedCount >= requiredMisses`, clear candidate and confirmed state.
- Any matched frame resets `missedCount` to 0.

### Task 1: Stable Recognition Pure Module

**Files:**
- Create: `src/features/testing/stableRecognition.ts`
- Test: `src/features/testing/stableRecognition.test.ts`

- [ ] **Step 1: Write failing unit tests**

Create `src/features/testing/stableRecognition.test.ts`:

```ts
import {
  createInitialStableRecognitionState,
  updateStableRecognition
} from "./stableRecognition";

describe("stableRecognition", () => {
  it("does not confirm a state after only one matching frame", () => {
    const state = updateStableRecognition(
      createInitialStableRecognitionState(),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );

    expect(state).toEqual({
      candidateStateId: "state_a",
      candidateCount: 1,
      confirmedStateId: undefined,
      missedCount: 0
    });
  });

  it("confirms a state after two consecutive matching frames", () => {
    const first = updateStableRecognition(
      createInitialStableRecognitionState(),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );
    const second = updateStableRecognition(first, { stateId: "state_a", confidence: 0.8 }, 0.15);

    expect(second.confirmedStateId).toBe("state_a");
    expect(second.candidateCount).toBe(2);
    expect(second.missedCount).toBe(0);
  });

  it("requires two consecutive frames before switching confirmed states", () => {
    const confirmedA = updateStableRecognition(
      updateStableRecognition(
        createInitialStableRecognitionState(),
        { stateId: "state_a", confidence: 0.9 },
        0.15
      ),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );
    const firstB = updateStableRecognition(
      confirmedA,
      { stateId: "state_b", confidence: 0.9 },
      0.15
    );
    const secondB = updateStableRecognition(firstB, { stateId: "state_b", confidence: 0.9 }, 0.15);

    expect(firstB.confirmedStateId).toBe("state_a");
    expect(firstB.candidateStateId).toBe("state_b");
    expect(firstB.candidateCount).toBe(1);
    expect(secondB.confirmedStateId).toBe("state_b");
  });

  it("clears confirmed state after two missed frames", () => {
    const confirmed = updateStableRecognition(
      updateStableRecognition(
        createInitialStableRecognitionState(),
        { stateId: "state_a", confidence: 0.9 },
        0.15
      ),
      { stateId: "state_a", confidence: 0.9 },
      0.15
    );
    const firstMiss = updateStableRecognition(confirmed, { stateId: "state_a", confidence: 0.05 }, 0.15);
    const secondMiss = updateStableRecognition(firstMiss, { stateId: "state_a", confidence: 0.04 }, 0.15);

    expect(firstMiss.confirmedStateId).toBe("state_a");
    expect(firstMiss.missedCount).toBe(1);
    expect(secondMiss.confirmedStateId).toBeUndefined();
    expect(secondMiss.candidateStateId).toBeUndefined();
    expect(secondMiss.candidateCount).toBe(0);
    expect(secondMiss.missedCount).toBe(2);
  });

  it("does not accumulate low-confidence candidates", () => {
    const first = updateStableRecognition(
      createInitialStableRecognitionState(),
      { stateId: "state_a", confidence: 0.05 },
      0.15
    );
    const second = updateStableRecognition(first, { stateId: "state_a", confidence: 0.05 }, 0.15);

    expect(second.confirmedStateId).toBeUndefined();
    expect(second.candidateStateId).toBeUndefined();
    expect(second.candidateCount).toBe(0);
  });
});
```

- [ ] **Step 2: Run unit tests and verify they fail**

Run:

```bash
pnpm.cmd test src/features/testing/stableRecognition.test.ts
```

Expected: fail because `src/features/testing/stableRecognition.ts` does not exist.

- [ ] **Step 3: Implement stable recognition module**

Create `src/features/testing/stableRecognition.ts`:

```ts
export type StableRecognitionInput = {
  stateId?: string;
  confidence?: number;
};

export type StableRecognitionState = {
  candidateStateId?: string;
  candidateCount: number;
  confirmedStateId?: string;
  missedCount: number;
};

export type StableRecognitionConfig = {
  requiredMatches: number;
  requiredMisses: number;
};

export const DEFAULT_STABLE_RECOGNITION_CONFIG: StableRecognitionConfig = {
  requiredMatches: 2,
  requiredMisses: 2
};

export function createInitialStableRecognitionState(): StableRecognitionState {
  return {
    candidateCount: 0,
    missedCount: 0
  };
}

export function updateStableRecognition(
  state: StableRecognitionState,
  input: StableRecognitionInput,
  threshold: number,
  config: StableRecognitionConfig = DEFAULT_STABLE_RECOGNITION_CONFIG
): StableRecognitionState {
  if (!isMatchedPrediction(input, threshold)) {
    const missedCount = state.missedCount + 1;

    if (missedCount >= config.requiredMisses) {
      return {
        candidateCount: 0,
        missedCount
      };
    }

    return {
      ...state,
      candidateStateId: undefined,
      candidateCount: 0,
      missedCount
    };
  }

  const candidateCount =
    state.candidateStateId === input.stateId ? state.candidateCount + 1 : 1;
  const confirmedStateId =
    candidateCount >= config.requiredMatches ? input.stateId : state.confirmedStateId;

  return {
    candidateStateId: input.stateId,
    candidateCount,
    confirmedStateId,
    missedCount: 0
  };
}

function isMatchedPrediction(input: StableRecognitionInput, threshold: number) {
  return (
    input.stateId !== undefined &&
    input.confidence !== undefined &&
    input.confidence >= threshold
  );
}
```

- [ ] **Step 4: Run unit tests and verify they pass**

Run:

```bash
pnpm.cmd test src/features/testing/stableRecognition.test.ts
```

Expected: all `stableRecognition` tests pass.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/features/testing/stableRecognition.ts src/features/testing/stableRecognition.test.ts
git commit -m "feat: add stable recognition confirmation"
```

### Task 2: Wire Stabilizer Into TestScreen

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`

- [ ] **Step 1: Write failing component tests**

Add these tests to `src/features/testing/TestScreen.test.tsx` inside `describe("TestScreen", () => { ... })`:

```ts
  it("waits for two matching automatic recognition frames before showing AR output", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop: vi.fn() };
      })
    };
    const { container } = render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.9 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.88 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();
  });

  it("clears automatic AR output after two missed recognition frames", async () => {
    let emitResult: RecognitionListener = () => undefined;
    const recognizer: StateRecognizer = {
      start: vi.fn(async (onResult) => {
        emitResult = onResult;
        return { stop: vi.fn() };
      })
    };
    const { container } = render(
      <TestScreen
        assets={assets}
        bindings={bindings}
        onBackHome={vi.fn()}
        recognizer={recognizer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "启动自动识别" }));

    await waitFor(() => {
      expect(recognizer.start).toHaveBeenCalledTimes(1);
    });

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.9 });
      emitResult({ stateId: "state_a", confidence: 0.9 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.05 });
    });

    expect(screen.getByText("状态 A 的 AR 输出")).toBeInTheDocument();

    act(() => {
      emitResult({ stateId: "state_a", confidence: 0.04 });
    });

    expect(container.querySelector(".ar-test-overlay")).toBeNull();
  });
```

If this repository's test file contains mojibake literals for the same Chinese labels, use the exact readable literals already visible to Testing Library output in this environment: `启动自动识别`, `状态 A 的 AR 输出`.

- [ ] **Step 2: Run TestScreen tests and verify they fail**

Run:

```bash
pnpm.cmd test src/features/testing/TestScreen.test.tsx
```

Expected: fail because automatic recognition still displays on the first high-confidence frame and does not use missed-frame clearing.

- [ ] **Step 3: Import and initialize stable recognition state**

In `src/features/testing/TestScreen.tsx`, add:

```ts
import {
  createInitialStableRecognitionState,
  updateStableRecognition,
  type StableRecognitionState
} from "./stableRecognition";
```

Add state inside `TestScreen`:

```ts
const [stableRecognition, setStableRecognition] = useState<StableRecognitionState>(
  createInitialStableRecognitionState
);
```

- [ ] **Step 4: Render output from confirmed state**

Replace the current accepted-state calculation:

```ts
const acceptedDetectedState = isRecognitionAccepted(confidence, recognitionThreshold)
  ? detectedState
  : undefined;
```

with:

```ts
const confirmedDetectedState = stableRecognition.confirmedStateId
  ? findTestState(stableRecognition.confirmedStateId)
  : detectedState && confidence === undefined
    ? detectedState
    : undefined;
```

Update consumers:

```ts
const output = confirmedDetectedState
  ? resolveStateOutput(confirmedDetectedState, props.assets, props.bindings)
  : undefined;
const statusText = createStatusText({
  confidence,
  detectedState: confirmedDetectedState,
  recognitionPhase
});
```

Add helper near `createStatusText`:

```ts
function findTestState(stateId: string): TestState {
  return TEST_STATES.find((state) => state.id === stateId) ?? {
    id: stateId,
    name: stateId
  };
}
```

- [ ] **Step 5: Update automatic recognizer callback**

Replace this block:

```ts
const nextState = TEST_STATES.find((state) => state.id === prediction.stateId) ?? {
  id: prediction.stateId,
  name: prediction.stateId
};
setDetectedState(nextState);
setConfidence(prediction.confidence);
```

with:

```ts
setDetectedState(findTestState(prediction.stateId));
setConfidence(prediction.confidence);
setStableRecognition((current) =>
  updateStableRecognition(
    current,
    {
      stateId: prediction.stateId,
      confidence: prediction.confidence
    },
    recognitionThreshold
  )
);
```

- [ ] **Step 6: Reset stable recognition in lifecycle actions**

When starting automatic recognition, after clearing `detectedState` and `confidence`, add:

```ts
setStableRecognition(createInitialStableRecognitionState());
```

When stopping automatic recognition, add:

```ts
setStableRecognition(createInitialStableRecognitionState());
```

When manually detecting a state, add:

```ts
setStableRecognition(createInitialStableRecognitionState());
```

- [ ] **Step 7: Remove unused threshold helper**

Remove `isRecognitionAccepted` if it has no remaining callers:

```ts
function isRecognitionAccepted(confidence: number | undefined, threshold: number) {
  return confidence === undefined || confidence >= threshold;
}
```

- [ ] **Step 8: Run TestScreen tests and verify they pass**

Run:

```bash
pnpm.cmd test src/features/testing/TestScreen.test.tsx
```

Expected: all `TestScreen` tests pass.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add src/features/testing/TestScreen.tsx src/features/testing/TestScreen.test.tsx
git commit -m "feat: stabilize automatic recognition output"
```

### Task 3: Verification

**Files:**
- No source edits unless verification exposes a real bug.

- [ ] **Step 1: Run focused testing module tests**

Run:

```bash
pnpm.cmd test src/features/testing/stableRecognition.test.ts src/features/testing/TestScreen.test.tsx
```

Expected: both testing feature test files pass.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm.cmd test
```

Expected: 26 or more test files pass, with no failed tests.

- [ ] **Step 3: Run production build**

Run:

```bash
pnpm.cmd run build
```

Expected: `tsc -b && vite build` completes successfully.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short --branch
```

Expected: clean working tree on the implementation branch.

- [ ] **Step 5: Commit verification fixes only when needed**

If Step 1, Step 2, or Step 3 exposes a bug and a fix is made, commit the focused fix:

```bash
git add <changed-files>
git commit -m "fix: keep stable recognition verification passing"
```

Expected: no extra commit when verification passes without fixes.

## Self-Review

- Spec coverage: Tasks 1 and 2 cover 2-frame confirmation, 2-frame lost-clear, automatic-only behavior, manual immediacy, and unchanged UI settings.
- Placeholder scan: this plan contains no unresolved placeholder text and every code-changing step includes concrete code.
- Type consistency: `StableRecognitionInput`, `StableRecognitionState`, `StableRecognitionConfig`, `createInitialStableRecognitionState`, and `updateStableRecognition` are named consistently across tasks.
