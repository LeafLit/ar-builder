# 3D Transform Controls Design

## Goal

Make built-in 3D outputs feel more like editable AR scenes by letting users rotate each state's 3D model and by smoothing visual changes when the active output changes in the test view.

## Scope

Included:

- Add a rotation slider for `3D model` outputs in the authoring screen.
- Store the rotation in the existing `Transform.rotation` tuple.
- Restore the rotation when reopening a saved 3D output.
- Pass the saved rotation into the Three.js preview.
- Add a lightweight CSS transition for AR overlay position and scale changes.

Not included:

- Rotation controls for text or image outputs.
- X/Z axis rotation controls.
- Drag gestures in the preview.
- WebXR spatial transforms.
- GLB/GLTF upload support.

## User Experience

When a state uses `3D 模型`, its card shows one extra slider:

- `旋转角度：0°` through `360°`

The existing horizontal position, vertical position, and size sliders remain unchanged. A beginner can still edit a 3D output without understanding 3D coordinates.

In the test screen, when users switch from one detected state to another, the virtual output should move and scale smoothly instead of snapping sharply. The Three.js model also starts from the saved rotation angle, while keeping the subtle automatic spin that helps it read as 3D.

## Data Model

No new data field is required. The feature uses the existing transform shape:

```ts
rotation: [xRadians, yRadians, zRadians]
```

The authoring UI edits only `rotation[1]`, using degrees in the UI and radians internally.

## Architecture

- `AuthoringScreen.tsx` adds helper functions to convert degrees and radians, then renders the rotation slider only for `model3d` drafts.
- `Model3DPreview.tsx` receives a `rotation` prop and applies it when rendering the mesh.
- `TestScreen.tsx` passes the resolved output transform rotation to `Model3DPreview`.
- `styles.css` adds transitions to the existing AR overlay, using the current CSS variables.

## Testing

Automated tests cover:

- Authoring can save a 3D model with a user-selected rotation angle.
- Existing saved 3D output rotation is restored into the slider.
- Test screen passes saved rotation into a labelled 3D preview.
- Full test suite and production build pass.

Manual test target:

- Online page still supports choosing 3D models.
- A 3D model with a non-zero rotation appears differently than the default.
- Switching simulated states no longer feels like a hard snap.

