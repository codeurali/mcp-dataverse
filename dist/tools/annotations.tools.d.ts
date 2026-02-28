import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
export declare const annotationTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            recordId: {
                type: string;
                description: string;
            };
            includeContent: {
                type: string;
                description: string;
                default: boolean;
            };
            top: {
                type: string;
                description: string;
                default: number;
            };
            mimeTypeFilter: {
                type: string;
                description: string;
            };
            entitySetName?: never;
            notetext?: never;
            subject?: never;
            filename?: never;
            mimetype?: never;
            documentbody?: never;
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
            recordId: {
                type: string;
                description: string;
            };
            entitySetName: {
                type: string;
                description: string;
            };
            notetext: {
                type: string;
                description: string;
            };
            subject: {
                type: string;
                description: string;
            };
            filename: {
                type: string;
                description: string;
            };
            mimetype: {
                type: string;
                description: string;
            };
            documentbody: {
                type: string;
                description: string;
            };
            includeContent?: never;
            top?: never;
            mimeTypeFilter?: never;
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
export declare function handleAnnotationTool(name: string, args: unknown, client: DataverseAdvancedClient): Promise<{
    content: Array<{
        type: "text";
        text: string;
    }>;
}>;
//# sourceMappingURL=annotations.tools.d.ts.map