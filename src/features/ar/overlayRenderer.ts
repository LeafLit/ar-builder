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
