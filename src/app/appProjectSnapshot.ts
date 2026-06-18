import type { AppState } from "./appState";
import { initialAppState } from "./appState";
import {
  restoreRecognitionModel,
  serializeRecognitionModel
} from "../features/ml/recognitionModelSnapshot";
import {
  normalizeProjectSettings,
  type Project
} from "../features/projects/projectTypes";
import {
  createDefaultSampleCounts,
  normalizeEditableProjectStates
} from "../features/projects/projectStates";
import { createId } from "../shared/id";

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
  const states = normalizeEditableProjectStates(state.states);

  return {
    id: state.projectId ?? createId("project"),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    states: states.map((projectState) => ({
      ...projectState,
      sampleIds: createSampleIds(projectState.id, state.sampleCounts[projectState.id] ?? 0)
    })),
    assets: state.assets,
    bindings: state.bindings,
    settings: normalizeProjectSettings(state.settings),
    ...(recognitionModel ? { recognitionModel } : {})
  };
}

export function restoreStateFromProject(project: Project): AppState {
  const states = normalizeEditableProjectStates(project.states);

  return {
    ...initialAppState,
    screen: "author",
    projectId: project.id,
    states,
    sampleCounts: {
      ...createDefaultSampleCounts(states),
      ...Object.fromEntries(project.states.map((state) => [state.id, state.sampleIds.length]))
    },
    assets: project.assets,
    bindings: project.bindings,
    recognitionModel: restoreRecognitionModel(project.recognitionModel),
    settings: normalizeProjectSettings(project.settings)
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
