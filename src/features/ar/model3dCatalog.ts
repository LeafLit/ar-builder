import * as THREE from "three";
import type { BuiltInModel3DId } from "../projects/projectTypes";

export type BuiltInModel3DOption = {
  id: BuiltInModel3DId;
  label: string;
};

export const BUILT_IN_MODEL_3D_OPTIONS: BuiltInModel3DOption[] = [
  { id: "cube", label: "立方体" },
  { id: "sphere", label: "球体" },
  { id: "cone", label: "圆锥" },
  { id: "tree", label: "小树" }
];

export function getBuiltInModel3DOption(modelId: string | undefined): BuiltInModel3DOption {
  return (
    BUILT_IN_MODEL_3D_OPTIONS.find((option) => option.id === modelId) ??
    BUILT_IN_MODEL_3D_OPTIONS[0]
  );
}

export function createBuiltInModelMesh(modelId: string | undefined): THREE.Group {
  const option = getBuiltInModel3DOption(modelId);

  switch (option.id) {
    case "sphere":
      return createSingleMeshGroup(
        new THREE.SphereGeometry(0.72, 32, 16),
        new THREE.MeshStandardMaterial({ color: "#2563eb", roughness: 0.42 })
      );
    case "cone":
      return createSingleMeshGroup(
        new THREE.ConeGeometry(0.72, 1.35, 32),
        new THREE.MeshStandardMaterial({ color: "#f97316", roughness: 0.48 })
      );
    case "tree":
      return createTreeGroup();
    case "cube":
    default:
      return createSingleMeshGroup(
        new THREE.BoxGeometry(1.1, 1.1, 1.1),
        new THREE.MeshStandardMaterial({ color: "#0f766e", roughness: 0.52 })
      );
  }
}

function createSingleMeshGroup(
  geometry: THREE.BufferGeometry,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

function createTreeGroup(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.78, 16),
    new THREE.MeshStandardMaterial({ color: "#854d0e", roughness: 0.7 })
  );
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 1.08, 32),
    new THREE.MeshStandardMaterial({ color: "#16a34a", roughness: 0.55 })
  );

  trunk.position.y = -0.36;
  canopy.position.y = 0.36;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  group.add(trunk, canopy);

  return group;
}
