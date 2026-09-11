import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface FinishingItem {
  id: number;
  name: string;
  description?: string | null;
  price?: {
    amount: string;
    currency: string;
    formatted?: string;
  } | null;
  pricePercentage?: string | null;
  studioId: number;
  technology: {
    id: number;
    code: string;
    name: string;
  };
}

export function registerFinishingsTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_finishings",
    "List all available post-processing and finishing services (vapor smoothing, painting, support removal, sanding) with pricing",
    {
      technology: z
        .string()
        .optional()
        .describe("Filter finishing operations by technology code (e.g. 'fdm', 'sla', 'sls')"),
    },
    async ({ technology }) => {
      try {
        const response = await client.request<FinishingItem[]>("/finishings", {
          method: "GET",
        });

        let finishings = response.data;

        if (technology) {
          const techLower = technology.toLowerCase();
          finishings = finishings.filter(
            (f) =>
              f.technology.code.toLowerCase() === techLower ||
              f.technology.name.toLowerCase().includes(techLower),
          );
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  total: finishings.length,
                  finishings,
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

  server.tool(
    "get_finishing",
    "Retrieve flat-rate and percentage pricing formulas for a specific post-processing finishing operation by ID",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the finishing operation"),
    },
    async ({ id }) => {
      try {
        const response = await client.request<FinishingItem>(`/finishings/${id}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  finishing: response.data,
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
