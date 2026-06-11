import type { SampleStore, TrainingSampleRecord } from "../capture/sampleStore";
import type { ImageEmbedder, TrainableClassifier } from "./classifierTypes";
import { createSampleModelTrainer } from "./sampleModelTrainer";

function createSample(
  id: string,
  projectId: string,
  stateId: string,
  blob: Blob
): TrainingSampleRecord {
  return {
    id,
    projectId,
    stateId,
    blob,
    createdAt: "2026-06-10T00:00:00.000Z"
  };
}

function createFakeSampleStore(samples: TrainingSampleRecord[]): SampleStore {
  return {
    saveSample: vi.fn(),
    listByState: vi.fn(async (stateId) => samples.filter((sample) => sample.stateId === stateId)),
    getSampleBlob: vi.fn(),
    deleteSample: vi.fn()
  };
}

describe("sampleModelTrainer", () => {
  it("trains a classifier from stored camera samples", async () => {
    const imageA = document.createElement("canvas");
    const imageB = document.createElement("canvas");
    const blobA = new Blob(["state-a"], { type: "image/jpeg" });
    const blobB = new Blob(["state-b"], { type: "image/jpeg" });
    const sampleStore = createFakeSampleStore([
      createSample("sample_a", "project_1", "state_a", blobA),
      createSample("sample_b", "project_1", "state_b", blobB)
    ]);
    const embedder: ImageEmbedder = {
      embed: vi.fn().mockResolvedValueOnce([0, 0]).mockResolvedValueOnce([1, 1])
    };
    const classifier: TrainableClassifier = {
      train: vi.fn(),
      predict: vi.fn()
    };
    const imageLoader = vi.fn().mockResolvedValueOnce(imageA).mockResolvedValueOnce(imageB);

    const trainer = createSampleModelTrainer({
      stateIds: ["state_a", "state_b"],
      sampleStore,
      embedderFactory: vi.fn(async () => embedder),
      classifierFactory: vi.fn(() => classifier),
      imageLoader
    });

    const result = await trainer.train("project_1");

    expect(imageLoader).toHaveBeenCalledWith(blobA);
    expect(imageLoader).toHaveBeenCalledWith(blobB);
    expect(embedder.embed).toHaveBeenCalledWith(imageA);
    expect(embedder.embed).toHaveBeenCalledWith(imageB);
    expect(classifier.train).toHaveBeenCalledWith([
      { stateId: "state_a", embedding: [0, 0] },
      { stateId: "state_b", embedding: [1, 1] }
    ]);
    expect(result.stateCount).toBe(2);
    expect(result.exampleCount).toBe(2);
    expect(result.model).toEqual({
      classifier,
      embedder
    });
  });

  it("fails when any required state has no samples for the project", async () => {
    const sampleStore = createFakeSampleStore([
      createSample("sample_a", "project_1", "state_a", new Blob(["state-a"]))
    ]);
    const trainer = createSampleModelTrainer({
      stateIds: ["state_a", "state_b"],
      sampleStore,
      embedderFactory: vi.fn(async () => ({ embed: vi.fn() })),
      classifierFactory: vi.fn(() => ({ train: vi.fn(), predict: vi.fn() }))
    });

    await expect(trainer.train("project_1")).rejects.toThrow(
      "状态 state_b 没有可训练样本。"
    );
  });

  it("uses the local image embedder by default so training does not depend on a remote model", async () => {
    const darkImage = {
      data: new Uint8ClampedArray(4 * 4 * 4),
      height: 4,
      width: 4
    } as ImageData;
    const brightPixels = new Uint8ClampedArray(4 * 4 * 4).fill(255);
    const brightImage = {
      data: brightPixels,
      height: 4,
      width: 4
    } as ImageData;
    const sampleStore = createFakeSampleStore([
      createSample("sample_a", "project_1", "state_a", new Blob(["state-a"])),
      createSample("sample_b", "project_1", "state_b", new Blob(["state-b"]))
    ]);
    const imageLoader = vi.fn().mockResolvedValueOnce(darkImage).mockResolvedValueOnce(brightImage);

    const trainer = createSampleModelTrainer({
      stateIds: ["state_a", "state_b"],
      sampleStore,
      imageLoader
    });

    const result = await trainer.train("project_1");

    expect(result.exampleCount).toBe(2);
    expect(result.model?.classifier.predict(await result.model.embedder.embed(darkImage))?.stateId).toBe(
      "state_a"
    );
    expect(
      result.model?.classifier.predict(await result.model.embedder.embed(brightImage))?.stateId
    ).toBe("state_b");
  });
});
