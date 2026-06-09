import type { RequestFn } from "../client.js";
import type { PlantSummary } from "../types.js";

export class PlantsResource {
  constructor(private request: RequestFn) {}

  /**
   * List plant summaries for the workspace.
   * Requires the `plants:read` scope.
   */
  list(): Promise<PlantSummary[]> {
    return this.request<PlantSummary[]>("/api/v1/plants");
  }

  /**
   * Get a single plant by ID.
   * Requires the `plants:read` scope.
   */
  get(plantId: string): Promise<PlantSummary> {
    return this.request<PlantSummary>(
      `/api/v1/plants/${encodeURIComponent(plantId)}`,
    );
  }
}
