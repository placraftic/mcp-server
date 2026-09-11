import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface AbandonedQuoteItem {
  id: number;
  token: string;
  email: string;
  firstName: string;
  quoteUrl: string;
  itemsCount: number;
  remindAt: string;
  remindedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export function registerAbandonedQuotesTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_abandoned_quotes",
    "List unfinished 3D print quote checkouts with customer contact details, item counts, and direct recovery links",
    {
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Maximum number of abandoned quotes to return (default: 20, max: 100)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Pagination page number (default: 1)"),
    },
    async ({ limit, page }) => {
      try {
        const query: Record<string, string | number> = {};
        if (limit) query.limit = limit;
        if (page) query.page = page;

        const response = await client.get<AbandonedQuoteItem[]>("/abandoned-quotes", query);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  abandonedQuotes: response.data,
                  metadata: response.metadata,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatErrorResult(error);
      }
    }
  );

  server.tool(
    "review_abandoned_quote",
    "Mark an abandoned quote lead as reviewed/reminded to acknowledge followup and avoid duplicate customer contact",
    {
      quoteId: z
        .number()
        .int()
        .positive()
        .describe("Unique numeric identifier of the abandoned quote lead"),
    },
    async ({ quoteId }) => {
      try {
        const response = await client.post<AbandonedQuoteItem>(`/abandoned-quotes/${quoteId}/review`);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: "Abandoned quote lead marked as reviewed successfully",
                  lead: response.data,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatErrorResult(error);
      }
    }
  );
}
