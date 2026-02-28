import { HttpClient } from "./http-client.js";
import type { AuthProvider } from "../auth/auth-provider.interface.js";
import type { ODataResponse, EntityMetadata, RelationshipMetadata } from "./types.js";
export declare class DataverseClient {
    protected readonly http: HttpClient;
    private readonly authProvider;
    private readonly maxRetries;
    constructor(authProvider: AuthProvider, maxRetries?: number, timeoutMs?: number);
    protected requestWithRetry<T>(fn: () => Promise<T>, attempt?: number): Promise<T>;
    private formatError;
    whoAmI(): Promise<{
        UserId: string;
        BusinessUnitId: string;
        OrganizationId: string;
        OrganizationName: string;
        EnvironmentUrl: string;
    }>;
    listTables(includeCustomOnly?: boolean): Promise<EntityMetadata[]>;
    getTableMetadata(logicalName: string, includeAttributes?: boolean): Promise<EntityMetadata>;
    getRelationships(logicalName: string): Promise<RelationshipMetadata[]>;
    query<T = Record<string, unknown>>(entitySetName: string, options?: {
        select?: string[];
        filter?: string;
        orderby?: string;
        top?: number;
        expand?: string;
        count?: boolean;
        apply?: string;
    }): Promise<ODataResponse<T>>;
    executeFetchXml<T = Record<string, unknown>>(entitySetName: string, fetchXml: string): Promise<ODataResponse<T>>;
    getRecord(entitySetName: string, id: string, select?: string[]): Promise<{
        record: Record<string, unknown>;
        etag: string | null;
    }>;
    createRecord(entitySetName: string, data: Record<string, unknown>): Promise<string>;
    updateRecord(entitySetName: string, id: string, data: Record<string, unknown>, etag?: string): Promise<void>;
    deleteRecord(entitySetName: string, id: string): Promise<void>;
    upsertRecord(entitySetName: string, alternateKey: string, alternateKeyValue: string, data: Record<string, unknown>, mode?: "upsert" | "createOnly" | "updateOnly", keySegment?: string): Promise<{
        operation: "created" | "updated";
        id: string;
    }>;
    associate(entitySetName: string, id: string, relationshipName: string, relatedEntitySetName: string, relatedId: string): Promise<void>;
    disassociate(entitySetName: string, id: string, relationshipName: string, relatedId?: string, relatedEntitySetName?: string): Promise<void>;
}
//# sourceMappingURL=dataverse-client.d.ts.map