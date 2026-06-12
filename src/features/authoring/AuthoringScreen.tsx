import { useState } from "react";
import type { Asset, StateBinding, TextOutputDraft, Transform } from "../projects/projectTypes";

type AuthoringState = {
  id: string;
  name: string;
};

const AUTHORING_STATES: AuthoringState[] = [
  { id: "state_a", name: "状态 A" },
  { id: "state_b", name: "状态 B" }
];

const DEFAULT_TEXT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

export function AuthoringScreen(props: {
  assets: Asset[];
  bindings: StateBinding[];
  onSaveTextOutputs: (outputs: Record<string, TextOutputDraft>) => void;
  onNext: () => void;
}) {
  const [outputs, setOutputs] = useState<Record<string, TextOutputDraft>>(() =>
    Object.fromEntries(
      AUTHORING_STATES.map((state) => [
        state.id,
        getTextOutputDraft(state.id, props.assets, props.bindings)
      ])
    )
  );
  const [saved, setSaved] = useState(props.bindings.length > 0);
  const filledOutputCount = AUTHORING_STATES.filter((state) =>
    outputs[state.id].content.trim()
  ).length;
  const canSave = filledOutputCount === AUTHORING_STATES.length;

  function saveBindings() {
    const trimmedOutputs = Object.fromEntries(
      AUTHORING_STATES.map((state) => [
        state.id,
        {
          ...outputs[state.id],
          content: outputs[state.id].content.trim()
        }
      ])
    );
    props.onSaveTextOutputs(trimmedOutputs);
    setSaved(true);
  }

  function updateTextOutput(stateId: string, content: string) {
    setOutputs((current) => ({
      ...current,
      [stateId]: {
        ...current[stateId],
        content
      }
    }));
  }

  function updateAnchor(stateId: string, field: "x" | "y" | "scale", value: string) {
    const numericValue = Number(value);

    setOutputs((current) => {
      const currentOutput = current[stateId];
      const transform = currentOutput.transform;

      if (field === "x") {
        return {
          ...current,
          [stateId]: {
            ...currentOutput,
            transform: {
              ...transform,
              position: [numericValue / 100, transform.position[1], transform.position[2]]
            }
          }
        };
      }

      if (field === "y") {
        return {
          ...current,
          [stateId]: {
            ...currentOutput,
            transform: {
              ...transform,
              position: [transform.position[0], numericValue / 100, transform.position[2]]
            }
          }
        };
      }

      const scale = numericValue / 100;
      return {
        ...current,
        [stateId]: {
          ...currentOutput,
          transform: {
            ...transform,
            scale: [scale, scale, transform.scale[2]]
          }
        }
      };
    });
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
        {AUTHORING_STATES.map((state) => {
          const output = outputs[state.id];
          const anchorValues = createAnchorControlValues(output.transform);

          return (
            <div className="binding-card stack" key={state.id}>
              <label className="stack compact-stack">
                <span>{state.name} 的 AR 文字</span>
                <textarea
                  aria-label={`${state.name} 的 AR 文字`}
                  onChange={(event) => updateTextOutput(state.id, event.target.value)}
                  placeholder={`识别到${state.name}时显示的内容`}
                  rows={4}
                  value={output.content}
                />
              </label>

              <div className="anchor-controls" aria-label={`${state.name} 的屏幕锚点`}>
                <label className="range-field">
                  <span>横向位置：{anchorValues.x}%</span>
                  <input
                    aria-label={`${state.name} 的横向位置`}
                    max="100"
                    min="-100"
                    onChange={(event) => updateAnchor(state.id, "x", event.target.value)}
                    step="5"
                    type="range"
                    value={anchorValues.x}
                  />
                </label>
                <label className="range-field">
                  <span>纵向位置：{anchorValues.y}%</span>
                  <input
                    aria-label={`${state.name} 的纵向位置`}
                    max="100"
                    min="-100"
                    onChange={(event) => updateAnchor(state.id, "y", event.target.value)}
                    step="5"
                    type="range"
                    value={anchorValues.y}
                  />
                </label>
                <label className="range-field">
                  <span>大小：{anchorValues.scale}%</span>
                  <input
                    aria-label={`${state.name} 的大小`}
                    max="200"
                    min="50"
                    onChange={(event) => updateAnchor(state.id, "scale", event.target.value)}
                    step="5"
                    type="range"
                    value={anchorValues.scale}
                  />
                </label>
              </div>
            </div>
          );
        })}
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

function getTextOutputDraft(
  stateId: string,
  assets: Asset[],
  bindings: StateBinding[]
): TextOutputDraft {
  const binding = bindings.find((item) => item.stateId === stateId);

  if (!binding || binding.action.type !== "show") {
    return {
      content: "",
      transform: cloneTransform(DEFAULT_TEXT_TRANSFORM)
    };
  }

  const asset = assets.find((item) => item.id === binding.action.assetId && item.type === "text");

  return {
    content: asset?.content ?? "",
    transform: cloneTransform(binding.action.transform)
  };
}

function createAnchorControlValues(transform: Transform) {
  return {
    x: Math.round(transform.position[0] * 100).toString(),
    y: Math.round(transform.position[1] * 100).toString(),
    scale: Math.round(transform.scale[0] * 100).toString()
  };
}

function cloneTransform(transform: Transform): Transform {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}
