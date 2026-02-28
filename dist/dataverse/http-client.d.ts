export declare class HttpError extends Error {
    readonly status: number;
    readonly data: unknown;
    readonly code?: string | undefined;
    readonly responseHeaders: Record<string, string>;
    constructor(message: string, status: number, data: unknown, code?: string | undefined, responseHeaders?: Record<string, string>);
}
export interface HttpRequestOptions {
    headers?: Record<string, string>;
    responseType?: "text";
}
export interface HttpResponse<T = unknown> {
    data: T;
    status: number;
    headers: Record<string, string>;
}
export declare class HttpClient {
    readonly baseURL: string;
    private readonly timeoutMs;
    readonly defaultHeaders: Record<string, string>;
    private readonly tokenProvider;
    constructor(config: {
        baseURL: string;
        timeout?: number;
        headers?: Record<string, string>;
        tokenProvider?: () => Promise<string>;
    });
    get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    post<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    patch<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    put<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    private resolveUrl;
    private request;
}
//# sourceMappingURL=http-client.d.ts.map