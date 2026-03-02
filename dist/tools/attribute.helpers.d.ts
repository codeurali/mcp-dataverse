import { z } from "zod";
export declare const DV_NAME_RE: RegExp;
export declare const ATTRIBUTE_TYPES: readonly ["String", "Memo", "Integer", "Decimal", "Money", "DateTime", "Boolean", "Picklist"];
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];
export declare const ODATA_TYPE_MAP: Record<AttributeType, string>;
export declare const CreateAttributeInput: z.ZodEffects<z.ZodObject<{
    entityLogicalName: z.ZodString;
    schemaName: z.ZodString;
    attributeType: z.ZodEnum<["String", "Memo", "Integer", "Decimal", "Money", "DateTime", "Boolean", "Picklist"]>;
    displayName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    requiredLevel: z.ZodDefault<z.ZodOptional<z.ZodEnum<["None", "ApplicationRequired", "Recommended"]>>>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    minValue: z.ZodOptional<z.ZodNumber>;
    maxValue: z.ZodOptional<z.ZodNumber>;
    precision: z.ZodOptional<z.ZodNumber>;
    dateTimeFormat: z.ZodDefault<z.ZodOptional<z.ZodEnum<["DateOnly", "DateAndTime"]>>>;
    defaultBooleanValue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    picklistOptions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodNumber;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: number;
        label: string;
    }, {
        value: number;
        label: string;
    }>, "many">>;
    languageCode: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    autoPublish: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    confirm: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    entityLogicalName: string;
    attributeType: "String" | "Boolean" | "Integer" | "Memo" | "Decimal" | "Money" | "DateTime" | "Picklist";
    confirm: true;
    autoPublish: boolean;
    schemaName: string;
    displayName: string;
    requiredLevel: "None" | "ApplicationRequired" | "Recommended";
    dateTimeFormat: "DateOnly" | "DateAndTime";
    defaultBooleanValue: boolean;
    languageCode: number;
    description?: string | undefined;
    maxLength?: number | undefined;
    minValue?: number | undefined;
    maxValue?: number | undefined;
    precision?: number | undefined;
    picklistOptions?: {
        value: number;
        label: string;
    }[] | undefined;
}, {
    entityLogicalName: string;
    attributeType: "String" | "Boolean" | "Integer" | "Memo" | "Decimal" | "Money" | "DateTime" | "Picklist";
    confirm: true;
    schemaName: string;
    displayName: string;
    description?: string | undefined;
    autoPublish?: boolean | undefined;
    requiredLevel?: "None" | "ApplicationRequired" | "Recommended" | undefined;
    maxLength?: number | undefined;
    minValue?: number | undefined;
    maxValue?: number | undefined;
    precision?: number | undefined;
    dateTimeFormat?: "DateOnly" | "DateAndTime" | undefined;
    defaultBooleanValue?: boolean | undefined;
    picklistOptions?: {
        value: number;
        label: string;
    }[] | undefined;
    languageCode?: number | undefined;
}>, {
    entityLogicalName: string;
    attributeType: "String" | "Boolean" | "Integer" | "Memo" | "Decimal" | "Money" | "DateTime" | "Picklist";
    confirm: true;
    autoPublish: boolean;
    schemaName: string;
    displayName: string;
    requiredLevel: "None" | "ApplicationRequired" | "Recommended";
    dateTimeFormat: "DateOnly" | "DateAndTime";
    defaultBooleanValue: boolean;
    languageCode: number;
    description?: string | undefined;
    maxLength?: number | undefined;
    minValue?: number | undefined;
    maxValue?: number | undefined;
    precision?: number | undefined;
    picklistOptions?: {
        value: number;
        label: string;
    }[] | undefined;
}, {
    entityLogicalName: string;
    attributeType: "String" | "Boolean" | "Integer" | "Memo" | "Decimal" | "Money" | "DateTime" | "Picklist";
    confirm: true;
    schemaName: string;
    displayName: string;
    description?: string | undefined;
    autoPublish?: boolean | undefined;
    requiredLevel?: "None" | "ApplicationRequired" | "Recommended" | undefined;
    maxLength?: number | undefined;
    minValue?: number | undefined;
    maxValue?: number | undefined;
    precision?: number | undefined;
    dateTimeFormat?: "DateOnly" | "DateAndTime" | undefined;
    defaultBooleanValue?: boolean | undefined;
    picklistOptions?: {
        value: number;
        label: string;
    }[] | undefined;
    languageCode?: number | undefined;
}>;
export declare const UpdateAttributeInput: z.ZodEffects<z.ZodObject<{
    entityLogicalName: z.ZodString;
    attributeLogicalName: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    requiredLevel: z.ZodOptional<z.ZodEnum<["None", "ApplicationRequired", "Recommended"]>>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    isSearchable: z.ZodOptional<z.ZodBoolean>;
    languageCode: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    autoPublish: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    confirm: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    entityLogicalName: string;
    attributeLogicalName: string;
    confirm: true;
    autoPublish: boolean;
    languageCode: number;
    description?: string | undefined;
    displayName?: string | undefined;
    requiredLevel?: "None" | "ApplicationRequired" | "Recommended" | undefined;
    maxLength?: number | undefined;
    isSearchable?: boolean | undefined;
}, {
    entityLogicalName: string;
    attributeLogicalName: string;
    confirm: true;
    description?: string | undefined;
    autoPublish?: boolean | undefined;
    displayName?: string | undefined;
    requiredLevel?: "None" | "ApplicationRequired" | "Recommended" | undefined;
    maxLength?: number | undefined;
    languageCode?: number | undefined;
    isSearchable?: boolean | undefined;
}>, {
    entityLogicalName: string;
    attributeLogicalName: string;
    confirm: true;
    autoPublish: boolean;
    languageCode: number;
    description?: string | undefined;
    displayName?: string | undefined;
    requiredLevel?: "None" | "ApplicationRequired" | "Recommended" | undefined;
    maxLength?: number | undefined;
    isSearchable?: boolean | undefined;
}, {
    entityLogicalName: string;
    attributeLogicalName: string;
    confirm: true;
    description?: string | undefined;
    autoPublish?: boolean | undefined;
    displayName?: string | undefined;
    requiredLevel?: "None" | "ApplicationRequired" | "Recommended" | undefined;
    maxLength?: number | undefined;
    languageCode?: number | undefined;
    isSearchable?: boolean | undefined;
}>;
export declare const DeleteAttributeInput: z.ZodObject<{
    entityLogicalName: z.ZodString;
    attributeLogicalName: z.ZodString;
    autoPublish: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    confirm: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    entityLogicalName: string;
    attributeLogicalName: string;
    confirm: true;
    autoPublish: boolean;
}, {
    entityLogicalName: string;
    attributeLogicalName: string;
    confirm: true;
    autoPublish?: boolean | undefined;
}>;
export declare function lbl(text: string, languageCode: number): {
    "@odata.type": string;
    LocalizedLabels: {
        Label: string;
        LanguageCode: number;
    }[];
    UserLocalizedLabel: {
        Label: string;
        LanguageCode: number;
    };
};
export declare function buildCreateBody(input: z.infer<typeof CreateAttributeInput>): Record<string, unknown>;
//# sourceMappingURL=attribute.helpers.d.ts.map