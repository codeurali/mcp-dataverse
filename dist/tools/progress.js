/**
 * Optional progress reporter for long-running tool operations.
 * When a server instance and progress token are available, sends
 * MCP progress notifications. Otherwise, silently no-ops.
 */
export class ProgressReporter {
    server;
    token;
    constructor(server, token) {
        this.server = server ?? null;
        this.token = token ?? null;
    }
    async report(progress, total) {
        if (!this.server || this.token == null)
            return;
        try {
            await this.server.notification({
                method: "notifications/progress",
                params: { progressToken: this.token, progress, total },
            });
        }
        catch {
            // Swallow — progress is best-effort
        }
    }
}
/** Singleton no-op reporter for when progress is not available */
export const NO_PROGRESS = new ProgressReporter();
//# sourceMappingURL=progress.js.map