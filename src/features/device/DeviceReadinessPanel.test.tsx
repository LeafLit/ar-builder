import { render, screen } from "@testing-library/react";
import { DeviceReadinessPanel } from "./DeviceReadinessPanel";

describe("DeviceReadinessPanel", () => {
  it("renders loading state and then the phone readiness checklist", async () => {
    render(
      <DeviceReadinessPanel
        probe={async () => ({
          cameraApi: true,
          manifest: true,
          secureContext: true,
          serviceWorker: true,
          webxrImmersiveAr: false
        })}
      />
    );

    expect(screen.getByText("正在检查手机浏览器能力...")).toBeInTheDocument();

    expect(await screen.findByText("真机能力：相机叠加模式")).toBeInTheDocument();
    expect(screen.getByText("安全连接：已满足")).toBeInTheDocument();
    expect(screen.getByText("相机 API：浏览器支持")).toBeInTheDocument();
    expect(screen.getByText("PWA 安装：基础文件已就绪")).toBeInTheDocument();
    expect(screen.getByText("AR 模式：相机叠加降级")).toBeInTheDocument();
  });

  it("shows a useful message when readiness probing fails", async () => {
    render(
      <DeviceReadinessPanel
        probe={async () => {
          throw new Error("probe failed");
        }}
      />
    );

    expect(await screen.findByText("真机检查暂时不可用，请刷新后再试。")).toBeInTheDocument();
  });
});
