import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlacrafticClient } from "../client.js";
import { ServerConfig } from "../config.js";

export function registerPingTool(server: McpServer, client: PlacrafticClient, config: ServerConfig) {
  server.tool(
    "ping",
    "Check server status, version, and latency between the MCP server and Placraftic API",
    {},
    async () => {
      let apiConnected = false;
      let latencyMs = 0;
      let apiMessage = "API key not configured";

      if (config.apiKey) {
        try {
          const res = await client.request("/me", { method: "GET" });
          apiConnected = true;
          latencyMs = res.latencyMs;
          apiMessage = "Connected to Placraftic API";
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          apiMessage = `API reachable with error: ${msg}`;
        }
      }

      const result = {
        status: "ok",
        serverName: config.serverName,
        serverVersion: config.serverVersion,
        timestamp: new Date().toISOString(),
        apiConnected,
        apiLatencyMs: latencyMs,
        apiMessage,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
