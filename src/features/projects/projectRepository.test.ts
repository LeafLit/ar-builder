import { createEmptyProject, createProjectRepository } from "./projectRepository";

async function deleteDatabase(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Database ${name} is blocked.`));
  });
}

describe("projectRepository", () => {
  beforeEach(async () => {
    await deleteDatabase("ar-builder");
  });

  it("creates and reads a local project", async () => {
    const repository = createProjectRepository();
    const project = createEmptyProject("厨房导航原型");

    await repository.save(project);

    const loaded = await repository.get(project.id);
    expect(loaded?.name).toBe("厨房导航原型");
    expect(loaded?.states).toEqual([]);
  });

  it("lists saved projects ordered by update time", async () => {
    const repository = createProjectRepository();
    const older = { ...createEmptyProject("旧项目"), updatedAt: "2026-01-01T00:00:00.000Z" };
    const newer = { ...createEmptyProject("新项目"), updatedAt: "2026-02-01T00:00:00.000Z" };

    await repository.save(older);
    await repository.save(newer);

    const projects = await repository.list();
    expect(projects[0].name).toBe("新项目");
  });
});
