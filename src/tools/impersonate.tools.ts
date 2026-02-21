import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import { esc } from "../dataverse/dataverse-client.utils.js";

const ImpersonateInput = z.object({
  callerId: z
    .string()
    .uuid()
    .describe(
      'Azure AD Object ID (GUID) of the Dataverse system user to impersonate. Requires the executing account to have the "Act on behalf of another user" privilege in Dataverse.',
    ),
  toolName: z
    .string()
    .min(1)
    .describe(
      'Name of the MCP tool to execute on behalf of the user (e.g., "dataverse_create", "dataverse_query")',
    ),
  toolArgs: z
    .record(z.unknown())
    .describe("Arguments for the wrapped tool, as an object"),
});

type DispatchFn = (
  toolName: string,
  args: unknown,
  client: DataverseAdvancedClient,
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

/** HttpClient exposes defaultHeaders as a mutable record */
type HttpDefaultHeaders = { defaultHeaders: Record<string, string> };

export const impersonateTools = [
  {
    name: "dataverse_impersonate",
    description:
      'Executes another Dataverse tool on behalf of a different system user by injecting the MSCRMCallerId header. Requires the executing account to have the "Act on behalf of another user" privilege in Dataverse. The impersonation applies ONLY to the single tool call specified. Use for auditing workflows that must create or update records under a specific user identity.',
    inputSchema: {
      type: "object" as const,
      properties: {
        callerId: {
          type: "string",
          description:
            "GUID (Azure AD Object ID) of the Dataverse system user to impersonate",
        },
        toolName: {
          type: "string",
          description:
            'MCP tool to execute while impersonating (e.g., "dataverse_create")',
        },
        toolArgs: {
          type: "object",
          description: "Arguments for the wrapped tool",
        },
      },
      required: ["callerId", "toolName", "toolArgs"],
    },
  },
];

export async function handleImpersonateTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
  dispatch: DispatchFn,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  if (name !== "dataverse_impersonate") {
    throw new Error(`Unknown impersonate tool: ${name}`);
  }

  const { callerId, toolName, toolArgs } = ImpersonateInput.parse(args);

  // Security guard: prevent privilege escalation via System Administrator impersonation.
  // Best-effort check — if it fails for non-security reasons, log and proceed.
  try {
    const roleCheck = await client.query<{ name: string }>(
      `systemusers(${esc(callerId)})/systemuserroles_association`,
      { select: ["name"], filter: `name eq 'System Administrator'`, top: 1 },
    );
    if ((roleCheck.value?.length ?? 0) > 0) {
      throw new Error(
        "Security policy: impersonation of users with System Administrator role is prohibited to prevent privilege escalation.",
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Security policy"))
      throw err;
    // Fail-closed: any failure verifying roles means we cannot confirm safety — deny impersonation.
    throw new Error(
      `Security policy: cannot verify callerId roles — impersonation denied. Cause: ${String(err)}`,
    );
  }

  // Access the HttpClient defaultHeaders via type cast — the http property is protected
  const http = (client as unknown as { http: HttpDefaultHeaders }).http;
  const prev = http.defaultHeaders["MSCRMCallerId"];

  try {
    http.defaultHeaders["MSCRMCallerId"] = callerId;
    const result = await dispatch(toolName, toolArgs, client);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              impersonatedAs: callerId,
              tool: toolName,
              result: JSON.parse(result.content[0]!.text) as unknown,
            },
            null,
            2,
          ),
        },
      ],
    };
  } finally {
    if (prev === undefined) {
      delete http.defaultHeaders["MSCRMCallerId"];
    } else {
      http.defaultHeaders["MSCRMCallerId"] = prev;
    }
  }
}
