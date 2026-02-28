import { DeviceCodeAuthProvider } from "./device-code-auth-provider.js";
export function createAuthProvider(config) {
    return new DeviceCodeAuthProvider(config.environmentUrl);
}
//# sourceMappingURL=auth-provider.factory.js.map