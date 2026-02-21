export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
    public readonly code?: string,
    public readonly responseHeaders: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  responseType?: 'text';
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class HttpClient {
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  readonly defaultHeaders: Record<string, string>;
  private readonly tokenProvider: (() => Promise<string>) | undefined;

  constructor(config: {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
    tokenProvider?: () => Promise<string>;
  }) {
    this.baseURL = config.baseURL.endsWith('/') ? config.baseURL : config.baseURL + '/';
    this.timeoutMs = config.timeout ?? 30_000;
    this.defaultHeaders = { ...config.headers };
    this.tokenProvider = config.tokenProvider ?? undefined;
  }

  async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, body, options);
  }

  async patch<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', url, body, options);
  }

  async put<T = unknown>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, body, options);
  }

  async delete<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private resolveUrl(url: string): string {
    if (!url.startsWith('http')) {
      return this.baseURL + url;
    }
    // Allow only same-origin absolute URLs (needed for OData nextLink paging tokens)
    const resolved = new URL(url);
    const base = new URL(this.baseURL);
    if (resolved.origin !== base.origin) {
      throw new HttpError(
        `SSRF protection: request to '${resolved.origin}' blocked; only '${base.origin}' is permitted`,
        0,
        undefined,
        'SSRF_BLOCKED',
      );
    }
    return url;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<HttpResponse<T>> {
    const resolvedUrl = this.resolveUrl(url);
    const headers: Record<string, string> = { ...this.defaultHeaders, ...options?.headers };

    if (this.tokenProvider) {
      headers['Authorization'] = `Bearer ${await this.tokenProvider()}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const init: RequestInit = { method, headers, signal: controller.signal };
      if (body !== undefined) {
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(resolvedUrl, init);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => { responseHeaders[key] = value; });

      if (!response.ok) {
        const text = await response.text();
        let errorData: unknown;
        try { errorData = JSON.parse(text); } catch { errorData = text || undefined; }
        throw new HttpError(
          `Request failed with status ${response.status}`,
          response.status,
          errorData,
          undefined,
          responseHeaders,
        );
      }

      let data: T;
      if (options?.responseType === 'text') {
        data = await response.text() as T;
      } else {
        const text = await response.text();
        data = (text ? JSON.parse(text) as T : {} as T);
      }

      return { data, status: response.status, headers: responseHeaders };
    } catch (err) {
      if (err instanceof HttpError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new HttpError('Request timed out', 0, undefined, 'ECONNABORTED');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
