import { dashboardStarter } from "./dashboard";
import { landingStarter } from "./landing";
import { plannerStarter } from "./planner";
import type { StarterDefinition } from "./types";

export type { StarterDefinition, StarterId } from "./types";
export {
  getWorkspaceProjectLabel,
  workspaceMatchesStarter,
} from "./workspaceIdentity";

export const starters: StarterDefinition[] = [
  landingStarter,
  dashboardStarter,
  plannerStarter,
];

export function getStarter(id: string | null): StarterDefinition {
  const normalized = id === "planner" ? "travel" : id;
  return (
    starters.find((starter) => starter.id === normalized) ?? landingStarter
  );
}
