import { createSampleStore } from "./sampleStore";

async function deleteDatabase(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Database ${name} is blocked.`));
  });
}

describe("sampleStore", () => {
  beforeEach(async () => {
    await deleteDatabase("ar-builder");
  });

  it("saves and lists samples by state", async () => {
    const store = createSampleStore();
    const blob = new Blob(["sample"], { type: "image/jpeg" });

    const saved = await store.saveSample("project_1", "state_1", blob);
    const samples = await store.listByState("state_1");

    expect(saved.stateId).toBe("state_1");
    expect(samples).toHaveLength(1);
    expect(samples[0].projectId).toBe("project_1");
  });

  it("deletes a saved sample", async () => {
    const store = createSampleStore();
    const blob = new Blob(["sample"], { type: "image/jpeg" });

    const saved = await store.saveSample("project_1", "state_2", blob);
    await store.deleteSample(saved.id);

    await expect(store.getSampleBlob(saved.id)).resolves.toBeUndefined();
  });
});
