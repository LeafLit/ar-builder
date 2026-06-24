import { createWebXRSpatialAdapter, type WebXRSpatialAdapterDependencies } from "./webxrSpatialAdapter";

function createContainer() {
  const container = document.createElement("div");
  Object.defineProperty(container, "clientWidth", { value: 320 });
  Object.defineProperty(container, "clientHeight", { value: 240 });
  document.body.appendChild(container);

  return container;
}

function createSession() {
  return {
    addEventListener: vi.fn(),
    end: vi.fn(async () => undefined),
    removeEventListener: vi.fn()
  };
}

function createRenderer() {
  const canvas = document.createElement("canvas");

  return {
    domElement: canvas,
    dispose: vi.fn(),
    render: vi.fn(),
    setAnimationLoop: vi.fn(),
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    xr: {
      enabled: false,
      setSession: vi.fn(async () => undefined)
    }
  };
}

function createDependencies(overrides: Partial<WebXRSpatialAdapterDependencies> = {}) {
  const session = createSession();
  const renderer = createRenderer();

  return {
    createDemoObject: vi.fn(() => ({ id: "demo-object" })),
    createLight: vi.fn(() => ({ id: "light" })),
    createRenderer: vi.fn(() => renderer),
    createScene: vi.fn(() => ({
      add: vi.fn(),
      remove: vi.fn()
    })),
    navigator: {
      xr: {
        isSessionSupported: vi.fn(async () => true),
        requestSession: vi.fn(async () => session)
      }
    },
    window: {
      devicePixelRatio: 2
    },
    ...overrides
  } satisfies WebXRSpatialAdapterDependencies;
}

describe("createWebXRSpatialAdapter", () => {
  it("checks immersive AR support through navigator.xr", async () => {
    const dependencies = createDependencies();
    const adapter = createWebXRSpatialAdapter(dependencies);

    await expect(adapter.isSupported()).resolves.toBe(true);

    expect(dependencies.navigator.xr?.isSessionSupported).toHaveBeenCalledWith("immersive-ar");
  });

  it("returns false when navigator.xr is missing", async () => {
    const adapter = createWebXRSpatialAdapter(
      createDependencies({
        navigator: {}
      })
    );

    await expect(adapter.isSupported()).resolves.toBe(false);
  });

  it("starts an immersive AR session and mounts the renderer canvas", async () => {
    const dependencies = createDependencies();
    const container = createContainer();
    const adapter = createWebXRSpatialAdapter(dependencies);

    await adapter.start(container);

    expect(dependencies.navigator.xr?.requestSession).toHaveBeenCalledWith("immersive-ar", {
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: container }
    });
    expect(dependencies.createRenderer).toHaveBeenCalledTimes(1);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("places a demo object after the session starts", async () => {
    const scene = {
      add: vi.fn(),
      remove: vi.fn()
    };
    const dependencies = createDependencies({
      createScene: vi.fn(() => scene)
    });
    const container = createContainer();
    const adapter = createWebXRSpatialAdapter(dependencies);

    await adapter.start(container);
    await adapter.placeDemoObject();

    expect(dependencies.createDemoObject).toHaveBeenCalledTimes(1);
    expect(scene.add).toHaveBeenCalledWith({ id: "demo-object" });
  });

  it("stops the session and removes the renderer canvas", async () => {
    const renderer = createRenderer();
    const session = createSession();
    const dependencies = createDependencies({
      createRenderer: vi.fn(() => renderer),
      navigator: {
        xr: {
          isSessionSupported: vi.fn(async () => true),
          requestSession: vi.fn(async () => session)
        }
      }
    });
    const container = createContainer();
    const adapter = createWebXRSpatialAdapter(dependencies);

    await adapter.start(container);
    await adapter.stop();

    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(session.end).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(container.querySelector("canvas")).toBeNull();
  });
});
