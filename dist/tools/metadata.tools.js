import { metadataReadTools, handleMetadataReadTool } from "./metadata-read.tools.js";
import { metadataWriteTools, handleMetadataWriteTool } from "./metadata-write.tools.js";
export const metadataTools = [...metadataReadTools, ...metadataWriteTools];
export async function handleMetadataTool(name, args, client) {
    const readNames = new Set(metadataReadTools.map((t) => t.name));
    if (readNames.has(name))
        return handleMetadataReadTool(name, args, client);
    return handleMetadataWriteTool(name, args, client);
}
//# sourceMappingURL=metadata.tools.js.map