import { DataverseActionsClient } from "./dataverse-client.actions.js";
/**
 * Extends DataverseActionsClient with dependency and option-set query methods.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export declare class DataverseMetadataClient extends DataverseActionsClient {
    listDependencies(componentType: number, objectId: string): Promise<unknown[]>;
    listTableDependencies(tableName: string, types?: string[]): Promise<{
        tableName: string;
        dependencies: Array<{
            componentType: string;
            name: string;
            id: string;
            state: string;
            triggerEvent: string | null;
            solutionName: string | null;
        }>;
        count: number;
        warning: string | null;
    }>;
    listGlobalOptionSets(): Promise<unknown[]>;
    getOptionSet(name: string): Promise<unknown>;
    getAttributeOptionSet(entityLogicalName: string, attributeLogicalName: string): Promise<{
        entityLogicalName: string;
        attributeLogicalName: string;
        attributeType: string;
        options: Array<{
            label: string;
            value: number;
        }>;
    }>;
    getEntityKeys(tableName: string): Promise<Array<{
        schemaName: string;
        logicalName: string;
        keyAttributes: string[];
        isCustomizable: boolean;
        indexStatus: string;
    }>>;
}
//# sourceMappingURL=dataverse-client.metadata.d.ts.map