import dotenv from "dotenv";

// Load local .env file if available
dotenv.config();

export interface ServerConfig {
  apiKey: string;
  baseUrl: string;
  serverName: string;
  serverVersion: string;
}

export function loadConfig(): ServerConfig {
  const apiKey = process.env.PLACRAFTIC_API_KEY?.trim() ?? "";
  const rawBaseUrl = process.env.PLACRAFTIC_BASE_URL?.trim() || "https://placraftic.com/api/api/v1";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  return {
    apiKey,
    baseUrl,
    serverName: "@placraftic/mcp-server",
    serverVersion: "0.1.1",
  };
}
