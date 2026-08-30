import { useEffect, useState } from "react";
import "./App.css";
import { WorkspaceStudio } from "./components/WorkspaceStudio";
import {
  useWorkspaceController,
  workspaceFacade,
} from "./components/workspace/useWorkspaceController";
import { getPreviewSnapshot } from "./services/preview/runtime";
import { registerPatchworkTools, type RegistrationStatus } from "./webmcp";

function App() {
  const controller = useWorkspaceController();
  const [siteToolsStatus, setSiteToolsStatus] = useState<
    RegistrationStatus | "registering"
  >(document.modelContext ? "registering" : "unavailable");

  useEffect(() => {
    let active = true;
    void workspaceFacade.ready().then(async () => {
      const status = await registerPatchworkTools(
        workspaceFacade,
        getPreviewSnapshot,
      );
      if (active) setSiteToolsStatus(status);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <WorkspaceStudio
      controller={controller}
      siteToolsStatus={siteToolsStatus}
    />
  );
}

export default App;
