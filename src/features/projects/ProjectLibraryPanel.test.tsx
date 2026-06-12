import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProjectLibraryPanel } from "./ProjectLibraryPanel";
import type { Project, ProjectSummary } from "./projectTypes";

const savedProject: ProjectSummary = {
  id: "project_1",
  name: "厨房 AR 原型",
  updatedAt: "2026-06-12T12:30:00.000Z",
  assets: 2,
  bindings: 2
};

describe("ProjectLibraryPanel", () => {
  it("lists recent local projects and opens one for editing", async () => {
    const onOpenProject = vi.fn();

    render(
      <ProjectLibraryPanel
        listProjects={async () => [savedProject]}
        onOpenProject={onOpenProject}
        onSaveProject={vi.fn()}
      />
    );

    expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
    expect(screen.getByText("2 个素材 / 2 个绑定")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "继续编辑 厨房 AR 原型" }));

    expect(onOpenProject).toHaveBeenCalledWith("project_1");
  });

  it("saves the current project and refreshes the list", async () => {
    const onSaveProject = vi.fn(async () => undefined);
    const listProjects = vi
      .fn<() => Promise<ProjectSummary[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([savedProject]);

    render(
      <ProjectLibraryPanel
        listProjects={listProjects}
        onOpenProject={vi.fn()}
        onSaveProject={onSaveProject}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("还没有保存的项目。")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "保存当前项目" }));

    await screen.findByText("厨房 AR 原型");
    expect(onSaveProject).toHaveBeenCalledTimes(1);
    expect(listProjects).toHaveBeenCalledTimes(2);
  });
});
