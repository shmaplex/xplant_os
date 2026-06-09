import type { RequestFn } from "../client.js";
import type { TaskSummary } from "../types.js";

export class TasksResource {
  constructor(private request: RequestFn) {}

  /**
   * List tasks for the workspace.
   * Requires the `tasks:read` scope.
   */
  list(): Promise<TaskSummary[]> {
    return this.request<TaskSummary[]>("/api/v1/tasks");
  }

  /**
   * Get a single task by ID.
   * Requires the `tasks:read` scope.
   */
  get(taskId: string): Promise<TaskSummary> {
    return this.request<TaskSummary>(
      `/api/v1/tasks/${encodeURIComponent(taskId)}`,
    );
  }
}
