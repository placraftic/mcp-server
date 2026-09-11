import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlacrafticClient } from "../client.js";
import { ServerConfig } from "../config.js";
import { registerPingTool } from "./ping.js";
import { registerStudioTool } from "./studio.js";

export function registerAllTools(server: McpServer, client: PlacrafticClient, config: ServerConfig) {
  registerPingTool(server, client, config);
  registerStudioTool(server, client);
}
