import { useState } from "react";
import type { RecognitionModel } from "./classifierTypes";

export type TrainingSummary = {
  stateCount: number;
  exampleCount: number;
};

export type TrainingResult = TrainingSummary & {
  model?: RecognitionModel;
};

export type ModelTrainer = {
  train(projectId: string): Promise<TrainingResult>;
};

const STATE_LABELS: Record<string, string> = {
  state_a: "状态 A",
  state_b: "状态 B"
};

function createDefaultTrainer(sampleCounts: Record<string, number>): ModelTrainer {
  return {
    async train() {
      return {
        stateCount: Object.keys(sampleCounts).length,
        exampleCount: Object.values(sampleCounts).reduce((total, count) => total + count, 0)
      };
    }
  };
}

function createTrainingRequirementMessage(sampleCounts: Record<string, number>) {
  const entries = Object.entries(sampleCounts);
  const missingStates = entries
    .filter(([, count]) => count <= 0)
    .map(([stateId]) => STATE_LABELS[stateId] ?? stateId);

  if (missingStates.length > 0) {
    return `真实训练需要每个状态至少 1 个样本。当前缺少：${missingStates.join("、")}。`;
  }

  return `已满足真实训练条件：${entries.length} 个状态都有样本。`;
}

export function TrainScreen(props: {
  projectId?: string;
  sampleCounts?: Record<string, number>;
  trainer?: ModelTrainer;
  onModelTrained?: (model: RecognitionModel) => void;
  onNext: () => void;
}) {
  const projectId = props.projectId ?? "local_project";
  const sampleCounts = props.sampleCounts ?? { state_a: 0, state_b: 0 };
  const trainer = props.trainer ?? createDefaultTrainer(sampleCounts);
  const trainingRequirementMessage = createTrainingRequirementMessage(sampleCounts);
  const [status, setStatus] = useState("准备好后点击开始训练。");
  const [isTraining, setIsTraining] = useState(false);
  const [trained, setTrained] = useState(false);

  async function trainModel() {
    setIsTraining(true);
    setTrained(false);
    setStatus("正在训练模型...");

    try {
      const summary = await trainer.train(projectId);
      if (summary.model) {
        props.onModelTrained?.(summary.model);
      }
      setTrained(true);
      setStatus(`训练完成：${summary.stateCount} 个状态，${summary.exampleCount} 个样本。`);
    } catch (error) {
      setStatus(createTrainingFailureMessage(error));
    } finally {
      setIsTraining(false);
    }
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h1>训练识别模型</h1>
        <p className="muted">
          App 会根据采集到的样本学习每个状态，训练完成后就可以把状态绑定到 AR 输出。
        </p>
        <div className="state-grid">
          <div className="state-summary">状态 A：{sampleCounts.state_a ?? 0} 个样本</div>
          <div className="state-summary">状态 B：{sampleCounts.state_b ?? 0} 个样本</div>
        </div>
        <p className="training-hint">{trainingRequirementMessage}</p>
        <p className="muted" role="status">
          {status}
        </p>
      </div>

      <button
        className="primary-button"
        disabled={isTraining}
        onClick={trainModel}
        type="button"
      >
        {isTraining ? "训练中" : "开始训练"}
      </button>
      <button
        className="primary-button"
        disabled={!trained}
        onClick={props.onNext}
        type="button"
      >
        下一步：编辑
      </button>
    </div>
  );
}

function createTrainingFailureMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes("没有可训练样本") || error.message.includes("missing samples")) {
      return "训练失败，请先确认每个状态都有样本。";
    }

    return `训练失败：${error.message}`;
  }

  return "训练失败，请先确认每个状态都有样本。";
}
