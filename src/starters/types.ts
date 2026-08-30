export type StarterId = "landing" | "dashboard" | "travel";

export interface StarterDefinition {
  id: StarterId;
  name: string;
  projectName: string;
  description: string;
  accent: string;
  files: Record<string, string>;
}
