import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const AUDIT_ACTION_NAMES = {
    1: "Create",
    2: "Update",
    3: "Delete",
    4: "Activate",
    5: "Deactivate",
    11: "Share",
    12: "Unshare",
    13: "Assign",
    104: "Access",
};
const AUDIT_ACTION_CODES = Object.fromEntries(Object.entries(AUDIT_ACTION_NAMES).map(([code, name]) => [
    name,
    Number(code),
]));
export const auditTools = [
    {
        name: "dataverse_get_audit_log",
        description: "Retrieves audit log entries from Dataverse. Returns operation details, user info, and parsed change data for each entry. " +
            "At least one filter (recordId, entityLogicalName, userId, fromDate, or operations) is recommended to avoid large result sets. " +
            "Audit must be enabled on the environment and table — returns a clear error if auditing is disabled (HTTP 403). " +
            "WHEN TO USE: Tracking who changed what and when on Dataverse records. " +
            "BEST PRACTICES: Always provide at least one filter; audit must be enabled on the table. " +
            "WORKFLOW: inspect_audit.",
        inputSchema: {
            type: "object",
            properties: {
                recordId: {
                    type: "string",
                    description: "GUID of a specific record to retrieve audit entries for",
                },
                entityLogicalName: {
                    type: "string",
                    description: 'Logical name of the entity to filter audit entries (e.g., "account", "contact")',
                },
                userId: {
                    type: "string",
                    description: "GUID of the user who made the changes",
                },
                fromDate: {
                    type: "string",
                    description: "ISO 8601 date string — only return audit entries created on or after this date",
                },
                top: {
                    type: "number",
                    description: "Maximum number of audit entries to return (default: 50, max: 500)",
                },
                operations: {
                    type: "array",
                    items: { type: "string" },
                    description: 'Filter by operation names: "Create", "Update", "Delete", "Activate", "Deactivate", "Share", "Unshare", "Assign", "Access"',
                },
            },
            required: [],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const AuditInput = z.object({
    recordId: z.string().uuid().optional(),
    entityLogicalName: z.string().min(1).optional(),
    userId: z.string().uuid().optional(),
    fromDate: z.string().datetime({ offset: true }).optional(),
    top: z.number().positive().max(500).optional().default(50),
    operations: z.array(z.string().min(1)).optional(),
});
function parseChangeData(raw) {
    if (!raw)
        return {};
    try {
        return JSON.parse(raw);
    }
    catch {
        return raw;
    }
}
function mapAuditRecord(record) {
    return {
        auditId: record.auditid,
        operation: record.operation,
        operationName: AUDIT_ACTION_NAMES[record.operation] ?? `Unknown(${record.operation})`,
        action: record.action,
        actionName: AUDIT_ACTION_NAMES[record.action] ?? `Unknown(${record.action})`,
        createdOn: record.createdon,
        userId: record._userid_value,
        userFullName: record.userid?.fullname ?? "",
        userDomainName: record.userid?.domainname ?? "",
        objectId: record._objectid_value,
        objectTypeCode: record.objecttypecode,
        changes: parseChangeData(record.changedata),
    };
}
export async function handleAuditTool(name, args, client) {
    switch (name) {
        case "dataverse_get_audit_log": {
            const params = AuditInput.parse(args);
            const filters = [];
            if (params.recordId) {
                filters.push(`_objectid_value eq ${params.recordId}`);
            }
            if (params.entityLogicalName) {
                const escaped = esc(params.entityLogicalName);
                filters.push(`objecttypecode eq '${escaped}'`);
            }
            if (params.userId) {
                filters.push(`_userid_value eq ${params.userId}`);
            }
            if (params.fromDate) {
                filters.push(`createdon ge ${params.fromDate}`);
            }
            if (params.operations?.length) {
                const codes = params.operations
                    .map((op) => AUDIT_ACTION_CODES[op])
                    .filter((code) => code !== undefined);
                if (codes.length > 0) {
                    const orClauses = codes.map((c) => `action eq ${c}`).join(" or ");
                    filters.push(`(${orClauses})`);
                }
            }
            try {
                const result = await client.query("audits", {
                    select: [
                        "auditid",
                        "action",
                        "operation",
                        "createdon",
                        "_objectid_value",
                        "objecttypecode",
                        "changedata",
                        "_userid_value",
                    ],
                    ...(filters.length > 0 ? { filter: filters.join(" and ") } : {}),
                    orderby: "createdon desc",
                    top: params.top,
                    expand: "userid($select=fullname,domainname)",
                });
                const entries = result.value.map(mapAuditRecord);
                return formatData(`${entries.length} audit records for ${params.entityLogicalName ?? params.recordId ?? "query"}`, { entries, count: entries.length }, ["Filter by operation type for specific changes"]);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (message.includes("403") || message.includes("Forbidden")) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    isError: true,
                                    error: "Audit log access denied (HTTP 403). Ensure auditing is enabled on the Dataverse environment and the target table, and that the authenticated user has sufficient privileges.",
                                }),
                            },
                        ],
                    };
                }
                throw error;
            }
        }
        default:
            throw new Error(`Unknown audit tool: ${name}`);
    }
}
//# sourceMappingURL=audit.tools.js.map