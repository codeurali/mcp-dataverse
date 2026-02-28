import { z } from "zod";
import { esc } from "../dataverse/dataverse-client.utils.js";
import { formatData } from "./output.utils.js";
const ListSolutionsInput = z.object({
    includeManaged: z.boolean().optional().default(false),
    nameFilter: z.string().optional(),
    top: z.number().int().min(1).max(200).optional().default(50),
});
const SolutionComponentsInput = z.object({
    solutionName: z
        .string()
        .min(1)
        .describe("Unique name of the solution (not the display name)"),
    componentType: z
        .number()
        .int()
        .optional()
        .describe("Filter by Dataverse component type code (1=Entity, 29=Workflow, 97=WebResource, 90=PluginAssembly, etc.). Omit for all types."),
    top: z.number().int().min(1).max(5000).default(200).optional(),
});
const PublishCustomizationsInput = z.object({
    components: z
        .object({
        entities: z
            .array(z.string())
            .optional()
            .describe("Entity logical names to publish"),
        webResources: z
            .array(z.string())
            .optional()
            .describe("Web resource names to publish"),
        optionSets: z
            .array(z.string())
            .optional()
            .describe("Global OptionSet names to publish"),
    })
        .optional()
        .describe("Specific components to publish. If omitted, ALL unpublished customizations are published."),
});
export const solutionTools = [
    {
        name: "dataverse_list_solutions",
        description: "Lists Dataverse solutions in the environment. By default returns only unmanaged solutions. Set includeManaged=true to include managed (imported) solutions. Use nameFilter to search by unique name. WHEN TO USE: Discovering solutions in the environment for inspection or management. BEST PRACTICES: Use nameFilter for targeted lookup; check version and publisher for managed solutions. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                includeManaged: {
                    type: "boolean",
                    description: "Include managed (imported) solutions. Default: false",
                },
                nameFilter: {
                    type: "string",
                    description: "Filter solutions by unique name (contains match)",
                },
                top: {
                    type: "number",
                    description: "Maximum number of solutions to return (default 50, max 200)",
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
    {
        name: "dataverse_solution_components",
        description: "Lists all components in a named Dataverse solution (entities, attributes, workflows, web resources, plugins, etc.). Use the unique solution name (not display name). Optionally filter by component type code (1=Entity, 29=Workflow, 97=WebResource, 90=PluginAssembly). WHEN TO USE: Inspecting which entities, workflows, or web resources belong to a specific solution. BEST PRACTICES: Filter by componentType code to reduce noise; use unique name, not display name. WORKFLOW: manage_solution.",
        inputSchema: {
            type: "object",
            properties: {
                solutionName: {
                    type: "string",
                    description: "Unique name of the solution",
                },
                componentType: {
                    type: "number",
                    description: "Filter by component type code",
                },
                top: {
                    type: "number",
                    description: "Max results (default 200, max 5000)",
                },
            },
            required: ["solutionName"],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    {
        name: "dataverse_publish_customizations",
        description: 'Publishes unpublished Dataverse customizations. Without parameters, publishes ALL pending customizations (equivalent to clicking "Publish All" in Power Apps maker portal). Optionally specify entities, webResources, or optionSets to publish only those components. WARNING: Publishing all can take 30-120 seconds in large environments. WHEN TO USE: After making schema or UI changes that need to be visible to users. BEST PRACTICES: Publish specific entities when possible to reduce duration; full publish can take 30-120s. WORKFLOW: manage_solution.',
        inputSchema: {
            type: "object",
            properties: {
                components: {
                    type: "object",
                    description: "Specific components. Omit to publish all.",
                    properties: {
                        entities: { type: "array", items: { type: "string" } },
                        webResources: { type: "array", items: { type: "string" } },
                        optionSets: { type: "array", items: { type: "string" } },
                    },
                },
            },
            required: [],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
];
export async function handleSolutionTool(name, args, client) {
    switch (name) {
        case "dataverse_list_solutions": {
            const params = ListSolutionsInput.parse(args ?? {});
            const filterParts = ["isvisible eq true"];
            if (!params.includeManaged) {
                filterParts.push("ismanaged eq false");
            }
            if (params.nameFilter) {
                filterParts.push(`contains(uniquename,'${esc(params.nameFilter)}')`);
            }
            const result = await client.query("solutions", {
                select: [
                    "solutionid",
                    "uniquename",
                    "friendlyname",
                    "version",
                    "ismanaged",
                    "installedon",
                ],
                filter: filterParts.join(" and "),
                expand: "publisherid($select=friendlyname)",
                orderby: "friendlyname asc",
                top: params.top,
            });
            const solutions = (result.value ?? []).map((s) => ({
                solutionId: s["solutionid"],
                uniqueName: s["uniquename"],
                friendlyName: s["friendlyname"],
                version: s["version"],
                isManaged: s["ismanaged"],
                installedOn: s["installedon"],
                publisher: s["publisherid"]?.["friendlyname"] ?? null,
            }));
            return formatData(`${solutions.length} solutions found`, { solutions, count: solutions.length }, [
                "Use dataverse_get_solution_components to inspect a specific solution",
            ]);
        }
        case "dataverse_solution_components": {
            const { solutionName, componentType, top = 200, } = SolutionComponentsInput.parse(args);
            const result = await client.getSolutionComponents(solutionName, componentType, top);
            const components = Array.isArray(result)
                ? result
                : (result.value ?? [result]);
            return formatData(`${components.length} components in solution '${solutionName}'`, result, ["Filter by componentType for specific component kinds"]);
        }
        case "dataverse_publish_customizations": {
            const { components } = PublishCustomizationsInput.parse(args ?? {});
            const result = await client.publishCustomizations(components);
            return formatData("Customizations published successfully", result, [
                "Changes are now visible to all users in the environment",
            ]);
        }
        default:
            throw new Error(`Unknown solution tool: ${name}`);
    }
}
//# sourceMappingURL=solution.tools.js.map