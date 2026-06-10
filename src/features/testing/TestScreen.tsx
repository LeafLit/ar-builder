import { useEffect, useMemo, useRef, useState } from "react";
import { createRuleEngine } from "../authoring/ruleEngine";
import type { RecognitionModel } from "../ml/classifierTypes";
import type { Asset, StateBinding } from "../projects/projectTypes";
import { createCameraStateRecognizer } from "./cameraStateRecognizer";
import {
  createSequenceRecognizer,
  type RecognitionSession,
  type StateRecognizer
} from "./stateRecognizer";

type TestState = {
  id: string;
  name: string;
};

const TEST_STATES: TestState[] = [
  { id: "state_a", name: "状态 A" },
  { id: "state_b", name: "状态 B" }
];

type CameraRecognizerFactory = (
  video: HTMLVideoElement,
  model: RecognitionModel
) => StateRecognizer;

export function TestScreen(props: {
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: RecognitionModel;
  recognizer?: StateRecognizer;
  createCameraRecognizer?: CameraRecognizerFactory;
  onBackHome: () => void;
}) {
  const sequenceRecognizer = useMemo(
    () => props.recognizer ?? createSequenceRecognizer(TEST_STATES.map((state) => state.id)),
    [props.recognizer]
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<RecognitionSession | undefined>(undefined);
  const [detectedState, setDetectedState] = useState<TestState | undefined>();
  const [confidence, setConfidence] = useState<number | undefined>();
  const [recognitionActive, setRecognitionActive] = useState(false);
  const output = detectedState
    ? resolveTextOutput(detectedState, props.assets, props.bindings)
    : undefined;
  const previewContent = output?.content ?? "等待 AR 输出。";
  const statusText = detectedState
    ? `当前识别：${detectedState.name}${formatConfidence(confidence)}`
    : recognitionActive
      ? "自动识别中，等待结果。"
      : "等待识别状态。";

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  async function startAutomaticRecognition() {
    if (recognitionActive) {
      return;
    }

    const recognizer = createActiveRecognizer({
      cameraRecognizerFactory: props.createCameraRecognizer,
      model: props.recognitionModel,
      sequenceRecognizer,
      video: videoRef.current
    });
    const session = await recognizer.start((prediction) => {
      const nextState = TEST_STATES.find((state) => state.id === prediction.stateId) ?? {
        id: prediction.stateId,
        name: prediction.stateId
      };
      setDetectedState(nextState);
      setConfidence(prediction.confidence);
    });
    sessionRef.current = session;
    setRecognitionActive(true);
  }

  function stopAutomaticRecognition() {
    sessionRef.current?.stop();
    sessionRef.current = undefined;
    setRecognitionActive(false);
  }

  function manuallyDetect(state: TestState) {
    setDetectedState(state);
    setConfidence(undefined);
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h1>实时测试</h1>
        <p className="muted">
          第一版先用模拟识别按钮验证输出绑定。后续会把这里接到真实摄像头识别结果。
        </p>
      </div>

      <div className="ar-test-stage" aria-label="AR 测试预览">
        <video
          aria-label="测试摄像头预览"
          className="ar-test-video"
          muted
          playsInline
          ref={videoRef}
        />
        <div className="ar-test-camera">相机画面预览</div>
        <div className="ar-test-overlay" aria-live="polite">
          {previewContent}
        </div>
      </div>

      <div className="state-grid">
        {TEST_STATES.map((state) => (
          <button
            className="state-button"
            key={state.id}
            onClick={() => manuallyDetect(state)}
            type="button"
          >
            模拟识别{state.name}
          </button>
        ))}
      </div>

      <div className="action-row">
        <button
          className="primary-button"
          disabled={recognitionActive}
          onClick={startAutomaticRecognition}
          type="button"
        >
          启动自动识别
        </button>
        <button
          className="secondary-button"
          disabled={!recognitionActive}
          onClick={stopAutomaticRecognition}
          type="button"
        >
          停止自动识别
        </button>
      </div>

      <p className="muted" role="status">
        {statusText}
      </p>

      <button className="secondary-button" onClick={props.onBackHome} type="button">
        返回首页
      </button>
    </div>
  );
}

function createActiveRecognizer(input: {
  cameraRecognizerFactory?: CameraRecognizerFactory;
  model?: RecognitionModel;
  sequenceRecognizer: StateRecognizer;
  video: HTMLVideoElement | null;
}) {
  if (input.model && input.video) {
    const factory = input.cameraRecognizerFactory ?? createDefaultCameraRecognizer;

    return factory(input.video, input.model);
  }

  return input.sequenceRecognizer;
}

function createDefaultCameraRecognizer(video: HTMLVideoElement, model: RecognitionModel) {
  return createCameraStateRecognizer({
    video,
    classifier: model.classifier,
    embedder: model.embedder
  });
}

function formatConfidence(confidence: number | undefined) {
  if (confidence === undefined) {
    return "";
  }

  return `（${Math.round(confidence * 100)}%）`;
}

function resolveTextOutput(state: TestState, assets: Asset[], bindings: StateBinding[]) {
  const resolved = createRuleEngine().resolve(state.id, bindings);

  if (!resolved || !("assetId" in resolved.action)) {
    return { content: `未找到${state.name} 的输出绑定。` };
  }

  const asset = assets.find(
    (item) => item.id === resolved.action.assetId && item.type === "text"
  );

  if (!asset?.content) {
    return { content: `${state.name} 的文字素材为空。` };
  }

  return { content: asset.content };
}
