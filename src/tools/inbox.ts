import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface ConversationThread {
  id: number;
  channel: string;
  status: string;
  customerId: number | null;
  customerName: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: number;
  direction: "inbound" | "outbound" | string;
  authorFullName: string | null;
  content: string;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  attachmentMimeType: string | null;
  createdAt: string;
  deliveryFailed?: boolean;
}

export interface ConversationDetails {
  id: number;
  channel: string;
  status: string;
  customerId: number | null;
  customerName: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
  lastMessageAt: string;
  createdAt: string;
  messages: ConversationMessage[];
}

export interface CannedResponseItem {
  id: number;
  title: string;
  content: string;
}

export function registerInboxTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_inbox_threads",
    "List active studio customer support conversations across Telegram, Instagram, and web portal",
    {
      channel: z
        .enum(["telegram", "instagram", "email", "portal"])
        .optional()
        .describe("Filter threads by messaging channel (telegram, instagram, email, portal)"),
      status: z
        .enum(["open", "closed", "pending"])
        .optional()
        .describe("Filter threads by status (open, closed, pending)"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Maximum number of threads to return (default: 20, max: 100)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number for pagination (default: 1)"),
    },
    async ({ channel, status, limit, page }) => {
      try {
        const query: Record<string, string | number> = {};
        if (channel) query.channel = channel;
        if (status) query.status = status;
        if (limit) query.limit = limit;
        if (page) query.page = page;

        const response = await client.get<ConversationThread[]>("/conversations", query);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  threads: response.data,
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
    "get_conversation_messages",
    "Retrieve complete chronological message history and attachments for a customer conversation",
    {
      conversationId: z
        .number()
        .int()
        .positive()
        .describe("Unique numeric identifier of the conversation"),
    },
    async ({ conversationId }) => {
      try {
        const response = await client.get<ConversationDetails>(`/conversations/${conversationId}`);
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

  server.tool(
    "send_inbox_reply",
    "Send an outbound message directly to the customer across Telegram or Instagram, with optional canned template",
    {
      conversationId: z
        .number()
        .int()
        .positive()
        .describe("Unique numeric identifier of the conversation to reply to"),
      message: z
        .string()
        .optional()
        .describe("Text message content to send to the customer (required unless templateId is provided)"),
      templateId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Optional numeric ID of a canned response template to populate the reply"),
      attachmentUrl: z
        .string()
        .url()
        .optional()
        .describe("Optional public URL of an attachment or image to send"),
    },
    async ({ conversationId, message, templateId, attachmentUrl }) => {
      try {
        const response = await client.post<ConversationMessage>(
          `/conversations/${conversationId}/messages`,
          {
            content: message,
            templateId,
            attachmentUrl,
          }
        );
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: "Reply sent successfully",
                  sentMessage: response.data,
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
    "list_canned_responses",
    "List preconfigured studio quick-reply templates for customer communications",
    {},
    async () => {
      try {
        const response = await client.get<CannedResponseItem[]>("/canned-responses");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  cannedResponses: response.data,
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
    "create_canned_response",
    "Create a new quick-reply canned response template for the studio",
    {
      title: z
        .string()
        .min(1)
        .describe("Descriptive title or label for the canned response (e.g. 'Standard Greeting')"),
      body: z
        .string()
        .min(1)
        .describe("Message body template to send to customers"),
      shortcut: z
        .string()
        .optional()
        .describe("Optional short identifier or slash shortcut (e.g. '/lead-time')"),
    },
    async ({ title, body, shortcut }) => {
      try {
        const response = await client.post<CannedResponseItem>("/canned-responses", {
          title,
          body,
          shortcut,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: "Canned response created successfully",
                  cannedResponse: response.data,
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
