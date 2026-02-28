import { DataverseBatchClient } from "./dataverse-client.batch.js";
/**
 * Extends DataverseMetadataClient with advanced query capabilities:
 * bound functions, server-side paging, and change tracking (delta queries).
 */
export declare class DataverseAdvancedClient extends DataverseBatchClient {
    executeBoundFunction<T = unknown>(entitySetName: string, recordId: string, functionName: string, params?: Record<string, string>): Promise<T>;
    queryWithPaging<T = Record<string, unknown>>(entitySetName: string, options?: {
        select?: string[];
        filter?: string;
        orderby?: string;
        expand?: string;
        maxTotal?: number;
    }): Promise<{
        records: T[];
        totalRetrieved: number;
        pageCount: number;
    }>;
    getChangedRecords<T = Record<string, unknown>>(entitySetName: string, deltaToken: string | null, select?: string[]): Promise<{
        newAndModified: T[];
        deleted: Array<{
            id: string;
        }>;
        nextDeltaToken: string | null;
    }>;
    getSolutionComponents(solutionName: string, componentType?: number, top?: number): Promise<{
        solutionName: string;
        solutionId: string;
        friendlyName: string;
        version: string;
        components: Array<{
            componentType: number;
            componentTypeName: string;
            objectId: string;
        }>;
        count: number;
    }>;
    publishCustomizations(components?: {
        entities?: string[] | undefined;
        webResources?: string[] | undefined;
        optionSets?: string[] | undefined;
    }): Promise<{
        published: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=dataverse-client-advanced.d.ts.map