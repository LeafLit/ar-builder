# Custom State Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to rename the two MVP input states and carry those names through capture, training, authoring, testing, and local project save/restore.

**Architecture:** Keep stable internal IDs `state_a` and `state_b`, and add a shared state metadata helper for default names, normalization, and label lookup. App state owns the names; screens receive them via props with default fallbacks for isolated tests and compatibility.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library.

---

## File Structure

- Create: `src/features/projects/projectStates.ts`
  - Shared defaults and helpers for fixed MVP input states.
- Create: `src/features/projects/projectStates.test.ts`
  - Unit tests for normalization, empty-name fallback, and label lookup.
- Modify: `src/app/appState.ts`
  - Add `states` to `AppState`, add `renameState`, load project names.
- Modify: `src/app/appState.test.ts`
  - Cover initial names, rename behavior, and load restore.
- Modify: `src/app/appProjectSnapshot.ts`
  - Save and restore names from app state.
- Modify: `src/app/appProjectSnapshot.test.ts`
  - Cover save/restore with custom names.
- Modify: `src/features/capture/CaptureScreen.tsx`
  - Add state-name inputs and custom labels.
- Modify: `src/features/capture/CaptureScreen.test.tsx`
  - Cover rename callback and custom capture labels.
- Modify: `src/features/ml/TrainScreen.tsx`
  - Accept state metadata and use custom labels in summaries/messages.
- Modify: `src/features/ml/TrainScreen.test.tsx`
  - Cover custom labels in training requirements.
- Modify: `src/features/authoring/AuthoringScreen.tsx`
  - Accept state metadata and use custom labels for controls.
- Modify: `src/features/authoring/AuthoringScreen.test.tsx`
  - Cover custom labels while preserving state IDs in saved output.
- Modify: `src/features/testing/TestScreen.tsx`
  - Accept state metadata and use custom labels for manual recognition, status, count, and missing binding messages.
- Modify: `src/features/testing/TestScreen.test.tsx`
  - Cover custom labels in testing flow.
- Modify: `src/app/App.tsx`
  - Pass app state names into screens and dispatch renames.
- Modify: `src/app/App.test.tsx`
  - Cover rename continuity across the main flow.

---

### Task 1: Shared Project State Helpers

**Files:**
- Create: `src/features/projects/projectStates.test.ts`
- Create: `src/features/projects/projectStates.ts`

- [ ] **Step 1: Write the failing helper tests**

Add:

```ts
import { describe, expect, it } from "vitest";
import {
  createDefaultSampleCounts,
  DEFAULT_PROJECT_STATES,
  getProjectStateName,
  normalizeEditableProjectStates
} from "./projectStates";

describe("projectStates", () => {
  it("provides the two default MVP states", () => {
    expect(DEFAULT_PROJECT_STATES).toEqual([
      { id: "state_a", name: "状态 A", order: 0 },
      { id: "state_b", name: "状态 B", order: 1 }
    ]);
  });

  it("normalizes custom names while preserving fixed state ids", () => {
    expect(
      normalizeEditableProjectStates([
        { id: "state_b", name: "巴掌", order: 1, sampleIds: [] },
        { id: "state_a", name: "拳头", order: 0, sampleIds: [] }
      ])
    ).toEqual([
      { id: "state_a", name: "拳头", order: 0 },
      { id: "state_b", name: "巴掌", order: 1 }
    ]);
  });

  it("falls back to default names for blank or missing states", () => {
    expect(
      normalizeEditableProjectStates([
        { id: "state_a", name: "   ", order: 0, sampleIds: [] }
      ])
    ).toEqual(DEFAULT_PROJECT_STATES);
  });

  it("creates sample count records for known states", () => {
    expect(createDefaultSampleCounts()).toEqual({ state_a: 0, state_b: 0 });
  });

  it("looks up display names with an id fallback", () => {
    const states = normalizeEditableProjectStates([
      { id: "state_a", name: "拳头", order: 0, sampleIds: [] }
    ]);

    expect(getProjectStateName(states, "state_a")).toBe("拳头");
    expect(getProjectStateName(states, "unknown")).toBe("unknown");
  });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `pnpm.cmd test -- src/features/projects/projectStates.test.ts`

Expected: FAIL because `projectStates.ts` does not exist.

- [ ] **Step 3: Implement helpers**

Create:

```ts
import type { InputState } from "./projectTypes";

export type EditableProjectState = Pick<InputState, "id" | "name" | "order">;

export const DEFAULT_PROJECT_STATES: EditableProjectState[] = [
  { id: "state_a", name: "状态 A", order: 0 },
  { id: "state_b", name: "状态 B", order: 1 }
];

export function normalizeEditableProjectStates(
  states: Partial<InputState>[] | undefined = []
): EditableProjectState[] {
  return DEFAULT_PROJECT_STATES.map((defaultState) => {
    const state = states.find((item) => item.id === defaultState.id);
    const name = typeof state?.name === "string" ? state.name.trim() : "";

    return {
      ...defaultState,
      name: name || defaultState.name
    };
  });
}

export function createDefaultSampleCounts(states = DEFAULT_PROJECT_STATES) {
  return Object.fromEntries(states.map((state) => [state.id, 0]));
}

export function getProjectStateName(states: EditableProjectState[], stateId: string) {
  return states.find((state) => state.id === stateId)?.name ?? stateId;
}
```

- [ ] **Step 4: Verify the helper tests pass**

Run: `pnpm.cmd test -- src/features/projects/projectStates.test.ts`

Expected: PASS.

---

### Task 2: App State and Project Snapshot

**Files:**
- Modify: `src/app/appState.test.ts`
- Modify: `src/app/appState.ts`
- Modify: `src/app/appProjectSnapshot.test.ts`
- Modify: `src/app/appProjectSnapshot.ts`

- [ ] **Step 1: Write failing app state tests**

Add tests:

```ts
it("starts with editable default state names", () => {
  expect(initialAppState.states).toEqual([
    { id: "state_a", name: "状态 A", order: 0 },
    { id: "state_b", name: "状态 B", order: 1 }
  ]);
});

it("renames a known state while keeping its id stable", () => {
  const state = appReducer(initialAppState, {
    type: "renameState",
    stateId: "state_a",
    name: "  拳头  "
  });

  expect(state.states[0]).toEqual({ id: "state_a", name: "拳头", order: 0 });
});

it("does not replace a state name with blank text", () => {
  const state = appReducer(initialAppState, {
    type: "renameState",
    stateId: "state_a",
    name: "   "
  });

  expect(state.states[0].name).toBe("状态 A");
});
```

Update the existing `loadProject` test fixture so project states use names `拳头` and `巴掌`, then assert:

```ts
expect(state.states).toEqual([
  { id: "state_a", name: "拳头", order: 0 },
  { id: "state_b", name: "巴掌", order: 1 }
]);
```

- [ ] **Step 2: Verify app state tests fail**

Run: `pnpm.cmd test -- src/app/appState.test.ts`

Expected: FAIL because `states` and `renameState` are missing.

- [ ] **Step 3: Write failing snapshot tests**

In `src/app/appProjectSnapshot.test.ts`, add `states` to `baseState` test data and add:

```ts
it("saves custom state names into project states", () => {
  const project = createProjectFromAppState(
    {
      ...initialAppState,
      states: [
        { id: "state_a", name: "拳头", order: 0 },
        { id: "state_b", name: "巴掌", order: 1 }
      ],
      sampleCounts: { state_a: 2, state_b: 1 }
    },
    { name: "命名状态项目", now: () => "2026-06-18T00:00:00.000Z" }
  );

  expect(project.states.map(({ id, name, order }) => ({ id, name, order }))).toEqual([
    { id: "state_a", name: "拳头", order: 0 },
    { id: "state_b", name: "巴掌", order: 1 }
  ]);
});

it("restores custom state names from a saved project", () => {
  const restored = restoreStateFromProject({
    id: "project_1",
    name: "命名状态项目",
    createdAt: "2026-06-18T00:00:00.000Z",
    updatedAt: "2026-06-18T00:00:00.000Z",
    states: [
      { id: "state_a", name: "拳头", order: 0, sampleIds: [] },
      { id: "state_b", name: "巴掌", order: 1, sampleIds: [] }
    ],
    assets: [],
    bindings: []
  });

  expect(restored.states).toEqual([
    { id: "state_a", name: "拳头", order: 0 },
    { id: "state_b", name: "巴掌", order: 1 }
  ]);
});
```

- [ ] **Step 4: Verify snapshot tests fail**

Run: `pnpm.cmd test -- src/app/appProjectSnapshot.test.ts`

Expected: FAIL because snapshot code still uses hardcoded default names.

- [ ] **Step 5: Implement app state and snapshot support**

Use `EditableProjectState`, `DEFAULT_PROJECT_STATES`, `createDefaultSampleCounts`, and `normalizeEditableProjectStates`.

Changes:

```ts
export type AppState = {
  screen: AppScreen;
  projectId?: string;
  states: EditableProjectState[];
  sampleCounts: Record<string, number>;
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: RecognitionModel;
  settings: ProjectSettings;
};
```

Add action:

```ts
| { type: "renameState"; stateId: string; name: string }
```

Implement:

```ts
case "renameState": {
  const name = action.name.trim();

  if (!name || !state.states.some((item) => item.id === action.stateId)) {
    return state;
  }

  return {
    ...state,
    states: state.states.map((item) =>
      item.id === action.stateId ? { ...item, name } : item
    )
  };
}
```

For load/restore:

```ts
const states = normalizeEditableProjectStates(action.project.states);
sampleCounts: {
  ...createDefaultSampleCounts(states),
  ...Object.fromEntries(action.project.states.map((projectState) => [
    projectState.id,
    projectState.sampleIds.length
  ]))
}
```

For snapshot save:

```ts
const states = normalizeEditableProjectStates(state.states);
states: states.map((projectState) => ({
  ...projectState,
  sampleIds: createSampleIds(projectState.id, state.sampleCounts[projectState.id] ?? 0)
}))
```

- [ ] **Step 6: Verify app state and snapshot tests pass**

Run:

```powershell
pnpm.cmd test -- src/app/appState.test.ts
pnpm.cmd test -- src/app/appProjectSnapshot.test.ts
```

Expected: PASS.

---

### Task 3: Capture Screen State Names

**Files:**
- Modify: `src/features/capture/CaptureScreen.test.tsx`
- Modify: `src/features/capture/CaptureScreen.tsx`

- [ ] **Step 1: Write failing capture tests**

Add:

```tsx
it("lets users rename input states from the capture step", () => {
  const onStateNameChange = vi.fn();

  render(
    <CaptureScreen
      states={[
        { id: "state_a", name: "状态 A", order: 0 },
        { id: "state_b", name: "状态 B", order: 1 }
      ]}
      onNext={vi.fn()}
      onStateNameChange={onStateNameChange}
    />
  );

  fireEvent.change(screen.getByLabelText("状态 A 名称"), {
    target: { value: "拳头" }
  });

  expect(onStateNameChange).toHaveBeenCalledWith("state_a", "拳头");
});

it("uses custom state names in state buttons and capture status", async () => {
  const cameraService = createReadyCameraService();
  const sampleStore = createMemorySampleStore();

  render(
    <CaptureScreen
      cameraService={cameraService}
      sampleStore={sampleStore}
      states={[
        { id: "state_a", name: "拳头", order: 0 },
        { id: "state_b", name: "巴掌", order: 1 }
      ]}
      onNext={vi.fn()}
    />
  );

  fireEvent.click(screen.getByText("开启摄像头"));
  await screen.findByText("摄像头已开启，可以采集样本。");
  fireEvent.click(screen.getByText("采集样本"));

  expect(await screen.findByText("已为 拳头 采集 1 个样本。")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "拳头 1 个样本" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify capture tests fail**

Run: `pnpm.cmd test -- src/features/capture/CaptureScreen.test.tsx`

Expected: FAIL because `states` and `onStateNameChange` props are missing.

- [ ] **Step 3: Implement capture props and UI**

Import `DEFAULT_PROJECT_STATES`.

Add props:

```ts
states?: CaptureState[];
onStateNameChange?: (stateId: string, name: string) => void;
```

Use:

```ts
const states = props.states ?? DEFAULT_PROJECT_STATES;
const [selectedStateId, setSelectedStateId] = useState(states[0]?.id ?? "state_a");
const selectedState = states.find((state) => state.id === selectedStateId) ?? states[0];
```

Add inputs above the state buttons:

```tsx
<div className="state-name-list">
  {states.map((state) => (
    <label className="stack compact-stack" key={state.id}>
      <span>{state.name} 名称</span>
      <input
        aria-label={`${state.name} 名称`}
        onChange={(event) => props.onStateNameChange?.(state.id, event.target.value)}
        type="text"
        value={state.name}
      />
    </label>
  ))}
</div>
```

- [ ] **Step 4: Verify capture tests pass**

Run: `pnpm.cmd test -- src/features/capture/CaptureScreen.test.tsx`

Expected: PASS.

---

### Task 4: Training Screen State Names

**Files:**
- Modify: `src/features/ml/TrainScreen.test.tsx`
- Modify: `src/features/ml/TrainScreen.tsx`

- [ ] **Step 1: Write failing training tests**

Add:

```tsx
it("uses custom state names in sample summaries and missing sample hints", () => {
  render(
    <TrainScreen
      states={[
        { id: "state_a", name: "拳头", order: 0 },
        { id: "state_b", name: "巴掌", order: 1 }
      ]}
      sampleCounts={{ state_a: 2, state_b: 0 }}
      onNext={vi.fn()}
    />
  );

  expect(screen.getByText("拳头：2 个样本")).toBeInTheDocument();
  expect(screen.getByText("巴掌：0 个样本")).toBeInTheDocument();
  expect(screen.getByText("真实训练需要每个状态至少 1 个样本。当前缺少：巴掌。")).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify training tests fail**

Run: `pnpm.cmd test -- src/features/ml/TrainScreen.test.tsx`

Expected: FAIL because `states` prop is missing and labels are hardcoded.

- [ ] **Step 3: Implement training labels**

Import `DEFAULT_PROJECT_STATES`.

Add:

```ts
type TrainingState = {
  id: string;
  name: string;
};
```

Change requirement function:

```ts
function createTrainingRequirementMessage(
  sampleCounts: Record<string, number>,
  states: TrainingState[]
) {
  const missingStates = states
    .filter((state) => (sampleCounts[state.id] ?? 0) <= 0)
    .map((state) => state.name);
```

Render summary by mapping `states`.

- [ ] **Step 4: Verify training tests pass**

Run: `pnpm.cmd test -- src/features/ml/TrainScreen.test.tsx`

Expected: PASS.

---

### Task 5: Authoring Screen State Names

**Files:**
- Modify: `src/features/authoring/AuthoringScreen.test.tsx`
- Modify: `src/features/authoring/AuthoringScreen.tsx`

- [ ] **Step 1: Write failing authoring tests**

Add:

```tsx
it("uses custom state names for authoring controls and keeps state ids on save", () => {
  const onSaveTextOutputs = vi.fn();

  render(
    <AuthoringScreen
      assets={[]}
      bindings={[]}
      states={[
        { id: "state_a", name: "拳头", order: 0 },
        { id: "state_b", name: "巴掌", order: 1 }
      ]}
      onNext={vi.fn()}
      onSaveTextOutputs={onSaveTextOutputs}
    />
  );

  fireEvent.change(screen.getByLabelText("拳头 的 AR 文字"), {
    target: { value: "拳头输出" }
  });
  fireEvent.change(screen.getByLabelText("巴掌 的 AR 文字"), {
    target: { value: "巴掌输出" }
  });
  fireEvent.click(screen.getByText("保存绑定"));

  expect(onSaveTextOutputs).toHaveBeenCalledWith(
    expect.objectContaining({
      state_a: expect.objectContaining({ content: "拳头输出" }),
      state_b: expect.objectContaining({ content: "巴掌输出" })
    })
  );
});
```

- [ ] **Step 2: Verify authoring tests fail**

Run: `pnpm.cmd test -- src/features/authoring/AuthoringScreen.test.tsx`

Expected: FAIL because `states` prop is missing.

- [ ] **Step 3: Implement authoring labels**

Import `DEFAULT_PROJECT_STATES`, add optional `states?: AuthoringState[]`, and replace `AUTHORING_STATES` references inside the component with:

```ts
const states = props.states ?? DEFAULT_PROJECT_STATES;
```

Use `states` for initial outputs, readiness, save, and rendering.

- [ ] **Step 4: Verify authoring tests pass**

Run: `pnpm.cmd test -- src/features/authoring/AuthoringScreen.test.tsx`

Expected: PASS.

---

### Task 6: Test Screen State Names

**Files:**
- Modify: `src/features/testing/TestScreen.test.tsx`
- Modify: `src/features/testing/TestScreen.tsx`

- [ ] **Step 1: Write failing test screen tests**

Add:

```tsx
it("uses custom state names in manual recognition status and counters", () => {
  render(
    <TestScreen
      assets={textAssets}
      bindings={textBindings}
      states={[
        { id: "state_a", name: "拳头", order: 0 },
        { id: "state_b", name: "巴掌", order: 1 }
      ]}
      onBackHome={vi.fn()}
    />
  );

  expect(screen.getByLabelText("拳头 触发 0 次")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "模拟识别拳头" }));

  expect(screen.getByRole("status")).toHaveTextContent("当前识别：拳头");
  expect(screen.getByLabelText("拳头 触发 1 次")).toBeInTheDocument();
});

it("uses custom state names in missing binding messages", () => {
  render(
    <TestScreen
      assets={textAssets}
      bindings={textBindings.filter((binding) => binding.stateId !== "state_b")}
      states={[
        { id: "state_a", name: "拳头", order: 0 },
        { id: "state_b", name: "巴掌", order: 1 }
      ]}
      onBackHome={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "模拟识别巴掌" }));

  expect(screen.getByText("未找到巴掌 的输出绑定。")).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify test screen tests fail**

Run: `pnpm.cmd test -- src/features/testing/TestScreen.test.tsx`

Expected: FAIL because `states` prop is missing.

- [ ] **Step 3: Implement test screen labels**

Import `DEFAULT_PROJECT_STATES`, add optional `states?: TestState[]`, and use:

```ts
const states = props.states ?? DEFAULT_PROJECT_STATES;
```

Replace `TEST_STATES` usage inside the component with `states`. Replace `findTestState(stateId)` with:

```ts
function findTestState(states: TestState[], stateId: string): TestState {
  return states.find((state) => state.id === stateId) ?? { id: stateId, name: stateId };
}
```

Initialize the counter with `states.map((state) => state.id)`.

- [ ] **Step 4: Verify test screen tests pass**

Run: `pnpm.cmd test -- src/features/testing/TestScreen.test.tsx`

Expected: PASS.

---

### Task 7: App Wiring

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write failing App flow test**

Add:

```tsx
it("carries renamed state labels from capture into authoring and testing", async () => {
  render(<App />);

  fireEvent.click(screen.getByText("新建项目"));
  fireEvent.change(screen.getByLabelText("状态 A 名称"), {
    target: { value: "拳头" }
  });
  fireEvent.change(screen.getByLabelText("状态 B 名称"), {
    target: { value: "巴掌" }
  });

  fireEvent.click(screen.getByText("下一步：训练"));
  fireEvent.click(screen.getByText("开始训练"));
  fireEvent.click(await screen.findByText("下一步：编辑"));

  fireEvent.change(screen.getByLabelText("拳头 的 AR 文字"), {
    target: { value: "拳头输出" }
  });
  fireEvent.change(screen.getByLabelText("巴掌 的 AR 文字"), {
    target: { value: "巴掌输出" }
  });
  fireEvent.click(screen.getByText("保存绑定"));
  fireEvent.click(screen.getByText("下一步：测试"));

  fireEvent.click(screen.getByRole("button", { name: "模拟识别拳头" }));

  expect(screen.getByRole("status")).toHaveTextContent("当前识别：拳头");
  expect(screen.getByText("拳头输出")).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify App test fails**

Run: `pnpm.cmd test -- src/app/App.test.tsx`

Expected: FAIL because app does not wire state names through.

- [ ] **Step 3: Wire state names in App**

Pass props:

```tsx
<CaptureScreen
  states={state.states}
  onStateNameChange={(stateId, name) => dispatch({ type: "renameState", stateId, name })}
/>
```

And:

```tsx
<TrainScreen states={state.states} ... />
<AuthoringScreen states={state.states} ... />
<TestScreen states={state.states} ... />
```

- [ ] **Step 4: Verify App test passes**

Run: `pnpm.cmd test -- src/app/App.test.tsx`

Expected: PASS.

---

### Task 8: Full Verification

**Files:**
- All modified files.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
pnpm.cmd test -- src/features/projects/projectStates.test.ts
pnpm.cmd test -- src/app/appState.test.ts
pnpm.cmd test -- src/app/appProjectSnapshot.test.ts
pnpm.cmd test -- src/features/capture/CaptureScreen.test.tsx
pnpm.cmd test -- src/features/ml/TrainScreen.test.tsx
pnpm.cmd test -- src/features/authoring/AuthoringScreen.test.tsx
pnpm.cmd test -- src/features/testing/TestScreen.test.tsx
pnpm.cmd test -- src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run: `pnpm.cmd test`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `pnpm.cmd run build`

Expected: PASS. Vite may print the existing chunk size warning; that warning is acceptable.

- [ ] **Step 4: Check diff hygiene**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Prepare commit commands for user if Codex cannot push**

Use:

```powershell
git add .
git commit -m "feat: add custom state names"
git push origin main
gh run list --repo LeafLit/ar-builder --branch main --limit 3
git rev-parse --short HEAD
```
