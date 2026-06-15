# Built-in 3D Model Output Design

## Goal

Add a first mobile-friendly 3D output path to AR Builder so users can bind a trained state to a simple virtual 3D object and see it in the real camera test view.

This is the next product step after text and image outputs. It follows the paper's core workflow: teach states, author the virtual scene for each state, then test the AR experience with automatic state detection.

## Scope

This version supports built-in 3D models rendered as a camera overlay with screen anchors.

Included:

- Add `3D model` as an output type in the authoring screen.
- Provide a small built-in model catalog: cube, sphere, cone, and tree.
- Let each state choose one built-in model.
- Reuse the existing screen anchor controls for horizontal position, vertical position, and size.
- Save 3D output bindings in the local project data.
- Restore 3D output bindings when reopening a project.
- Render the selected 3D model in the test screen when its state is recognized.

Not included yet:

- Uploading `.glb` or `.gltf` files.
- True spatial anchors through WebXR.
- Surface detection.
- Image anchors.
- Object anchors.
- Rotation controls in the authoring UI.
- Multi-object scenes.

## User Experience

In the AR output editor, each state keeps the same output card. The output type selector gains a new option: `3D model`.

When users select `3D model`, the card shows a model selector with friendly names:

- Cube
- Sphere
- Cone
- Tree

The existing position and size sliders remain visible. Users can move and scale the 3D model the same way they already move text and image outputs.

In the test screen, when recognition confirms a state with a 3D model binding, the camera preview remains the background and the 3D model appears at the saved screen anchor. If WebGL is unavailable, the UI shows a small Chinese fallback message instead of crashing.

## Architecture

The first implementation stays inside the current screen-anchor AR path.

- `projectTypes.ts` extends `StateOutputDraft` and `Asset` enough to describe built-in 3D assets.
- `appState.ts` converts a 3D output draft into a `model3d` asset and a normal `show` binding.
- `model3dCatalog.ts` owns the built-in model IDs, labels, colors, and mesh construction.
- `Model3DPreview.tsx` owns the Three.js canvas lifecycle and renders one selected built-in model.
- `AuthoringScreen.tsx` lets users choose a 3D model for each state.
- `TestScreen.tsx` resolves `model3d` assets and displays `Model3DPreview` inside the existing overlay container.

The machine learning module remains unchanged. It still reports the current state only. The authoring and AR modules decide which virtual output to show.

## Data Model

Add a built-in model ID:

```ts
export type BuiltInModel3DId = "cube" | "sphere" | "cone" | "tree";
```

Extend assets:

```ts
export type Asset = {
  id: string;
  type: AssetType;
  name: string;
  content?: string;
  localBlobKey?: string;
  url?: string;
  modelId?: BuiltInModel3DId;
};
```

Extend output drafts:

```ts
export type Model3DOutputDraft = {
  assetType: "model3d";
  modelId: BuiltInModel3DId;
  name: string;
  transform: Transform;
};
```

This keeps compatibility with existing saved projects. Older projects simply do not have `model3d` assets.

## Rendering Behavior

`Model3DPreview` renders a transparent Three.js scene into a small canvas inside the existing AR overlay.

The model:

- Is centered in the canvas.
- Has ambient and directional light.
- Slowly rotates so users can perceive it as 3D.
- Uses simple geometries for performance.
- Cleans up renderer, geometry, material, animation frame, and DOM nodes on unmount.

The existing overlay transform still controls screen placement and scale.

## Error Handling

If a 3D asset has no `modelId`, the test screen shows a Chinese empty-asset message.

If the model ID is unknown, the renderer falls back to the cube mesh.

If WebGL is unavailable, the preview shows `当前浏览器暂不支持 3D 预览` and the app continues to work.

## Testing

Unit and component tests cover:

- The app reducer saving a `model3d` draft as a `model3d` asset and `show` binding.
- Authoring UI can select the 3D model output type, choose a built-in model, save it, and continue.
- Test screen displays the 3D output path for a manually detected state.
- The built-in model catalog returns known options and falls back safely.
- Full test suite still passes.

Manual verification covers:

- Local browser render.
- Desktop viewport screenshot.
- Mobile viewport screenshot.
- Canvas is present and nonblank when WebGL is available.

