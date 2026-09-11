import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface MaterialItem {
  id: number;
  name: string;
  color: string;
  costPerKg: {
    amount: string;
    currency: string;
    formatted?: string;
  };
  status: string;
  studioId: number;
  technology: {
    id: number;
    code: string;
    name: string;
  };
  stockQuantity?: string | null;
  lowStockThreshold?: string | null;
  isLowStock?: boolean;
}

export function registerMaterialsTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_materials",
    "List all available 3D printing materials (filaments, resins) with pricing, color, technology, and stock status",
    {
      technology: z
        .string()
        .optional()
        .describe("Filter materials by technology code (e.g. 'fdm', 'sla', 'sls')"),
      color: z
        .string()
        .optional()
        .describe("Filter materials by color name (case-insensitive substring)"),
      inStockOnly: z
        .boolean()
        .optional()
        .describe("When true, only returns materials with positive stock quantity"),
    },
    async ({ technology, color, inStockOnly }) => {
      try {
        const response = await client.request<MaterialItem[]>("/materials", {
          method: "GET",
        });

        let materials = response.data;

        if (technology) {
          const techLower = technology.toLowerCase();
          materials = materials.filter(
            (m) =>
              m.technology.code.toLowerCase() === techLower ||
              m.technology.name.toLowerCase().includes(techLower),
          );
        }

        if (color) {
          const colorLower = color.toLowerCase();
          materials = materials.filter((m) =>
            m.color.toLowerCase().includes(colorLower),
          );
        }

        if (inStockOnly) {
          materials = materials.filter((m) => {
            if (m.stockQuantity == null) return true;
            const parsed = parseFloat(m.stockQuantity);
            return isNaN(parsed) || parsed > 0;
          });
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  total: materials.length,
                  materials,
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
    "get_material",
    "Retrieve full details for a specific 3D printing material by its numeric ID",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the material"),
    },
    async ({ id }) => {
      try {
        const response = await client.request<MaterialItem>(`/materials/${id}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  material: response.data,
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
