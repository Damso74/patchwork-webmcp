import {
  SandpackCodeEditor,
  SandpackPreview,
  SandpackProvider,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react";
import {
  Activity,
  ArchiveRestore,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Code2,
  Download,
  FileCode2,
  FilePlus2,
  Files,
  FolderOpen,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { setPreviewSnapshot } from "../services/preview/runtime";
import type { RegistrationStatus } from "../webmcp";
import type { StarterId } from "../starters";
import { BrandMark } from "./BrandMark";
import type { WorkspaceController } from "./workspace/useWorkspaceController";

type MobilePane = "files" | "code" | "preview" | "activity";

function WorkspaceBridge({
  files,
  activeFile,
  onCodeChange,
  humanEditRef,
}: {
  files: Record<string, string>;
  activeFile: string;
  onCodeChange: (code: string) => void;
  humanEditRef: { current: boolean };
}) {
  const { sandpack } = useSandpack();
  const { code } = useActiveCode();
  const sandpackRef = useRef(sandpack);
  const localEditRef = useRef<{ path: string; content: string } | null>(null);
  const previewSyncTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    sandpackRef.current = sandpack;
  }, [sandpack]);

  useEffect(() => {
    const runtime = sandpackRef.current;
    const changed: Record<string, string> = {};
    let runtimeChanged = false;
    for (const [path, content] of Object.entries(files)) {
      if (!runtime.files[path]) {
        runtime.addFile(path, content, true);
        runtimeChanged = true;
      } else if (runtime.files[path].code !== content) changed[path] = content;
    }
    for (const path of Object.keys(runtime.files)) {
      if (path.startsWith("/src/") && !(path in files)) {
        runtime.deleteFile(path, true);
        runtimeChanged = true;
      }
    }
    for (const [path, content] of Object.entries(changed)) {
      runtime.updateFile(path, content, true);
      runtimeChanged = true;
    }

    window.clearTimeout(previewSyncTimerRef.current);
    if (!runtimeChanged) return;

    let attempts = 0;
    const syncWhenPreviewReady = () => {
      const current = sandpackRef.current;
      const clients = Object.values(current.clients);
      if (
        (clients.length === 0 ||
          clients.some((client) => client.status !== "done")) &&
        attempts < 50
      ) {
        attempts += 1;
        previewSyncTimerRef.current = window.setTimeout(
          syncWhenPreviewReady,
          100,
        );
        return;
      }
      for (const [path, content] of Object.entries(files)) {
        if (!current.files[path]) current.addFile(path, content, true);
        else current.updateFile(path, content, true);
      }
      for (const path of Object.keys(current.files)) {
        if (path.startsWith("/src/") && !(path in files))
          current.deleteFile(path, true);
      }
    };
    syncWhenPreviewReady();
    return () => window.clearTimeout(previewSyncTimerRef.current);
  }, [activeFile, files]);

  useEffect(() => {
    const runtime = sandpackRef.current;
    if (runtime.files[activeFile] && runtime.activeFile !== activeFile) {
      runtime.setActiveFile(activeFile);
    }
  }, [activeFile]);

  useEffect(() => {
    const authoritative = files[activeFile];
    if (sandpack.activeFile !== activeFile || authoritative === undefined)
      return;

    const localEdit = localEditRef.current;
    if (localEdit?.path === activeFile && authoritative === localEdit.content) {
      localEditRef.current = null;
    }
    if (code === authoritative) return;

    if (humanEditRef.current) {
      humanEditRef.current = false;
      localEditRef.current = { path: activeFile, content: code };
      onCodeChange(code);
      return;
    }
    if (localEdit?.path === activeFile && code === localEdit.content) return;

    sandpackRef.current.updateFile(activeFile, authoritative, true);
  }, [
    activeFile,
    code,
    files,
    humanEditRef,
    onCodeChange,
    sandpack.activeFile,
  ]);

  return null;
}

function RuntimeStatus({
  onDiagnostics,
  revision,
}: {
  onDiagnostics: (message: string | null) => void;
  revision: number;
}) {
  const { sandpack } = useSandpack();
  const message = sandpack.error ? String(sandpack.error) : null;
  const problem = Boolean(message) || sandpack.status === "timeout";
  const building = sandpack.status === "initial" || sandpack.status === "idle";

  useEffect(() => {
    onDiagnostics(message);
    setPreviewSnapshot({
      status: problem ? "error" : building ? "compiling" : "ready",
      errors: message
        ? [{ severity: "error", message: message.slice(0, 1000) }]
        : [],
      warnings: [],
      summary: problem
        ? "The preview reports a compilation or runtime error."
        : building
          ? "The preview is compiling the current workspace."
          : "The React preview compiled without a blocking error.",
      renderedRevision: problem ? undefined : revision,
      renderedAt: problem ? undefined : new Date().toISOString(),
    });
  }, [building, message, onDiagnostics, problem, revision]);

  return (
    <span
      className={`runtime-state ${problem ? "is-error" : ""}`}
      role="status"
    >
      {problem ? (
        <CircleAlert size={13} />
      ) : building ? (
        <Clock3 size={13} />
      ) : (
        <CircleCheck size={13} />
      )}
      {problem
        ? "Preview error"
        : building
          ? "Building preview…"
          : "Preview ready"}
    </span>
  );
}

const PREVIEW_SANDBOX = "allow-scripts allow-same-origin";
const SANDPACK_CUSTOM_SETUP = { entry: "/src/main.tsx" } as const;

function SecureSandpackPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const harden = () => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (!iframe) return;
      if (iframe.getAttribute("sandbox") !== PREVIEW_SANDBOX)
        iframe.setAttribute("sandbox", PREVIEW_SANDBOX);
      if (iframe.hasAttribute("allow")) iframe.removeAttribute("allow");
    };
    const observer = new MutationObserver(harden);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        attributes: true,
        attributeFilter: ["allow", "sandbox"],
        childList: true,
        subtree: true,
      });
    }
    harden();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="preview-frame" ref={containerRef}>
      <SandpackPreview
        showNavigator={false}
        showOpenInCodeSandbox={false}
        showOpenNewtab={false}
        showRefreshButton
        showRestartButton={false}
      />
    </div>
  );
}

function FileSidebar({ controller }: { controller: WorkspaceController }) {
  const [showStarters, setShowStarters] = useState(true);
  const [newPath, setNewPath] = useState("");
  const [creating, setCreating] = useState(false);

  const fileEntries = Object.keys(controller.files).sort((a, b) =>
    a.localeCompare(b),
  );

  const addFile = () => {
    if (!newPath.trim()) return;
    controller.createFile(newPath.trim());
    setNewPath("");
    setCreating(false);
  };

  const renameFile = (path: string) => {
    const next = window.prompt("Rename this file", path);
    if (next && next !== path) controller.moveFile(path, next);
  };

  const removeFile = (path: string) => {
    if (window.confirm(`Delete ${path}? A checkpoint can restore it later.`))
      controller.deleteFile(path);
  };

  return (
    <aside className="files-sidebar" aria-label="Project files">
      <section className="sidebar-section starters-section">
        <button
          className="section-heading"
          onClick={() => setShowStarters((open) => !open)}
          aria-expanded={showStarters}
        >
          <span>
            <Sparkles size={14} /> Demo starters
          </span>
          {showStarters ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>
        {showStarters && (
          <div className="starter-list">
            {controller.starters.map((starter) => (
              <button
                key={starter.id}
                className={`starter-card ${controller.starter.id === starter.id ? "active" : ""}`}
                onClick={() =>
                  controller.selectStarter(starter.id as StarterId)
                }
              >
                <i style={{ background: starter.accent }} />
                <span>
                  <strong>{starter.name}</strong>
                  <small>{starter.projectName}</small>
                </span>
                {controller.starter.id === starter.id && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="sidebar-section file-section">
        <div className="section-heading static">
          <span>
            <FolderOpen size={14} /> Project files
          </span>
          <button
            className="quiet-icon"
            onClick={() => setCreating(true)}
            aria-label="Create file"
            title="Create file"
          >
            <FilePlus2 size={14} />
          </button>
        </div>
        {creating && (
          <div className="new-file-row">
            <input
              autoFocus
              value={newPath}
              onChange={(event) => setNewPath(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addFile();
                if (event.key === "Escape") setCreating(false);
              }}
              placeholder="src/section.tsx"
              aria-label="New file path"
            />
            <button onClick={addFile} aria-label="Add file">
              <Check size={13} />
            </button>
            <button onClick={() => setCreating(false)} aria-label="Cancel">
              <X size={13} />
            </button>
          </div>
        )}
        <div className="file-list">
          {fileEntries.map((path) => {
            const name = path.split("/").pop();
            const folder = path.slice(1, path.lastIndexOf("/"));
            return (
              <div
                className={`file-row ${controller.activeFile === path ? "active" : ""}`}
                key={path}
              >
                <button
                  className="file-select"
                  onClick={() => controller.selectFile(path)}
                  title={path}
                >
                  <FileCode2 size={14} />
                  <span>
                    <strong>{name}</strong>
                    <small>{folder}</small>
                  </span>
                </button>
                <div className="file-actions">
                  <button
                    onClick={() => renameFile(path)}
                    aria-label={`Rename ${path}`}
                    title="Rename"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => removeFile(path)}
                    aria-label={`Delete ${path}`}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <p className="sidebar-footnote">
        <span /> Stored in this browser
      </p>
    </aside>
  );
}

function CheckpointPopover({
  controller,
  close,
}: {
  controller: WorkspaceController;
  close: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div
      className="popover checkpoint-popover"
      role="dialog"
      aria-label="Checkpoints"
    >
      <div className="popover-head">
        <div>
          <small>Project history</small>
          <strong>Checkpoints</strong>
        </div>
        <button onClick={close} aria-label="Close checkpoints">
          <X size={15} />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          controller.createCheckpoint(name);
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Revision ${controller.revision}`}
          aria-label="Checkpoint name"
        />
        <button type="submit">
          <Plus size={14} /> Save
        </button>
      </form>
      <div className="checkpoint-list">
        {controller.checkpoints.length === 0 ? (
          <div className="empty-mini">
            <ArchiveRestore size={22} />
            <p>No checkpoints yet.</p>
            <small>Create one before a big change.</small>
          </div>
        ) : (
          controller.checkpoints.map((checkpoint) => (
            <article key={checkpoint.id}>
              <span>
                <strong>{checkpoint.name}</strong>
                <small>
                  Revision {checkpoint.revision} ·{" "}
                  {new Date(checkpoint.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </span>
              <button
                onClick={() => {
                  controller.restoreCheckpoint(checkpoint.id);
                  close();
                }}
              >
                <RotateCcw size={13} /> Restore
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function ActivityPanel({ controller }: { controller: WorkspaceController }) {
  return (
    <section className="activity-panel" aria-label="Recent activity">
      <header>
        <div>
          <Activity size={15} />
          <span>
            <strong>Recent activity</strong>
            <small>Workspace events, without file contents</small>
          </span>
        </div>
        <span className="revision-pill">Revision {controller.revision}</span>
      </header>
      <div className="activity-list">
        {controller.activities.map((item) => (
          <article key={item.id}>
            <i className={item.tone ?? ""}>
              {item.tone === "warning" ? (
                <CircleAlert size={12} />
              ) : (
                <Check size={12} />
              )}
            </i>
            <span>
              <strong>{item.action}</strong>
              <small>{item.detail}</small>
            </span>
            <time>
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </article>
        ))}
      </div>
      <p className="independence-note">
        Patchwork is an independent project and is not affiliated with or
        endorsed by OpenAI.
      </p>
    </section>
  );
}

export function WorkspaceStudio({
  controller,
  siteToolsStatus,
}: {
  controller: WorkspaceController;
  siteToolsStatus: RegistrationStatus | "registering";
}) {
  const [mobilePane, setMobilePane] = useState<MobilePane>("code");
  const [activityOpen, setActivityOpen] = useState(false);
  const [checkpointsOpen, setCheckpointsOpen] = useState(false);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<"desktop" | "tablet">(
    "desktop",
  );
  const humanEditRef = useRef(false);

  const siteToolsReady = siteToolsStatus === "ready";

  const visibleFiles = Object.keys(controller.files);
  const latestActivity = controller.activities[0];
  const sandpackSeedFiles = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(controller.starter.files).map(([path, code]) => [
          path,
          { code },
        ]),
      ),
    [controller.starter.files],
  );

  return (
    <SandpackProvider
      key={controller.starter.id}
      template="react-ts"
      files={sandpackSeedFiles}
      customSetup={SANDPACK_CUSTOM_SETUP}
      options={{
        activeFile: controller.activeFile,
        visibleFiles,
        autorun: true,
        autoReload: true,
        recompileMode: "delayed",
        recompileDelay: 250,
      }}
    >
      <WorkspaceBridge
        files={controller.files}
        activeFile={controller.activeFile}
        onCodeChange={controller.updateActiveFile}
        humanEditRef={humanEditRef}
      />
      <div className="patchwork-app">
        <header className="topbar">
          <div className="brand-lockup">
            <BrandMark />
            <span>
              <strong>Patchwork</strong>
              <small>Browser workspace</small>
            </span>
          </div>
          <div className="project-title">
            <span>{controller.starter.projectName}</span>
            <small>{controller.activeFile}</small>
          </div>
          <div className="topbar-statuses">
            <span className="save-status">
              <i />
              {controller.saveState === "saving"
                ? "Saving locally…"
                : controller.saveState === "memory"
                  ? "In-memory only"
                  : controller.saveState === "conflict"
                    ? "Edit conflict — review latest"
                    : "Saved locally"}
            </span>
            <span className={`tools-status ${siteToolsReady ? "ready" : ""}`}>
              {siteToolsReady ? <Sparkles size={13} /> : <WifiOff size={13} />}
              {siteToolsReady
                ? "Site tools ready"
                : siteToolsStatus === "registering"
                  ? "Registering site tools…"
                  : siteToolsStatus === "failed"
                    ? "Site tools registration failed"
                    : "Site tools unavailable in this browser"}
            </span>
          </div>
          <div className="topbar-actions">
            <div className="action-wrap">
              <button
                className="secondary-action"
                onClick={() => setCheckpointsOpen((open) => !open)}
                aria-expanded={checkpointsOpen}
                aria-label="Create or restore checkpoint"
                title="Checkpoints"
              >
                <ArchiveRestore size={15} />
                <span>Checkpoint</span>
              </button>
              {checkpointsOpen && (
                <CheckpointPopover
                  controller={controller}
                  close={() => setCheckpointsOpen(false)}
                />
              )}
            </div>
            <button
              className="icon-action"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset this demo to its exact original state? A safety checkpoint will be kept.",
                  )
                )
                  controller.resetDemo();
              }}
              title="Reset demo"
              aria-label="Reset demo"
            >
              <RefreshCcw size={15} />
            </button>
            <button
              className="primary-action"
              onClick={() => void controller.exportProject()}
              aria-label="Export ZIP"
              title="Export ZIP"
            >
              <Download size={15} />
              <span>Export ZIP</span>
            </button>
          </div>
        </header>

        <nav className="mobile-tabs" aria-label="Workspace views">
          {(
            [
              ["files", Files, "Files"],
              ["code", Code2, "Code"],
              ["preview", PanelRight, "Preview"],
              ["activity", Activity, "Activity"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              className={mobilePane === id ? "active" : ""}
              onClick={() => setMobilePane(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <main className="workspace-grid">
          <div
            className={`pane files-pane ${mobilePane === "files" ? "mobile-active" : ""}`}
          >
            <FileSidebar controller={controller} />
          </div>
          <section
            className={`pane editor-pane ${mobilePane === "code" ? "mobile-active" : ""}`}
            aria-label="Code editor"
          >
            <header className="panel-header">
              <div>
                <Code2 size={14} />
                <span>{controller.activeFile.split("/").pop()}</span>
                <small>{controller.activeFile}</small>
              </div>
              <span className="language-pill">
                {controller.activeFile.split(".").pop()?.toUpperCase()}
              </span>
            </header>
            <div
              className="editor-canvas"
              onBeforeInputCapture={() => {
                humanEditRef.current = true;
              }}
              onPasteCapture={() => {
                humanEditRef.current = true;
              }}
              onCutCapture={() => {
                humanEditRef.current = true;
              }}
              onKeyDownCapture={(event) => {
                if (
                  event.key === "Backspace" ||
                  event.key === "Delete" ||
                  event.key === "Enter"
                )
                  humanEditRef.current = true;
              }}
            >
              <SandpackCodeEditor
                showTabs={false}
                showLineNumbers
                showInlineErrors
                wrapContent={false}
              />
            </div>
            <footer className="editor-footer">
              <span>Ln 1, Col 1</span>
              <span>UTF-8</span>
              <span>Changes save locally</span>
            </footer>
          </section>

          <section
            className={`pane preview-pane ${mobilePane === "preview" ? "mobile-active" : ""}`}
            aria-label="Live preview"
          >
            <header className="panel-header preview-header">
              <div>
                <PanelRight size={14} />
                <span>Live preview</span>
                <RuntimeStatus
                  onDiagnostics={setDiagnostic}
                  revision={controller.revision}
                />
              </div>
              <div className="preview-actions">
                <div className="viewport-toggle" aria-label="Preview size">
                  <button
                    className={previewSize === "desktop" ? "active" : ""}
                    onClick={() => setPreviewSize("desktop")}
                  >
                    Desktop
                  </button>
                  <button
                    className={previewSize === "tablet" ? "active" : ""}
                    onClick={() => setPreviewSize("tablet")}
                  >
                    Tablet
                  </button>
                </div>
                <button
                  className="quiet-icon"
                  title="More preview options"
                  aria-label="More preview options"
                >
                  <MoreHorizontal size={15} />
                </button>
              </div>
            </header>
            <div className={`preview-stage ${previewSize}`}>
              <SecureSandpackPreview />
            </div>
            <section
              className={`diagnostics ${diagnostic ? "has-error" : ""}`}
              aria-label="Preview diagnostics"
            >
              <header>
                <span>
                  {diagnostic ? (
                    <CircleAlert size={14} />
                  ) : (
                    <CircleCheck size={14} />
                  )}
                  <strong>Diagnostics</strong>
                </span>
                <small>{diagnostic ? "1 issue" : "No issues"}</small>
              </header>
              {diagnostic ? (
                <p>{diagnostic.slice(0, 360)}</p>
              ) : (
                <p className="healthy-message">
                  The current revision compiled without a blocking error.
                </p>
              )}
            </section>
          </section>

          <div
            className={`pane mobile-activity-pane ${mobilePane === "activity" ? "mobile-active" : ""}`}
          >
            <ActivityPanel controller={controller} />
          </div>
        </main>

        <section className={`activity-dock ${activityOpen ? "open" : ""}`}>
          <button
            className="activity-summary"
            onClick={() => setActivityOpen((open) => !open)}
            aria-expanded={activityOpen}
          >
            <span className="activity-label">
              <Activity size={14} />
              <strong>Recent activity</strong>
              <i>{controller.activities.length}</i>
            </span>
            {latestActivity && (
              <span className="latest-event">
                <CircleCheck size={13} />
                <strong>{latestActivity.action}</strong>
                <small>{latestActivity.detail}</small>
              </span>
            )}
            <span className="activity-expand">
              {activityOpen ? "Close" : "View all"}
              <ChevronDown size={14} />
            </span>
          </button>
          {activityOpen && <ActivityPanel controller={controller} />}
        </section>
      </div>
    </SandpackProvider>
  );
}
