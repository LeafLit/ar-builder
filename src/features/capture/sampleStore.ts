import { createId } from "../../shared/id";
import { runStore, STORES } from "../../shared/storage/indexedDb";

export type TrainingSampleRecord = {
  id: string;
  projectId: string;
  stateId: string;
  createdAt: string;
  blob: Blob;
};

export type SampleStore = {
  saveSample(projectId: string, stateId: string, blob: Blob): Promise<TrainingSampleRecord>;
  listByState(stateId: string): Promise<TrainingSampleRecord[]>;
  listByProject(projectId: string): Promise<TrainingSampleRecord[]>;
  getSampleBlob(id: string): Promise<Blob | undefined>;
  deleteSample(id: string): Promise<void>;
  saveSampleRecord(sample: TrainingSampleRecord): Promise<TrainingSampleRecord>;
};

export function createSampleStore(): SampleStore {
  return {
    async saveSample(projectId, stateId, blob) {
      const sample: TrainingSampleRecord = {
        id: createId("sample"),
        projectId,
        stateId,
        createdAt: new Date().toISOString(),
        blob
      };

      await runStore<IDBValidKey>(STORES.samples, "readwrite", (store) =>
        store.put(sample)
      );

      return sample;
    },

    async listByState(stateId) {
      const samples = await runStore<TrainingSampleRecord[]>(
        STORES.samples,
        "readonly",
        (store) => store.getAll()
      );

      return samples
        .filter((sample) => sample.stateId === stateId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async listByProject(projectId) {
      const samples = await runStore<TrainingSampleRecord[]>(
        STORES.samples,
        "readonly",
        (store) => store.getAll()
      );

      return samples
        .filter((sample) => sample.projectId === projectId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async getSampleBlob(id) {
      const sample = await runStore<TrainingSampleRecord | undefined>(
        STORES.samples,
        "readonly",
        (store) => store.get(id)
      );

      return sample?.blob;
    },

    async deleteSample(id) {
      await runStore<undefined>(STORES.samples, "readwrite", (store) => store.delete(id));
    },

    async saveSampleRecord(sample) {
      await runStore<IDBValidKey>(STORES.samples, "readwrite", (store) =>
        store.put(sample)
      );

      return sample;
    }
  };
}
