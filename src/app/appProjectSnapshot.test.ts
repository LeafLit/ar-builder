import { createProjectFromAppState, restoreStateFromProject } from "./appProjectSnapshot";
import type { AppState } from "./appState";
import type { Project } from "../features/projects/projectTypes";
import { createEmbeddingClassifier } from "../features/ml/embeddingClassifier";

describe("appProjectSnapshot", () => {
  it("creates a local project snapshot from the current app state", () => {
    const state: AppState = {
      screen: "test",
      projectId: "project_existing",
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
      ]
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
      bindings: state.bindings
    });
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

  it("saves and restores a trained recognition model snapshot", () => {
    const classifier = createEmbeddingClassifier();
    classifier.train([
      { stateId: "state_a", embedding: [0, 0] },
      { stateId: "state_b", embedding: [1, 1] }
    ]);
    const state: AppState = {
      screen: "test",
      projectId: "project_with_model",
      sampleCounts: {
        state_a: 1,
        state_b: 1
      },
      assets: [],
      bindings: [],
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
