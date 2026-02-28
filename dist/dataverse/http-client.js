export class HttpError extends Error {
    status;
    data;
    code;
    responseHeaders;
    constructor(message, status, data, code, responseHeaders = {}) {
        super(message);
        this.status = status;
        this.data = data;
        this.code = code;
        this.responseHeaders = responseHeaders;
        this.name = "HttpError";
    }
}
export class HttpClient {
    baseURL;
    timeoutMs;
    defaultHeaders;
    tokenProvider;
    constructor(config) {
        this.baseURL = config.baseURL.endsWith("/")
            ? config.baseURL
            : config.baseURL + "/";
        this.timeoutMs = config.timeout ?? 30_000;
        this.defaultHeaders = { ...config.headers };
        this.tokenProvider = config.tokenProvider ?? undefined;
    }
    async get(url, options) {
        return this.request("GET", url, undefined, options);
    }
    async post(url, body, options) {
        return this.request("POST", url, body, options);
    }
    async patch(url, body, options) {
        return this.request("PATCH", url, body, options);
    }
    async put(url, body, options) {
        return this.request("PUT", url, body, options);
    }
    async delete(url, options) {
        return this.request("DELETE", url, undefined, options);
    }
    resolveUrl(url) {
        if (!url.startsWith("http")) {
            return this.baseURL + url;
        }
        // Allow only same-origin absolute URLs (needed for OData nextLink paging tokens)
        const resolved = new URL(url);
        const base = new URL(this.baseURL);
        if (resolved.origin !== base.origin) {
            throw new HttpError(`SSRF protection: request to '${resolved.origin}' blocked; only '${base.origin}' is permitted`, 0, undefined, "SSRF_BLOCKED");
        }
        return url;
    }
    async request(method, url, body, options) {
        const resolvedUrl = this.resolveUrl(url);
        const headers = {
            ...this.defaultHeaders,
            ...options?.headers,
        };
        if (this.tokenProvider) {
            headers["Authorization"] = `Bearer ${await this.tokenProvider()}`;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const init = { method, headers, signal: controller.signal };
            if (body !== undefined) {
                init.body = typeof body === "string" ? body : JSON.stringify(body);
            }
            const response = await fetch(resolvedUrl, init);
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            if (!response.ok) {
                const text = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(text);
                }
                catch {
                    errorData = text || undefined;
                }
                throw new HttpError(`Request failed with status ${response.status}`, response.status, errorData, undefined, responseHeaders);
            }
            let data;
            if (options?.responseType === "text") {
                data = (await response.text());
            }
            else {
                const text = await response.text();
                data = text ? JSON.parse(text) : {};
            }
            return { data, status: response.status, headers: responseHeaders };
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof DOMException && err.name === "AbortError") {
                throw new HttpError("Request timed out", 0, undefined, "ECONNABORTED");
            }
            throw err;
        }
        finally {
            clearTimeout(timer);
        }
    }
}
//# sourceMappingURL=http-client.js.map