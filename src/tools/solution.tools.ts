import { z } from 'zod';
import type { DataverseAdvancedClient } from '../dataverse/dataverse-client-advanced.js';

const ListSolutionsInput = z.object({
  includeManaged: z.boolean().optional().default(false),
  nameFilter: z.string().optional(),
  top: z.number().int().min(1).max(200).optional().default(50),
});

const SolutionComponentsInput = z.object({
  solutionName: z.string().min(1).describe('Unique name of the solution (not the display name)'),
  componentType: z
    .number()
    .int()
    .optional()
    .describe(
      'Filter by Dataverse component type code (1=Entity, 29=Workflow, 97=WebResource, 90=PluginAssembly, etc.). Omit for all types.'
    ),
  top: z.number().int().min(1).max(5000).default(200).optional(),
});

const PublishCustomizationsInput = z.object({
  components: z
    .object({
      entities: z.array(z.string()).optional().describe('Entity logical names to publish'),
      webResources: z.array(z.string()).optional().describe('Web resource names to publish'),
      optionSets: z.array(z.string()).optional().describe('Global OptionSet names to publish'),
    })
    .optional()
    .describe(
      'Specific components to publish. If omitted, ALL unpublished customizations are published.'
    ),
});

export const solutionTools = [
  {
    name: 'dataverse_list_solutions',
    description:
      'Lists Dataverse solutions in the environment. By default returns only unmanaged solutions. Set includeManaged=true to include managed (imported) solutions. Use nameFilter to search by unique name.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        includeManaged: {
          type: 'boolean',
          description: 'Include managed (imported) solutions. Default: false',
        },
        nameFilter: {
          type: 'string',
          description: 'Filter solutions by unique name (contains match)',
        },
        top: {
          type: 'number',
          description: 'Maximum number of solutions to return (default 50, max 200)',
        },
      },
      required: [],
    },
  },
  {
    name: 'dataverse_solution_components',
    description:
      'Lists all components in a named Dataverse solution (entities, attributes, workflows, web resources, plugins, etc.). Use the unique solution name (not display name). Optionally filter by component type code (1=Entity, 29=Workflow, 97=WebResource, 90=PluginAssembly).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        solutionName: { type: 'string', description: 'Unique name of the solution' },
        componentType: { type: 'number', description: 'Filter by component type code' },
        top: { type: 'number', description: 'Max results (default 200, max 5000)' },
      },
      required: ['solutionName'],
    },
  },
  {
    name: 'dataverse_publish_customizations',
    description:
      'Publishes unpublished Dataverse customizations. Without parameters, publishes ALL pending customizations (equivalent to clicking "Publish All" in Power Apps maker portal). Optionally specify entities, webResources, or optionSets to publish only those components. WARNING: Publishing all can take 30-120 seconds in large environments.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        components: {
          type: 'object',
          description: 'Specific components. Omit to publish all.',
          properties: {
            entities: { type: 'array', items: { type: 'string' } },
            webResources: { type: 'array', items: { type: 'string' } },
            optionSets: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: [],
    },
  },
];

export async function handleSolutionTool(
  name: string,
  args: unknown,
  client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'dataverse_list_solutions': {
      const params = ListSolutionsInput.parse(args ?? {});

      const filterParts: string[] = ['isvisible eq true'];
      if (!params.includeManaged) {
        filterParts.push('ismanaged eq false');
      }
      if (params.nameFilter) {
        filterParts.push(
          `contains(uniquename,'${params.nameFilter.replace(/'/g, "''")}')`,
        );
      }

      const result = await client.query<Record<string, unknown>>('solutions', {
        select: ['solutionid', 'uniquename', 'friendlyname', 'version', 'ismanaged', 'installedon'],
        filter: filterParts.join(' and '),
        expand: 'publisherid($select=friendlyname)',
        orderby: 'friendlyname asc',
        top: params.top,
      });

      const solutions = (result.value ?? []).map(s => ({
        solutionId: s['solutionid'],
        uniqueName: s['uniquename'],
        friendlyName: s['friendlyname'],
        version: s['version'],
        isManaged: s['ismanaged'],
        installedOn: s['installedon'],
        publisher: (s['publisherid'] as Record<string, unknown> | null)?.['friendlyname'] ?? null,
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ solutions, count: solutions.length }, null, 2),
        }],
      };
    }
    case 'dataverse_solution_components': {
      const { solutionName, componentType, top = 200 } = SolutionComponentsInput.parse(args);
      const result = await client.getSolutionComponents(solutionName, componentType, top);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'dataverse_publish_customizations': {
      const { components } = PublishCustomizationsInput.parse(args ?? {});
      const result = await client.publishCustomizations(components);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown solution tool: ${name}`);
  }
}
