# Local Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users rename and delete saved local AR Builder projects from the home screen.

**Architecture:** Keep project persistence in the existing `ProjectRepository`. Extend `ProjectLibraryPanel` with rename/delete UI state and callbacks, and let `App` implement those callbacks by loading, saving, or deleting projects through the repository.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, IndexedDB repository abstraction.

---

## File Structure

- Modify: `src/features/projects/ProjectLibraryPanel.test.tsx`
  - Add panel-level behavior tests for rename, empty rename, delete confirmation, and delete failure.
- Modify: `src/features/projects/ProjectLibraryPanel.tsx`
  - Add rename/delete controls and local UI state.
- Modify: `src/app/App.test.tsx`
  - Add integration tests proving repository data changes when renaming/deleting from home.
- Modify: `src/app/App.tsx`
  - Implement `renameProject` and `deleteProject`, pass them into `ProjectLibraryPanel`.
- Modify: `src/styles.css`
  - Add compact project action/edit styles using existing buttons and inputs.

---

### Task 1: Project Library Panel Rename UI

**Files:**
- Modify: `src/features/projects/ProjectLibraryPanel.test.tsx`
- Modify: `src/features/projects/ProjectLibraryPanel.tsx`

- [ ] **Step 1: Write failing rename tests**

Add tests:

```tsx
it("renames a saved project and refreshes the list", async () => {
  const onRenameProject = vi.fn(async () => undefined);
  const listProjects = vi
    .fn<() => Promise<ProjectSummary[]>>()
    .mockResolvedValueOnce([savedProject])
    .mockResolvedValueOnce([{ ...savedProject, name: "展厅 AR 原型" }]);

  render(
    <ProjectLibraryPanel
      listProjects={listProjects}
      onOpenProject={vi.fn()}
      onRenameProject={onRenameProject}
      onSaveProject={vi.fn()}
    />
  );

  expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重命名 厨房 AR 原型" }));
  fireEvent.change(screen.getByLabelText("项目名称"), {
    target: { value: "展厅 AR 原型" }
  });
  fireEvent.click(screen.getByRole("button", { name: "保存名称" }));

  expect(await screen.findByText("展厅 AR 原型")).toBeInTheDocument();
  expect(onRenameProject).toHaveBeenCalledWith("project_1", "展厅 AR 原型");
  expect(screen.getByRole("status")).toHaveTextContent("项目名称已更新。");
});

it("does not rename a project to a blank name", async () => {
  const onRenameProject = vi.fn();

  render(
    <ProjectLibraryPanel
      listProjects={async () => [savedProject]}
      onOpenProject={vi.fn()}
      onRenameProject={onRenameProject}
      onSaveProject={vi.fn()}
    />
  );

  expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重命名 厨房 AR 原型" }));
  fireEvent.change(screen.getByLabelText("项目名称"), {
    target: { value: "   " }
  });
  fireEvent.click(screen.getByRole("button", { name: "保存名称" }));

  expect(onRenameProject).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("项目名称不能为空。");
});
```

- [ ] **Step 2: Run rename tests and verify RED**

Run: `pnpm.cmd test -- src/features/projects/ProjectLibraryPanel.test.tsx`

Expected: FAIL because rename props and UI do not exist.

- [ ] **Step 3: Implement minimal rename UI**

Add optional prop:

```ts
onRenameProject?: (projectId: string, name: string) => void | Promise<void>;
```

Add local state:

```ts
const [renamingProjectId, setRenamingProjectId] = useState<string | undefined>();
const [draftProjectName, setDraftProjectName] = useState("");
```

Add handlers:

```ts
function startRename(project: ProjectSummary) {
  setRenamingProjectId(project.id);
  setDraftProjectName(project.name);
  setDeleteConfirmProjectId(undefined);
}

async function saveRename(projectId: string) {
  const name = draftProjectName.trim();

  if (!name) {
    setStatus("项目名称不能为空。");
    return;
  }

  try {
    await onRenameProject?.(projectId, name);
    await refreshProjects();
    setRenamingProjectId(undefined);
    setStatus("项目名称已更新。");
  } catch {
    setStatus("重命名项目失败，请稍后再试。");
  }
}
```

Render rename form inside the project item when `renamingProjectId === project.id`.

- [ ] **Step 4: Verify rename tests pass**

Run: `pnpm.cmd test -- src/features/projects/ProjectLibraryPanel.test.tsx`

Expected: PASS.

---

### Task 2: Project Library Panel Delete UI

**Files:**
- Modify: `src/features/projects/ProjectLibraryPanel.test.tsx`
- Modify: `src/features/projects/ProjectLibraryPanel.tsx`

- [ ] **Step 1: Write failing delete tests**

Add tests:

```tsx
it("requires confirmation before deleting a saved project", async () => {
  const onDeleteProject = vi.fn(async () => undefined);
  const listProjects = vi
    .fn<() => Promise<ProjectSummary[]>>()
    .mockResolvedValueOnce([savedProject])
    .mockResolvedValueOnce([]);

  render(
    <ProjectLibraryPanel
      listProjects={listProjects}
      onDeleteProject={onDeleteProject}
      onOpenProject={vi.fn()}
      onSaveProject={vi.fn()}
    />
  );

  expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "删除 厨房 AR 原型" }));
  expect(onDeleteProject).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "确认删除 厨房 AR 原型" }));

  await waitFor(() => {
    expect(screen.queryByText("厨房 AR 原型")).not.toBeInTheDocument();
  });
  expect(onDeleteProject).toHaveBeenCalledWith("project_1");
  expect(screen.getByRole("status")).toHaveTextContent("项目已删除。");
});

it("shows a useful message when deleting a project fails", async () => {
  render(
    <ProjectLibraryPanel
      listProjects={async () => [savedProject]}
      onDeleteProject={async () => {
        throw new Error("delete failed");
      }}
      onOpenProject={vi.fn()}
      onSaveProject={vi.fn()}
    />
  );

  expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "删除 厨房 AR 原型" }));
  fireEvent.click(screen.getByRole("button", { name: "确认删除 厨房 AR 原型" }));

  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent("删除项目失败，请稍后再试。");
  });
});
```

- [ ] **Step 2: Run delete tests and verify RED**

Run: `pnpm.cmd test -- src/features/projects/ProjectLibraryPanel.test.tsx`

Expected: FAIL because delete props and confirmation UI do not exist.

- [ ] **Step 3: Implement delete confirmation UI**

Add optional prop:

```ts
onDeleteProject?: (projectId: string) => void | Promise<void>;
```

Add local state:

```ts
const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | undefined>();
```

Add handlers:

```ts
function startDelete(projectId: string) {
  setDeleteConfirmProjectId(projectId);
  setRenamingProjectId(undefined);
}

async function confirmDelete(projectId: string) {
  try {
    await onDeleteProject?.(projectId);
    await refreshProjects();
    setDeleteConfirmProjectId(undefined);
    setStatus("项目已删除。");
  } catch {
    setStatus("删除项目失败，请稍后再试。");
  }
}
```

Render `删除 <name>` first, then `确认删除 <name>` plus `取消` in confirmation state.

- [ ] **Step 4: Verify panel tests pass**

Run: `pnpm.cmd test -- src/features/projects/ProjectLibraryPanel.test.tsx`

Expected: PASS.

---

### Task 3: App Repository Wiring

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write failing App integration tests**

Add tests using an in-memory `ProjectRepository`:

```tsx
it("renames a saved project from the home project list", async () => {
  const savedProjects: Project[] = [createSavedProject("project_1", "厨房 AR 原型")];
  const repository = createMemoryRepository(savedProjects);

  render(<App projectRepository={repository} />);

  expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "重命名 厨房 AR 原型" }));
  fireEvent.change(screen.getByLabelText("项目名称"), {
    target: { value: "展厅 AR 原型" }
  });
  fireEvent.click(screen.getByRole("button", { name: "保存名称" }));

  expect(await screen.findByText("展厅 AR 原型")).toBeInTheDocument();
  expect(savedProjects[0].name).toBe("展厅 AR 原型");
});

it("deletes a saved project from the home project list", async () => {
  const savedProjects: Project[] = [createSavedProject("project_1", "厨房 AR 原型")];
  const repository = createMemoryRepository(savedProjects);

  render(<App projectRepository={repository} />);

  expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "删除 厨房 AR 原型" }));
  fireEvent.click(screen.getByRole("button", { name: "确认删除 厨房 AR 原型" }));

  await waitFor(() => {
    expect(savedProjects).toHaveLength(0);
  });
  expect(screen.getByRole("status")).toHaveTextContent("项目已删除。");
});
```

Use helper functions in the test file:

```ts
function createSavedProject(id: string, name: string): Project {
  return {
    id,
    name,
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    states: [],
    assets: [],
    bindings: []
  };
}

function createMemoryRepository(savedProjects: Project[]): ProjectRepository {
  return {
    list: vi.fn(async () => savedProjects),
    get: vi.fn(async (id) => savedProjects.find((project) => project.id === id)),
    save: vi.fn(async (project) => {
      const index = savedProjects.findIndex((item) => item.id === project.id);
      if (index >= 0) {
        savedProjects[index] = project;
      } else {
        savedProjects.push(project);
      }
    }),
    delete: vi.fn(async (id) => {
      const index = savedProjects.findIndex((project) => project.id === id);
      if (index >= 0) {
        savedProjects.splice(index, 1);
      }
    })
  };
}
```

- [ ] **Step 2: Run App tests and verify RED**

Run: `pnpm.cmd test -- src/app/App.test.tsx`

Expected: FAIL because `App` does not pass rename/delete callbacks.

- [ ] **Step 3: Implement App callbacks**

Add:

```ts
async function renameProject(projectId: string, name: string) {
  const project = await projectRepository.get(projectId);

  if (!project) {
    return;
  }

  await projectRepository.save({
    ...project,
    name,
    updatedAt: new Date().toISOString()
  });
}

async function deleteProject(projectId: string) {
  await projectRepository.delete(projectId);
}
```

Pass into `ProjectLibraryPanel`:

```tsx
onRenameProject={renameProject}
onDeleteProject={deleteProject}
```

- [ ] **Step 4: Verify App tests pass**

Run: `pnpm.cmd test -- src/app/App.test.tsx`

Expected: PASS.

---

### Task 4: Styling and Full Verification

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add compact project action styles**

Add:

```css
.project-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.project-edit-form {
  display: grid;
  gap: 8px;
}

.project-edit-form input {
  min-height: 44px;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 12px;
  color: #0f172a;
  background: #ffffff;
}
```

- [ ] **Step 2: Run focused tests**

Run:

```powershell
pnpm.cmd test -- src/features/projects/ProjectLibraryPanel.test.tsx
pnpm.cmd test -- src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run full tests**

Run: `pnpm.cmd test`

Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `pnpm.cmd run build`

Expected: PASS. Existing Vite chunk size warning is acceptable.

- [ ] **Step 5: Check diff hygiene**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Prepare commit commands if needed**

Use:

```powershell
git add .
git commit -m "feat: manage local projects"
git push origin main
gh run list --repo LeafLit/ar-builder --branch main --limit 3
git rev-parse --short HEAD
```
