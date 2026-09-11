import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface StudioAnalytics {
  period: {
    name: string;
    startDate: string;
    endDate: string;
  };
  currency: {
    code: string;
    symbol: string;
  };
  financials: {
    revenue: string;
    completedOrdersCount: number;
    totalOrdersCount: number;
    averageOrderValue: string;
  };
  ordersByStatus: Record<string, number>;
  fleetAndQueue: {
    totalPrinters: number;
    activePrintersCount: number;
    itemsCurrentlyPrinting: number;
    itemsAwaitingPrint: number;
  };
  topMaterials: Array<{
    materialId: number;
    name: string;
    color: string;
    technology: string;
    ordersCount: number;
    totalQuantity: number;
  }>;
}

export function registerAnalyticsTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "get_studio_stats",
    "Retrieve real-time studio financial metrics, orders breakdown by status, active printer fleet load, and top materials for a given period",
    {
      period: z
        .enum(["today", "this_week", "this_month", "last_30_days"])
        .optional()
        .describe("Time period to aggregate metrics for (today, this_week, this_month, last_30_days; default: this_week)"),
    },
    async ({ period = "this_week" }) => {
      try {
        const response = await client.get<StudioAnalytics>("/analytics/stats", { period });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatErrorResult(error);
      }
    }
  );
}
