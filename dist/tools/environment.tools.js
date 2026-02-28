import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const ENV_VAR_TYPE_NAMES = {
    100000000: "String",
    100000001: "Number",
    100000002: "Boolean",
    100000003: "JSON",
    100000004: "DataSource",
};
export const environmentTools = [
    {
        name: "dataverse_get_environment_variable",
        description: "Retrieves an environment variable's definition and current value from Dataverse. Returns the schema name, display name, type, default value, and the current override value (if set). Useful for reading feature flags, configuration values, and integration settings stored in Dataverse environment variables. WHEN TO USE: Reading configuration values, feature flags, or integration settings stored as environment variables. BEST PRACTICES: Check both defaultValue and currentValue; the effective value is currentValue ?? defaultValue. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                schemaName: {
                    type: "string",
                    description: "The schema name of the environment variable (e.g. 'new_MyConfig')",
                },
            },
            required: ["schemaName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_set_environment_variable",
        description: "Sets or updates an environment variable value in Dataverse. If a value record already exists for the variable, it is updated; otherwise a new value record is created. The schemaName must match an existing environment variable definition. WHEN TO USE: Updating configuration values or feature flags stored in Dataverse environment variables. BEST PRACTICES: Verify the variable exists first with dataverse_get_environment_variable; schemaName must match exactly. WORKFLOW: manage_solution.",
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
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
const GetEnvVarInput = z.object({ schemaName: z.string().min(1) });
const SetEnvVarInput = z.object({
    schemaName: z.string().min(1),
    value: z.string(),
});
async function handleGetEnvironmentVariable(args, client) {
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
    const defRecords = defResult.value;
    if (defRecords.length === 0) {
        throw new Error(`Environment variable '${schemaName}' not found`);
    }
    const def = defRecords[0];
    const defId = def["environmentvariabledefinitionid"];
    const valResult = await client.query("environmentvariablevalues", {
        filter: `_environmentvariabledefinitionid_value eq ${defId}`,
        select: ["environmentvariablevalueid", "value"],
        top: 1,
    });
    const valRecords = valResult.value;
    const valRecord = valRecords.length > 0 ? valRecords[0] : null;
    const typeNum = def["type"];
    const currentValue = valRecord
        ? (valRecord["value"] ?? null)
        : null;
    const defaultValue = def["defaultvalue"] ?? null;
    const response = {
        schemaName: def["schemaname"],
        displayName: def["displayname"] ?? "",
        description: def["description"] ?? "",
        type: typeNum,
        typeName: ENV_VAR_TYPE_NAMES[typeNum] ?? "Unknown",
        defaultValue,
        currentValue,
        valueId: valRecord
            ? valRecord["environmentvariablevalueid"]
            : null,
        isRequired: def["isrequired"] ?? false,
        effectiveValue: currentValue ?? defaultValue,
    };
    return formatData(`Environment variable '${response.schemaName}': ${response.typeName} = ${response.effectiveValue ?? "(not set)"}`, response, ["Use dataverse_set_environment_variable to update the value"]);
}
async function handleSetEnvironmentVariable(args, client) {
    const { schemaName, value } = SetEnvVarInput.parse(args);
    const defResult = await client.query("environmentvariabledefinitions", {
        filter: `schemaname eq '${esc(schemaName)}'`,
        select: ["environmentvariabledefinitionid", "schemaname"],
        top: 1,
    });
    const defRecords = defResult.value;
    if (defRecords.length === 0) {
        throw new Error(`Environment variable '${schemaName}' not found`);
    }
    const defId = defRecords[0]["environmentvariabledefinitionid"];
    const valResult = await client.query("environmentvariablevalues", {
        filter: `_environmentvariabledefinitionid_value eq ${defId}`,
        select: ["environmentvariablevalueid", "value"],
        top: 1,
    });
    const valRecords = valResult.value;
    let operation;
    let valueId;
    if (valRecords.length > 0) {
        valueId = valRecords[0]["environmentvariablevalueid"];
        await client.updateRecord("environmentvariablevalues", valueId, { value });
        operation = "updated";
    }
    else {
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
    return formatData(`Environment variable '${schemaName}' set to new value`, response, ["Use dataverse_get_environment_variable to verify the update"]);
}
export async function handleEnvironmentTool(name, args, client) {
    switch (name) {
        case "dataverse_get_environment_variable":
            return handleGetEnvironmentVariable(args, client);
        case "dataverse_set_environment_variable":
            return handleSetEnvironmentVariable(args, client);
        default:
            throw new Error(`Unknown environment tool: ${name}`);
    }
}
//# sourceMappingURL=environment.tools.js.map