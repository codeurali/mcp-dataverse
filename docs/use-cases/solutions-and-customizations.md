# Solutions & Customizations

Tools for inspecting Dataverse solutions, publishing customizations, managing plugins, workflows, and environment variables.

## Listing Solutions — `dataverse_list_solutions`

Lists solutions in the environment. By default, only unmanaged solutions are returned.

### Example: List unmanaged solutions

```json
{}
```

### Example: Include managed solutions, filtered by name

```json
{
  "includeManaged": true,
  "nameFilter": "contoso",
  "top": 20
}
```

**Response:**

```json
{
  "summary": "5 solutions found",
  "data": [
    {
      "uniquename": "ContosoCore",
      "friendlyname": "Contoso Core",
      "version": "1.2.0.3",
      "ismanaged": false
    }
  ],
  "suggestions": []
}
```

Annotations: `readOnlyHint: true`.

---

## Solution Components — `dataverse_solution_components`

Lists all components within a named solution (entities, workflows, web resources, plugins, etc.).

### Example: All components in a solution

```json
{
  "solutionName": "ContosoCore"
}
```

### Example: Only workflows (component type 29)

```json
{
  "solutionName": "ContosoCore",
  "componentType": 29,
  "top": 500
}
```

**Common component type codes:**

| Code | Type            |
| ---- | --------------- |
| 1    | Entity (Table)  |
| 29   | Workflow        |
| 90   | Plugin Assembly |
| 91   | Plugin Step     |
| 97   | Web Resource    |

---

## Publishing Customizations — `dataverse_publish_customizations`

Publishes unpublished customizations — equivalent to clicking **Publish All** in the Power Apps maker portal.

### Publish all pending customizations

```json
{}
```

### Publish specific components only

```json
{
  "components": {
    "entities": ["account", "contact"],
    "webResources": ["new_/scripts/main.js"],
    "optionSets": ["new_projectstatus"]
  }
}
```

> **Warning**: Publishing all customizations can take 30–120 seconds in large environments.

Annotations: `readOnlyHint: false`, `destructiveHint: false`.

---

## Custom Actions — `dataverse_list_custom_actions`

Lists all custom actions (Custom API / SDK messages) registered in the environment.

```json
{
  "top": 50,
  "nameFilter": "contoso"
}
```

Returns: message name, category, bound entity (if any), execute privilege, and customizability.

Annotations: `readOnlyHint: true`.

---

## Plugin Steps — `dataverse_list_plugin_steps`

Lists plugin step registrations, showing what custom logic fires on Dataverse operations.

### Example: All active plugin steps for the account table

```json
{
  "entityLogicalName": "account",
  "activeOnly": true,
  "top": 100
}
```

**Response includes:**

| Field           | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| Plugin assembly | The DLL containing the logic                                 |
| Message         | Create, Update, Delete, etc.                                 |
| Stage           | Pre-validation (10), Pre-operation (20), Post-operation (40) |
| Mode            | Synchronous (0) or Asynchronous (1)                          |
| State           | Enabled or Disabled                                          |

---

## Environment Variables

### Get a variable — `dataverse_get_environment_variable`

```json
{
  "schemaName": "new_ApiEndpoint"
}
```

**Response:**

```json
{
  "summary": "Environment variable new_ApiEndpoint",
  "data": {
    "schemaName": "new_ApiEndpoint",
    "displayName": "API Endpoint",
    "type": "String",
    "defaultValue": "https://api.example.com",
    "currentValue": "https://api-prod.example.com"
  },
  "suggestions": []
}
```

### Set a variable — `dataverse_set_environment_variable`

```json
{
  "schemaName": "new_ApiEndpoint",
  "value": "https://api-staging.example.com"
}
```

If a value record exists, it is updated. Otherwise, a new value record is created.

Annotations: `idempotentHint: true`.

---

## Workflow State Management — `dataverse_set_workflow_state`

Activate or deactivate a classic workflow, real-time workflow, or action.

### Activate a workflow

```json
{
  "workflowId": "abc12345-0000-0000-0000-000000000001",
  "activate": true
}
```

### Deactivate a workflow

```json
{
  "workflowId": "abc12345-0000-0000-0000-000000000001",
  "activate": false
}
```

---

## Typical Workflow

1. **`dataverse_list_solutions`** — find your solution
2. **`dataverse_solution_components`** — list what's in it
3. **`dataverse_list_plugin_steps`** — check registered plugins
4. **`dataverse_list_custom_actions`** — discover available actions
5. Make changes to schema or records
6. **`dataverse_publish_customizations`** — publish your changes

---

## Related

- [Inspecting schema](inspecting-schema.md) — explore table metadata
- [Managing records](managing-records.md) — CRUD operations after inspecting solutions
