import { createOverlayRenderer } from "./overlayRenderer";

describe("overlayRenderer", () => {
  it("mounts a render layer into a container", () => {
    const container = document.createElement("div");
    const renderer = createOverlayRenderer();

    renderer.mount(container);

    expect(container.querySelector("[data-ar-overlay]")).not.toBeNull();
  });

  it("clears the mounted layer", () => {
    const container = document.createElement("div");
    const renderer = createOverlayRenderer();

    renderer.mount(container);
    renderer.clear();

    expect(container.querySelector("[data-ar-overlay]")).not.toBeInTheDocument();
  });
});
