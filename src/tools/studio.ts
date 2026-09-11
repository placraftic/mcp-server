import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

interface StudioInfoData {
  studioId: number;
  studioTitle: string;
  apiKeyName: string;
  slug?: string;
  tagline?: string;
  currency?: {
    code: string;
    name?: string;
    symbol?: string;
  };
  pricing?: {
    markupPercentage?: string;
    minimumPrice?: string;
    hourlyRate?: string;
    setupCost?: string;
  };
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

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...response.data,
                  latencyMs: response.latencyMs,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        return formatErrorResult(err);
      }
    },
  );
}
