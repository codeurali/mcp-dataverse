import { DataverseClient } from "./dataverse-client.js";
import { esc } from "./dataverse-client.utils.js";

/**
 * Extends DataverseClient with action/function execution support.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export class DataverseActionsClient extends DataverseClient {
  // ─── Actions & Functions ─────────────────────────────────────────────────

  async executeAction(
    actionName: string,
    parameters: Record<string, unknown> = {},
  ): Promise<unknown> {
    return this.requestWithRetry(() =>
      this.http.post(actionName, parameters).then((r) => r.data),
    );
  }

  async executeFunction(
    functionName: string,
    parameters: Record<string, string> = {},
  ): Promise<unknown> {
    const paramStr = Object.entries(parameters)
      .map(([k, v]) => `${esc(k)}='${esc(v)}'`)
      .join(",");
    const url = paramStr ? `${functionName}(${paramStr})` : `${functionName}()`;
    return this.requestWithRetry(() => this.http.get(url).then((r) => r.data));
  }

  async executeBoundAction(
    entitySetName: string,
    id: string,
    actionName: string,
    parameters: Record<string, unknown> = {},
  ): Promise<unknown> {
    return this.requestWithRetry(() =>
      this.http
        .post(
          `${entitySetName}(${id})/Microsoft.Dynamics.CRM.${actionName}`,
          parameters,
        )
        .then((r) => r.data),
    );
  }
}
