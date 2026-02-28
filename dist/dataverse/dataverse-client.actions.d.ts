import { DataverseClient } from "./dataverse-client.js";
/**
 * Extends DataverseClient with action/function execution support.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export declare class DataverseActionsClient extends DataverseClient {
    executeAction(actionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
    executeFunction(functionName: string, parameters?: Record<string, string>): Promise<unknown>;
    executeBoundAction(entitySetName: string, id: string, actionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
}
//# sourceMappingURL=dataverse-client.actions.d.ts.map