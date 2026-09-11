import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export class PlacrafticApiError extends Error {
  public readonly status: number;
  public readonly errorCode?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = "PlacrafticApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export function mapHttpErrorToMcpError(err: unknown): McpError {
  if (err instanceof McpError) {
    return err;
  }

  if (err instanceof PlacrafticApiError) {
    switch (err.status) {
      case 401:
        return new McpError(
          ErrorCode.InvalidRequest,
          "Invalid or missing Placraftic API key. Please generate an API key in Settings -> API Keys (/api-keys) and set PLACRAFTIC_API_KEY.",
        );
      case 403:
        return new McpError(
          ErrorCode.InvalidRequest,
          `Access forbidden: ${err.message || "This feature requires an upgraded studio plan or additional permissions."}`,
        );
      case 404:
        return new McpError(
          ErrorCode.InvalidRequest,
          `Resource not found: ${err.message || "The requested entity does not exist in your studio."}`,
        );
      case 422:
        return new McpError(
          ErrorCode.InvalidParams,
          `Validation failed: ${err.message}. Details: ${JSON.stringify(err.details ?? {})}`,
        );
      case 429:
        return new McpError(
          ErrorCode.InternalError,
          "Placraftic API rate limit exceeded. Please wait a few moments before retrying.",
        );
      default:
        return new McpError(
          ErrorCode.InternalError,
          `Placraftic API error (${err.status}): ${err.message}`,
        );
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  return new McpError(ErrorCode.InternalError, `Connection to Placraftic failed: ${message}`);
}
