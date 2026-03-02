export interface WorkflowStep {
    order: number;
    tool: string;
    description: string;
    required: boolean;
    tips?: string;
}
export interface Workflow {
    name: string;
    description: string;
    steps: WorkflowStep[];
    tags: string[];
}
export declare const WORKFLOWS: ReadonlyMap<string, Workflow>;
//# sourceMappingURL=guides.d.ts.map