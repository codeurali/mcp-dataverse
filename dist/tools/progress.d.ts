import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
/**
 * Optional progress reporter for long-running tool operations.
 * When a server instance and progress token are available, sends
 * MCP progress notifications. Otherwise, silently no-ops.
 */
export declare class ProgressReporter {
    private server;
    private token;
    constructor(server?: Server, token?: string | number);
    report(progress: number, total: number): Promise<void>;
}
/** Singleton no-op reporter for when progress is not available */
export declare const NO_PROGRESS: ProgressReporter;
//# sourceMappingURL=progress.d.ts.map