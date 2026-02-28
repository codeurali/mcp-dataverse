export interface DataverseError {
    message: string;
    code?: string;
    innererror?: {
        message: string;
        type?: string;
        stacktrace?: string;
    };
}
export interface ODataResponse<T> {
    "@odata.context"?: string;
    "@odata.count"?: number;
    "@odata.nextLink"?: string;
    value: T[];
}
export interface EntityMetadata {
    LogicalName: string;
    DisplayName?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    SchemaName: string;
    EntitySetName: string;
    PrimaryIdAttribute: string;
    PrimaryNameAttribute: string;
    IsCustomEntity: boolean;
    Attributes?: AttributeMetadata[];
}
export interface AttributeMetadata {
    LogicalName: string;
    SchemaName: string;
    AttributeType: string;
    DisplayName?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    RequiredLevel?: {
        Value: string;
    };
    IsCustomAttribute: boolean;
    Targets?: string[];
}
export interface RelationshipMetadata {
    SchemaName: string;
    RelationshipType: "OneToManyRelationship" | "ManyToManyRelationship";
    ReferencedEntity?: string;
    ReferencingEntity?: string;
    ReferencedAttribute?: string;
    ReferencingAttribute?: string;
    Entity1LogicalName?: string;
    Entity2LogicalName?: string;
}
export interface WhoAmIResponse {
    UserId: string;
    BusinessUnitId: string;
    OrganizationId: string;
}
export interface BatchRequest {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    url: string;
    body?: unknown;
    headers?: Record<string, string>;
    /** Optional Content-ID for changeset cross-references (auto-assigned if omitted) */
    contentId?: string;
}
//# sourceMappingURL=types.d.ts.map