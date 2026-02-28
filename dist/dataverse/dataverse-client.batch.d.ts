import { DataverseMetadataClient } from "./dataverse-client.metadata.js";
import type { BatchRequest } from "./types.js";
/**
 * Extends DataverseMetadataClient with batch execution support.
 * Kept in a separate file to stay within the 400-line hard limit.
 */
export declare class DataverseBatchClient extends DataverseMetadataClient {
    batchExecute(requests: BatchRequest[], useChangeset?: boolean): Promise<unknown[]>;
}
//# sourceMappingURL=dataverse-client.batch.d.ts.map