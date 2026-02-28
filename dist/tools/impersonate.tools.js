import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const ImpersonateInput = z.object({
    callerId: z
        .string()
        .uuid()
        .describe('Azure AD Object ID (GUID) of the Dataverse system user to impersonate. Requires the executing account to have the "Act on behalf of another user" privilege in Dataverse.'),
    toolName: z
        .string()
        .min(1)
        .describe('Name of the MCP tool to execute on behalf of the user (e.g., "dataverse_create", "dataverse_query")'),
    toolArgs: z
        .record(z.unknown())
        .describe("Arguments for the wrapped tool, as an object"),
});
export const impersonateTools = [
    {
        name: "dataverse_impersonate",
        description: 'Executes another Dataverse tool on behalf of a different system user by injecting the MSCRMCallerId header. Requires the executing account to have the "Act on behalf of another user" privilege in Dataverse. The impersonation applies ONLY to the single tool call specified. Use for auditing workflows that must create or update records under a specific user identity. WHEN TO USE: Creating or updating records under a specific user identity for audit-trail purposes. BEST PRACTICES: Impersonation applies to the single wrapped tool call only; cannot impersonate System Administrators. WORKFLOW: update_record.',
        inputSchema: {
            type: "object",
            properties: {
                callerId: {
                    type: "string",
                    description: "GUID (Azure AD Object ID) of the Dataverse system user to impersonate",
                },
                toolName: {
                    type: "string",
                    description: 'MCP tool to execute while impersonating (e.g., "dataverse_create")',
                },
                toolArgs: {
                    type: "object",
                    description: "Arguments for the wrapped tool",
                },
            },
            required: ["callerId", "toolName", "toolArgs"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
];
export async function handleImpersonateTool(name, args, client, dispatch) {
    if (name !== "dataverse_impersonate") {
        throw new Error(`Unknown impersonate tool: ${name}`);
    }
    const { callerId, toolName, toolArgs } = ImpersonateInput.parse(args);
    // Security guard: prevent privilege escalation via System Administrator impersonation.
    // Best-effort check — if it fails for non-security reasons, log and proceed.
    try {
        const roleCheck = await client.query(`systemusers(${esc(callerId)})/systemuserroles_association`, { select: ["name"], filter: `name eq 'System Administrator'`, top: 1 });
        if ((roleCheck.value?.length ?? 0) > 0) {
            throw new Error("Security policy: impersonation of users with System Administrator role is prohibited to prevent privilege escalation.");
        }
    }
    catch (err) {
        if (err instanceof Error && err.message.includes("Security policy"))
            throw err;
        // Fail-closed: any failure verifying roles means we cannot confirm safety — deny impersonation.
        throw new Error(`Security policy: cannot verify callerId roles — impersonation denied. Cause: ${String(err)}`);
    }
    // Access the HttpClient defaultHeaders via type cast — the http property is protected
    const http = client.http;
    const prev = http.defaultHeaders["MSCRMCallerId"];
    try {
        http.defaultHeaders["MSCRMCallerId"] = callerId;
        const result = await dispatch(toolName, toolArgs, client);
        return formatData(`Impersonated as ${callerId}, executed ${toolName}`, {
            impersonatedAs: callerId,
            tool: toolName,
            result: JSON.parse(result.content[0].text),
        }, ["Impersonation applies to this single call only"]);
    }
    finally {
        if (prev === undefined) {
            delete http.defaultHeaders["MSCRMCallerId"];
        }
        else {
            http.defaultHeaders["MSCRMCallerId"] = prev;
        }
    }
}
//# sourceMappingURL=impersonate.tools.js.map