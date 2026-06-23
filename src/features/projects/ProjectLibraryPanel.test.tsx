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

  it("exports a saved project from the project list", async () => {
    const onExportProject = vi.fn(async () => undefined);

    render(
      <ProjectLibraryPanel
        listProjects={async () => [savedProject]}
        onExportProject={onExportProject}
        onOpenProject={vi.fn()}
        onSaveProject={vi.fn()}
      />
    );

    expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "导出 厨房 AR 原型" }));

    expect(onExportProject).toHaveBeenCalledWith("project_1");
    expect(await screen.findByRole("status")).toHaveTextContent("项目文件已导出。");
  });

  it("imports a project file and refreshes the project list", async () => {
    const onImportProject = vi.fn(async () => undefined);
    const listProjects = vi
      .fn<() => Promise<ProjectSummary[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([savedProject]);

    render(
      <ProjectLibraryPanel
        listProjects={listProjects}
        onImportProject={onImportProject}
        onOpenProject={vi.fn()}
        onSaveProject={vi.fn()}
      />
    );

    const file = new File(["{}"], "demo-ar-builder.json", {
      type: "application/json"
    });

    fireEvent.change(screen.getByLabelText("导入项目文件"), {
      target: { files: [file] }
    });

    await waitFor(() => {
      expect(onImportProject).toHaveBeenCalledWith(file);
    });
    expect(await screen.findByText("厨房 AR 原型")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("项目文件已导入。");
  });

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
});
