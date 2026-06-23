import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RecognitionModel } from "./classifierTypes";
import { TrainScreen, type ModelTrainer } from "./TrainScreen";

function createFakeTrainer(model?: RecognitionModel): ModelTrainer {
  return {
    train: vi.fn(async () => ({
      stateCount: 2,
      exampleCount: 6,
      model
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

  it("notifies the app when training produces a recognition model", async () => {
    const model: RecognitionModel = {
      classifier: {
        predict: vi.fn()
      },
      embedder: {
        embed: vi.fn()
      }
    };
    const trainer = createFakeTrainer(model);
    const onModelTrained = vi.fn();

    render(
      <TrainScreen
        onModelTrained={onModelTrained}
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 3, state_b: 3 }}
        trainer={trainer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));

    await waitFor(() => {
      expect(onModelTrained).toHaveBeenCalledWith(model);
    });
  });

  it("shows which states still need samples for real training", () => {
    render(
      <TrainScreen
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 2, state_b: 0 }}
      />
    );

    expect(
      screen.getByText("真实训练需要每个状态至少 1 个样本。当前缺少：状态 B。")
    ).toBeInTheDocument();
  });

  it("uses custom state names in sample summaries and missing sample hints", () => {
    render(
      <TrainScreen
        states={[
          { id: "state_a", name: "拳头", order: 0 },
          { id: "state_b", name: "巴掌", order: 1 }
        ]}
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 2, state_b: 0 }}
      />
    );

    expect(screen.getByText("拳头：2 个样本")).toBeInTheDocument();
    expect(screen.getByText("巴掌：0 个样本")).toBeInTheDocument();
    expect(
      screen.getByText("真实训练需要每个状态至少 1 个样本。当前缺少：巴掌。")
    ).toBeInTheDocument();
  });

  it("confirms when every state has enough samples for real training", () => {
    render(
      <TrainScreen
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 1, state_b: 1 }}
      />
    );

    expect(screen.getByText("已满足真实训练条件：2 个状态都有样本。")).toBeInTheDocument();
  });

  it("shows sample quality guidance before training", () => {
    render(
      <TrainScreen
        states={[
          { id: "state_a", name: "杯子左边", order: 0 },
          { id: "state_b", name: "杯子右边", order: 1 }
        ]}
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 2, state_b: 6 }}
      />
    );

    expect(screen.getByText("样本质量提示")).toBeInTheDocument();
    expect(screen.getByText("建议每个状态至少拍 5 张样本。")).toBeInTheDocument();
    expect(screen.getByText("还建议补拍：杯子左边 还差 3 张。")).toBeInTheDocument();
    expect(screen.getByText("光线尽量充足，避免画面太暗或反光。")).toBeInTheDocument();
    expect(screen.getByText("背景尽量简单，别让无关物体抢镜。")).toBeInTheDocument();
    expect(screen.getByText("同一个状态可以换一点角度和距离，帮助模型学得更稳。")).toBeInTheDocument();
  });

  it("confirms when each state reaches the recommended sample count", () => {
    render(
      <TrainScreen
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 5, state_b: 7 }}
      />
    );

    expect(screen.getByText("样本数量不错：每个状态都至少有 5 张。")).toBeInTheDocument();
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

  it("shows the real training error when samples exist but model preparation fails", async () => {
    const trainer: ModelTrainer = {
      train: vi.fn(async () => {
        throw new Error("基础识别模型加载失败，请刷新后重试。");
      })
    };

    render(
      <TrainScreen
        onNext={vi.fn()}
        projectId="project_1"
        sampleCounts={{ state_a: 31, state_b: 33 }}
        trainer={trainer}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "开始训练" }));

    await waitFor(() => {
      expect(
        screen.getByText("训练失败：基础识别模型加载失败，请刷新后重试。")
      ).toBeInTheDocument();
    });
  });
});
