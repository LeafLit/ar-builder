import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SpatialARExperiment, type SpatialARExperimentAdapter } from "./SpatialARExperiment";

function createAdapter(overrides: Partial<SpatialARExperimentAdapter> = {}) {
  return {
    isSupported: vi.fn(async () => true),
    placeDemoObject: vi.fn(async () => undefined),
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    ...overrides
  } satisfies SpatialARExperimentAdapter;
}

describe("SpatialARExperiment", () => {
  it("shows a fallback message when immersive AR is unsupported", async () => {
    const adapter = createAdapter({
      isSupported: vi.fn(async () => false)
    });

    render(<SpatialARExperiment adapter={adapter} />);

    expect(await screen.findByText("当前设备暂不支持 WebXR 空间 AR。")).toBeInTheDocument();
    expect(screen.getByText("可以继续使用上面的相机叠加测试。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "进入空间 AR" })).not.toBeInTheDocument();
  });

  it("starts a spatial AR session when supported", async () => {
    const adapter = createAdapter();

    render(<SpatialARExperiment adapter={adapter} />);

    fireEvent.click(await screen.findByRole("button", { name: "进入空间 AR" }));

    await waitFor(() => {
      expect(adapter.start).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
    expect(screen.getByText("空间 AR 已启动，可以放置演示物体。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "放置演示物体" })).toBeInTheDocument();
  });

  it("places a demo object inside the running spatial AR session", async () => {
    const adapter = createAdapter();

    render(<SpatialARExperiment adapter={adapter} />);

    fireEvent.click(await screen.findByRole("button", { name: "进入空间 AR" }));
    fireEvent.click(await screen.findByRole("button", { name: "放置演示物体" }));

    await waitFor(() => {
      expect(adapter.placeDemoObject).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("已放置演示物体。")).toBeInTheDocument();
  });

  it("shows a clear message when starting WebXR fails", async () => {
    const adapter = createAdapter({
      start: vi.fn(async () => {
        throw new Error("permission denied");
      })
    });

    render(<SpatialARExperiment adapter={adapter} />);

    fireEvent.click(await screen.findByRole("button", { name: "进入空间 AR" }));

    expect(await screen.findByText("空间 AR 启动失败，请检查浏览器和系统 AR 权限。")).toBeInTheDocument();
  });

  it("stops the spatial AR session when unmounted", async () => {
    const adapter = createAdapter();
    const { unmount } = render(<SpatialARExperiment adapter={adapter} />);

    fireEvent.click(await screen.findByRole("button", { name: "进入空间 AR" }));
    await waitFor(() => {
      expect(adapter.start).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(adapter.stop).toHaveBeenCalledTimes(1);
  });
});
