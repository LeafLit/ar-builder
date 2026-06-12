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
});
