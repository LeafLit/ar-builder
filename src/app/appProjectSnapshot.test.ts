import { createProjectFromAppState, restoreStateFromProject } from "./appProjectSnapshot";
import { initialAppState, type AppState } from "./appState";
import type { Project } from "../features/projects/projectTypes";
import { createEmbeddingClassifier } from "../features/ml/embeddingClassifier";

describe("appProjectSnapshot", () => {
  it("creates a local project snapshot from the current app state", () => {
    const state: AppState = {
      screen: "test",
      projectId: "project_existing",
      states: initialAppState.states,
      sampleCounts: {
        state_a: 2,
        state_b: 1
      },
      assets: [
        {
          id: "asset_image_state_a",
          type: "image2d",
          name: "小树贴纸",
          url: "data:image/png;base64,tree"
        }
      ],
      bindings: [
        {
          id: "binding_state_a",
          stateId: "state_a",
          action: {
            type: "show",
            assetId: "asset_image_state_a",
            visible: true,
            transform: {
              position: [0.4, -0.4, 0],
              rotation: [0, 0, 0],
              scale: [1.4, 1.4, 1]
            }
          }
        }
      ],
      settings: {
        recognitionSensitivity: 85
      }
    };

    const project = createProjectFromAppState(state, {
      name: "我的 AR 项目",
      now: () => "2026-06-12T12:30:00.000Z"
    });

    expect(project).toEqual({
      id: "project_existing",
      name: "我的 AR 项目",
      createdAt: "2026-06-12T12:30:00.000Z",
      updatedAt: "2026-06-12T12:30:00.000Z",
      states: [
        {
          id: "state_a",
          name: "状态 A",
          order: 0,
          sampleIds: ["sample_state_a_1", "sample_state_a_2"]
        },
        {
          id: "state_b",
          name: "状态 B",
          order: 1,
          sampleIds: ["sample_state_b_1"]
        }
      ],
      assets: state.assets,
      bindings: state.bindings,
      settings: {
        recognitionSensitivity: 85
      }
    });
  });

  it("saves recognition sensitivity settings in project snapshots", () => {
    const state: AppState = {
      screen: "test",
      projectId: "project_existing",
      states: initialAppState.states,
      sampleCounts: {
        state_a: 0,
        state_b: 0
      },
      assets: [],
      bindings: [],
      settings: {
        recognitionSensitivity: 100
      }
    };

    const project = createProjectFromAppState(state, {
      name: "sensitivity project",
      now: () => "2026-06-13T00:00:00.000Z"
    });

    expect(project.settings).toEqual({
      recognitionSensitivity: 100
    });
  });

  it("saves custom state names into project states", () => {
    const project = createProjectFromAppState(
      {
        ...initialAppState,
        states: [
          { id: "state_a", name: "拳头", order: 0 },
          { id: "state_b", name: "巴掌", order: 1 }
        ],
        sampleCounts: { state_a: 2, state_b: 1 }
      },
      { name: "命名状态项目", now: () => "2026-06-18T00:00:00.000Z" }
    );

    expect(project.states.map(({ id, name, order }) => ({ id, name, order }))).toEqual([
      { id: "state_a", name: "拳头", order: 0 },
      { id: "state_b", name: "巴掌", order: 1 }
    ]);
  });

  it("restores custom state names from a saved project", () => {
    const restored = restoreStateFromProject({
      id: "project_1",
      name: "命名状态项目",
      createdAt: "2026-06-18T00:00:00.000Z",
      updatedAt: "2026-06-18T00:00:00.000Z",
      states: [
        { id: "state_a", name: "拳头", order: 0, sampleIds: [] },
        { id: "state_b", name: "巴掌", order: 1, sampleIds: [] }
      ],
      assets: [],
      bindings: []
    });

    expect(restored.states).toEqual([
      { id: "state_a", name: "拳头", order: 0 },
      { id: "state_b", name: "巴掌", order: 1 }
    ]);
  });

  it("restores a saved project into the authoring screen", () => {
    const project: Project = {
      id: "project_saved",
      name: "保存的项目",
      createdAt: "2026-06-12T12:00:00.000Z",
      updatedAt: "2026-06-12T12:30:00.000Z",
      states: [
        {
          id: "state_a",
          name: "状态 A",
          order: 0,
          sampleIds: ["sample_1", "sample_2"]
        }
      ],
      assets: [
        {
          id: "asset_text_state_a",
          type: "text",
          name: "状态 A 文字",
          content: "欢迎回来"
        }
      ],
      bindings: []
    };

    expect(restoreStateFromProject(project)).toEqual(
      expect.objectContaining({
        screen: "author",
        projectId: "project_saved",
        sampleCounts: {
          state_a: 2,
          state_b: 0
        },
        assets: project.assets,
        bindings: []
      })
    );
  });

  it("restores recognition sensitivity settings from project snapshots", () => {
    const project: Project = {
      id: "project_1",
      name: "restore sensitivity project",
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
      states: [],
      assets: [],
      bindings: [],
      settings: {
        recognitionSensitivity: 95
      }
    };

    expect(restoreStateFromProject(project).settings.recognitionSensitivity).toBe(95);
  });

  it("uses default recognition sensitivity when restoring old project snapshots", () => {
    const project: Project = {
      id: "project_1",
      name: "old project",
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
      states: [],
      assets: [],
      bindings: []
    };

    expect(restoreStateFromProject(project).settings.recognitionSensitivity).toBe(85);
  });

  it("saves and restores a trained recognition model snapshot", () => {
    const classifier = createEmbeddingClassifier();
    classifier.train([
      { stateId: "state_a", embedding: [0, 0] },
      { stateId: "state_b", embedding: [1, 1] }
    ]);
    const state: AppState = {
      screen: "test",
      projectId: "project_with_model",
      states: initialAppState.states,
      sampleCounts: {
        state_a: 1,
        state_b: 1
      },
      assets: [],
      bindings: [],
      settings: {
        recognitionSensitivity: 85
      },
      recognitionModel: {
        classifier,
        embedder: {
          embed: vi.fn()
        }
      }
    };

    const project = createProjectFromAppState(state, {
      name: "可继续识别的项目",
      now: () => "2026-06-12T13:00:00.000Z"
    });

    expect(project.recognitionModel).toEqual({
      version: 1,
      classifier: {
        kind: "embedding-centroid-v1",
        centroids: [
          { stateId: "state_a", vector: [0, 0] },
          { stateId: "state_b", vector: [1, 1] }
        ]
      }
    });
    expect(restoreStateFromProject(project).recognitionModel?.classifier.predict([0, 0])?.stateId).toBe(
      "state_a"
    );
  });
});
