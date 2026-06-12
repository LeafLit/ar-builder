import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RealDeviceFeedbackPanel } from "./RealDeviceFeedbackPanel";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("RealDeviceFeedbackPanel", () => {
  it("saves a local phone test record", async () => {
    const storage = new MemoryStorage();

    render(
      <RealDeviceFeedbackPanel
        storage={storage}
        now={() => new Date("2026-06-12T13:30:00.000Z")}
        pageUrl="https://leaflit.github.io/ar-builder/"
        userAgent="Mozilla/5.0 HuaweiBrowser"
      />
    );

    fireEvent.change(screen.getByLabelText("手机型号"), {
      target: { value: "华为 Mate40" }
    });
    fireEvent.change(screen.getByLabelText("系统版本"), {
      target: { value: "HarmonyOS" }
    });
    fireEvent.click(screen.getByLabelText("页面能打开"));
    fireEvent.click(screen.getByLabelText("相机能开启"));
    fireEvent.click(screen.getByLabelText("训练能完成"));
    fireEvent.change(screen.getByLabelText("问题备注"), {
      target: { value: "识别现在比较流畅。" }
    });

    fireEvent.click(screen.getByRole("button", { name: "保存记录" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("已保存本机测试记录。");
    });
    expect(storage.getItem("ar-builder.real-device-feedback")).toContain("华为 Mate40");
  });

  it("copies the formatted report for sending feedback", async () => {
    const copyText = vi.fn().mockResolvedValue(undefined);

    render(
      <RealDeviceFeedbackPanel
        copyText={copyText}
        now={() => new Date("2026-06-12T13:30:00.000Z")}
        pageUrl="https://leaflit.github.io/ar-builder/"
        userAgent="Mozilla/5.0 HuaweiBrowser"
      />
    );

    fireEvent.change(screen.getByLabelText("手机型号"), {
      target: { value: "华为 Mate40" }
    });
    fireEvent.click(screen.getByLabelText("识别够流畅"));
    fireEvent.click(screen.getByRole("button", { name: "复制记录" }));

    await waitFor(() => {
      expect(copyText).toHaveBeenCalledWith(expect.stringContaining("手机：华为 Mate40"));
      expect(copyText).toHaveBeenCalledWith(expect.stringContaining("识别够流畅：通过"));
      expect(screen.getByRole("status")).toHaveTextContent("已复制测试记录。");
    });
  });
});
