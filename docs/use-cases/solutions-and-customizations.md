---
title: Customizations
description: Publish customizations, inspect plugins and custom actions, and manage environment variables and workflow state in Dataverse.
---

# Customizations

Tools for publishing customizations, inspecting plugin steps and custom actions, and managing workflows and environment variables.

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

1. **`dataverse_list_plugin_steps`**: check registered plugins
2. **`dataverse_list_custom_actions`**: discover available actions
3. Make changes to schema or records
4. **`dataverse_publish_customizations`**: publish your changes

---

## Related

- [Inspecting schema](inspecting-schema.md) — explore table metadata
- [Managing records](managing-records.md) — CRUD operations after inspecting customizations
