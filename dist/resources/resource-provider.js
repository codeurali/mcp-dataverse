// ── Resource Templates (dynamic URIs with parameters) ────────────────────────
const RESOURCE_TEMPLATES = [
    {
        uriTemplate: "dataverse://tables/{tableName}/schema",
        name: "Table Schema",
        description: "Returns the full schema (columns, types, requirements) for a Dataverse table",
        mimeType: "application/json",
    },
    {
        uriTemplate: "dataverse://tables/{tableName}/relationships",
        name: "Table Relationships",
        description: "Returns all 1:N and N:N relationships for a Dataverse table",
        mimeType: "application/json",
    },
];
// ── Static Resources (fixed URIs) ────────────────────────────────────────────
const STATIC_RESOURCES = [
    {
        uri: "dataverse://tables",
        name: "Available Tables",
        description: "Lists all custom tables in the connected Dataverse environment",
        mimeType: "application/json",
    },
    {
        uri: "dataverse://server/instructions",
        name: "Server Instructions",
        description: "Usage guidelines and best practices for interacting with this Dataverse MCP server",
        mimeType: "text/plain",
    },
];
function parseResourceUri(uri) {
    const PREFIX = "dataverse://";
    if (!uri.startsWith(PREFIX)) {
        throw new Error(`Unknown resource URI: ${uri}`);
    }
    const path = uri.slice(PREFIX.length);
    if (path === "tables") {
        return { type: "tables" };
    }
    if (path === "server/instructions") {
        return { type: "instructions" };
    }
    const schemaMatch = /^tables\/([^/]+)\/schema$/.exec(path);
    if (schemaMatch) {
        return { type: "schema", tableName: schemaMatch[1] };
    }
    const relMatch = /^tables\/([^/]+)\/relationships$/.exec(path);
    if (relMatch) {
        return { type: "relationships", tableName: relMatch[1] };
    }
    throw new Error(`Unknown resource URI: ${uri}`);
}
export function listResources() {
    return STATIC_RESOURCES;
}
export function listResourceTemplates() {
    return RESOURCE_TEMPLATES;
}
export async function readResource(uri, client, serverInstructions) {
    const parsed = parseResourceUri(uri);
    switch (parsed.type) {
        case "tables": {
            const tables = await client.listTables(true);
            return { uri, mimeType: "application/json", text: JSON.stringify(tables, null, 2) };
        }
        case "schema": {
            const metadata = await client.getTableMetadata(parsed.tableName);
            return { uri, mimeType: "application/json", text: JSON.stringify(metadata, null, 2) };
        }
        case "relationships": {
            const rels = await client.getRelationships(parsed.tableName);
            return { uri, mimeType: "application/json", text: JSON.stringify(rels, null, 2) };
        }
        case "instructions": {
            return { uri, mimeType: "text/plain", text: serverInstructions };
        }
    }
}
//# sourceMappingURL=resource-provider.js.map