import { z } from "zod";

export const ConfigSchema = z.object({
  environmentUrl: z
    .string()
    .url("Must be a valid Dataverse environment URL")
    .refine((url) => url.startsWith("https://"), {
      message: "Dataverse environment URL must use HTTPS",
    })
    .refine(
      (url) => {
        try {
          return new URL(url).hostname.toLowerCase().endsWith(".dynamics.com");
        } catch {
          return false;
        }
      },
      { message: "environmentUrl must be a *.dynamics.com host" },
    ),
  authMode: z.enum(["pac", "msal"]).default("pac"),
  pacProfileName: z.string().default("default"),
  tenantId: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  requestTimeoutMs: z.number().positive().default(30000),
  maxRetries: z.number().min(0).max(10).default(3),
});

export type Config = z.infer<typeof ConfigSchema>;
