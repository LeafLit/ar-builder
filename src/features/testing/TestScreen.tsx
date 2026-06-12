import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createScreenAnchorPlacement } from "../ar/screenAnchor";
import { createRuleEngine } from "../authoring/ruleEngine";
import type { RecognitionModel } from "../ml/classifierTypes";
import type { Asset, StateBinding, Transform } from "../projects/projectTypes";
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

type RecognitionPhase = "idle" | "starting" | "running" | "failed";

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
  const [recognitionPhase, setRecognitionPhase] = useState<RecognitionPhase>("idle");
  const recognitionStartingOrRunning =
    recognitionPhase === "starting" || recognitionPhase === "running";
  const output = detectedState
    ? resolveStateOutput(detectedState, props.assets, props.bindings)
    : undefined;
  const anchorStyle = output ? createAnchorStyle(output.transform) : undefined;
  const statusText = createStatusText({
    confidence,
    detectedState,
    recognitionPhase
  });

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  async function startAutomaticRecognition() {
    if (recognitionStartingOrRunning) {
      return;
    }

    setRecognitionPhase("starting");

    try {
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
      setRecognitionPhase("running");
    } catch {
      sessionRef.current = undefined;
      setRecognitionPhase("failed");
    }
  }

  function stopAutomaticRecognition() {
    sessionRef.current?.stop();
    sessionRef.current = undefined;
    setRecognitionPhase("idle");
  }

  function manuallyDetect(state: TestState) {
    sessionRef.current?.stop();
    sessionRef.current = undefined;
    setRecognitionPhase("idle");
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
        <div
          className={`ar-test-overlay ${output?.asset?.type === "image2d" ? "image-output" : ""}`}
          aria-live="polite"
          style={anchorStyle}
        >
          {output ? renderOutput(output) : "等待 AR 输出。"}
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
          disabled={recognitionStartingOrRunning}
          onClick={startAutomaticRecognition}
          type="button"
        >
          启动自动识别
        </button>
        <button
          className="secondary-button"
          disabled={recognitionPhase !== "running"}
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

function createStatusText(input: {
  confidence: number | undefined;
  detectedState: TestState | undefined;
  recognitionPhase: RecognitionPhase;
}) {
  if (input.recognitionPhase === "starting") {
    return "正在启动相机识别，请确认浏览器权限。";
  }

  if (input.recognitionPhase === "failed") {
    return "自动识别启动失败，请检查相机权限或模型是否已加载。";
  }

  if (input.detectedState) {
    return `当前识别：${input.detectedState.name}${formatConfidence(input.confidence)}`;
  }

  if (input.recognitionPhase === "running") {
    return "自动识别中，等待结果。";
  }

  return "等待识别状态。";
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

type ResolvedStateOutput = {
  asset?: Asset;
  message?: string;
  transform: Transform;
};

function resolveStateOutput(
  state: TestState,
  assets: Asset[],
  bindings: StateBinding[]
): ResolvedStateOutput {
  const resolved = createRuleEngine().resolve(state.id, bindings);

  if (!resolved || resolved.action.type !== "show") {
    return {
      message: `未找到${state.name} 的输出绑定。`,
      transform: DEFAULT_OUTPUT_TRANSFORM
    };
  }

  const asset = assets.find((item) => item.id === resolved.action.assetId);

  if (!asset) {
    return {
      message: `${state.name} 的素材为空。`,
      transform: resolved.action.transform
    };
  }

  return {
    asset,
    transform: resolved.action.transform
  };
}

const DEFAULT_OUTPUT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

function createAnchorStyle(transform: Transform): CSSProperties {
  const placement = createScreenAnchorPlacement(transform);

  return {
    "--anchor-x": `${placement.xPercent}%`,
    "--anchor-y": `${placement.yPercent}%`,
    "--anchor-scale": `${placement.scale}`
  } as CSSProperties;
}

function renderOutput(output: ResolvedStateOutput) {
  if (!output.asset) {
    return output.message;
  }

  if (output.asset.type === "image2d") {
    if (!output.asset.url) {
      return "图片素材为空。";
    }

    return <img alt={output.asset.name} className="ar-test-image-output" src={output.asset.url} />;
  }

  if (output.asset.type === "text") {
    return output.asset.content || "文字素材为空。";
  }

  return `${output.asset.name} 暂不支持预览。`;
}
