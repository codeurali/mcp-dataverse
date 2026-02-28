import { createServer } from "http";
import { randomUUID } from "crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
export async function startHttpTransport(server, port, version, toolCount) {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
    });
    await server.connect(transport);
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
                await transport.handleRequest(req, res);
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
        await transport.close();
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