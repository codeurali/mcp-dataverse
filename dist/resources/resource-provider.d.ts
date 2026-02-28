import type { Resource, ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export interface ResourceContent {
    uri: string;
    mimeType: string;
    text: string;
}
export declare function listResources(): Resource[];
export declare function listResourceTemplates(): ResourceTemplate[];
export declare function readResource(uri: string, client: DataverseAdvancedClient, serverInstructions: string): Promise<ResourceContent>;
//# sourceMappingURL=resource-provider.d.ts.map