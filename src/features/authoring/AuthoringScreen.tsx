import { useState } from "react";
import type { Asset, StateBinding } from "../projects/projectTypes";

type AuthoringState = {
  id: string;
  name: string;
};

const AUTHORING_STATES: AuthoringState[] = [
  { id: "state_a", name: "状态 A" },
  { id: "state_b", name: "状态 B" }
];

export function AuthoringScreen(props: {
  assets: Asset[];
  bindings: StateBinding[];
  onSaveTextOutputs: (outputs: Record<string, string>) => void;
  onNext: () => void;
}) {
  const [outputs, setOutputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      AUTHORING_STATES.map((state) => [state.id, getTextOutput(state.id, props.assets, props.bindings)])
    )
  );
  const [saved, setSaved] = useState(props.bindings.length > 0);
  const filledOutputCount = AUTHORING_STATES.filter((state) => outputs[state.id].trim()).length;
  const canSave = filledOutputCount === AUTHORING_STATES.length;

  function saveBindings() {
    const trimmedOutputs = Object.fromEntries(
      AUTHORING_STATES.map((state) => [state.id, outputs[state.id].trim()])
    );
    props.onSaveTextOutputs(trimmedOutputs);
    setSaved(true);
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <h1>编辑 AR 输出</h1>
        <p className="muted">
          为每个识别状态绑定一段文字。第一版先跑通文字输出，后续会扩展图片、3D 模型和音频。
        </p>
      </div>

      <div className="binding-list">
        {AUTHORING_STATES.map((state) => (
          <label className="binding-card stack" key={state.id}>
            <span>{state.name} 的 AR 文字</span>
            <textarea
              aria-label={`${state.name} 的 AR 文字`}
              onChange={(event) =>
                setOutputs((current) => ({
                  ...current,
                  [state.id]: event.target.value
                }))
              }
              placeholder={`识别到${state.name}时显示的内容`}
              rows={4}
              value={outputs[state.id]}
            />
          </label>
        ))}
      </div>

      <div className="action-row">
        <button className="secondary-button" disabled={!canSave} onClick={saveBindings} type="button">
          保存绑定
        </button>
        <button className="primary-button" disabled={!saved} onClick={props.onNext} type="button">
          下一步：测试
        </button>
      </div>

      <p className="muted" role="status">
        {saved ? `已保存 ${filledOutputCount} 个文字输出。` : "填写两个状态的文字后保存绑定。"}
      </p>
    </div>
  );
}

function getTextOutput(stateId: string, assets: Asset[], bindings: StateBinding[]) {
  const binding = bindings.find((item) => item.stateId === stateId);

  if (!binding || !("assetId" in binding.action)) {
    return "";
  }

  const asset = assets.find((item) => item.id === binding.action.assetId && item.type === "text");

  return asset?.content ?? "";
}
