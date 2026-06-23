import { createId } from "../../shared/id";
import type { TrainingSampleRecord } from "../capture/sampleStore";
import type { Project } from "./projectTypes";

export type ProjectExportSample = {
  id: string;
  projectId: string;
  stateId: string;
  createdAt: string;
  type: string;
  dataUrl: string;
};

export type ProjectExportBundle = {
  version: 1;
  exportedAt: string;
  project: Project;
  samples: ProjectExportSample[];
};

type ExportOptions = {
  now?: () => string;
};

type ImportOptions = {
  createId?: (prefix: string) => string;
  now?: () => string;
};

export async function createProjectExportBundle(
  project: Project,
  samples: TrainingSampleRecord[],
  { now = () => new Date().toISOString() }: ExportOptions = {}
): Promise<ProjectExportBundle> {
  return {
    version: 1,
    exportedAt: now(),
    project,
    samples: await Promise.all(
      samples.map(async (sample) => ({
        id: sample.id,
        projectId: sample.projectId,
        stateId: sample.stateId,
        createdAt: sample.createdAt,
        type: sample.blob.type || "application/octet-stream",
        dataUrl: await blobToDataUrl(sample.blob)
      }))
    )
  };
}

export async function parseProjectExportBundle(
  text: string,
  {
    createId: createNextId = createId,
    now = () => new Date().toISOString()
  }: ImportOptions = {}
): Promise<{ project: Project; samples: TrainingSampleRecord[] }> {
  const bundle = JSON.parse(text) as ProjectExportBundle;

  if (bundle.version !== 1 || !bundle.project || !Array.isArray(bundle.samples)) {
    throw new Error("Unsupported AR Builder project file.");
  }

  const importedAt = now();
  const projectId = createNextId("project");
  const sampleIdMap = new Map(
    bundle.samples.map((sample) => [sample.id, createNextId("sample")])
  );
  const samples = await Promise.all(
    bundle.samples.map(async (sample) => ({
      id: sampleIdMap.get(sample.id) ?? createNextId("sample"),
      projectId,
      stateId: sample.stateId,
      createdAt: sample.createdAt,
      blob: dataUrlToBlob(sample.dataUrl, sample.type)
    }))
  );

  return {
    project: {
      ...bundle.project,
      id: projectId,
      name: `${bundle.project.name}（导入副本）`,
      createdAt: importedAt,
      updatedAt: importedAt,
      states: bundle.project.states.map((state) => ({
        ...state,
        sampleIds: samples
          .filter((sample) => sample.stateId === state.id)
          .map((sample) => sample.id)
      }))
    },
    samples
  };
}

async function blobToDataUrl(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

function dataUrlToBlob(dataUrl: string, fallbackType: string) {
  const [, meta = "", base64 = ""] = dataUrl.match(/^data:([^,]*),(.+)$/) ?? [];
  const mimeType = meta.split(";")[0] || fallbackType || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}
