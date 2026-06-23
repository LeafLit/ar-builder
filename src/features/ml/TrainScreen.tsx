import { useState } from "react";
import type { RecognitionModel } from "./classifierTypes";
import {
  createDefaultSampleCounts,
  DEFAULT_PROJECT_STATES
} from "../projects/projectStates";

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

type TrainingState = {
  id: string;
  name: string;
  order?: number;
};

const RECOMMENDED_SAMPLE_COUNT = 5;

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

function createTrainingRequirementMessage(
  sampleCounts: Record<string, number>,
  states: TrainingState[]
) {
  const missingStates = states
    .filter((state) => (sampleCounts[state.id] ?? 0) <= 0)
    .map((state) => state.name);

  if (missingStates.length > 0) {
    return `真实训练需要每个状态至少 1 个样本。当前缺少：${missingStates.join("、")}。`;
  }

  return `已满足真实训练条件：${states.length} 个状态都有样本。`;
}

function createSampleQualityMessage(
  sampleCounts: Record<string, number>,
  states: TrainingState[]
) {
  const statesNeedingMoreSamples = states
    .map((state) => ({
      name: state.name,
      missingCount: Math.max(0, RECOMMENDED_SAMPLE_COUNT - (sampleCounts[state.id] ?? 0))
    }))
    .filter((state) => state.missingCount > 0);

  if (statesNeedingMoreSamples.length === 0) {
    return `样本数量不错：每个状态都至少有 ${RECOMMENDED_SAMPLE_COUNT} 张。`;
  }

  return `还建议补拍：${statesNeedingMoreSamples
    .map((state) => `${state.name} 还差 ${state.missingCount} 张`)
    .join("、")}。`;
}

export function TrainScreen(props: {
  projectId?: string;
  states?: TrainingState[];
  sampleCounts?: Record<string, number>;
  trainer?: ModelTrainer;
  onModelTrained?: (model: RecognitionModel) => void;
  onNext: () => void;
}) {
  const projectId = props.projectId ?? "local_project";
  const states = props.states ?? DEFAULT_PROJECT_STATES;
  const sampleCounts = props.sampleCounts ?? createDefaultSampleCounts(states);
  const trainer = props.trainer ?? createDefaultTrainer(sampleCounts);
  const trainingRequirementMessage = createTrainingRequirementMessage(sampleCounts, states);
  const sampleQualityMessage = createSampleQualityMessage(sampleCounts, states);
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
          {states.map((state) => (
            <div className="state-summary" key={state.id}>
              {state.name}：{sampleCounts[state.id] ?? 0} 个样本
            </div>
          ))}
        </div>
        <p className="training-hint">{trainingRequirementMessage}</p>
        <div className="quality-tip-panel">
          <h2>样本质量提示</h2>
          <p>建议每个状态至少拍 {RECOMMENDED_SAMPLE_COUNT} 张样本。</p>
          <p>{sampleQualityMessage}</p>
          <ul>
            <li>光线尽量充足，避免画面太暗或反光。</li>
            <li>背景尽量简单，别让无关物体抢镜。</li>
            <li>同一个状态可以换一点角度和距离，帮助模型学得更稳。</li>
          </ul>
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

function createTrainingFailureMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes("没有可训练样本") || error.message.includes("missing samples")) {
      return "训练失败，请先确认每个状态都有样本。";
    }

    return `训练失败：${error.message}`;
  }

  return "训练失败，请先确认每个状态都有样本。";
}
