export function parseTransportArgs() {
    const args = process.argv.slice(2);
    let transport = "stdio";
    let port = 3000;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--transport" && args[i + 1]) {
            const val = args[i + 1];
            if (val === "http" || val === "stdio")
                transport = val;
            i++;
        }
        if (args[i] === "--port" && args[i + 1]) {
            const p = parseInt(args[i + 1], 10);
            if (!isNaN(p) && p > 0 && p < 65536)
                port = p;
            i++;
        }
    }
    return { transport, port };
}
//# sourceMappingURL=transport.js.map