import { createId } from "../../shared/id";
import { runStore, STORES } from "../../shared/storage/indexedDb";
import type { Project } from "./projectTypes";

export type ProjectRepository = {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
};

export function createEmptyProject(name: string): Project {
  const now = new Date().toISOString();

  return {
    id: createId("project"),
    name,
    createdAt: now,
    updatedAt: now,
    states: [],
    assets: [],
    bindings: []
  };
}

export function createProjectRepository(): ProjectRepository {
  return {
    async list() {
      const result = await runStore<Project[]>(STORES.projects, "readonly", (store) =>
        store.getAll()
      );

      return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async get(id) {
      return runStore<Project | undefined>(STORES.projects, "readonly", (store) =>
        store.get(id)
      );
    },

    async save(project) {
      await runStore<IDBValidKey>(STORES.projects, "readwrite", (store) =>
        store.put(project)
      );
    },

    async delete(id) {
      await runStore<undefined>(STORES.projects, "readwrite", (store) => store.delete(id));
    }
  };
}
