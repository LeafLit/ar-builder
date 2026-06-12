import {
  createDefaultRealDeviceFeedbackRecord,
  formatRealDeviceFeedback,
  loadRealDeviceFeedbackRecord,
  saveRealDeviceFeedbackRecord,
  type RealDeviceFeedbackRecord
} from "./realDeviceFeedback";

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

describe("realDeviceFeedback", () => {
  it("creates a beginner-friendly report for sharing phone test results", () => {
    const record: RealDeviceFeedbackRecord = {
      deviceModel: "华为 Mate40",
      systemVersion: "HarmonyOS",
      browserName: "华为浏览器",
      pageUrl: "https://leaflit.github.io/ar-builder/",
      checklist: {
        appOpened: true,
        cameraStarted: true,
        trainingCompleted: true,
        recognitionSmooth: false,
        pwaInstalled: false
      },
      notes: "识别偶尔会慢半拍。",
      createdAt: "2026-06-12T13:30:00.000Z"
    };

    expect(formatRealDeviceFeedback(record)).toBe(
      [
        "AR Builder 真机测试记录",
        "时间：2026-06-12 13:30",
        "手机：华为 Mate40",
        "系统：HarmonyOS",
        "浏览器：华为浏览器",
        "地址：https://leaflit.github.io/ar-builder/",
        "检查项：",
        "- 页面能打开：通过",
        "- 相机能开启：通过",
        "- 训练能完成：通过",
        "- 识别够流畅：需排查",
        "- PWA 可安装：需排查",
        "备注：识别偶尔会慢半拍。"
      ].join("\n")
    );
  });

  it("saves and loads the latest local phone test record", () => {
    const storage = new MemoryStorage();
    const record = createDefaultRealDeviceFeedbackRecord({
      now: () => new Date("2026-06-12T13:30:00.000Z"),
      pageUrl: "https://leaflit.github.io/ar-builder/",
      userAgent: "Mozilla/5.0 HuaweiBrowser"
    });

    const saved = saveRealDeviceFeedbackRecord(
      {
        ...record,
        deviceModel: "华为 Mate40",
        checklist: {
          ...record.checklist,
          appOpened: true,
          cameraStarted: true
        }
      },
      storage
    );

    expect(saved).toBe(true);
    expect(loadRealDeviceFeedbackRecord(storage)).toEqual({
      ...record,
      deviceModel: "华为 Mate40",
      browserName: "HuaweiBrowser",
      checklist: {
        ...record.checklist,
        appOpened: true,
        cameraStarted: true
      }
    });
  });
});
