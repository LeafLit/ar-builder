import { useReducer } from "react";
import { appReducer, initialAppState } from "./appState";

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
          <WorkflowPanel
            title="采集训练样本"
            description="先为每个真实世界状态拍摄几张样本，例如物体在左边和右边。"
            action="下一步：训练"
            onNext={() => dispatch({ type: "goTo", screen: "train" })}
          />
        )}

        {state.screen === "train" && (
          <WorkflowPanel
            title="训练识别模型"
            description="App 会用这些样本训练一个轻量识别器，并显示当前识别状态。"
            action="下一步：编辑"
            onNext={() => dispatch({ type: "goTo", screen: "author" })}
          />
        )}

        {state.screen === "author" && (
          <WorkflowPanel
            title="编辑 AR 输出"
            description="为每个状态绑定文字、图片、3D 模型或音频。"
            action="下一步：测试"
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
