import { useState } from "react";

export type TrainingSummary = {
  stateCount: number;
  exampleCount: number;
};

export type ModelTrainer = {
  train(projectId: string): Promise<TrainingSummary>;
};

const defaultTrainer: ModelTrainer = {
  async train() {
    return {
      stateCount: 2,
      exampleCount: 0
    };
  }
};

export function TrainScreen(props: {
  projectId?: string;
  sampleCounts?: Record<string, number>;
  trainer?: ModelTrainer;
  onNext: () => void;
}) {
  const projectId = props.projectId ?? "local_project";
  const sampleCounts = props.sampleCounts ?? { state_a: 0, state_b: 0 };
  const trainer = props.trainer ?? defaultTrainer;
  const [status, setStatus] = useState("准备好后点击开始训练。");
  const [isTraining, setIsTraining] = useState(false);
  const [trained, setTrained] = useState(false);

  async function trainModel() {
    setIsTraining(true);
    setTrained(false);
    setStatus("正在训练模型...");

    try {
      const summary = await trainer.train(projectId);
      setTrained(true);
      setStatus(`训练完成：${summary.stateCount} 个状态，${summary.exampleCount} 个样本。`);
    } catch {
      setStatus("训练失败，请先确认每个状态都有样本。");
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
