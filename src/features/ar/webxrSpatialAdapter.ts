import * as THREE from "three";
import type { SpatialARExperimentAdapter } from "./SpatialARExperiment";

type WebXRSessionInit = {
  optionalFeatures?: string[];
  domOverlay?: {
    root: HTMLElement;
  };
};

type WebXRSessionLike = {
  addEventListener?: (type: "select", listener: () => void) => void;
  end?: () => Promise<void>;
  removeEventListener?: (type: "select", listener: () => void) => void;
};

type WebXRLike = {
  isSessionSupported(mode: "immersive-ar"): Promise<boolean>;
  requestSession?(mode: "immersive-ar", init?: WebXRSessionInit): Promise<WebXRSessionLike>;
};

type NavigatorWithXR = {
  xr?: WebXRLike;
};

type RendererLike = {
  domElement: HTMLElement;
  dispose(): void;
  render(scene: unknown, camera: unknown): void;
  setAnimationLoop(callback: (() => void) | null): void;
  setPixelRatio(pixelRatio: number): void;
  setSize(width: number, height: number): void;
  xr: {
    enabled: boolean;
    setSession(session: WebXRSessionLike): Promise<void>;
  };
};

type SceneLike = {
  add(object: unknown): void;
  remove?(object: unknown): void;
};

export type WebXRSpatialAdapterDependencies = {
  createCamera?: () => unknown;
  createDemoObject?: () => unknown;
  createLight?: () => unknown;
  createRenderer?: () => RendererLike;
  createScene?: () => SceneLike;
  navigator?: NavigatorWithXR;
  window?: Pick<Window, "devicePixelRatio">;
};

export function createWebXRSpatialAdapter(
  dependencies: WebXRSpatialAdapterDependencies = {}
): SpatialARExperimentAdapter {
  const navigatorLike =
    dependencies.navigator ?? (typeof navigator === "undefined" ? undefined : navigator);
  const windowLike = dependencies.window ?? (typeof window === "undefined" ? undefined : window);
  const createRenderer = dependencies.createRenderer ?? createDefaultRenderer;
  const createScene = dependencies.createScene ?? (() => new THREE.Scene());
  const createCamera = dependencies.createCamera ?? createDefaultCamera;
  const createLight = dependencies.createLight ?? createDefaultLight;
  const createDemoObject = dependencies.createDemoObject ?? createDefaultDemoObject;
  let container: HTMLElement | undefined;
  let demoObject: unknown;
  let renderer: RendererLike | undefined;
  let scene: SceneLike | undefined;
  let session: WebXRSessionLike | undefined;
  let onSelect: (() => void) | undefined;

  async function placeDemoObjectImpl() {
    if (!scene) {
      throw new Error("请先启动空间 AR。");
    }

    if (demoObject) {
      scene.remove?.(demoObject);
    }

    demoObject = createDemoObject();
    scene.add(demoObject);
  }

  return {
    async isSupported() {
      const xr = navigatorLike?.xr;

      return xr ? xr.isSessionSupported("immersive-ar").catch(() => false) : false;
    },

    async start(nextContainer: HTMLElement) {
      const xr = navigatorLike?.xr;

      if (!xr?.requestSession) {
        throw new Error("当前浏览器不支持 WebXR 空间 AR。");
      }

      container = nextContainer;
      renderer = createRenderer();
      renderer.xr.enabled = true;
      renderer.setPixelRatio(windowLike?.devicePixelRatio ?? 1);
      renderer.setSize(
        nextContainer.clientWidth || 1,
        nextContainer.clientHeight || 1
      );
      nextContainer.appendChild(renderer.domElement);

      scene = createScene();
      scene.add(createLight());
      const camera = createCamera();

      session = await xr.requestSession("immersive-ar", {
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: nextContainer }
      });
      onSelect = () => {
        void placeDemoObjectImpl();
      };
      session.addEventListener?.("select", onSelect);
      await renderer.xr.setSession(session);
      renderer.setAnimationLoop(() => renderer?.render(scene, camera));
    },

    async stop() {
      renderer?.setAnimationLoop(null);

      if (session && onSelect) {
        session.removeEventListener?.("select", onSelect);
      }

      await session?.end?.();

      if (demoObject) {
        scene?.remove?.(demoObject);
      }

      if (renderer?.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      } else if (container?.contains(renderer?.domElement ?? null)) {
        container.removeChild(renderer!.domElement);
      }

      renderer?.dispose();
      container = undefined;
      demoObject = undefined;
      onSelect = undefined;
      renderer = undefined;
      scene = undefined;
      session = undefined;
    },

    async placeDemoObject() {
      await placeDemoObjectImpl();
    }
  };
}

function createDefaultRenderer(): RendererLike {
  return new THREE.WebGLRenderer({ alpha: true, antialias: true }) as unknown as RendererLike;
}

function createDefaultCamera() {
  return new THREE.PerspectiveCamera();
}

function createDefaultLight() {
  return new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
}

function createDefaultDemoObject() {
  const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const material = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    roughness: 0.45,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(0, 0, -1);
  return mesh;
}
