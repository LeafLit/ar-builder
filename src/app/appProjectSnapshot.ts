import type { AppState } from "./appState";
import { initialAppState } from "./appState";
import {
  restoreRecognitionModel,
  serializeRecognitionModel
} from "../features/ml/recognitionModelSnapshot";
import type { InputState, Project } from "../features/projects/projectTypes";
import { createId } from "../shared/id";

const DEFAULT_PROJECT_STATES = [
  { id: "state_a", name: "状态 A", order: 0 },
  { id: "state_b", name: "状态 B", order: 1 }
] as const;

type CreateProjectOptions = {
  name: string;
  now?: () => string;
};

export function createProjectFromAppState(
  state: AppState,
  { name, now = () => new Date().toISOString() }: CreateProjectOptions
): Project {
  const timestamp = now();
  const recognitionModel = serializeRecognitionModel(state.recognitionModel);

  return {
    id: state.projectId ?? createId("project"),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    states: DEFAULT_PROJECT_STATES.map((projectState) => ({
      ...projectState,
      sampleIds: createSampleIds(projectState.id, state.sampleCounts[projectState.id] ?? 0)
    })),
    assets: state.assets,
    bindings: state.bindings,
    ...(recognitionModel ? { recognitionModel } : {})
  };
}

export function restoreStateFromProject(project: Project): AppState {
  return {
    ...initialAppState,
    screen: "author",
    projectId: project.id,
    sampleCounts: {
      ...initialAppState.sampleCounts,
      ...Object.fromEntries(project.states.map((state) => [state.id, state.sampleIds.length]))
    },
    assets: project.assets,
    bindings: project.bindings,
    recognitionModel: restoreRecognitionModel(project.recognitionModel)
  };
}

export function createProjectSummary(project: Project) {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    assets: project.assets.length,
    bindings: project.bindings.length
  };
}

function createSampleIds(stateId: string, count: number) {
  return Array.from({ length: count }, (_, index) => `sample_${stateId}_${index + 1}`);
}
