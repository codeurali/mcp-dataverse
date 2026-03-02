import { z } from "zod";
// ── Regex ──────────────────────────────────────────────────────────────────────
export const DV_NAME_RE = /^[a-z_][a-z0-9_]*$/;
// ── Supported attribute types ──────────────────────────────────────────────────
export const ATTRIBUTE_TYPES = [
    "String",
    "Memo",
    "Integer",
    "Decimal",
    "Money",
    "DateTime",
    "Boolean",
    "Picklist",
];
export const ODATA_TYPE_MAP = {
    String: "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    Memo: "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
    Integer: "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
    Decimal: "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
    Money: "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
    DateTime: "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
    Boolean: "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
    Picklist: "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
};
// ── Zod Schemas ────────────────────────────────────────────────────────────────
export const CreateAttributeInput = z
    .object({
    entityLogicalName: z.string().min(1).regex(DV_NAME_RE, "Invalid Dataverse logical name"),
    schemaName: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid schema name"),
    attributeType: z.enum(ATTRIBUTE_TYPES),
    displayName: z.string().min(1),
    description: z.string().optional(),
    requiredLevel: z.enum(["None", "ApplicationRequired", "Recommended"]).optional().default("None"),
    maxLength: z.number().int().positive().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    precision: z.number().int().min(0).max(10).optional(),
    dateTimeFormat: z.enum(["DateOnly", "DateAndTime"]).optional().default("DateAndTime"),
    defaultBooleanValue: z.boolean().optional().default(false),
    picklistOptions: z
        .array(z.object({ value: z.number().int(), label: z.string().min(1) }))
        .optional(),
    languageCode: z.number().int().optional().default(1033),
    autoPublish: z.boolean().optional().default(true),
    confirm: z.literal(true, {
        errorMap: () => ({ message: "Set confirm: true to create a column" }),
    }),
})
    .refine((d) => d.attributeType !== "Picklist" || (d.picklistOptions && d.picklistOptions.length > 0), { message: "picklistOptions is required for Picklist type and must have at least one option" });
export const UpdateAttributeInput = z
    .object({
    entityLogicalName: z.string().min(1).regex(DV_NAME_RE, "Invalid Dataverse logical name"),
    attributeLogicalName: z.string().min(1).regex(DV_NAME_RE, "Invalid Dataverse logical name"),
    displayName: z.string().min(1).optional(),
    description: z.string().optional(),
    requiredLevel: z.enum(["None", "ApplicationRequired", "Recommended"]).optional(),
    maxLength: z.number().int().positive().optional(),
    isSearchable: z.boolean().optional(),
    languageCode: z.number().int().optional().default(1033),
    autoPublish: z.boolean().optional().default(true),
    confirm: z.literal(true, {
        errorMap: () => ({ message: "Set confirm: true to update column metadata" }),
    }),
})
    .refine((d) => d.displayName !== undefined ||
    d.description !== undefined ||
    d.requiredLevel !== undefined ||
    d.maxLength !== undefined ||
    d.isSearchable !== undefined, { message: "At least one mutable property (displayName, description, requiredLevel, maxLength, isSearchable) must be provided" });
export const DeleteAttributeInput = z.object({
    entityLogicalName: z.string().min(1).regex(DV_NAME_RE, "Invalid Dataverse logical name"),
    attributeLogicalName: z.string().min(1).regex(DV_NAME_RE, "Invalid Dataverse logical name"),
    autoPublish: z.boolean().optional().default(true),
    confirm: z.literal(true, {
        errorMap: () => ({ message: "Set confirm: true to delete a column — this is irreversible" }),
    }),
});
// ── Helpers ────────────────────────────────────────────────────────────────────
export function lbl(text, languageCode) {
    return {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        LocalizedLabels: [{ Label: text, LanguageCode: languageCode }],
        UserLocalizedLabel: { Label: text, LanguageCode: languageCode },
    };
}
export function buildCreateBody(input) {
    const lang = input.languageCode;
    const body = {
        "@odata.type": ODATA_TYPE_MAP[input.attributeType],
        SchemaName: input.schemaName,
        DisplayName: lbl(input.displayName, lang),
        RequiredLevel: { Value: input.requiredLevel },
    };
    if (input.description) {
        body["Description"] = lbl(input.description, lang);
    }
    switch (input.attributeType) {
        case "String":
            body["MaxLength"] = input.maxLength ?? 100;
            break;
        case "Memo":
            body["MaxLength"] = input.maxLength ?? 4000;
            break;
        case "Integer":
            body["Format"] = "None";
            if (input.minValue !== undefined)
                body["MinValue"] = input.minValue;
            if (input.maxValue !== undefined)
                body["MaxValue"] = input.maxValue;
            break;
        case "Decimal":
            if (input.precision !== undefined)
                body["Precision"] = input.precision;
            if (input.minValue !== undefined)
                body["MinValue"] = input.minValue;
            if (input.maxValue !== undefined)
                body["MaxValue"] = input.maxValue;
            break;
        case "Money":
            body["PrecisionSource"] = input.precision !== undefined ? 0 : 2;
            if (input.precision !== undefined)
                body["Precision"] = input.precision;
            break;
        case "DateTime":
            body["Format"] = input.dateTimeFormat;
            break;
        case "Boolean":
            body["DefaultValue"] = input.defaultBooleanValue;
            body["OptionSet"] = {
                TrueOption: { Value: 1, Label: lbl("Yes", lang) },
                FalseOption: { Value: 0, Label: lbl("No", lang) },
            };
            break;
        case "Picklist":
            body["OptionSet"] = {
                "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
                IsGlobal: false,
                OptionSetType: "Picklist",
                Options: input.picklistOptions.map((o) => ({
                    Value: o.value,
                    Label: lbl(o.label, lang),
                })),
            };
            break;
    }
    return body;
}
//# sourceMappingURL=attribute.helpers.js.map