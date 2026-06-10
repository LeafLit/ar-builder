import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TrainScreen, type ModelTrainer } from "./TrainScreen";

function createFakeTrainer(): ModelTrainer {
  return {
    train: vi.fn(async () => ({
      stateCount: 2,
      exampleCount: 6
    }))
  };
}

describe("TrainScreen", () => {
  it("runs training and unlocks the next step", async () => {
    const trainer = createFakeTrainer();
    const onNext = vi.fn();

    render(
      <TrainScreen
        onNext={onNext}
        projectId="project_1"
        sampleCounts={{ state_a: 3, state_b: 3 }}
        trainer={trainer}
      />
    );

    expect(screen.getByRole("button", { name: "下一步：编辑" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));

    expect(screen.getByText("正在训练模型...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("训练完成：2 个状态，6 个样本。")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "下一步：编辑" }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(trainer.train).toHaveBeenCalledWith("project_1");
  });

  it("uses captured sample counts when no custom trainer is provided", async () => {
    render(
      <TrainScreen
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 2, state_b: 1 }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("3");
    });
  });

  it("shows a useful error when training fails", async () => {
    const trainer: ModelTrainer = {
      train: vi.fn(async () => {
        throw new Error("missing samples");
      })
    };

    render(
      <TrainScreen
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 0, state_b: 0 }}
        trainer={trainer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));

    await waitFor(() => {
      expect(screen.getByText("训练失败，请先确认每个状态都有样本。")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "下一步：编辑" })).toBeDisabled();
  });
});
