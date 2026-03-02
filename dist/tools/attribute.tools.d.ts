import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const attributeTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entityLogicalName: {
                type: string;
                description: string;
            };
            schemaName: {
                type: string;
                description: string;
            };
            attributeType: {
                type: string;
                enum: readonly ["String", "Memo", "Integer", "Decimal", "Money", "DateTime", "Boolean", "Picklist"];
                description: string;
            };
            displayName: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            requiredLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            maxLength: {
                type: string;
                description: string;
            };
            minValue: {
                type: string;
                description: string;
            };
            maxValue: {
                type: string;
                description: string;
            };
            precision: {
                type: string;
                description: string;
            };
            dateTimeFormat: {
                type: string;
                enum: string[];
                description: string;
            };
            defaultBooleanValue: {
                type: string;
                description: string;
            };
            picklistOptions: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        value: {
                            type: string;
                            description: string;
                        };
                        label: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
            languageCode: {
                type: string;
                description: string;
            };
            autoPublish: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            attributeLogicalName?: never;
            isSearchable?: never;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entityLogicalName: {
                type: string;
                description: string;
            };
            attributeLogicalName: {
                type: string;
                description: string;
            };
            displayName: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            requiredLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            maxLength: {
                type: string;
                description: string;
            };
            isSearchable: {
                type: string;
                description: string;
            };
            languageCode: {
                type: string;
                description: string;
            };
            autoPublish: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            schemaName?: never;
            attributeType?: never;
            minValue?: never;
            maxValue?: never;
            precision?: never;
            dateTimeFormat?: never;
            defaultBooleanValue?: never;
            picklistOptions?: never;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            entityLogicalName: {
                type: string;
                description: string;
            };
            attributeLogicalName: {
                type: string;
                description: string;
            };
            autoPublish: {
                type: string;
                description: string;
            };
            confirm: {
                type: string;
                description: string;
            };
            schemaName?: never;
            attributeType?: never;
            displayName?: never;
            description?: never;
            requiredLevel?: never;
            maxLength?: never;
            minValue?: never;
            maxValue?: never;
            precision?: never;
            dateTimeFormat?: never;
            defaultBooleanValue?: never;
            picklistOptions?: never;
            languageCode?: never;
            isSearchable?: never;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
})[];
export declare function handleAttributeTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=attribute.tools.d.ts.map