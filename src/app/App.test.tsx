import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import type { ProjectRepository } from "../features/projects/projectRepository";
import type { Project } from "../features/projects/projectTypes";

describe("App", () => {
  it("renders the MVP shell", () => {
    render(<App />);

    expect(screen.getByText("AR Builder")).toBeInTheDocument();
    expect(screen.getByText(/第一版优先使用 PWA/)).toBeInTheDocument();
    expect(screen.getByText("真机体验检查")).toBeInTheDocument();
    expect(screen.getByText("真机测试记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建项目" })).toBeInTheDocument();
  });

  it("navigates through MVP workflow screens", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "新建项目" }));
    expect(screen.getByText("采集训练样本")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步：训练" }));
    expect(screen.getByText("训练识别模型")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));
    await waitFor(() => {
      expect(screen.getByText("训练完成：2 个状态，0 个样本。")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "下一步：编辑" }));
    expect(screen.getByText("编辑 AR 输出")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("状态 A 的 AR 文字"), {
      target: { value: "状态 A 的提示" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "状态 B 的提示" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));

    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));
    expect(screen.getByText("实时测试")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "模拟识别状态 A" }));
    expect(screen.getByText("状态 A 的提示")).toBeInTheDocument();
  });

  it("carries renamed state labels from capture into authoring and testing", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "新建项目" }));
    fireEvent.change(screen.getByLabelText("状态 A 名称"), {
      target: { value: "拳头" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 名称"), {
      target: { value: "巴掌" }
    });

    fireEvent.click(screen.getByRole("button", { name: "下一步：训练" }));
    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));
    fireEvent.click(await screen.findByRole("button", { name: "下一步：编辑" }));

    fireEvent.change(screen.getByLabelText("拳头 的 AR 文字"), {
      target: { value: "拳头输出" }
    });
    fireEvent.change(screen.getByLabelText("巴掌 的 AR 文字"), {
      target: { value: "巴掌输出" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));
    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));

    fireEvent.click(screen.getByRole("button", { name: "模拟识别拳头" }));

    expect(screen.getByRole("status")).toHaveTextContent("当前识别：拳头");
    expect(screen.getByText("拳头输出")).toBeInTheDocument();
  });

  it("saves and reopens a local project for editing", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));
    await waitFor(() => screen.getByText("训练完成：2 个状态，0 个样本。"));
    fireEvent.click(screen.getByRole("button", { name: "下一步：编辑" }));

    fireEvent.change(screen.getByLabelText("状态 A 的 AR 文字"), {
      target: { value: "保存后还能编辑" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "第二个状态" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));
    fireEvent.click(screen.getByRole("button", { name: "保存项目" }));

    await waitFor(() => {
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "返回首页" }));
    expect(await screen.findByText("AR Builder 本机项目")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑 AR Builder 本机项目" }));

    expect(await screen.findByDisplayValue("保存后还能编辑")).toBeInTheDocument();
  });

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
    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));
    await waitFor(() => screen.getByText("训练完成：2 个状态，0 个样本。"));
    fireEvent.click(screen.getByRole("button", { name: "下一步：编辑" }));

    fireEvent.change(screen.getByLabelText("状态 A 的 AR 文字"), {
      target: { value: "保存灵敏度 A" }
    });
    fireEvent.change(screen.getByLabelText("状态 B 的 AR 文字"), {
      target: { value: "保存灵敏度 B" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存绑定" }));
    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));

    fireEvent.change(screen.getByRole("slider", { name: "识别灵敏度" }), {
      target: { value: "100" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存项目" }));

    await waitFor(() => {
      expect(repository.save).toHaveBeenCalledTimes(1);
    });
    expect(savedProjects[0].settings?.recognitionSensitivity).toBe(100);

    fireEvent.click(screen.getByRole("button", { name: "返回首页" }));
    expect(await screen.findByText("AR Builder 本机项目")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑 AR Builder 本机项目" }));
    fireEvent.click(await screen.findByRole("button", { name: "下一步：测试" }));

    expect(screen.getByText("识别灵敏度：100%")).toBeInTheDocument();
  });
});

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
        return;
      }

      savedProjects.push(project);
    }),
    delete: vi.fn(async (id) => {
      const index = savedProjects.findIndex((project) => project.id === id);

      if (index >= 0) {
        savedProjects.splice(index, 1);
      }
    })
  };
}
