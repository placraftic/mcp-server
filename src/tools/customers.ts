import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface CustomerSummaryItem {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  locale: string;
  notes?: string;
  totalOrders: number;
  totalSpent: string;
}

export interface CustomerProfileDetails {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  locale: string;
  notes?: string;
  studioId: number;
  studioTitle: string;
  totalOrders: number;
  totalSpent: string;
  ordersByStatus: Record<string, number>;
  orders: Array<{
    id: number;
    status: string;
    totalPrice: string;
    createdAt: string;
  }>;
}

export function registerCustomersTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_customers",
    "List studio customer directory with lifetime order counts, total spent, and search by name or phone",
    {
      search: z
        .string()
        .optional()
        .describe("Search customers by first name, last name, phone number, or email"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Maximum number of customers to return (default: 20, max: 100)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Pagination page number (default: 1)"),
    },
    async ({ search, limit, page }) => {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (limit) queryParams.set("limit", String(limit));
        if (page) queryParams.set("page", String(page));

        const queryStr = queryParams.toString();
        const endpoint = `/customers${queryStr ? `?${queryStr}` : ""}`;

        const response = await client.request<CustomerSummaryItem[]>(endpoint, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  customers: response.data,
                  metadata: response.metadata,
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
    "get_customer_profile",
    "Retrieve complete customer profile, lifetime value, breakdown of orders by status, and order history",
    {
      customerId: z.number().int().positive().describe("Unique numeric ID of the customer"),
    },
    async ({ customerId }) => {
      try {
        const response = await client.request<CustomerProfileDetails>(`/customers/${customerId}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  customer: response.data,
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
