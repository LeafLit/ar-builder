# AR Builder MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable PWA version of AR Builder: create projects, capture camera samples, train a browser recognizer, bind states to outputs, and test the result on a phone.

**Architecture:** The app is a React + TypeScript PWA with small feature modules. Camera capture, ML recognition, authoring rules, local persistence, and AR rendering communicate through typed interfaces instead of directly controlling each other.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, IndexedDB, TensorFlow.js, MobileNet, Three.js, vite-plugin-pwa.

---

## Scope

This plan implements a working MVP that follows `docs/PRD.md` and `docs/DEVELOPMENT_MANUAL.md`.

Included:

- Mobile-first PWA project shell.
- Local project creation and persistence.
- Camera permission and sample capture.
- Browser-side trainable image recognizer.
- State-to-output authoring.
- Camera overlay AR test mode.
- WebXR capability detection and adapter interface.
- Build and test verification.

Deferred to later plans:

- Native iOS/Android/HarmonyOS wrappers.
- Cloud login and sync.
- Complex state machine editor.
- Multiplayer or team collaboration.
- Full WebXR spatial authoring tools.

## File Structure

Create these files:

```text
package.json
index.html
tsconfig.json
vite.config.ts
vitest.setup.ts
src/main.tsx
src/vite-env.d.ts
src/app/App.tsx
src/app/App.test.tsx
src/app/appState.ts
src/app/appState.test.ts
src/features/projects/projectTypes.ts
src/features/projects/projectRepository.ts
src/features/projects/projectRepository.test.ts
src/features/capture/cameraService.ts
src/features/capture/sampleStore.ts
src/features/capture/sampleStore.test.ts
src/features/ml/classifierTypes.ts
src/features/ml/embeddingClassifier.ts
src/features/ml/embeddingClassifier.test.ts
src/features/ml/mobileNetEmbedder.ts
src/features/authoring/authoringTypes.ts
src/features/authoring/ruleEngine.ts
src/features/authoring/ruleEngine.test.ts
src/features/ar/arTypes.ts
src/features/ar/capabilities.ts
src/features/ar/capabilities.test.ts
src/features/ar/overlayRenderer.ts
src/features/ar/webxrAdapter.ts
src/shared/id.ts
src/shared/id.test.ts
src/shared/storage/indexedDb.ts
src/styles.css
public/manifest.webmanifest
```

Responsibilities:

- `src/features/projects/*`: project model and local persistence.
- `src/features/capture/*`: camera access and training sample storage.
- `src/features/ml/*`: image embeddings and trainable recognition.
- `src/features/authoring/*`: state-to-action data and resolution.
- `src/features/ar/*`: platform detection and camera overlay rendering.
- `src/app/*`: UI flow and app-level state.
- `src/shared/*`: shared ID and IndexedDB helpers.

---

### Task 1: Project Tooling

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `public/manifest.webmanifest`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "ar-builder",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 2: Install runtime and development dependencies**

Run:

```powershell
pnpm.cmd add react react-dom three @tensorflow/tfjs @tensorflow-models/mobilenet vite-plugin-pwa lucide-react
pnpm.cmd add -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @types/react @types/react-dom fake-indexeddb
```

Expected: `node_modules` and `pnpm-lock.yaml` are created, and dependencies are added to `package.json`.

- [ ] **Step 3: Add TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals"]
  },
  "include": ["src", "vite.config.ts", "vitest.setup.ts"]
}
```

- [ ] **Step 4: Add Vite and test configuration**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["manifest.webmanifest"],
      manifest: {
        name: "AR Builder",
        short_name: "AR Builder",
        description: "手机端 AR 原型制作工具",
        theme_color: "#111827",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/"
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true
  }
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

- [ ] **Step 5: Add HTML entry and PWA manifest**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#111827" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>AR Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `public/manifest.webmanifest`:

```json
{
  "name": "AR Builder",
  "short_name": "AR Builder",
  "description": "手机端 AR 原型制作工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#111827",
  "icons": []
}
```

- [ ] **Step 6: Add main entry and base styles**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/styles.css` with mobile-first layout tokens:

```css
:root {
  color: #111827;
  background: #f8fafc;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.screen {
  width: min(100%, 760px);
  margin: 0 auto;
  padding: 16px;
}

.primary-button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  padding: 0 14px;
  color: #ffffff;
  background: #0f766e;
}

.secondary-button {
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 14px;
  color: #0f172a;
  background: #ffffff;
}

.panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.stack {
  display: grid;
  gap: 12px;
}

.muted {
  color: #64748b;
}
```

- [ ] **Step 7: Create minimal App and smoke test**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <header className="top-bar">
        <strong>AR Builder</strong>
        <span className="muted">MVP</span>
      </header>
      <section className="screen stack">
        <h1>创建手机端 AR 原型</h1>
        <p className="muted">采集状态、训练识别、绑定输出，然后实时测试。</p>
        <button className="primary-button">新建项目</button>
      </section>
    </main>
  );
}
```

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the MVP shell", () => {
    render(<App />);
    expect(screen.getByText("AR Builder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建项目" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Verify tooling**

Run:

```powershell
pnpm.cmd test
pnpm.cmd run build
```

Expected: tests pass and build completes.

---

### Task 2: Domain Types And Local Project Repository

**Files:**

- Create: `src/shared/id.ts`
- Create: `src/shared/id.test.ts`
- Create: `src/shared/storage/indexedDb.ts`
- Create: `src/features/projects/projectTypes.ts`
- Create: `src/features/projects/projectRepository.ts`
- Create: `src/features/projects/projectRepository.test.ts`

- [ ] **Step 1: Write ID tests**

Create `src/shared/id.test.ts`:

```ts
import { createId } from "./id";

describe("createId", () => {
  it("creates readable unique ids with a prefix", () => {
    const first = createId("project");
    const second = createId("project");

    expect(first).toMatch(/^project_/);
    expect(second).toMatch(/^project_/);
    expect(first).not.toBe(second);
  });
});
```

- [ ] **Step 2: Implement ID helper**

Create `src/shared/id.ts`:

```ts
export function createId(prefix: string): string {
  const random = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}
```

- [ ] **Step 3: Verify ID tests**

Run:

```powershell
pnpm.cmd test src/shared/id.test.ts
```

Expected: PASS.

- [ ] **Step 4: Create project types**

Create `src/features/projects/projectTypes.ts`:

```ts
export type AssetType = "model3d" | "image2d" | "text" | "audio";

export type Transform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export type InputState = {
  id: string;
  name: string;
  sampleIds: string[];
  order: number;
};

export type Asset = {
  id: string;
  type: AssetType;
  name: string;
  localBlobKey?: string;
  url?: string;
};

export type OutputAction =
  | {
      type: "show";
      assetId: string;
      transform: Transform;
      visible: boolean;
    }
  | {
      type: "transform";
      assetId: string;
      transform: Transform;
    }
  | {
      type: "playAudio";
      assetId: string;
    };

export type StateBinding = {
  id: string;
  stateId: string;
  action: OutputAction;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  states: InputState[];
  assets: Asset[];
  bindings: StateBinding[];
};
```

- [ ] **Step 5: Create IndexedDB helper**

Create `src/shared/storage/indexedDb.ts`:

```ts
const DB_NAME = "ar-builder";
const DB_VERSION = 1;

export const STORES = {
  projects: "projects",
  samples: "samples"
} as const;

export function openAppDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.projects)) {
        db.createObjectStore(STORES.projects, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.samples)) {
        db.createObjectStore(STORES.samples, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function runStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openAppDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
```

- [ ] **Step 6: Write repository tests**

Create `src/features/projects/projectRepository.test.ts`:

```ts
import { createEmptyProject, createProjectRepository } from "./projectRepository";

describe("projectRepository", () => {
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
```

- [ ] **Step 7: Implement repository**

Create `src/features/projects/projectRepository.ts`:

```ts
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
      const updatedProject = { ...project, updatedAt: new Date().toISOString() };
      await runStore<IDBValidKey>(STORES.projects, "readwrite", (store) =>
        store.put(updatedProject)
      );
    },

    async delete(id) {
      await runStore<undefined>(STORES.projects, "readwrite", (store) => store.delete(id));
    }
  };
}
```

- [ ] **Step 8: Verify repository**

Run:

```powershell
pnpm.cmd test src/shared/id.test.ts src/features/projects/projectRepository.test.ts
```

Expected: PASS.

---

### Task 3: Platform Capability And AR Adapter Contracts

**Files:**

- Create: `src/features/ar/arTypes.ts`
- Create: `src/features/ar/capabilities.ts`
- Create: `src/features/ar/capabilities.test.ts`
- Create: `src/features/ar/webxrAdapter.ts`

- [ ] **Step 1: Create AR types**

Create `src/features/ar/arTypes.ts`:

```ts
import type { Transform } from "../projects/projectTypes";

export type ARMode = "webxr" | "camera-overlay" | "screen-only";

export type DeviceCapabilities = {
  camera: boolean;
  webxrImmersiveAr: boolean;
  mode: ARMode;
};

export type ARAdapter = {
  mode: ARMode;
  isSupported(): Promise<boolean>;
  start(container: HTMLElement): Promise<void>;
  stop(): Promise<void>;
  placeObject(assetId: string): Promise<void>;
  updateObjectTransform(assetId: string, transform: Transform): Promise<void>;
};
```

- [ ] **Step 2: Write capability tests**

Create `src/features/ar/capabilities.test.ts`:

```ts
import { detectDeviceCapabilities } from "./capabilities";

describe("detectDeviceCapabilities", () => {
  it("uses screen-only when camera is missing", async () => {
    const result = await detectDeviceCapabilities({
      mediaDevices: undefined,
      xr: undefined
    });

    expect(result).toEqual({
      camera: false,
      webxrImmersiveAr: false,
      mode: "screen-only"
    });
  });

  it("uses camera overlay when camera exists but WebXR AR is unavailable", async () => {
    const result = await detectDeviceCapabilities({
      mediaDevices: {} as MediaDevices,
      xr: {
        isSessionSupported: async () => false
      } as XRSystem
    });

    expect(result.mode).toBe("camera-overlay");
  });

  it("uses WebXR when immersive AR is supported", async () => {
    const result = await detectDeviceCapabilities({
      mediaDevices: {} as MediaDevices,
      xr: {
        isSessionSupported: async () => true
      } as XRSystem
    });

    expect(result.mode).toBe("webxr");
  });
});
```

- [ ] **Step 3: Implement capability detection**

Create `src/features/ar/capabilities.ts`:

```ts
import type { DeviceCapabilities } from "./arTypes";

type CapabilityInput = {
  mediaDevices?: MediaDevices;
  xr?: XRSystem;
};

export async function detectDeviceCapabilities(
  input: CapabilityInput = {
    mediaDevices: navigator.mediaDevices,
    xr: navigator.xr
  }
): Promise<DeviceCapabilities> {
  const camera = Boolean(input.mediaDevices?.getUserMedia);
  const webxrImmersiveAr = input.xr
    ? await input.xr.isSessionSupported("immersive-ar").catch(() => false)
    : false;

  if (camera && webxrImmersiveAr) {
    return { camera, webxrImmersiveAr, mode: "webxr" };
  }

  if (camera) {
    return { camera, webxrImmersiveAr, mode: "camera-overlay" };
  }

  return { camera, webxrImmersiveAr, mode: "screen-only" };
}
```

- [ ] **Step 4: Add WebXR adapter stub with explicit unsupported behavior**

Create `src/features/ar/webxrAdapter.ts`:

```ts
import type { Transform } from "../projects/projectTypes";
import type { ARAdapter } from "./arTypes";

export function createWebXRAdapter(): ARAdapter {
  let session: XRSession | undefined;

  return {
    mode: "webxr",

    async isSupported() {
      return Boolean(navigator.xr?.isSessionSupported("immersive-ar"));
    },

    async start() {
      if (!navigator.xr) {
        throw new Error("当前浏览器不支持 WebXR。");
      }
      session = await navigator.xr.requestSession("immersive-ar");
    },

    async stop() {
      await session?.end();
      session = undefined;
    },

    async placeObject() {
      throw new Error("WebXR 空间摆放将在后续阶段增强。");
    },

    async updateObjectTransform(_assetId: string, _transform: Transform) {
      throw new Error("WebXR 空间变换将在后续阶段增强。");
    }
  };
}
```

- [ ] **Step 5: Verify AR capability tests**

Run:

```powershell
pnpm.cmd test src/features/ar/capabilities.test.ts
```

Expected: PASS.

---

### Task 4: Camera Service And Sample Storage

**Files:**

- Create: `src/features/capture/cameraService.ts`
- Create: `src/features/capture/sampleStore.ts`
- Create: `src/features/capture/sampleStore.test.ts`

- [ ] **Step 1: Create camera service**

Create `src/features/capture/cameraService.ts`:

```ts
export type CameraService = {
  start(video: HTMLVideoElement): Promise<MediaStream>;
  stop(stream: MediaStream): void;
  captureFrame(video: HTMLVideoElement, size?: number): Promise<Blob>;
};

export function createCameraService(): CameraService {
  return {
    async start(video) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      return stream;
    },

    stop(stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    },

    async captureFrame(video, size = 224) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("无法创建图像采集画布。");
      }

      context.drawImage(video, 0, 0, size, size);

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("采集图像失败。"));
          }
        }, "image/jpeg", 0.86);
      });
    }
  };
}
```

- [ ] **Step 2: Write sample store tests**

Create `src/features/capture/sampleStore.test.ts`:

```ts
import { createSampleStore } from "./sampleStore";

describe("sampleStore", () => {
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
```

- [ ] **Step 3: Implement sample store**

Create `src/features/capture/sampleStore.ts`:

```ts
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
  getSampleBlob(id: string): Promise<Blob | undefined>;
  deleteSample(id: string): Promise<void>;
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
    }
  };
}
```

- [ ] **Step 4: Verify capture tests**

Run:

```powershell
pnpm.cmd test src/features/capture/sampleStore.test.ts
```

Expected: PASS.

---

### Task 5: Browser Trainable Classifier

**Files:**

- Create: `src/features/ml/classifierTypes.ts`
- Create: `src/features/ml/embeddingClassifier.ts`
- Create: `src/features/ml/embeddingClassifier.test.ts`
- Create: `src/features/ml/mobileNetEmbedder.ts`

- [ ] **Step 1: Create classifier types**

Create `src/features/ml/classifierTypes.ts`:

```ts
export type TrainingExample = {
  stateId: string;
  embedding: number[];
};

export type Prediction = {
  stateId: string;
  confidence: number;
};

export type TrainableClassifier = {
  train(examples: TrainingExample[]): void;
  predict(embedding: number[]): Prediction | undefined;
};
```

- [ ] **Step 2: Write classifier tests**

Create `src/features/ml/embeddingClassifier.test.ts`:

```ts
import { createEmbeddingClassifier } from "./embeddingClassifier";

describe("embeddingClassifier", () => {
  it("predicts the nearest trained state", () => {
    const classifier = createEmbeddingClassifier();

    classifier.train([
      { stateId: "left", embedding: [0, 0, 0] },
      { stateId: "left", embedding: [0.1, 0, 0] },
      { stateId: "right", embedding: [1, 1, 1] },
      { stateId: "right", embedding: [0.9, 1, 1] }
    ]);

    const prediction = classifier.predict([0.05, 0, 0]);

    expect(prediction?.stateId).toBe("left");
    expect(prediction?.confidence).toBeGreaterThan(0.5);
  });

  it("returns undefined before training", () => {
    const classifier = createEmbeddingClassifier();
    expect(classifier.predict([1, 2, 3])).toBeUndefined();
  });
});
```

- [ ] **Step 3: Implement embedding classifier**

Create `src/features/ml/embeddingClassifier.ts`:

```ts
import type { Prediction, TrainableClassifier, TrainingExample } from "./classifierTypes";

type Centroid = {
  stateId: string;
  vector: number[];
};

function average(vectors: number[][]): number[] {
  const size = vectors[0]?.length ?? 0;
  const result = Array.from({ length: size }, () => 0);

  for (const vector of vectors) {
    vector.forEach((value, index) => {
      result[index] += value;
    });
  }

  return result.map((value) => value / vectors.length);
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

export function createEmbeddingClassifier(): TrainableClassifier {
  let centroids: Centroid[] = [];

  return {
    train(examples) {
      const grouped = new Map<string, number[][]>();

      for (const example of examples) {
        const current = grouped.get(example.stateId) ?? [];
        current.push(example.embedding);
        grouped.set(example.stateId, current);
      }

      centroids = Array.from(grouped.entries()).map(([stateId, vectors]) => ({
        stateId,
        vector: average(vectors)
      }));
    },

    predict(embedding) {
      if (centroids.length === 0) {
        return undefined;
      }

      const ranked = centroids
        .map((centroid) => ({
          stateId: centroid.stateId,
          distance: distance(embedding, centroid.vector)
        }))
        .sort((a, b) => a.distance - b.distance);

      const best = ranked[0];
      const confidence = 1 / (1 + best.distance);

      return { stateId: best.stateId, confidence };
    }
  };
}
```

- [ ] **Step 4: Add MobileNet image embedder**

Add this exported type to `src/features/ml/classifierTypes.ts`:

```ts
export type ImageEmbedder = {
  embed(image: HTMLImageElement | HTMLCanvasElement | ImageData): Promise<number[]>;
};
```

Create `src/features/ml/mobileNetEmbedder.ts`:

```ts
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import type { ImageEmbedder } from "./classifierTypes";

export async function createMobileNetEmbedder(): Promise<ImageEmbedder> {
  await tf.ready();
  const model = await mobilenet.load({ version: 2, alpha: 0.5 });

  return {
    async embed(image) {
      const activation = model.infer(image, true);
      const values = await activation.data();
      activation.dispose();
      return Array.from(values);
    }
  };
}
```

- [ ] **Step 5: Verify classifier tests**

Run:

```powershell
pnpm.cmd test src/features/ml/embeddingClassifier.test.ts
```

Expected: PASS.

---

### Task 6: Authoring Rule Engine

**Files:**

- Create: `src/features/authoring/authoringTypes.ts`
- Create: `src/features/authoring/ruleEngine.ts`
- Create: `src/features/authoring/ruleEngine.test.ts`

- [ ] **Step 1: Create authoring types**

Create `src/features/authoring/authoringTypes.ts`:

```ts
import type { OutputAction, StateBinding } from "../projects/projectTypes";

export type ResolvedAction = {
  stateId: string;
  action: OutputAction;
};

export type RuleEngine = {
  resolve(stateId: string, bindings: StateBinding[]): ResolvedAction | undefined;
};
```

- [ ] **Step 2: Write rule engine tests**

Create `src/features/authoring/ruleEngine.test.ts`:

```ts
import { createRuleEngine } from "./ruleEngine";
import type { StateBinding } from "../projects/projectTypes";

describe("ruleEngine", () => {
  it("returns the action for the detected state", () => {
    const bindings: StateBinding[] = [
      {
        id: "binding_1",
        stateId: "state_left",
        action: {
          type: "show",
          assetId: "asset_tree",
          visible: true,
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          }
        }
      }
    ];

    const result = createRuleEngine().resolve("state_left", bindings);

    expect(result?.action.type).toBe("show");
    expect(result?.action.assetId).toBe("asset_tree");
  });

  it("returns undefined when no binding matches", () => {
    const result = createRuleEngine().resolve("missing", []);
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 3: Implement rule engine**

Create `src/features/authoring/ruleEngine.ts`:

```ts
import type { StateBinding } from "../projects/projectTypes";
import type { RuleEngine } from "./authoringTypes";

export function createRuleEngine(): RuleEngine {
  return {
    resolve(stateId: string, bindings: StateBinding[]) {
      const binding = bindings.find((item) => item.stateId === stateId);

      if (!binding) {
        return undefined;
      }

      return {
        stateId,
        action: binding.action
      };
    }
  };
}
```

- [ ] **Step 4: Verify rule tests**

Run:

```powershell
pnpm.cmd test src/features/authoring/ruleEngine.test.ts
```

Expected: PASS.

---

### Task 7: App State And Mobile UI Flow

**Files:**

- Create: `src/app/appState.ts`
- Create: `src/app/appState.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

- [ ] **Step 1: Write app state tests**

Create `src/app/appState.test.ts`:

```ts
import { appReducer, initialAppState } from "./appState";

describe("appReducer", () => {
  it("moves through the main authoring steps", () => {
    const capture = appReducer(initialAppState, { type: "goTo", screen: "capture" });
    const train = appReducer(capture, { type: "goTo", screen: "train" });
    const author = appReducer(train, { type: "goTo", screen: "author" });
    const test = appReducer(author, { type: "goTo", screen: "test" });

    expect(test.screen).toBe("test");
  });

  it("stores selected project id", () => {
    const state = appReducer(initialAppState, {
      type: "selectProject",
      projectId: "project_1"
    });

    expect(state.projectId).toBe("project_1");
  });
});
```

- [ ] **Step 2: Implement app state**

Create `src/app/appState.ts`:

```ts
export type AppScreen = "home" | "capture" | "train" | "author" | "test";

export type AppState = {
  screen: AppScreen;
  projectId?: string;
};

export type AppAction =
  | { type: "goTo"; screen: AppScreen }
  | { type: "selectProject"; projectId: string };

export const initialAppState: AppState = {
  screen: "home"
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "goTo":
      return { ...state, screen: action.screen };
    case "selectProject":
      return { ...state, projectId: action.projectId };
    default:
      return state;
  }
}
```

- [ ] **Step 3: Update App test for workflow navigation**

Modify `src/app/App.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the MVP shell", () => {
    render(<App />);
    expect(screen.getByText("AR Builder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建项目" })).toBeInTheDocument();
  });

  it("navigates through MVP workflow screens", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "新建项目" }));
    expect(screen.getByText("采集训练样本")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步：训练" }));
    expect(screen.getByText("训练识别模型")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步：编辑" }));
    expect(screen.getByText("编辑 AR 输出")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步：测试" }));
    expect(screen.getByText("实时测试")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Implement workflow UI**

Modify `src/app/App.tsx`:

```tsx
import { useReducer } from "react";
import { appReducer, initialAppState } from "./appState";

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <strong>AR Builder</strong>
        <span className="muted">MVP</span>
      </header>
      <section className="screen stack">
        {state.screen === "home" && (
          <>
            <h1>创建手机端 AR 原型</h1>
            <p className="muted">采集状态、训练识别、绑定输出，然后实时测试。</p>
            <button
              className="primary-button"
              onClick={() => dispatch({ type: "goTo", screen: "capture" })}
            >
              新建项目
            </button>
          </>
        )}

        {state.screen === "capture" && (
          <WorkflowPanel
            title="采集训练样本"
            description="先为每个真实世界状态拍摄几张样本，例如物体在左边和右边。"
            action="下一步：训练"
            onNext={() => dispatch({ type: "goTo", screen: "train" })}
          />
        )}

        {state.screen === "train" && (
          <WorkflowPanel
            title="训练识别模型"
            description="App 会用这些样本训练一个轻量识别器，并显示当前识别状态。"
            action="下一步：编辑"
            onNext={() => dispatch({ type: "goTo", screen: "author" })}
          />
        )}

        {state.screen === "author" && (
          <WorkflowPanel
            title="编辑 AR 输出"
            description="为每个状态绑定文字、图片、3D 模型或音频。"
            action="下一步：测试"
            onNext={() => dispatch({ type: "goTo", screen: "test" })}
          />
        )}

        {state.screen === "test" && (
          <WorkflowPanel
            title="实时测试"
            description="把摄像头识别结果和 AR 输出连接起来，直接在手机上验证。"
            action="返回首页"
            onNext={() => dispatch({ type: "goTo", screen: "home" })}
          />
        )}
      </section>
    </main>
  );
}

function WorkflowPanel(props: {
  title: string;
  description: string;
  action: string;
  onNext: () => void;
}) {
  return (
    <div className="panel stack">
      <h1>{props.title}</h1>
      <p className="muted">{props.description}</p>
      <button className="primary-button" onClick={props.onNext}>
        {props.action}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Verify UI state**

Run:

```powershell
pnpm.cmd test src/app/appState.test.ts src/app/App.test.tsx
```

Expected: PASS.

---

### Task 8: Camera Overlay Renderer

**Files:**

- Create: `src/features/ar/overlayRenderer.ts`
- Create: `src/features/ar/overlayRenderer.test.ts`

- [ ] **Step 1: Write overlay renderer test**

Create `src/features/ar/overlayRenderer.test.ts`:

```ts
import { createOverlayRenderer } from "./overlayRenderer";

describe("overlayRenderer", () => {
  it("mounts a render layer into a container", () => {
    const container = document.createElement("div");
    const renderer = createOverlayRenderer();

    renderer.mount(container);

    expect(container.querySelector("[data-ar-overlay]")).toBeInTheDocument();
  });

  it("clears the mounted layer", () => {
    const container = document.createElement("div");
    const renderer = createOverlayRenderer();

    renderer.mount(container);
    renderer.clear();

    expect(container.querySelector("[data-ar-overlay]")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement overlay renderer**

Create `src/features/ar/overlayRenderer.ts`:

```ts
export type OverlayRenderer = {
  mount(container: HTMLElement): void;
  clear(): void;
};

export function createOverlayRenderer(): OverlayRenderer {
  let layer: HTMLDivElement | undefined;

  return {
    mount(container) {
      this.clear();
      layer = document.createElement("div");
      layer.dataset.arOverlay = "true";
      layer.style.position = "absolute";
      layer.style.inset = "0";
      layer.style.pointerEvents = "none";
      layer.style.display = "grid";
      layer.style.placeItems = "center";
      layer.textContent = "AR 输出层";
      container.style.position = "relative";
      container.appendChild(layer);
    },

    clear() {
      layer?.remove();
      layer = undefined;
    }
  };
}
```

- [ ] **Step 3: Verify overlay renderer**

Run:

```powershell
pnpm.cmd test src/features/ar/overlayRenderer.test.ts
```

Expected: PASS.

---

### Task 9: Integration Build And Local Run

**Files:**

- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add visible platform mode and MVP status to App**

Modify `src/app/App.tsx` so the home screen mentions the first-version platform strategy:

```tsx
<p className="muted">
  第一版优先使用 PWA：Android 尽量启用 WebXR，iOS 和鸿蒙使用相机叠加降级。
</p>
```

Place this paragraph under the existing home description.

- [ ] **Step 2: Add camera placeholder styling**

Add to `src/styles.css`:

```css
.camera-preview {
  min-height: 280px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #475569;
  background: #0f172a;
}
```

- [ ] **Step 3: Run full test suite**

Run:

```powershell
pnpm.cmd test
```

Expected: all tests PASS.

- [ ] **Step 4: Run production build**

Run:

```powershell
pnpm.cmd run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 5: Start development server**

Run:

```powershell
pnpm.cmd run dev
```

Expected: Vite prints a local URL such as `http://localhost:5173/`.

Open the URL in the in-app browser and verify:

- Home screen renders.
- Workflow buttons move through capture, train, author, and test screens.
- Layout fits a narrow mobile viewport.

---

## Self-Review

Spec coverage:

- PWA project shell: Task 1.
- Local project persistence: Task 2.
- Platform fallback strategy: Task 3 and Task 9.
- Camera capture service: Task 4.
- Browser trainable recognizer: Task 5.
- State-to-output binding: Task 6.
- Mobile workflow UI: Task 7.
- Camera overlay AR foundation: Task 8.
- Build and local run: Task 9.

Placeholder scan:

- The plan contains no unfinished placeholder markers.
- Deferred items are explicitly scoped as later plans.

Type consistency:

- `Transform`, `Project`, `StateBinding`, and `OutputAction` are defined in `projectTypes.ts`.
- `ARAdapter` uses the same `Transform` type.
- `RuleEngine` resolves `StateBinding` into an action without duplicating project data.
