import { useEffect, useRef, useState, type CSSProperties } from "react";
import { playBuiltInAudio } from "../ar/audioCatalog";
import { Model3DPreview } from "../ar/Model3DPreview";
import { createScreenAnchorPlacement } from "../ar/screenAnchor";
import type { RecognitionModel } from "../ml/classifierTypes";
import type { Asset, BuiltInAudioId, StateBinding, Transform } from "../projects/projectTypes";
import {
  DEFAULT_RECOGNITION_SENSITIVITY,
  MAX_RECOGNITION_SENSITIVITY,
  MIN_RECOGNITION_SENSITIVITY
} from "../projects/projectTypes";
import { createCameraStateRecognizer } from "./cameraStateRecognizer";
import {
  createInitialStableRecognitionState,
  updateStableRecognition,
  type StableRecognitionState
} from "./stableRecognition";
import { type RecognitionSession, type StateRecognizer } from "./stateRecognizer";
import {
  createInitialStateTriggerCounter,
  resetStateTriggerCounter,
  updateStateTriggerCounter
} from "./stateTriggerCounter";
import { DEFAULT_PROJECT_STATES } from "../projects/projectStates";

type TestState = {
  id: string;
  name: string;
  order?: number;
};

type ShowStateBinding = StateBinding & {
  action: Extract<StateBinding["action"], { type: "show" }>;
};

type AudioStateBinding = StateBinding & {
  action: Extract<StateBinding["action"], { type: "playAudio" }>;
};

type RecognitionPhase = "idle" | "starting" | "running" | "failed";

const SENSITIVITY_STEP = 5;
const AUDIO_PLAYBACK_BLOCKED_MESSAGE = "音效播放被浏览器阻止，请点一下页面后重试。";

type CameraRecognizerFactory = (
  video: HTMLVideoElement,
  model: RecognitionModel
) => StateRecognizer;

export function TestScreen(props: {
  assets: Asset[];
  bindings: StateBinding[];
  states?: TestState[];
  recognitionModel?: RecognitionModel;
  recognizer?: StateRecognizer;
  createCameraRecognizer?: CameraRecognizerFactory;
  playAudio?: (audioId: BuiltInAudioId) => Promise<void> | void;
  vibrate?: (duration: number) => void;
  recognitionSensitivity?: number;
  onRecognitionSensitivityChange?: (recognitionSensitivity: number) => void;
  onBackHome: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<RecognitionSession | undefined>(undefined);
  const lastAudioStateIdRef = useRef<string | undefined>(undefined);
  const playAudioRef = useRef(props.playAudio ?? playBuiltInAudio);
  const vibrateRef = useRef(props.vibrate ?? vibrateDevice);
  const states = props.states ?? DEFAULT_PROJECT_STATES;
  const [detectedState, setDetectedState] = useState<TestState | undefined>();
  const [confidence, setConfidence] = useState<number | undefined>();
  const [audioMessage, setAudioMessage] = useState<string | undefined>();
  const [localRecognitionSensitivity, setLocalRecognitionSensitivity] = useState(
    DEFAULT_RECOGNITION_SENSITIVITY
  );
  const [recognitionPhase, setRecognitionPhase] = useState<RecognitionPhase>("idle");
  const [stableRecognition, setStableRecognition] = useState<StableRecognitionState>(
    createInitialStableRecognitionState
  );
  const [triggerCounter, setTriggerCounter] = useState(() =>
    createInitialStateTriggerCounter(states.map((state) => state.id))
  );
  const recognitionSensitivity =
    props.recognitionSensitivity ?? localRecognitionSensitivity;
  const recognitionStartingOrRunning =
    recognitionPhase === "starting" || recognitionPhase === "running";
  const recognitionThreshold = createRecognitionThreshold(recognitionSensitivity);
  const recognitionThresholdRef = useRef(recognitionThreshold);
  recognitionThresholdRef.current = recognitionThreshold;
  const confirmedDetectedState = stableRecognition.confirmedStateId
    ? findTestState(states, stableRecognition.confirmedStateId)
    : detectedState && confidence === undefined
    ? detectedState
    : undefined;
  const output = confirmedDetectedState
    ? resolveStateOutput(confirmedDetectedState, props.assets, props.bindings)
    : undefined;
  const audioOutput = confirmedDetectedState
    ? resolveStateAudio(confirmedDetectedState, props.assets, props.bindings)
    : undefined;
  const anchorStyle = output ? createAnchorStyle(output.transform) : undefined;
  const statusText = createStatusText({
    confidence,
    detectedState: confirmedDetectedState,
    recognitionPhase
  });

  playAudioRef.current = props.playAudio ?? playBuiltInAudio;
  vibrateRef.current = props.vibrate ?? vibrateDevice;

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    setTriggerCounter((current) =>
      updateStateTriggerCounter(current, confirmedDetectedState?.id)
    );
  }, [confirmedDetectedState?.id]);

  useEffect(() => {
    if (confirmedDetectedState?.id) {
      vibrateRef.current(35);
    }
  }, [confirmedDetectedState?.id]);

  useEffect(() => {
    const stateId = confirmedDetectedState?.id;

    if (!stateId) {
      lastAudioStateIdRef.current = undefined;
      setAudioMessage(undefined);
      return undefined;
    }

    if (lastAudioStateIdRef.current === stateId) {
      return undefined;
    }

    lastAudioStateIdRef.current = stateId;

    if (!audioOutput?.audioId) {
      setAudioMessage(undefined);
      return undefined;
    }

    let ignored = false;

    void Promise.resolve(playAudioRef.current(audioOutput.audioId))
      .then(() => {
        if (!ignored) {
          setAudioMessage(undefined);
        }
      })
      .catch(() => {
        if (!ignored) {
          setAudioMessage(AUDIO_PLAYBACK_BLOCKED_MESSAGE);
        }
      });

    return () => {
      ignored = true;
    };
  }, [audioOutput?.audioId, confirmedDetectedState?.id]);

  async function startAutomaticRecognition() {
    if (recognitionStartingOrRunning) {
      return;
    }

    setRecognitionPhase("starting");
    setDetectedState(undefined);
    setConfidence(undefined);
    setStableRecognition(createInitialStableRecognitionState());

    try {
      const recognizer = createActiveRecognizer({
        cameraRecognizerFactory: props.createCameraRecognizer,
        model: props.recognitionModel,
        recognizer: props.recognizer,
        video: videoRef.current
      });
      const session = await recognizer.start((prediction) => {
        setDetectedState(findTestState(states, prediction.stateId));
        setConfidence(prediction.confidence);
        setStableRecognition((current) =>
          updateStableRecognition(
            current,
            {
              stateId: prediction.stateId,
              confidence: prediction.confidence
            },
            recognitionThresholdRef.current
          )
        );
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
    setStableRecognition(createInitialStableRecognitionState());
  }

  function manuallyDetect(state: TestState) {
    sessionRef.current?.stop();
    sessionRef.current = undefined;
    setRecognitionPhase("idle");
    setDetectedState(state);
    setConfidence(undefined);
    setStableRecognition(createInitialStableRecognitionState());
  }

  function changeRecognitionSensitivity(nextValue: number) {
    if (props.recognitionSensitivity === undefined) {
      setLocalRecognitionSensitivity(nextValue);
    }

    props.onRecognitionSensitivityChange?.(nextValue);
  }

  function resetTriggerCounts() {
    setTriggerCounter((current) => resetStateTriggerCounter(current));
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
        {output && (
          <div
            className={`ar-test-overlay ar-test-overlay-enter ${createOutputClassName(output.asset)}`}
            aria-live="polite"
            style={anchorStyle}
          >
            {renderOutput(output)}
          </div>
        )}
      </div>

      <div className="state-grid">
        {states.map((state) => (
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

      <label className="range-field">
        <span>识别灵敏度：{recognitionSensitivity}%</span>
        <input
          aria-label="识别灵敏度"
          max={MAX_RECOGNITION_SENSITIVITY}
          min={MIN_RECOGNITION_SENSITIVITY}
          onChange={(event) => changeRecognitionSensitivity(Number(event.currentTarget.value))}
          step={SENSITIVITY_STEP}
          type="range"
          value={recognitionSensitivity}
        />
      </label>

      <section className="counter-panel" aria-labelledby="state-trigger-counter-title">
        <div className="counter-panel-header">
          <h2 id="state-trigger-counter-title">状态计数</h2>
          <button className="secondary-button" onClick={resetTriggerCounts} type="button">
            重置计数
          </button>
        </div>
        <div className="counter-list">
          {states.map((state) => {
            const count = triggerCounter.counts[state.id] ?? 0;

            return (
              <div
                aria-label={`${state.name} 触发 ${count} 次`}
                className="counter-row"
                key={state.id}
              >
                <span>{state.name}</span>
                <strong>{count} 次</strong>
              </div>
            );
          })}
        </div>
      </section>

      <p className="muted" role="status">
        {statusText}
      </p>

      {audioMessage && (
        <p className="muted" role="alert">
          {audioMessage}
        </p>
      )}

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

  if (input.recognitionPhase === "running" && input.confidence !== undefined) {
    return "自动识别中，未识别到已训练状态。";
  }

  if (input.recognitionPhase === "running") {
    return "自动识别中，等待结果。";
  }

  return "等待识别状态。";
}

function findTestState(states: TestState[], stateId: string): TestState {
  return states.find((state) => state.id === stateId) ?? {
    id: stateId,
    name: stateId
  };
}

function createRecognitionThreshold(sensitivity: number) {
  return Math.max(0.03, (100 - sensitivity) / 100);
}

function createActiveRecognizer(input: {
  cameraRecognizerFactory?: CameraRecognizerFactory;
  model?: RecognitionModel;
  recognizer?: StateRecognizer;
  video: HTMLVideoElement | null;
}) {
  if (input.recognizer) {
    return input.recognizer;
  }

  if (input.model && input.video) {
    const factory = input.cameraRecognizerFactory ?? createDefaultCameraRecognizer;

    return factory(input.video, input.model);
  }

  throw new Error("Missing trained recognition model.");
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
): ResolvedStateOutput | undefined {
  const binding = bindings.find(
    (item): item is ShowStateBinding => item.stateId === state.id && isShowBinding(item)
  );

  if (!binding) {
    const hasAudioBinding = bindings.some(
      (item) => item.stateId === state.id && isAudioBinding(item)
    );

    if (hasAudioBinding) {
      return undefined;
    }

    return {
      message: `未找到${state.name} 的输出绑定。`,
      transform: DEFAULT_OUTPUT_TRANSFORM
    };
  }

  const asset = assets.find((item) => item.id === binding.action.assetId);

  if (!asset) {
    return {
      message: `${state.name} 的素材为空。`,
      transform: binding.action.transform
    };
  }

  return {
    asset,
    transform: binding.action.transform
  };
}

type ResolvedStateAudio = {
  audioId: BuiltInAudioId;
};

function resolveStateAudio(
  state: TestState,
  assets: Asset[],
  bindings: StateBinding[]
): ResolvedStateAudio | undefined {
  const binding = bindings.find(
    (item): item is AudioStateBinding => item.stateId === state.id && isAudioBinding(item)
  );

  if (!binding) {
    return undefined;
  }

  const asset = assets.find((item) => item.id === binding.action.assetId);

  if (asset?.type !== "audio" || !asset.audioId) {
    return undefined;
  }

  return {
    audioId: asset.audioId
  };
}

function isShowBinding(binding: StateBinding): binding is ShowStateBinding {
  return binding.action.type === "show";
}

function isAudioBinding(binding: StateBinding): binding is AudioStateBinding {
  return binding.action.type === "playAudio";
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

  if (output.asset.type === "model3d") {
    if (!output.asset.modelId) {
      return "3D 模型素材为空。";
    }

    return (
      <Model3DPreview
        label={output.asset.name}
        modelId={output.asset.modelId}
        rotation={output.transform.rotation}
      />
    );
  }

  if (output.asset.type === "text") {
    return output.asset.content || "文字素材为空。";
  }

  return `${output.asset.name} 暂不支持预览。`;
}

function createOutputClassName(asset: Asset | undefined) {
  if (asset?.type === "image2d") {
    return "image-output";
  }

  if (asset?.type === "model3d") {
    return "model3d-output";
  }

  return "";
}

function vibrateDevice(duration: number) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}
