import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface PrintingQualityItem {
  id: number;
  name: string;
  description?: string | null;
  studioId: number;
  technology: {
    id: number;
    code: string;
    name: string;
  };
  layerHeight?: string | null;
  nozzleDiameter?: string | null;
  infillPercent?: number | null;
  wallCount?: number | null;
  topLayers?: number | null;
  bottomLayers?: number | null;
  speedMode?: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export function registerQualitiesTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_qualities",
    "List configured 3D printing qualities and slicing profiles (layer heights, nozzle diameter, speed modes, infill)",
    {
      technology: z
        .string()
        .optional()
        .describe("Filter qualities by technology code (e.g. 'fdm', 'sla', 'sls')"),
      activeOnly: z
        .boolean()
        .optional()
        .describe("When true, only returns active printing qualities"),
    },
    async ({ technology, activeOnly }) => {
      try {
        const response = await client.request<PrintingQualityItem[]>("/printing-qualities", {
          method: "GET",
        });

        let qualities = response.data;

        if (technology) {
          const techLower = technology.toLowerCase();
          qualities = qualities.filter(
            (q) =>
              q.technology.code.toLowerCase() === techLower ||
              q.technology.name.toLowerCase().includes(techLower),
          );
        }

        if (activeOnly) {
          qualities = qualities.filter((q) => q.isActive);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  total: qualities.length,
                  qualities,
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
    "get_quality",
    "Retrieve slicing parameters and layer height configuration for a specific printing quality profile by ID",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the printing quality"),
    },
    async ({ id }) => {
      try {
        const response = await client.request<PrintingQualityItem>(`/printing-qualities/${id}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  quality: response.data,
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
