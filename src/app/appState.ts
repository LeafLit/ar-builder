import type {
  Asset,
  StateBinding,
  TextOutputDraft,
  Transform
} from "../features/projects/projectTypes";
import type { RecognitionModel } from "../features/ml/classifierTypes";

export type AppScreen = "home" | "capture" | "train" | "author" | "test";

export type AppState = {
  screen: AppScreen;
  projectId?: string;
  sampleCounts: Record<string, number>;
  assets: Asset[];
  bindings: StateBinding[];
  recognitionModel?: RecognitionModel;
};

export type AppAction =
  | { type: "goTo"; screen: AppScreen }
  | { type: "selectProject"; projectId: string }
  | { type: "recordSample"; stateId: string; count: number }
  | { type: "saveTextOutputs"; outputs: Record<string, string | TextOutputDraft> }
  | { type: "storeRecognitionModel"; model: RecognitionModel };

const DEFAULT_TEXT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

export const initialAppState: AppState = {
  screen: "home",
  sampleCounts: {
    state_a: 0,
    state_b: 0
  },
  assets: [],
  bindings: []
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "goTo":
      return { ...state, screen: action.screen };
    case "selectProject":
      return { ...state, projectId: action.projectId };
    case "recordSample":
      return {
        ...state,
        sampleCounts: {
          ...state.sampleCounts,
          [action.stateId]: action.count
        }
      };
    case "storeRecognitionModel":
      return {
        ...state,
        recognitionModel: action.model
      };
    case "saveTextOutputs": {
      const stateIds = Object.keys(action.outputs);
      const normalizedOutputs = Object.fromEntries(
        stateIds.map((stateId) => [stateId, normalizeTextOutput(action.outputs[stateId])])
      );
      const textAssetIds = new Set(stateIds.map((stateId) => `asset_text_${stateId}`));
      const textAssets: Asset[] = stateIds.map((stateId) => ({
        id: `asset_text_${stateId}`,
        type: "text",
        name: `${stateId} 文字`,
        content: normalizedOutputs[stateId].content.trim()
      }));
      const textBindings: StateBinding[] = stateIds.map((stateId) => ({
        id: `binding_${stateId}`,
        stateId,
        action: {
          type: "show",
          assetId: `asset_text_${stateId}`,
          transform: normalizedOutputs[stateId].transform,
          visible: true
        }
      }));
      const preservedAssets = state.assets.filter((asset) => !textAssetIds.has(asset.id));
      const preservedBindings = state.bindings.filter((binding) => !stateIds.includes(binding.stateId));

      return {
        ...state,
        assets: [...preservedAssets, ...textAssets],
        bindings: [...preservedBindings, ...textBindings]
      };
    }
    default:
      return state;
  }
}

function normalizeTextOutput(output: string | TextOutputDraft): TextOutputDraft {
  if (typeof output === "string") {
    return {
      content: output,
      transform: cloneTransform(DEFAULT_TEXT_TRANSFORM)
    };
  }

  return {
    content: output.content,
    transform: cloneTransform(output.transform)
  };
}

function cloneTransform(transform: Transform): Transform {
  return {
    position: [...transform.position],
    rotation: [...transform.rotation],
    scale: [...transform.scale]
  };
}
