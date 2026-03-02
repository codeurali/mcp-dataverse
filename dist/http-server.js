import { createServer } from "http";
import { randomUUID } from "crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
export async function startHttpTransport(serverFactory, port, version, toolCount) {
    // One transport (and one Server instance) per client session.
    // Key = mcp-session-id assigned at initialize time.
    const sessions = new Map();
    const httpServer = createServer(async (req, res) => {
        // CORS headers for browser-based clients
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }
        const url = new URL(req.url ?? "/", `http://localhost:${port}`);
        if (url.pathname === "/health" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok", version, tools: toolCount }));
            return;
        }
        if (url.pathname === "/mcp") {
            try {
                const sessionId = req.headers["mcp-session-id"];
                if (sessionId) {
                    // Route to existing session
                    const existing = sessions.get(sessionId);
                    if (!existing) {
                        res.writeHead(404, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({
                            error: "Session not found. Please reinitialize.",
                        }));
                        return;
                    }
                    await existing.handleRequest(req, res);
                }
                else {
                    // New client: create a dedicated Server + transport pair
                    const transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        enableJsonResponse: true,
                    });
                    // Register session before connecting so any early messages are routed correctly
                    if (transport.sessionId) {
                        sessions.set(transport.sessionId, transport);
                        transport.onclose = () => {
                            if (transport.sessionId)
                                sessions.delete(transport.sessionId);
                        };
                    }
                    const sessionServer = serverFactory();
                    await sessionServer.connect(transport);
                    await transport.handleRequest(req, res);
                    // Capture session ID that may have been set during handleRequest
                    if (!transport.sessionId) {
                        // stateless fallback: nothing to track
                    }
                    else if (!sessions.has(transport.sessionId)) {
                        sessions.set(transport.sessionId, transport);
                        transport.onclose = () => {
                            if (transport.sessionId)
                                sessions.delete(transport.sessionId);
                        };
                    }
                }
            }
            catch {
                if (!res.headersSent) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Internal server error" }));
                }
            }
            return;
        }
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
    });
    await new Promise((resolve) => {
        httpServer.listen(port, () => {
            process.stderr.write(`MCP Dataverse HTTP server listening on http://localhost:${port}/mcp\n`);
            resolve();
        });
    });
    // Keep the process alive; clean shutdown on signals
    const shutdown = async () => {
        process.stderr.write("Shutting down HTTP server...\n");
        for (const t of sessions.values()) {
            await t.close();
        }
        httpServer.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    // Block until server closes
    await new Promise((resolve) => {
        httpServer.on("close", resolve);
    });
}
//# sourceMappingURL=http-server.js.map