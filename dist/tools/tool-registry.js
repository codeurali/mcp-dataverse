export class ToolRegistry {
    map = new Map();
    register(mod) {
        for (const tool of mod.tools) {
            if (this.map.has(tool.name)) {
                throw new Error(`Duplicate tool name: ${tool.name}`);
            }
            this.map.set(tool.name, { definition: tool, handler: mod.handler });
        }
    }
    getHandler(name) {
        return this.map.get(name)?.handler;
    }
    getAllDefinitions() {
        return Array.from(this.map.values()).map((e) => e.definition);
    }
    has(name) {
        return this.map.has(name);
    }
    get size() {
        return this.map.size;
    }
}
export function createToolRegistry(modules) {
    const registry = new ToolRegistry();
    for (const mod of modules) {
        registry.register(mod);
    }
    return registry;
}
//# sourceMappingURL=tool-registry.js.map