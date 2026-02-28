import { z } from "zod";
/** Matches valid OData entity set names and Dataverse schema identifiers. */
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
/** Zod string schema for entity set names — blocks path traversal and injection. */
export const safeEntitySetName = z
    .string()
    .min(1)
    .regex(SAFE_IDENTIFIER, "entitySetName must contain only letters, digits, or underscores");
/** Zod string schema for relationship names — blocks path traversal and injection. */
export const safeRelationshipName = z
    .string()
    .min(1)
    .regex(SAFE_IDENTIFIER, "relationshipName must contain only letters, digits, or underscores");
//# sourceMappingURL=validation.utils.js.map