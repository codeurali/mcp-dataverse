import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
import { checkWriteGuardrails } from "./guardrails.js";
const ENV_VAR_TYPE_NAMES = {
    100000000: "String",
    100000001: "Number",
    100000002: "Boolean",
    100000003: "JSON",
    100000004: "DataSource",
};
const ENV_VAR_TYPE_CODES = {
    String: 100000000,
    Integer: 100000001,
    Boolean: 100000002,
    JSON: 100000003,
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
    {
        name: "dataverse_create_environment_variable",
        description: "Creates a new Dataverse environment variable definition and sets its initial value. " +
            "Use this when the variable does not yet exist — use dataverse_set_environment_variable to update an existing one. " +
            "WHEN TO USE: Initial setup of configuration flags, feature toggles, or integration settings. " +
            "BEST PRACTICES: Use a solution-prefixed schemaName (e.g. 'myprefix_MyConfig'); provide solutionUniqueName to register in a solution. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                schemaName: {
                    type: "string",
                    description: "Schema name of the new variable (e.g. 'new_MyConfig'). Case-sensitive.",
                },
                displayName: {
                    type: "string",
                    description: "Human-readable display name",
                },
                type: {
                    type: "string",
                    enum: ["String", "Integer", "Boolean", "JSON"],
                    description: "Variable type",
                },
                value: { type: "string", description: "Initial value to set" },
                description: { type: "string", description: "Optional description" },
                defaultValue: {
                    type: "string",
                    description: "Optional default value (fallback when no override value is set)",
                },
                confirm: {
                    type: "boolean",
                    description: "Must be true — confirms intentional creation of a new environment variable definition",
                },
            },
            required: ["schemaName", "displayName", "type", "value", "confirm"],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
];
const GetEnvVarInput = z.object({ schemaName: z.string().min(1) });
const SetEnvVarInput = z.object({
    schemaName: z.string().min(1),
    value: z.string(),
});
const CreateEnvVarInput = z.object({
    schemaName: z.string().min(1),
    displayName: z.string().min(1),
    type: z.enum(["String", "Integer", "Boolean", "JSON"]),
    value: z.string(),
    description: z.string().optional(),
    defaultValue: z.string().optional(),
    confirm: z.literal(true, {
        errorMap: () => ({
            message: "Set confirm: true to create a new environment variable definition",
        }),
    }),
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
        throw new Error(`Environment variable '${schemaName}' not found. ` +
            `Check the schema name (it is case-sensitive, e.g. 'new_MyConfig'). ` +
            `To browse existing variables: Power Apps maker portal → Solutions → your solution → Environment Variables. ` +
            `To create a new one: open a solution → New → More → Environment Variable.`);
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
        throw new Error(`Environment variable definition '${schemaName}' not found. ` +
            `This tool can only update the value of an existing variable. ` +
            `To create a new environment variable: Power Apps maker portal → Solutions → your solution → New → More → Environment variable. ` +
            `Then call this tool to set its value.`);
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
async function handleCreateEnvironmentVariable(args, client) {
    const { schemaName, displayName, type, value, description, defaultValue } = CreateEnvVarInput.parse(args);
    const writeWarnings = checkWriteGuardrails({
        toolName: "dataverse_create_environment_variable",
    }).map((w) => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`);
    const existing = await client.query("environmentvariabledefinitions", {
        filter: `schemaname eq '${esc(schemaName)}'`,
        select: ["environmentvariabledefinitionid"],
        top: 1,
    });
    if (existing.value.length > 0) {
        throw new Error(`Environment variable '${schemaName}' already exists. ` +
            `Use dataverse_set_environment_variable to update its value.`);
    }
    const typeCode = ENV_VAR_TYPE_CODES[type] ?? 100000000;
    const defBody = {
        schemaname: schemaName,
        displayname: displayName,
        type: typeCode,
    };
    if (description)
        defBody["description"] = description;
    if (defaultValue !== undefined)
        defBody["defaultvalue"] = defaultValue;
    const defId = await client.createRecord("environmentvariabledefinitions", defBody);
    const valId = await client.createRecord("environmentvariablevalues", {
        value,
        "EnvironmentVariableDefinitionId@odata.bind": `/environmentvariabledefinitions(${defId})`,
    });
    return formatData(`Environment variable '${schemaName}' created (type: ${type}, value: '${value}').`, {
        schemaName,
        displayName,
        type,
        typeCode,
        definitionId: defId,
        valueId: valId,
        value,
        ...(writeWarnings.length > 0 && { warnings: writeWarnings }),
    }, [
        "Use dataverse_get_environment_variable to verify",
        "Use dataverse_set_environment_variable to update the value later",
    ]);
}
export async function handleEnvironmentTool(name, args, client) {
    switch (name) {
        case "dataverse_get_environment_variable":
            return handleGetEnvironmentVariable(args, client);
        case "dataverse_set_environment_variable":
            return handleSetEnvironmentVariable(args, client);
        case "dataverse_create_environment_variable":
            return handleCreateEnvironmentVariable(args, client);
        default:
            throw new Error(`Unknown environment tool: ${name}`);
    }
}
//# sourceMappingURL=environment.tools.js.map