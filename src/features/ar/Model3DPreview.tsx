import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BuiltInModel3DId, Transform } from "../projects/projectTypes";
import { createBuiltInModelMesh } from "./model3dCatalog";

export function Model3DPreview({
  label,
  modelId,
  rotation
}: {
  label: string;
  modelId: BuiltInModel3DId;
  rotation: Transform["rotation"];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGlUnavailable, setWebGlUnavailable] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (!canUseWebGL()) {
      setWebGlUnavailable(true);
      return;
    }

    setWebGlUnavailable(false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    const model = createBuiltInModelMesh(modelId);
    const ambientLight = new THREE.AmbientLight("#ffffff", 1.15);
    const keyLight = new THREE.DirectionalLight("#ffffff", 1.8);
    let animationFrame = 0;
    let spin = 0;

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.className = "ar-test-model3d-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    camera.position.set(0, 0.35, 3.4);
    keyLight.position.set(2.4, 3.2, 3.2);
    scene.add(ambientLight, keyLight, model);

    const resize = () => {
      const size = Math.max(container.clientWidth, 1);

      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    const renderFrame = () => {
      spin += 0.012;
      model.rotation.set(rotation[0], rotation[1] + spin, rotation[2]);
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(renderFrame);
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(resize);

    resize();
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);
    renderFrame();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      resizeObserver?.disconnect();
      disposeObject3D(model);
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelId, rotation]);

  return (
    <div
      aria-label={`${label} 3D 模型`}
      className="ar-test-model3d-output"
      data-rotation-y={rotation[1].toFixed(4)}
      ref={containerRef}
      role="img"
    >
      {webGlUnavailable && (
        <span className="ar-test-model3d-fallback">当前浏览器暂不支持 3D 预览</span>
      )}
    </div>
  );
}

function canUseWebGL() {
  return typeof window !== "undefined" && typeof window.WebGLRenderingContext !== "undefined";
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;

    mesh.geometry?.dispose();

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose());
    } else {
      mesh.material?.dispose();
    }
  });
}
