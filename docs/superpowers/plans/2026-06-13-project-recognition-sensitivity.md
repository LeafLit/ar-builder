# Project Recognition Sensitivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save recognition sensitivity as a per-project setting so reopened AR Builder projects restore the slider value.

**Architecture:** Add a small `ProjectSettings` shape to project data and a matching `settings` field to `AppState`. Keep compatibility by normalizing missing or invalid project settings back to the default 85%. Make `TestScreen` receive the slider value and change callback from `App`, so slider changes update current recognition immediately and are included in the next project save.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, IndexedDB project repository.

---

## File Structure

- Modify `src/features/projects/projectTypes.ts`: define `ProjectSettings` and add optional `settings` to `Project`.
- Modify `src/app/appState.ts`: add default settings, reducer action, settings normalization, and project-load restoration.
- Modify `src/app/appProjectSnapshot.ts`: write settings into project snapshots and restore them from saved projects.
- Modify `src/features/testing/TestScreen.tsx`: make recognition sensitivity controlled by props with default fallback.
- Modify `src/app/App.tsx`: pass settings into `TestScreen` and dispatch setting updates.
- Modify tests in `src/app/appState.test.ts`, `src/app/appProjectSnapshot.test.ts`, `src/features/testing/TestScreen.test.tsx`, and `src/app/App.test.tsx`.

## Constants And Types

Use these names consistently:

```ts
export const DEFAULT_RECOGNITION_SENSITIVITY = 85;
export const MIN_RECOGNITION_SENSITIVITY = 50;
export const MAX_RECOGNITION_SENSITIVITY = 100;

export type ProjectSettings = {
  recognitionSensitivity: number;
};
```

Normalization rule:

```ts
export function normalizeProjectSettings(settings?: Partial<ProjectSettings>): ProjectSettings {
  const recognitionSensitivity = settings?.recognitionSensitivity;

  return {
    recognitionSensitivity:
      Number.isFinite(recognitionSensitivity) &&
      recognitionSensitivity >= MIN_RECOGNITION_SENSITIVITY &&
      recognitionSensitivity <= MAX_RECOGNITION_SENSITIVITY
        ? recognitionSensitivity
        : DEFAULT_RECOGNITION_SENSITIVITY
  };
}
```

### Task 1: App State Stores Project Settings

**Files:**
- Modify: `src/features/projects/projectTypes.ts`
- Modify: `src/app/appState.ts`
- Test: `src/app/appState.test.ts`

- [ ] **Step 1: Write failing tests for default, load, and update behavior**

Add tests to `src/app/appState.test.ts`:

```ts
it("starts with the default recognition sensitivity setting", () => {
  expect(initialAppState.settings).toEqual({
    recognitionSensitivity: 85
  });
});

it("restores recognition sensitivity settings when loading a project", () => {
  const project: Project = {
    id: "project_1",
    name: "保存灵敏度项目",
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
    states: [],
    assets: [],
    bindings: [],
    settings: {
      recognitionSensitivity: 100
    }
  };

  const state = appReducer(initialAppState, { type: "loadProject", project });

  expect(state.settings.recognitionSensitivity).toBe(100);
});

it("falls back to the default recognition sensitivity when loading an old project", () => {
  const project: Project = {
    id: "project_1",
    name: "旧项目",
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
    states: [],
    assets: [],
    bindings: []
  };

  const state = appReducer(initialAppState, { type: "loadProject", project });

  expect(state.settings.recognitionSensitivity).toBe(85);
});

it("updates recognition sensitivity settings", () => {
  const state = appReducer(initialAppState, {
    type: "updateRecognitionSensitivity",
    recognitionSensitivity: 95
  });

  expect(state.settings.recognitionSensitivity).toBe(95);
});
```

- [ ] **Step 2: Run app state tests and verify they fail**

Run:

```bash
pnpm test src/app/appState.test.ts
```

Expected: fail because `settings`, `Project.settings`, and `updateRecognitionSensitivity` do not exist yet.

- [ ] **Step 3: Add project settings types and normalization**

In `src/features/projects/projectTypes.ts`, add exported constants and type near the existing project types:

```ts
export const DEFAULT_RECOGNITION_SENSITIVITY = 85;
export const MIN_RECOGNITION_SENSITIVITY = 50;
export const MAX_RECOGNITION_SENSITIVITY = 100;

export type ProjectSettings = {
  recognitionSensitivity: number;
};

export function normalizeProjectSettings(settings?: Partial<ProjectSettings>): ProjectSettings {
  const recognitionSensitivity = settings?.recognitionSensitivity;

  return {
    recognitionSensitivity:
      Number.isFinite(recognitionSensitivity) &&
      recognitionSensitivity >= MIN_RECOGNITION_SENSITIVITY &&
      recognitionSensitivity <= MAX_RECOGNITION_SENSITIVITY
        ? recognitionSensitivity
        : DEFAULT_RECOGNITION_SENSITIVITY
  };
}
```

Update `Project`:

```ts
export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  states: InputState[];
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: SerializedRecognitionModel;
  settings?: ProjectSettings;
};
```

- [ ] **Step 4: Add settings to app state and reducer**

In `src/app/appState.ts`, import the settings helpers:

```ts
import type {
  Asset,
  Project,
  ProjectSettings,
  StateBinding,
  StateOutputDraft,
  Transform
} from "../features/projects/projectTypes";
import { normalizeProjectSettings } from "../features/projects/projectTypes";
```

Update `AppState`:

```ts
export type AppState = {
  screen: AppScreen;
  projectId?: string;
  sampleCounts: Record<string, number>;
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: RecognitionModel;
  settings: ProjectSettings;
};
```

Update `AppAction`:

```ts
  | { type: "updateRecognitionSensitivity"; recognitionSensitivity: number }
```

Update `initialAppState`:

```ts
export const initialAppState: AppState = {
  screen: "home",
  sampleCounts: {
    state_a: 0,
    state_b: 0
  },
  assets: [],
  bindings: [],
  settings: normalizeProjectSettings()
};
```

Update `loadProject`:

```ts
settings: normalizeProjectSettings(action.project.settings)
```

Add reducer case:

```ts
case "updateRecognitionSensitivity":
  return {
    ...state,
    settings: normalizeProjectSettings({
      ...state.settings,
      recognitionSensitivity: action.recognitionSensitivity
    })
  };
```

- [ ] **Step 5: Run app state tests and verify they pass**

Run:

```bash
pnpm test src/app/appState.test.ts
```

Expected: all `appState` tests pass.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add src/features/projects/projectTypes.ts src/app/appState.ts src/app/appState.test.ts
git commit -m "feat: store recognition sensitivity in app state"
```

### Task 2: Project Snapshots Persist Settings

**Files:**
- Modify: `src/app/appProjectSnapshot.ts`
- Test: `src/app/appProjectSnapshot.test.ts`

- [ ] **Step 1: Write failing snapshot tests**

Add tests to `src/app/appProjectSnapshot.test.ts`:

```ts
it("saves recognition sensitivity settings in project snapshots", () => {
  const state = {
    ...initialAppState,
    settings: {
      recognitionSensitivity: 100
    }
  };

  const project = createProjectFromAppState(state, {
    name: "保存灵敏度项目",
    now: () => "2026-06-13T00:00:00.000Z"
  });

  expect(project.settings).toEqual({
    recognitionSensitivity: 100
  });
});

it("restores recognition sensitivity settings from project snapshots", () => {
  const project: Project = {
    id: "project_1",
    name: "恢复灵敏度项目",
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
    states: [],
    assets: [],
    bindings: [],
    settings: {
      recognitionSensitivity: 95
    }
  };

  expect(restoreStateFromProject(project).settings.recognitionSensitivity).toBe(95);
});

it("uses default recognition sensitivity when restoring old project snapshots", () => {
  const project: Project = {
    id: "project_1",
    name: "旧项目",
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
    states: [],
    assets: [],
    bindings: []
  };

  expect(restoreStateFromProject(project).settings.recognitionSensitivity).toBe(85);
});
```

- [ ] **Step 2: Run snapshot tests and verify they fail**

Run:

```bash
pnpm test src/app/appProjectSnapshot.test.ts
```

Expected: fail because project snapshots do not write or restore settings yet.

- [ ] **Step 3: Write settings into and out of project snapshots**

In `src/app/appProjectSnapshot.ts`, import normalization:

```ts
import {
  normalizeProjectSettings,
  type InputState,
  type Project
} from "../features/projects/projectTypes";
```

In `createProjectFromAppState`, add:

```ts
settings: normalizeProjectSettings(state.settings),
```

In `restoreStateFromProject`, add:

```ts
settings: normalizeProjectSettings(project.settings),
```

- [ ] **Step 4: Run snapshot tests and verify they pass**

Run:

```bash
pnpm test src/app/appProjectSnapshot.test.ts
```

Expected: all `appProjectSnapshot` tests pass.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add src/app/appProjectSnapshot.ts src/app/appProjectSnapshot.test.ts
git commit -m "feat: persist recognition sensitivity in project snapshots"
```

### Task 3: Test Screen Uses Controlled Sensitivity

**Files:**
- Modify: `src/features/testing/TestScreen.tsx`
- Test: `src/features/testing/TestScreen.test.tsx`

- [ ] **Step 1: Write failing controlled-slider tests**

Add tests to `src/features/testing/TestScreen.test.tsx`:

```ts
it("shows the recognition sensitivity passed by the app", () => {
  render(
    <TestScreen
      assets={assets}
      bindings={bindings}
      onBackHome={vi.fn()}
      recognitionSensitivity={95}
      onRecognitionSensitivityChange={vi.fn()}
    />
  );

  expect(screen.getByText("璇嗗埆鐏垫晱搴︼細95%")).toBeInTheDocument();
});

it("notifies the app when recognition sensitivity changes", () => {
  const onRecognitionSensitivityChange = vi.fn();

  render(
    <TestScreen
      assets={assets}
      bindings={bindings}
      onBackHome={vi.fn()}
      recognitionSensitivity={85}
      onRecognitionSensitivityChange={onRecognitionSensitivityChange}
    />
  );

  fireEvent.change(screen.getByLabelText("璇嗗埆鐏垫晱搴?), {
    target: { value: "100" }
  });

  expect(onRecognitionSensitivityChange).toHaveBeenCalledWith(100);
});
```

- [ ] **Step 2: Run test screen tests and verify they fail**

Run:

```bash
pnpm test src/features/testing/TestScreen.test.tsx
```

Expected: fail because `TestScreen` does not accept controlled sensitivity props yet.

- [ ] **Step 3: Make TestScreen sensitivity controlled with a default fallback**

In `src/features/testing/TestScreen.tsx`, import constants from project types and remove the local default/min/max constants:

```ts
import type { Asset, StateBinding, Transform } from "../projects/projectTypes";
import {
  DEFAULT_RECOGNITION_SENSITIVITY,
  MAX_RECOGNITION_SENSITIVITY,
  MIN_RECOGNITION_SENSITIVITY
} from "../projects/projectTypes";
```

Update props:

```ts
recognitionSensitivity?: number;
onRecognitionSensitivityChange?: (recognitionSensitivity: number) => void;
```

Replace local state:

```ts
const recognitionSensitivity =
  props.recognitionSensitivity ?? DEFAULT_RECOGNITION_SENSITIVITY;
```

Add handler:

```ts
function changeRecognitionSensitivity(nextValue: number) {
  props.onRecognitionSensitivityChange?.(nextValue);
}
```

Update slider change:

```tsx
onChange={(event) => changeRecognitionSensitivity(Number(event.currentTarget.value))}
```

Keep existing tests that do not pass the prop working by relying on the default fallback.

- [ ] **Step 4: Run test screen tests and verify they pass**

Run:

```bash
pnpm test src/features/testing/TestScreen.test.tsx
```

Expected: all `TestScreen` tests pass.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add src/features/testing/TestScreen.tsx src/features/testing/TestScreen.test.tsx
git commit -m "feat: control recognition sensitivity from app"
```

### Task 4: App Wires Settings Into Save And Reopen Flow

**Files:**
- Modify: `src/app/App.tsx`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Write failing App integration test**

Add this test to `src/app/App.test.tsx`:

```ts
it("saves and reopens project recognition sensitivity", async () => {
  const savedProjects: Project[] = [];
  const repository: ProjectRepository = {
    list: vi.fn(async () => savedProjects),
    get: vi.fn(async (id) => savedProjects.find((project) => project.id === id)),
    save: vi.fn(async (project) => {
      savedProjects.splice(0, savedProjects.length, project);
    }),
    delete: vi.fn()
  };

  render(<App projectRepository={repository} />);

  fireEvent.click(screen.getByRole("button", { name: "新建项目" }));
  fireEvent.click(screen.getByRole("button", { name: "下一步：训练" }));
  fireEvent.click(screen.getByRole("button", { name: "下一步：编辑" }));
  fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));

  fireEvent.change(screen.getByLabelText("璇嗗埆鐏垫晱搴?), {
    target: { value: "100" }
  });
  fireEvent.click(screen.getByRole("button", { name: "保存项目" }));

  await waitFor(() => {
    expect(repository.save).toHaveBeenCalled();
  });
  expect(savedProjects[0].settings?.recognitionSensitivity).toBe(100);

  fireEvent.click(screen.getByRole("button", { name: "返回首页" }));
  await screen.findByText("本机项目已加载。");
  fireEvent.click(screen.getByRole("button", { name: /继续编辑/ }));
  fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));

  expect(screen.getByText("璇嗗埆鐏垫晱搴︼細100%")).toBeInTheDocument();
});
```

If the existing App flow uses mojibake strings in tests, use the same strings already present in `src/app/App.test.tsx` for button names.

- [ ] **Step 2: Run App tests and verify they fail**

Run:

```bash
pnpm test src/app/App.test.tsx
```

Expected: fail because `App` does not pass or update recognition sensitivity.

- [ ] **Step 3: Wire settings through App**

In `src/app/App.tsx`, pass props to `TestScreen`:

```tsx
<TestScreen
  assets={state.assets}
  bindings={state.bindings}
  recognitionModel={state.recognitionModel}
  recognitionSensitivity={state.settings.recognitionSensitivity}
  onRecognitionSensitivityChange={(recognitionSensitivity) =>
    dispatch({ type: "updateRecognitionSensitivity", recognitionSensitivity })
  }
  onBackHome={() => dispatch({ type: "goTo", screen: "home" })}
/>
```

- [ ] **Step 4: Run App tests and verify they pass**

Run:

```bash
pnpm test src/app/App.test.tsx
```

Expected: all `App` tests pass.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add src/app/App.tsx src/app/App.test.tsx
git commit -m "feat: save project recognition sensitivity"
```

### Task 5: Full Verification

**Files:**
- No new source edits unless tests reveal a real bug.

- [ ] **Step 1: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
pnpm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short --branch
```

Expected: clean working tree on `main`, ahead of `origin/main` by the new local commits.

- [ ] **Step 4: Commit any verification-only fixes**

Only if Step 1 or Step 2 required a code fix, commit the focused fix:

```bash
git add <changed-files>
git commit -m "fix: keep recognition sensitivity persistence stable"
```

Expected: no commit if verification passed without extra edits.

## Self-Review

- Spec coverage: project-level setting, default 85%, old-project compatibility, immediate slider effect, save/reopen flow, and tests are covered by Tasks 1-5.
- Placeholder scan: this plan contains no unresolved placeholders and no unspecified implementation steps.
- Type consistency: `ProjectSettings`, `settings`, `recognitionSensitivity`, and `updateRecognitionSensitivity` are named consistently across tasks.
