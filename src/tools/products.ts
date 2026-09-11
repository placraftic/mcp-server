import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface ProductItem {
  id: number;
  title: string;
  description?: string | null;
  photos: string[];
  price: {
    amount: string;
    currency: string;
    formatted?: string;
  };
  leadTime?: number | null;
  isActive: boolean;
  studioId: number;
  createdAt: string;
  updatedAt: string;
}

export function registerProductsTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_products",
    "List catalog products manufactured by the studio with fixed pricing, photos, and estimated lead time",
    {
      activeOnly: z
        .boolean()
        .optional()
        .describe("When true, only returns active and publicly available catalog products"),
    },
    async ({ activeOnly }) => {
      try {
        const response = await client.request<ProductItem[]>("/products", {
          method: "GET",
        });

        let products = response.data;

        if (activeOnly) {
          products = products.filter((p) => p.isActive);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  total: products.length,
                  products,
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
    "get_product",
    "Retrieve complete specifications, media photos, and turnaround lead time for a specific product by ID",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the product"),
    },
    async ({ id }) => {
      try {
        const response = await client.request<ProductItem>(`/products/${id}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  product: response.data,
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
