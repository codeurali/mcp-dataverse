import { DataverseClient } from './dataverse-client.js';
import type { ODataResponse } from './types.js';
import { esc } from './dataverse-client.utils.js';

/**
 * Extends DataverseClient with dependency and option-set query methods.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export class DataverseMetadataClient extends DataverseClient {
  // ─── Dependencies & Option Sets ─────────────────────────────────────────

  async listDependencies(
    componentType: number,
    objectId: string
  ): Promise<unknown[]> {
    return this.requestWithRetry(() =>
      this.http
        .get<ODataResponse<unknown>>(
          `RetrieveDependenciesForDelete(ComponentType=${componentType},ObjectId=${objectId})`
        )
        .then(r => r.data.value)
    );
  }

  async listTableDependencies(
    tableName: string,
    types?: string[]
  ): Promise<{
    tableName: string;
    dependencies: Array<{
      componentType: string;
      name: string;
      id: string;
      state: string;
      triggerEvent: string | null;
      solutionName: string | null;
    }>;
    count: number;
    warning: string | null;
  }> {
    const CATEGORY_MAP: Record<number, string> = {
      0: 'Workflow',
      1: 'Dialog',
      2: 'BusinessRule',
      3: 'Action',
      4: 'BusinessProcessFlow',
      5: 'Flow',
    };
    const STATE_MAP: Record<number, string> = {
      0: 'Draft',
      1: 'Active',
      2: 'Inactive',
    };

    interface WorkflowRecord {
      workflowid: string;
      name: string;
      statecode: number;
      category: number;
      triggeroncreate: boolean;
      triggerondelete: boolean;
      triggeronupdateattributelist: string | null;
    }

    const response = await this.requestWithRetry(() =>
      this.http
        .get<ODataResponse<WorkflowRecord>>(
          `workflows?$filter=primaryentity eq '${esc(tableName)}' and statecode ne 2` +
          `&$select=name,workflowid,statecode,category,triggeroncreate,triggerondelete,triggeronupdateattributelist`
        )
        .then(r => r.data)
    );

    const all = response.value.map((w) => {
      const events: string[] = [];
      if (w.triggeroncreate) events.push('Create');
      if (w.triggerondelete) events.push('Delete');
      if (w.triggeronupdateattributelist) events.push('Update');
      return {
        componentType: CATEGORY_MAP[w.category] ?? `Category${w.category}`,
        name: w.name,
        id: w.workflowid,
        state: STATE_MAP[w.statecode] ?? `State${w.statecode}`,
        triggerEvent: events.length ? events.join(',') : null,
        solutionName: null as string | null,
      };
    });

    const dependencies = types?.length
      ? all.filter(d => types.includes(d.componentType))
      : all;

    const hasPluginOrCustomApi = types?.some(t => t === 'Plugin' || t === 'CustomAPI');
    const warning = hasPluginOrCustomApi
      ? 'Plugin and CustomAPI types require additional SDK message queries and are not yet implemented. Results show Workflow/BusinessRule/Flow/Action dependencies only.'
      : null;
    return {
      tableName,
      dependencies,
      count: dependencies.length,
      warning,
    };
  }

  async listGlobalOptionSets(): Promise<unknown[]> {
    return this.requestWithRetry(() =>
      this.http
        .get<ODataResponse<unknown>>('GlobalOptionSetDefinitions')
        .then(r => r.data.value)
    );
  }

  async getOptionSet(name: string): Promise<unknown> {
    return this.requestWithRetry(() =>
      this.http
        .get(`GlobalOptionSetDefinitions(Name='${esc(name)}')`)
        .then(r => r.data)
    );
  }

  async getAttributeOptionSet(
    entityLogicalName: string,
    attributeLogicalName: string,
  ): Promise<{
    entityLogicalName: string;
    attributeLogicalName: string;
    attributeType: string;
    options: Array<{ label: string; value: number }>;
  }> {
    const metadataTypes = [
      'PicklistAttributeMetadata',
      'StatusAttributeMetadata',
      'StateAttributeMetadata',
    ];

    for (const typeName of metadataTypes) {
      try {
        const url =
          `EntityDefinitions(LogicalName='${esc(entityLogicalName)}')/` +
          `Attributes(LogicalName='${esc(attributeLogicalName)}')/` +
          `Microsoft.Dynamics.CRM.${typeName}?$select=LogicalName,DisplayName&$expand=OptionSet`;
        const response = await this.requestWithRetry(() =>
          this.http.get<Record<string, unknown>>(url).then(r => r.data),
        );
        const optionSet = response['OptionSet'] as Record<string, unknown> | undefined;
        const rawOptions = (optionSet?.['Options'] as Array<Record<string, unknown>>) ?? [];
        const options = rawOptions.map(o => {
          const lblObj = o['Label'] as Record<string, unknown> | undefined;
          const locLabel = lblObj?.['UserLocalizedLabel'] as Record<string, unknown> | undefined;
          return {
            label: (locLabel?.['Label'] as string) ?? '',
            value: o['Value'] as number,
          };
        });
        return {
          entityLogicalName,
          attributeLogicalName,
          attributeType: typeName.replace('AttributeMetadata', ''),
          options,
        };
      } catch {
        continue;
      }
    }

    throw new Error(
      `Attribute '${attributeLogicalName}' on entity '${entityLogicalName}' is not a Picklist, Status, or State attribute, or does not exist.`,
    );
  }

  async getEntityKeys(tableName: string): Promise<Array<{
    schemaName: string;
    logicalName: string;
    keyAttributes: string[];
    isCustomizable: boolean;
    indexStatus: string;
  }>> {
    return this.requestWithRetry(async () => {
      const response = await this.http.get<{ value: Array<Record<string, unknown>> }>(
        `EntityDefinitions(LogicalName='${esc(tableName)}')/Keys?$select=SchemaName,LogicalName,KeyAttributes,IsCustomizable,EntityKeyIndexStatus`
      );
      return response.data.value.map(k => ({
        schemaName: k['SchemaName'] as string,
        logicalName: k['LogicalName'] as string,
        keyAttributes: k['KeyAttributes'] as string[],
        isCustomizable: (k['IsCustomizable'] as { Value: boolean } | undefined)?.Value ?? false,
        indexStatus: k['EntityKeyIndexStatus'] as string,
      }));
    });
  }
}
