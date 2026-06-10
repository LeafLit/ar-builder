import { useMemo, useReducer } from "react";
import { appReducer, initialAppState } from "./appState";
import { AuthoringScreen } from "../features/authoring/AuthoringScreen";
import { CaptureScreen } from "../features/capture/CaptureScreen";
import { TrainScreen, type ModelTrainer } from "../features/ml/TrainScreen";
import { TestScreen } from "../features/testing/TestScreen";

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const trainer = useMemo<ModelTrainer | undefined>(() => {
    const stateIds = Object.keys(state.sampleCounts);
    const hasSamples = stateIds.some((stateId) => (state.sampleCounts[stateId] ?? 0) > 0);

    if (!hasSamples) {
      return undefined;
    }

    return {
      async train(projectId) {
        const { createSampleModelTrainer } = await import("../features/ml/sampleModelTrainer");

        return createSampleModelTrainer({ stateIds }).train(projectId);
      }
    };
  }, [state.sampleCounts]);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <strong>AR Builder</strong>
        <span className="muted">MVP</span>
      </header>
      <section className="screen stack">
        {state.screen === "home" && (
          <>
            <h1>创建手机端 AR 原型</h1>
            <p className="muted">采集状态、训练识别、绑定输出，然后实时测试。</p>
            <p className="muted">
              第一版优先使用 PWA：Android 尽量启用 WebXR，iOS 和鸿蒙使用相机叠加降级。
            </p>
            <button
              className="primary-button"
              onClick={() => dispatch({ type: "goTo", screen: "capture" })}
            >
              新建项目
            </button>
          </>
        )}

        {state.screen === "capture" && (
          <CaptureScreen
            projectId={state.projectId}
            onSampleCaptured={(stateId, count) =>
              dispatch({ type: "recordSample", stateId, count })
            }
            onNext={() => dispatch({ type: "goTo", screen: "train" })}
          />
        )}

        {state.screen === "train" && (
          <TrainScreen
            projectId={state.projectId}
            sampleCounts={state.sampleCounts}
            trainer={trainer}
            onModelTrained={(model) => dispatch({ type: "storeRecognitionModel", model })}
            onNext={() => dispatch({ type: "goTo", screen: "author" })}
          />
        )}

        {state.screen === "author" && (
          <AuthoringScreen
            assets={state.assets}
            bindings={state.bindings}
            onSaveTextOutputs={(outputs) => dispatch({ type: "saveTextOutputs", outputs })}
            onNext={() => dispatch({ type: "goTo", screen: "test" })}
          />
        )}

        {state.screen === "test" && (
          <TestScreen
            assets={state.assets}
            bindings={state.bindings}
            recognitionModel={state.recognitionModel}
            onBackHome={() => dispatch({ type: "goTo", screen: "home" })}
          />
        )}
      </section>
    </main>
  );
}
