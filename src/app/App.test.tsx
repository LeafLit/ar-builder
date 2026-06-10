import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the MVP shell", () => {
    render(<App />);

    expect(screen.getByText("AR Builder")).toBeInTheDocument();
    expect(screen.getByText(/第一版优先使用 PWA/)).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));
    expect(screen.getByText("实时测试")).toBeInTheDocument();
  });
});
