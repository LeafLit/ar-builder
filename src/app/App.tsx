import { useReducer } from "react";
import { appReducer, initialAppState } from "./appState";
import { AuthoringScreen } from "../features/authoring/AuthoringScreen";
import { CaptureScreen } from "../features/capture/CaptureScreen";
import { TrainScreen } from "../features/ml/TrainScreen";

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

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
          <WorkflowPanel
            title="实时测试"
            description="把摄像头识别结果和 AR 输出连接起来，直接在手机上验证。"
            action="返回首页"
            onNext={() => dispatch({ type: "goTo", screen: "home" })}
          />
        )}
      </section>
    </main>
  );
}

function WorkflowPanel(props: {
  title: string;
  description: string;
  action: string;
  onNext: () => void;
}) {
  return (
    <div className="panel stack">
      <h1>{props.title}</h1>
      <p className="muted">{props.description}</p>
      <button className="primary-button" onClick={props.onNext}>
        {props.action}
      </button>
    </div>
  );
}
