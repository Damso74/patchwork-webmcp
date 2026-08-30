import type { WorkspaceFacade } from "../services/persistence";
import { createPatchworkTools } from "./tools";
import type { PreviewReader, WebMCPToolDefinition } from "./types";

export type RegistrationStatus = "ready" | "unavailable" | "failed";

interface RegistrationRecord {
  facade: WorkspaceFacade;
  controller: AbortController;
  promise: Promise<RegistrationStatus>;
}

const registryKey = "__patchworkWebMCPRegistration__";

type RegistryGlobal = typeof globalThis & {
  [registryKey]?: RegistrationRecord;
};

export const registerPatchworkTools = (
  facade: WorkspaceFacade,
  getPreview: PreviewReader,
  modelContext = document.modelContext,
): Promise<RegistrationStatus> => {
  if (
    typeof window === "undefined" ||
    window.top !== window ||
    typeof modelContext?.registerTool !== "function"
  ) {
    return Promise.resolve("unavailable");
  }

  const registry = globalThis as RegistryGlobal;
  const existing = registry[registryKey];
  if (existing?.facade === facade) return existing.promise;
  existing?.controller.abort();

  const controller = new AbortController();
  const tools = createPatchworkTools({ facade, getPreview });
  const promise = Promise.all(
    tools.map((definition: WebMCPToolDefinition) =>
      Promise.resolve(
        modelContext.registerTool(definition, { signal: controller.signal }),
      ),
    ),
  )
    .then(() => "ready" as const)
    .catch(() => {
      controller.abort();
      delete registry[registryKey];
      return "failed" as const;
    });

  registry[registryKey] = { facade, controller, promise };
  return promise;
};

export const unregisterPatchworkToolsForTests = (): void => {
  const registry = globalThis as RegistryGlobal;
  registry[registryKey]?.controller.abort();
  delete registry[registryKey];
};
