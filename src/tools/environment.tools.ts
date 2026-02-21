import { z } from "zod";
import type { DataverseAdvancedClient } from "../dataverse/dataverse-client-advanced.js";
import { esc } from "../dataverse/dataverse-client.utils.js";

const ENV_VAR_TYPE_NAMES: Record<number, string> = {
  100000000: "String",
  100000001: "Number",
  100000002: "Boolean",
  100000003: "JSON",
  100000004: "DataSource",
};

export const environmentTools = [
  {
    name: "dataverse_get_environment_variable",
    description:
      "Retrieves an environment variable's definition and current value from Dataverse. Returns the schema name, display name, type, default value, and the current override value (if set). Useful for reading feature flags, configuration values, and integration settings stored in Dataverse environment variables.",
    inputSchema: {
      type: "object",
      properties: {
        schemaName: {
          type: "string",
          description:
            "The schema name of the environment variable (e.g. 'new_MyConfig')",
        },
      },
      required: ["schemaName"],
    },
  },
  {
    name: "dataverse_set_environment_variable",
    description:
      "Sets or updates an environment variable value in Dataverse. If a value record already exists for the variable, it is updated; otherwise a new value record is created. The schemaName must match an existing environment variable definition.",
    inputSchema: {
      type: "object",
      properties: {
        schemaName: {
          type: "string",
          description: "The schema name of the environment variable",
        },
        value: {
          type: "string",
          description: "The new value to set",
        },
      },
      required: ["schemaName", "value"],
    },
  },
];

const GetEnvVarInput = z.object({ schemaName: z.string().min(1) });
const SetEnvVarInput = z.object({
  schemaName: z.string().min(1),
  value: z.string(),
});

async function handleGetEnvironmentVariable(
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { schemaName } = GetEnvVarInput.parse(args);

  const defResult = await client.query("environmentvariabledefinitions", {
    filter: `schemaname eq '${esc(schemaName)}'`,
    select: [
      "environmentvariabledefinitionid",
      "schemaname",
      "displayname",
      "description",
      "type",
      "defaultvalue",
      "isrequired",
    ],
    top: 1,
  });

  const defRecords = defResult.value as Array<Record<string, unknown>>;
  if (defRecords.length === 0) {
    throw new Error(`Environment variable '${schemaName}' not found`);
  }

  const def = defRecords[0]!;
  const defId = def["environmentvariabledefinitionid"] as string;

  const valResult = await client.query("environmentvariablevalues", {
    filter: `_environmentvariabledefinitionid_value eq ${defId}`,
    select: ["environmentvariablevalueid", "value"],
    top: 1,
  });

  const valRecords = valResult.value as Array<Record<string, unknown>>;
  const valRecord = valRecords.length > 0 ? valRecords[0]! : null;

  const typeNum = def["type"] as number;
  const currentValue = valRecord
    ? ((valRecord["value"] as string) ?? null)
    : null;
  const defaultValue = (def["defaultvalue"] as string) ?? null;

  const response = {
    schemaName: def["schemaname"] as string,
    displayName: (def["displayname"] as string) ?? "",
    description: (def["description"] as string) ?? "",
    type: typeNum,
    typeName: ENV_VAR_TYPE_NAMES[typeNum] ?? "Unknown",
    defaultValue,
    currentValue,
    valueId: valRecord
      ? (valRecord["environmentvariablevalueid"] as string)
      : null,
    isRequired: (def["isrequired"] as boolean) ?? false,
    effectiveValue: currentValue ?? defaultValue,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
  };
}

async function handleSetEnvironmentVariable(
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const { schemaName, value } = SetEnvVarInput.parse(args);

  const defResult = await client.query("environmentvariabledefinitions", {
    filter: `schemaname eq '${esc(schemaName)}'`,
    select: ["environmentvariabledefinitionid", "schemaname"],
    top: 1,
  });

  const defRecords = defResult.value as Array<Record<string, unknown>>;
  if (defRecords.length === 0) {
    throw new Error(`Environment variable '${schemaName}' not found`);
  }

  const defId = defRecords[0]!["environmentvariabledefinitionid"] as string;

  const valResult = await client.query("environmentvariablevalues", {
    filter: `_environmentvariabledefinitionid_value eq ${defId}`,
    select: ["environmentvariablevalueid", "value"],
    top: 1,
  });

  const valRecords = valResult.value as Array<Record<string, unknown>>;
  let operation: "created" | "updated";
  let valueId: string;

  if (valRecords.length > 0) {
    valueId = valRecords[0]!["environmentvariablevalueid"] as string;
    await client.updateRecord("environmentvariablevalues", valueId, { value });
    operation = "updated";
  } else {
    valueId = await client.createRecord("environmentvariablevalues", {
      value,
      "EnvironmentVariableDefinitionId@odata.bind": `/environmentvariabledefinitions(${defId})`,
    });
    operation = "created";
  }

  const response = {
    schemaName,
    operation,
    valueId,
    value,
  };

  return {
    content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
  };
}

export async function handleEnvironmentTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "dataverse_get_environment_variable":
      return handleGetEnvironmentVariable(args, client);
    case "dataverse_set_environment_variable":
      return handleSetEnvironmentVariable(args, client);
    default:
      throw new Error(`Unknown environment tool: ${name}`);
  }
}
