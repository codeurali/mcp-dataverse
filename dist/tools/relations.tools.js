import { z } from "zod";
import { formatData } from "./output.utils.js";
import { safeEntitySetName, safeRelationshipName } from "./validation.utils.js";
export const relationTools = [
    {
        name: "dataverse_associate",
        description: "Creates an association between two Dataverse records via a named N:N or 1:N relationship. Requires the relationship schema name obtainable from dataverse_get_relationships. Use for N:N relationships or to link records without modifying a lookup field directly — for simple 1:N lookups, setting the lookup field in dataverse_update is simpler. WHEN TO USE: Linking two records via an N:N relationship or 1:N navigation property. BEST PRACTICES: Get the relationship schema name from dataverse_get_relationships first; for simple 1:N lookups use dataverse_update. WORKFLOW: update_record.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: { type: "string" },
                id: { type: "string", description: "Source record GUID" },
                relationshipName: {
                    type: "string",
                    description: "Relationship schema name",
                },
                relatedEntitySetName: {
                    type: "string",
                    description: "Related entity set name",
                },
                relatedId: { type: "string", description: "Related record GUID" },
            },
            required: [
                "entitySetName",
                "id",
                "relationshipName",
                "relatedEntitySetName",
                "relatedId",
            ],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_disassociate",
        description: "Removes an existing association between two Dataverse records on a named relationship. For N:N relationships, provide relatedId and relatedEntitySetName to build the correct $id URL. For 1:N relationships, relatedId and relatedEntitySetName are optional. Use dataverse_get_relationships to find the correct relationship schema name. WHEN TO USE: Removing an N:N or 1:N link between two records without deleting either record. BEST PRACTICES: Get the relationship schema name from dataverse_get_relationships; relatedId is required for N:N. WORKFLOW: update_record.",
        inputSchema: {
            type: "object",
            properties: {
                entitySetName: { type: "string" },
                id: { type: "string" },
                relationshipName: { type: "string" },
                relatedId: {
                    type: "string",
                    description: "Required for N:N relationships",
                },
                relatedEntitySetName: {
                    type: "string",
                    description: 'Entity set name of the related record (required for N:N). E.g., "contacts"',
                },
            },
            required: ["entitySetName", "id", "relationshipName"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const AssociateInput = z.object({
    entitySetName: safeEntitySetName,
    id: z.string().uuid(),
    relationshipName: safeRelationshipName,
    relatedEntitySetName: safeEntitySetName,
    relatedId: z.string().uuid(),
});
const DisassociateInput = z.object({
    entitySetName: safeEntitySetName,
    id: z.string().uuid(),
    relationshipName: safeRelationshipName,
    relatedId: z.string().uuid().optional(),
    relatedEntitySetName: safeEntitySetName.optional(),
});
export async function handleRelationTool(name, args, client) {
    switch (name) {
        case "dataverse_associate": {
            const { entitySetName, id, relationshipName, relatedEntitySetName, relatedId, } = AssociateInput.parse(args);
            await client.associate(entitySetName, id, relationshipName, relatedEntitySetName, relatedId);
            return formatData(`Associated ${entitySetName}(${id}) with ${relatedEntitySetName}(${relatedId}) via ${relationshipName}`, { message: "Records associated successfully" }, ["Use dataverse_get_relationships to verify relationship names"]);
        }
        case "dataverse_disassociate": {
            const { entitySetName, id, relationshipName, relatedId, relatedEntitySetName, } = DisassociateInput.parse(args);
            await client.disassociate(entitySetName, id, relationshipName, relatedId, relatedEntitySetName);
            return formatData(`Disassociated records via ${relationshipName}`, { message: "Records disassociated successfully" }, ["This removes the N:N link but does not delete records"]);
        }
        default:
            throw new Error(`Unknown relation tool: ${name}`);
    }
}
//# sourceMappingURL=relations.tools.js.map