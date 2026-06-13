import { useMemo, useReducer } from "react";
import { createProjectFromAppState, createProjectSummary } from "./appProjectSnapshot";
import { appReducer, initialAppState } from "./appState";
import { createAppTrainer } from "./appTrainer";
import { AuthoringScreen } from "../features/authoring/AuthoringScreen";
import { CaptureScreen } from "../features/capture/CaptureScreen";
import { DeviceReadinessPanel } from "../features/device/DeviceReadinessPanel";
import { RealDeviceFeedbackPanel } from "../features/feedback/RealDeviceFeedbackPanel";
import { TrainScreen, type ModelTrainer } from "../features/ml/TrainScreen";
import { ProjectLibraryPanel } from "../features/projects/ProjectLibraryPanel";
import {
  createProjectRepository,
  type ProjectRepository
} from "../features/projects/projectRepository";
import { TestScreen } from "../features/testing/TestScreen";

export function App({ projectRepository = createProjectRepository() }: { projectRepository?: ProjectRepository }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const hasEditableProject = state.assets.length > 0 || state.bindings.length > 0;
  const trainer = useMemo<ModelTrainer | undefined>(
    () => createAppTrainer(state.sampleCounts),
    [state.sampleCounts]
  );

  async function saveCurrentProject() {
    const project = createProjectFromAppState(state, {
      name: "AR Builder 本机项目"
    });

    await projectRepository.save(project);
    dispatch({ type: "loadProject", project });
  }

  async function openProject(projectId: string) {
    const project = await projectRepository.get(projectId);

    if (project) {
      dispatch({ type: "loadProject", project });
    }
  }

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
            <DeviceReadinessPanel />
            <RealDeviceFeedbackPanel />
            <ProjectLibraryPanel
              listProjects={async () =>
                (await projectRepository.list()).map((project) => createProjectSummary(project))
              }
              onOpenProject={openProject}
              onSaveProject={saveCurrentProject}
            />
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
          <div className="stack">
            <AuthoringScreen
              assets={state.assets}
              bindings={state.bindings}
              onSaveTextOutputs={(outputs) => dispatch({ type: "saveTextOutputs", outputs })}
              onNext={() => dispatch({ type: "goTo", screen: "test" })}
            />
            <div className="action-row">
              <button
                className="secondary-button"
                disabled={!hasEditableProject}
                onClick={saveCurrentProject}
                type="button"
              >
                保存项目
              </button>
              <button
                className="secondary-button"
                onClick={() => dispatch({ type: "goTo", screen: "home" })}
                type="button"
              >
                返回首页
              </button>
            </div>
          </div>
        )}

        {state.screen === "test" && (
          <div className="stack">
            <TestScreen
              assets={state.assets}
              bindings={state.bindings}
              recognitionModel={state.recognitionModel}
              recognitionSensitivity={state.settings.recognitionSensitivity}
              onRecognitionSensitivityChange={(recognitionSensitivity) =>
                dispatch({ type: "updateRecognitionSensitivity", recognitionSensitivity })
              }
              onBackHome={() => dispatch({ type: "goTo", screen: "home" })}
            />
            <button className="secondary-button" onClick={saveCurrentProject} type="button">
              保存项目
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
