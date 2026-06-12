import { useEffect, useState } from "react";
import type { ProjectSummary } from "./projectTypes";

export function ProjectLibraryPanel({
  listProjects,
  onOpenProject,
  onSaveProject
}: {
  listProjects: () => Promise<ProjectSummary[]>;
  onOpenProject: (projectId: string) => void | Promise<void>;
  onSaveProject: () => void | Promise<void>;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [status, setStatus] = useState("正在读取本机项目...");

  async function refreshProjects() {
    try {
      const nextProjects = await listProjects();
      setProjects(nextProjects);
      setStatus(nextProjects.length > 0 ? "本机项目已加载。" : "还没有保存的项目。");
    } catch {
      setStatus("读取项目失败，请刷新后再试。");
    }
  }

  async function saveProject() {
    try {
      await onSaveProject();
      await refreshProjects();
      setStatus("当前项目已保存。");
    } catch {
      setStatus("保存项目失败，请稍后再试。");
    }
  }

  useEffect(() => {
    void refreshProjects();
  }, []);

  return (
    <section aria-labelledby="project-library-title" className="panel stack">
      <div className="stack compact-stack">
        <h2 id="project-library-title">本机项目</h2>
        <p className="muted">保存当前原型，下次打开可以继续编辑素材、绑定、位置和大小。</p>
      </div>

      <button className="secondary-button" onClick={saveProject} type="button">
        保存当前项目
      </button>

      {projects.length > 0 && (
        <div className="project-list">
          {projects.map((project) => (
            <div className="project-list-item" key={project.id}>
              <div className="stack compact-stack">
                <strong>{project.name}</strong>
                <span className="muted">
                  {project.assets} 个素材 / {project.bindings} 个绑定
                </span>
              </div>
              <button
                className="secondary-button"
                onClick={() => onOpenProject(project.id)}
                type="button"
              >
                继续编辑 {project.name}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="muted" role="status">
        {status}
      </p>
    </section>
  );
}
