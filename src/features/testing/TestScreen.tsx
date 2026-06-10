import { useState } from "react";
import { createRuleEngine } from "../authoring/ruleEngine";
import type { Asset, StateBinding } from "../projects/projectTypes";

type TestState = {
  id: string;
  name: string;
};

const TEST_STATES: TestState[] = [
  { id: "state_a", name: "状态 A" },
  { id: "state_b", name: "状态 B" }
];

export function TestScreen(props: {
  assets: Asset[];
  bindings: StateBinding[];
  onBackHome: () => void;
}) {
  const [detectedState, setDetectedState] = useState<TestState | undefined>();
  const output = detectedState
    ? resolveTextOutput(detectedState, props.assets, props.bindings)
    : undefined;
  const previewContent = output?.content ?? "等待 AR 输出。";

  return (
    <div className="stack">
      <div className="panel stack">
        <h1>实时测试</h1>
        <p className="muted">
          第一版先用模拟识别按钮验证输出绑定。后续会把这里接到真实摄像头识别结果。
        </p>
      </div>

      <div className="ar-test-stage" aria-label="AR 测试预览">
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
            onClick={() => setDetectedState(state)}
            type="button"
          >
            模拟识别{state.name}
          </button>
        ))}
      </div>

      <p className="muted" role="status">
        {detectedState ? `当前识别：${detectedState.name}` : "等待识别状态。"}
      </p>

      <button className="secondary-button" onClick={props.onBackHome} type="button">
        返回首页
      </button>
    </div>
  );
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
