import { useEffect, useState } from "react";
import type { ProjectSummary } from "./projectTypes";

export function ProjectLibraryPanel({
  listProjects,
  onDeleteProject,
  onOpenProject,
  onRenameProject,
  onSaveProject
}: {
  listProjects: () => Promise<ProjectSummary[]>;
  onDeleteProject?: (projectId: string) => void | Promise<void>;
  onOpenProject: (projectId: string) => void | Promise<void>;
  onRenameProject?: (projectId: string, name: string) => void | Promise<void>;
  onSaveProject: () => void | Promise<void>;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [status, setStatus] = useState("正在读取本机项目...");
  const [renamingProjectId, setRenamingProjectId] = useState<string | undefined>();
  const [draftProjectName, setDraftProjectName] = useState("");
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | undefined>();

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

  function startRename(project: ProjectSummary) {
    setRenamingProjectId(project.id);
    setDraftProjectName(project.name);
    setDeleteConfirmProjectId(undefined);
  }

  async function saveRename(projectId: string) {
    const name = draftProjectName.trim();

    if (!name) {
      setStatus("项目名称不能为空。");
      return;
    }

    try {
      await onRenameProject?.(projectId, name);
      await refreshProjects();
      setRenamingProjectId(undefined);
      setStatus("项目名称已更新。");
    } catch {
      setStatus("重命名项目失败，请稍后再试。");
    }
  }

  function startDelete(projectId: string) {
    setDeleteConfirmProjectId(projectId);
    setRenamingProjectId(undefined);
  }

  async function confirmDelete(projectId: string) {
    try {
      await onDeleteProject?.(projectId);
      await refreshProjects();
      setDeleteConfirmProjectId(undefined);
      setStatus("项目已删除。");
    } catch {
      setStatus("删除项目失败，请稍后再试。");
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
              {renamingProjectId === project.id && (
                <div className="project-edit-form">
                  <label className="stack compact-stack">
                    <span>项目名称</span>
                    <input
                      aria-label="项目名称"
                      onChange={(event) => setDraftProjectName(event.target.value)}
                      type="text"
                      value={draftProjectName}
                    />
                  </label>
                  <div className="project-actions">
                    <button
                      className="secondary-button"
                      onClick={() => void saveRename(project.id)}
                      type="button"
                    >
                      保存名称
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setRenamingProjectId(undefined)}
                      type="button"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              <button
                className="secondary-button"
                onClick={() => onOpenProject(project.id)}
                type="button"
              >
                继续编辑 {project.name}
              </button>
              {onRenameProject && (
                <button
                  className="secondary-button"
                  onClick={() => startRename(project)}
                  type="button"
                >
                  重命名 {project.name}
                </button>
              )}
              {onDeleteProject &&
                (deleteConfirmProjectId === project.id ? (
                  <div className="project-actions">
                    <button
                      className="secondary-button"
                      onClick={() => void confirmDelete(project.id)}
                      type="button"
                    >
                      确认删除 {project.name}
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setDeleteConfirmProjectId(undefined)}
                      type="button"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    className="secondary-button"
                    onClick={() => startDelete(project.id)}
                    type="button"
                  >
                    删除 {project.name}
                  </button>
                ))}
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
