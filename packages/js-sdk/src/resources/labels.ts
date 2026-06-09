import type { RequestFn } from "../client.js";
import type { LabelResolveResult } from "../types.js";

export class LabelsResource {
  constructor(private request: RequestFn) {}

  /**
   * Resolve a barcode or QR code string to its linked xPlant record.
   * Useful for scan stations that need to look up what a label refers to.
   * Requires the `labels:read` scope.
   *
   * @example
   * const result = await client.labels.resolve("XPL-2025-001");
   * // result.record_type === "batch"
   * // result.url === "https://xplant.shmaplex.com/batches/..."
   */
  resolve(barcode: string): Promise<LabelResolveResult> {
    return this.request<LabelResolveResult>(
      `/api/v1/labels/resolve?barcode=${encodeURIComponent(barcode)}`,
    );
  }
}
