import type { Project } from "./projectTypes";
import {
  createProjectExportBundle,
  parseProjectExportBundle
} from "./projectTransfer";
import type { TrainingSampleRecord } from "../capture/sampleStore";

describe("projectTransfer", () => {
  it("exports project metadata together with camera samples", async () => {
    const project = createProject("project_1");
    const samples: TrainingSampleRecord[] = [
      {
        id: "sample_1",
        projectId: "project_1",
        stateId: "state_a",
        createdAt: "2026-06-22T10:00:00.000Z",
        blob: new Blob(["state-a-image"], { type: "image/jpeg" })
      }
    ];

    const bundle = await createProjectExportBundle(project, samples, {
      now: () => "2026-06-23T08:00:00.000Z"
    });

    expect(bundle.version).toBe(1);
    expect(bundle.exportedAt).toBe("2026-06-23T08:00:00.000Z");
    expect(bundle.project.id).toBe("project_1");
    expect(bundle.samples).toHaveLength(1);
    expect(bundle.samples[0]).toMatchObject({
      id: "sample_1",
      projectId: "project_1",
      stateId: "state_a",
      type: "image/jpeg"
    });
    expect(bundle.samples[0].dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("imports a project as a new copy and restores sample blobs", async () => {
    const exported = await createProjectExportBundle(createProject("project_original"), [
      {
        id: "sample_original",
        projectId: "project_original",
        stateId: "state_a",
        createdAt: "2026-06-22T10:00:00.000Z",
        blob: new Blob(["sample-body"], { type: "image/jpeg" })
      }
    ]);

    const imported = await parseProjectExportBundle(JSON.stringify(exported), {
      createId: (prefix) => `${prefix}_copy`,
      now: () => "2026-06-23T09:00:00.000Z"
    });

    expect(imported.project.id).toBe("project_copy");
    expect(imported.project.name).toBe("Demo Project（导入副本）");
    expect(imported.project.createdAt).toBe("2026-06-23T09:00:00.000Z");
    expect(imported.project.states[0].sampleIds).toEqual(["sample_copy"]);
    expect(imported.samples).toHaveLength(1);
    expect(imported.samples[0]).toMatchObject({
      id: "sample_copy",
      projectId: "project_copy",
      stateId: "state_a",
      createdAt: "2026-06-22T10:00:00.000Z"
    });
    await expect(imported.samples[0].blob.text()).resolves.toBe("sample-body");
  });
});

function createProject(id: string): Project {
  return {
    id,
    name: "Demo Project",
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    states: [
      {
        id: "state_a",
        name: "State A",
        order: 0,
        sampleIds: ["sample_1"]
      }
    ],
    assets: [],
    bindings: [],
    settings: {
      recognitionSensitivity: 85
    }
  };
}
