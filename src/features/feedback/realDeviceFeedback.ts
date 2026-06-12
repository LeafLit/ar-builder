export type RealDeviceFeedbackChecklist = {
  appOpened: boolean;
  cameraStarted: boolean;
  trainingCompleted: boolean;
  recognitionSmooth: boolean;
  pwaInstalled: boolean;
};

export type RealDeviceFeedbackRecord = {
  deviceModel: string;
  systemVersion: string;
  browserName: string;
  pageUrl: string;
  checklist: RealDeviceFeedbackChecklist;
  notes: string;
  createdAt: string;
};

export const REAL_DEVICE_FEEDBACK_STORAGE_KEY = "ar-builder.real-device-feedback";

type DefaultRecordOptions = {
  now?: () => Date;
  pageUrl?: string;
  userAgent?: string;
};

const CHECKLIST_LABELS: Array<[keyof RealDeviceFeedbackChecklist, string]> = [
  ["appOpened", "页面能打开"],
  ["cameraStarted", "相机能开启"],
  ["trainingCompleted", "训练能完成"],
  ["recognitionSmooth", "识别够流畅"],
  ["pwaInstalled", "PWA 可安装"]
];

export function createDefaultRealDeviceFeedbackRecord({
  now = () => new Date(),
  pageUrl = "",
  userAgent = ""
}: DefaultRecordOptions = {}): RealDeviceFeedbackRecord {
  return {
    deviceModel: "",
    systemVersion: "",
    browserName: detectBrowserName(userAgent),
    pageUrl,
    checklist: {
      appOpened: false,
      cameraStarted: false,
      trainingCompleted: false,
      recognitionSmooth: false,
      pwaInstalled: false
    },
    notes: "",
    createdAt: now().toISOString()
  };
}

export function formatRealDeviceFeedback(record: RealDeviceFeedbackRecord): string {
  const lines = [
    "AR Builder 真机测试记录",
    `时间：${formatRecordTime(record.createdAt)}`,
    `手机：${record.deviceModel.trim() || "未填写"}`,
    `系统：${record.systemVersion.trim() || "未填写"}`,
    `浏览器：${record.browserName.trim() || "未填写"}`,
    `地址：${record.pageUrl.trim() || "未填写"}`,
    "检查项：",
    ...CHECKLIST_LABELS.map(
      ([key, label]) => `- ${label}：${record.checklist[key] ? "通过" : "需排查"}`
    ),
    `备注：${record.notes.trim() || "无"}`
  ];

  return lines.join("\n");
}

export function saveRealDeviceFeedbackRecord(
  record: RealDeviceFeedbackRecord,
  storage?: Pick<Storage, "setItem">
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(REAL_DEVICE_FEEDBACK_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function loadRealDeviceFeedbackRecord(
  storage?: Pick<Storage, "getItem">
): RealDeviceFeedbackRecord | undefined {
  if (!storage) {
    return undefined;
  }

  try {
    const value = storage.getItem(REAL_DEVICE_FEEDBACK_STORAGE_KEY);

    if (!value) {
      return undefined;
    }

    return normalizeRealDeviceFeedbackRecord(JSON.parse(value));
  } catch {
    return undefined;
  }
}

export function detectBrowserName(userAgent: string): string {
  if (!userAgent) {
    return "";
  }

  if (userAgent.includes("HuaweiBrowser")) {
    return "HuaweiBrowser";
  }
  if (userAgent.includes("Edg/")) {
    return "Microsoft Edge";
  }
  if (userAgent.includes("CriOS") || userAgent.includes("Chrome")) {
    return "Chrome";
  }
  if (userAgent.includes("Firefox")) {
    return "Firefox";
  }
  if (userAgent.includes("Safari")) {
    return "Safari";
  }

  return userAgent.slice(0, 48);
}

function formatRecordTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return date.toISOString().slice(0, 16).replace("T", " ");
}

function normalizeRealDeviceFeedbackRecord(value: unknown): RealDeviceFeedbackRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Partial<RealDeviceFeedbackRecord>;
  const checklist: Partial<RealDeviceFeedbackChecklist> = record.checklist ?? {};

  return {
    deviceModel: String(record.deviceModel ?? ""),
    systemVersion: String(record.systemVersion ?? ""),
    browserName: String(record.browserName ?? ""),
    pageUrl: String(record.pageUrl ?? ""),
    checklist: {
      appOpened: Boolean(checklist.appOpened),
      cameraStarted: Boolean(checklist.cameraStarted),
      trainingCompleted: Boolean(checklist.trainingCompleted),
      recognitionSmooth: Boolean(checklist.recognitionSmooth),
      pwaInstalled: Boolean(checklist.pwaInstalled)
    },
    notes: String(record.notes ?? ""),
    createdAt: String(record.createdAt ?? new Date().toISOString())
  };
}
