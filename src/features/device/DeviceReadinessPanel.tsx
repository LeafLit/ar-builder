import { useEffect, useState } from "react";
import {
  createDeviceReadinessReport,
  probeDeviceReadiness,
  type DeviceReadinessReport,
  type DeviceReadinessSnapshot
} from "./deviceReadiness";

type DeviceReadinessPanelProps = {
  probe?: () => Promise<DeviceReadinessSnapshot>;
};

export function DeviceReadinessPanel({
  probe = probeDeviceReadiness
}: DeviceReadinessPanelProps) {
  const [report, setReport] = useState<DeviceReadinessReport | undefined>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    probe()
      .then((snapshot) => {
        if (active) {
          setReport(createDeviceReadinessReport(snapshot));
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [probe]);

  return (
    <section aria-labelledby="device-readiness-title" className="panel stack">
      <div className="stack compact-stack">
        <h2 id="device-readiness-title">真机体验检查</h2>
        <p className="muted">
          用手机打开前先确认运行环境。这里会检查 HTTPS、相机、PWA 安装和 AR 模式。
        </p>
      </div>

      {!report && !failed && <p className="muted">正在检查手机浏览器能力...</p>}
      {failed && <p className="muted">真机检查暂时不可用，请刷新后再试。</p>}
      {report && (
        <div className="stack compact-stack">
          <strong>{report.summary}</strong>
          <ul className="readiness-list">
            {report.items.map((item) => (
              <li className={`readiness-item ${item.level}`} key={item.label}>
                {item.label}：{item.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
