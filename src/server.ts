import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { PlacrafticClient } from "./client.js";
import { registerAllTools } from "./tools/index.js";

export function createServer() {
  const config = loadConfig();
  const client = new PlacrafticClient(config);

  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  registerAllTools(server, client, config);

  return { server, client, config };
}

export async function startServer() {
  const { server, config } = createServer();
  const transport = new StdioServerTransport();

  // Redirect all informational logs to stderr to protect stdio JSON-RPC stream
  console.error(`[Placraftic MCP] Starting ${config.serverName} v${config.serverVersion}...`);
  if (!config.apiKey) {
    console.error(
      "[Placraftic MCP] WARNING: PLACRAFTIC_API_KEY is not set. Tools requiring API access will fail. Set this environment variable in your MCP client config.",
    );
  } else {
    console.error("[Placraftic MCP] API Key configured. Base URL: " + config.baseUrl);
  }

  process.on("SIGINT", async () => {
    console.error("[Placraftic MCP] Received SIGINT, shutting down...");
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.error("[Placraftic MCP] Received SIGTERM, shutting down...");
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error("[Placraftic MCP] Server connected to stdio transport. Listening for requests.");
}
