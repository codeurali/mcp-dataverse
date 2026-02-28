import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import type { ToolDefinition, ToolResult } from "./tool-registry.js";
export declare const routerTools: ToolDefinition[];
export declare function handleRouterTool(name: string, args: unknown, _client: DataverseAdvancedClient): Promise<ToolResult>;
//# sourceMappingURL=router.tools.d.ts.map