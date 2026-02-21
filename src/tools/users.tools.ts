import { z } from 'zod';
import type { DataverseAdvancedClient } from '../dataverse/dataverse-client-advanced.js';
import { esc } from '../dataverse/dataverse-client.utils.js';

const GetUserRolesInput = z.object({
    userId: z.string().uuid(),
});

const ListUsersInput = z.object({
    search: z.string().optional(),
    businessUnitId: z.string().optional(),
    includeDisabled: z.boolean().optional().default(false),
    includeApplicationUsers: z.boolean().optional().default(false),
    top: z.number().int().positive().max(100).optional().default(20),
}).refine(
    data => data.search || data.businessUnitId,
    { message: 'At least one of search or businessUnitId is required' }
);

export const userTools = [
    {
        name: 'dataverse_get_user_roles',
        description:
            'Returns all security roles assigned to a Dataverse system user. Provide the user GUID to retrieve full name, domain name (UPN), and the list of roles with role ID, name, and managed status.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                userId: {
                    type: 'string',
                    description: 'The system user GUID',
                },
            },
            required: ['userId'],
        },
    },
    {
        name: 'dataverse_list_users',
        description:
            'Searches Dataverse system users by name or email. Returns user ID, full name, domain name (UPN), email, business unit, and disabled status. Excludes application users and disabled users by default.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                search: {
                    type: 'string',
                    description: 'Full-name or email contains-search',
                },
                businessUnitId: {
                    type: 'string',
                    description: 'Restrict to a business unit (GUID)',
                },
                includeDisabled: {
                    type: 'boolean',
                    description: 'Include disabled users (default false)',
                },
                includeApplicationUsers: {
                    type: 'boolean',
                    description: 'Include application/service users (default false)',
                },
                top: {
                    type: 'number',
                    description: 'Maximum number of results (default 20, max 100)',
                },
            },
        },
    },
];

export async function handleUserTool(
    name: string,
    args: unknown,
    client: DataverseAdvancedClient
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    switch (name) {
        case 'dataverse_get_user_roles': {
            const { userId } = GetUserRolesInput.parse(args);

            const response = await client.query<Record<string, unknown>>('systemusers', {
                filter: `systemuserid eq ${userId}`,
                select: ['fullname', 'domainname'],
                expand: 'systemuserroles_association($select=name,roleid,ismanaged)',
                top: 1,
            });

            const rows = (response.value ?? []) as Array<Record<string, unknown>>;
            if (rows.length === 0) {
                throw new Error(`User with ID '${userId}' not found`);
            }

            const user = rows[0]!;
            const rawRoles = (user['systemuserroles_association'] ?? []) as Array<Record<string, unknown>>;
            const roles = rawRoles.map(r => ({
                roleId: r['roleid'] ?? '',
                name: r['name'] ?? '',
                isManaged: r['ismanaged'] === true,
            }));

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            userId,
                            fullname: user['fullname'] ?? '',
                            domainname: user['domainname'] ?? '',
                            roles,
                            roleCount: roles.length,
                        }, null, 2),
                    },
                ],
            };
        }

        case 'dataverse_list_users': {
            const params = ListUsersInput.parse(args);

            const filterParts: string[] = [];

            if (!params.includeDisabled) {
                filterParts.push('isdisabled eq false');
            }

            if (!params.includeApplicationUsers) {
                filterParts.push('applicationid eq null');
            }

            if (params.search) {
                const escaped = esc(params.search);
                filterParts.push(
                    `(contains(fullname,'${escaped}') or contains(internalemailaddress,'${escaped}'))`
                );
            }

            if (params.businessUnitId) {
                filterParts.push(`_businessunitid_value eq ${params.businessUnitId}`);
            }

            const response = await client.query<Record<string, unknown>>('systemusers', {
                select: [
                    'systemuserid',
                    'fullname',
                    'domainname',
                    'internalemailaddress',
                    'applicationid',
                    'isdisabled',
                ],
                filter: filterParts.join(' and '),
                expand: 'businessunitid($select=name)',
                orderby: 'fullname asc',
                top: params.top,
            });

            const rows = (response.value ?? []) as Array<Record<string, unknown>>;

            const users = rows.map(row => ({
                id: row['systemuserid'] ?? '',
                fullName: row['fullname'] ?? '',
                domainName: row['domainname'] ?? '',
                email: row['internalemailaddress'] ?? '',
                businessUnit:
                    (row['businessunitid'] as Record<string, unknown> | null)?.['name'] ?? null,
                isDisabled: row['isdisabled'] === true,
                isApplicationUser: row['applicationid'] != null,
            }));

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ users, count: users.length }, null, 2),
                    },
                ],
            };
        }

        default:
            throw new Error(`Unknown user tool: ${name}`);
    }
}
