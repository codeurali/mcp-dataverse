import { DataverseActionsClient } from "./dataverse-client.actions.js";
import { esc } from "./dataverse-client.utils.js";
/**
 * Extends DataverseActionsClient with dependency and option-set query methods.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export class DataverseMetadataClient extends DataverseActionsClient {
    // ─── Dependencies & Option Sets ─────────────────────────────────────────
    async listDependencies(componentType, objectId) {
        return this.requestWithRetry(() => this.http
            .get(`RetrieveDependenciesForDelete(ComponentType=${componentType},ObjectId=${objectId})`)
            .then((r) => r.data.value));
    }
    async listTableDependencies(tableName, types) {
        const CATEGORY_MAP = {
            0: "Workflow",
            1: "Dialog",
            2: "BusinessRule",
            3: "Action",
            4: "BusinessProcessFlow",
            5: "Flow",
        };
        const STATE_MAP = {
            0: "Draft",
            1: "Active",
            2: "Inactive",
        };
        const response = await this.requestWithRetry(() => this.http
            .get(`workflows?$filter=primaryentity eq '${esc(tableName)}' and statecode ne 2` + `&$select=name,workflowid,statecode,category,triggeroncreate,triggerondelete,triggeronupdateattributelist`)
            .then((r) => r.data));
        const all = response.value.map((w) => {
            const events = [];
            if (w.triggeroncreate)
                events.push("Create");
            if (w.triggerondelete)
                events.push("Delete");
            if (w.triggeronupdateattributelist)
                events.push("Update");
            return {
                componentType: CATEGORY_MAP[w.category] ?? `Category${w.category}`,
                name: w.name,
                id: w.workflowid,
                state: STATE_MAP[w.statecode] ?? `State${w.statecode}`,
                triggerEvent: events.length ? events.join(",") : null,
                solutionName: null,
            };
        });
        const dependencies = types?.length
            ? all.filter((d) => types.includes(d.componentType))
            : all;
        const hasPluginOrCustomApi = types?.some((t) => t === "Plugin" || t === "CustomAPI");
        const warning = hasPluginOrCustomApi
            ? "Plugin and CustomAPI types require additional SDK message queries and are not yet implemented. Results show Workflow/BusinessRule/Flow/Action dependencies only."
            : null;
        return {
            tableName,
            dependencies,
            count: dependencies.length,
            warning,
        };
    }
    async listGlobalOptionSets() {
        return this.requestWithRetry(() => this.http
            .get("GlobalOptionSetDefinitions")
            .then((r) => r.data.value));
    }
    async getOptionSet(name) {
        return this.requestWithRetry(() => this.http
            .get(`GlobalOptionSetDefinitions(Name='${esc(name)}')`)
            .then((r) => r.data));
    }
    async getAttributeOptionSet(entityLogicalName, attributeLogicalName) {
        const metadataTypes = [
            "PicklistAttributeMetadata",
            "StatusAttributeMetadata",
            "StateAttributeMetadata",
        ];
        for (const typeName of metadataTypes) {
            try {
                const url = `EntityDefinitions(LogicalName='${esc(entityLogicalName)}')/` +
                    `Attributes(LogicalName='${esc(attributeLogicalName)}')/` +
                    `Microsoft.Dynamics.CRM.${typeName}?$select=LogicalName,DisplayName&$expand=OptionSet`;
                const response = await this.requestWithRetry(() => this.http.get(url).then((r) => r.data));
                const optionSet = response["OptionSet"];
                const rawOptions = optionSet?.["Options"] ?? [];
                const options = rawOptions.map((o) => {
                    const lblObj = o["Label"];
                    const locLabel = lblObj?.["UserLocalizedLabel"];
                    return {
                        label: locLabel?.["Label"] ?? "",
                        value: o["Value"],
                    };
                });
                return {
                    entityLogicalName,
                    attributeLogicalName,
                    attributeType: typeName.replace("AttributeMetadata", ""),
                    options,
                };
            }
            catch {
                continue;
            }
        }
        throw new Error(`Attribute '${attributeLogicalName}' on entity '${entityLogicalName}' is not a Picklist, Status, or State attribute, or does not exist.`);
    }
    async getEntityKeys(tableName) {
        return this.requestWithRetry(async () => {
            const response = await this.http.get(`EntityDefinitions(LogicalName='${esc(tableName)}')/Keys?$select=SchemaName,LogicalName,KeyAttributes,IsCustomizable,EntityKeyIndexStatus`);
            return response.data.value.map((k) => ({
                schemaName: k["SchemaName"],
                logicalName: k["LogicalName"],
                keyAttributes: k["KeyAttributes"],
                isCustomizable: k["IsCustomizable"]?.Value ??
                    false,
                indexStatus: k["EntityKeyIndexStatus"],
            }));
        });
    }
}
//# sourceMappingURL=dataverse-client.metadata.js.map