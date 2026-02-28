import { z } from "zod";
export declare const ConfigSchema: z.ZodObject<{
    environmentUrl: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    requestTimeoutMs: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    environmentUrl: string;
    requestTimeoutMs: number;
    maxRetries: number;
}, {
    environmentUrl: string;
    requestTimeoutMs?: number | undefined;
    maxRetries?: number | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
//# sourceMappingURL=config.schema.d.ts.map