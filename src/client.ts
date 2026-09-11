import { ServerConfig } from "./config.js";
import { PlacrafticApiError } from "./errors.js";

export interface ApiResponseEnvelope<T> {
  data?: T;
  metadata?: Record<string, unknown>;
  errors?: Array<{ message: string; path?: string }>;
  errorCode?: string;
  error?: string;
  message?: string;
}

export class PlacrafticClient {
  private readonly config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T; latencyMs: number; metadata?: Record<string, unknown> }> {
    if (!this.config.apiKey) {
      throw new PlacrafticApiError(
        "Missing PLACRAFTIC_API_KEY environment variable. Obtain a key from your studio dashboard (/api-keys).",
        401,
      );
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.config.baseUrl}${cleanEndpoint}`;

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.config.apiKey}`);
    headers.set("User-Agent", `${this.config.serverName}/${this.config.serverVersion}`);
    headers.set("Accept", "application/json");

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const startTime = Date.now();
    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError) {
      const message = networkError instanceof Error ? networkError.message : String(networkError);
      throw new PlacrafticApiError(`Network request to ${url} failed: ${message}`, 500);
    }

    const latencyMs = Date.now() - startTime;

    let json: ApiResponseEnvelope<T> | null = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        json = (await response.json()) as ApiResponseEnvelope<T>;
      } catch {
        json = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        json?.message ||
        json?.error ||
        json?.errors?.map((e) => e.message).join(", ") ||
        `HTTP ${response.status} ${response.statusText}`;

      throw new PlacrafticApiError(
        errorMessage,
        response.status,
        json?.errorCode,
        json?.errors,
      );
    }

    // Placraftic standard envelopes wrap results in `data`
    const unwrappedData = (json && "data" in json && json.data !== undefined ? json.data : (json as unknown as T));

    return {
      data: unwrappedData,
      latencyMs,
      metadata: json?.metadata,
    };
  }
}
