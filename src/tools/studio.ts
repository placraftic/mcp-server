import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlacrafticClient } from "../client.js";
import { mapHttpErrorToMcpError } from "../errors.js";

interface StudioInfoData {
  studioId: number;
  studioTitle: string;
  apiKeyName: string;
}

export function registerStudioTool(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "get_studio_info",
    "Retrieve the authenticated 3D printing studio identity, studio ID, and API key details",
    {},
    async () => {
      try {
        const response = await client.request<StudioInfoData>("/me", {
          method: "GET",
        });

        const formatted = {
          studioId: response.data.studioId,
          studioTitle: response.data.studioTitle,
          apiKeyName: response.data.apiKeyName,
          latencyMs: response.latencyMs,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      } catch (err) {
        throw mapHttpErrorToMcpError(err);
      }
    },
  );
}
