import { useMemo, useState } from "react";
import {
  createDefaultRealDeviceFeedbackRecord,
  formatRealDeviceFeedback,
  loadRealDeviceFeedbackRecord,
  saveRealDeviceFeedbackRecord,
  type RealDeviceFeedbackChecklist,
  type RealDeviceFeedbackRecord
} from "./realDeviceFeedback";

type RealDeviceFeedbackPanelProps = {
  storage?: Storage;
  now?: () => Date;
  pageUrl?: string;
  userAgent?: string;
  copyText?: (text: string) => Promise<void>;
};

const CHECKLIST_FIELDS: Array<[keyof RealDeviceFeedbackChecklist, string]> = [
  ["appOpened", "页面能打开"],
  ["cameraStarted", "相机能开启"],
  ["trainingCompleted", "训练能完成"],
  ["recognitionSmooth", "识别够流畅"],
  ["pwaInstalled", "PWA 可安装"]
];

export function RealDeviceFeedbackPanel({
  storage = getBrowserStorage(),
  now = () => new Date(),
  pageUrl = getBrowserPageUrl(),
  userAgent = getBrowserUserAgent(),
  copyText = writeClipboardText
}: RealDeviceFeedbackPanelProps) {
  const [record, setRecord] = useState<RealDeviceFeedbackRecord>(() => {
    return (
      loadRealDeviceFeedbackRecord(storage) ??
      createDefaultRealDeviceFeedbackRecord({ now, pageUrl, userAgent })
    );
  });
  const [status, setStatus] = useState("");
  const reportText = useMemo(() => formatRealDeviceFeedback(record), [record]);

  function updateField(field: keyof RealDeviceFeedbackRecord, value: string) {
    setRecord((current) => ({
      ...current,
      [field]: value,
      createdAt: now().toISOString()
    }));
  }

  function updateChecklist(field: keyof RealDeviceFeedbackChecklist, value: boolean) {
    setRecord((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [field]: value
      },
      createdAt: now().toISOString()
    }));
  }

  function handleSave() {
    const saved = saveRealDeviceFeedbackRecord(record, storage);
    setStatus(saved ? "已保存本机测试记录。" : "保存失败，请复制记录后手动发送。");
  }

  async function handleCopy() {
    try {
      await copyText(reportText);
      setStatus("已复制测试记录。");
    } catch {
      setStatus("复制失败，请手动选择下方记录文本。");
    }
  }

  return (
    <section aria-labelledby="real-device-feedback-title" className="panel stack">
      <div className="stack compact-stack">
        <h2 id="real-device-feedback-title">真机测试记录</h2>
        <p className="muted">把手机测试结果保存到本机，遇到问题时可以复制给开发者排查。</p>
      </div>

      <div className="feedback-form">
        <label className="feedback-field">
          <span>手机型号</span>
          <input
            value={record.deviceModel}
            onChange={(event) => updateField("deviceModel", event.target.value)}
            placeholder="例如：华为 Mate40"
          />
        </label>
        <label className="feedback-field">
          <span>系统版本</span>
          <input
            value={record.systemVersion}
            onChange={(event) => updateField("systemVersion", event.target.value)}
            placeholder="例如：HarmonyOS 4"
          />
        </label>
        <label className="feedback-field">
          <span>浏览器</span>
          <input
            value={record.browserName}
            onChange={(event) => updateField("browserName", event.target.value)}
            placeholder="例如：华为浏览器"
          />
        </label>
      </div>

      <fieldset className="feedback-checklist">
        <legend>检查项</legend>
        {CHECKLIST_FIELDS.map(([field, label]) => (
          <label key={field} className="feedback-check">
            <input
              checked={record.checklist[field]}
              type="checkbox"
              onChange={(event) => updateChecklist(field, event.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <label className="feedback-field">
        <span>问题备注</span>
        <textarea
          value={record.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="例如：训练成功，但识别偶尔慢半拍。"
        />
      </label>

      <div className="action-row">
        <button className="secondary-button" type="button" onClick={handleSave}>
          保存记录
        </button>
        <button className="secondary-button" type="button" onClick={handleCopy}>
          复制记录
        </button>
      </div>

      <pre aria-label="测试记录预览" className="feedback-preview">
        {reportText}
      </pre>

      {status && (
        <p className="muted" role="status">
          {status}
        </p>
      )}
    </section>
  );
}

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getBrowserPageUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.href;
}

function getBrowserUserAgent(): string {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent;
}

async function writeClipboardText(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API is not available");
  }

  await navigator.clipboard.writeText(text);
}
