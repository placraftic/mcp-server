import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";

export function registerAllPrompts(server: McpServer, _client: PlacrafticClient) {
  // 1. Daily Production Standup
  server.prompt(
    "daily_production_standup",
    "Morning production standup: review printing and pending orders, fleet load, and optimize batch scheduling",
    async () => {
      return {
        description: "Placraftic morning production standup and scheduling review",
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are the Placraftic Studio Production Manager. Conduct the daily morning production review:

1. Call list_orders with status "printing" to see active jobs currently running on printers.
2. Call list_orders with status "pending" and "confirmed" to inspect newly queued orders awaiting production.
3. Call list_printers to assess total fleet capacity and maintenance statuses.
4. Group pending items by material and print quality to minimize filament spool changeovers.
5. Identify any urgent orders approaching deadline, unassigned jobs, or idle printers.
6. Present a concise, actionable morning standup summary in Ukrainian with clear prioritized next actions for the studio operators.`,
            },
          },
        ],
      };
    }
  );

  // 2. Pack & Ship Order
  server.prompt(
    "pack_and_ship_order",
    "Fulfillment workflow: verify order completion, generate Nova Poshta waybill, print label, and notify customer",
    {
      orderId: z
        .string()
        .describe("The order ID to fulfill and ship"),
    },
    async ({ orderId }) => {
      return {
        description: `Pack and ship workflow for order #${orderId}`,
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are the Placraftic Logistics & Fulfillment Specialist. Execute the shipping workflow for order #${orderId}:

1. Call get_order_details with orderId ${orderId}.
2. Check that the order status is ready (or post_processing). Verify customer delivery preferences (recipient name, phone number, Nova Poshta city, and warehouse).
3. Call get_delivery_settings to confirm your studio sender warehouse details.
4. Ask the operator for confirmation to generate the shipping waybill: confirm package weight and declared value.
5. Upon confirmation, call create_nova_poshta_waybill to create the electronic TTN.
6. Call print_waybill to obtain the printable PDF sticker URL for the shipping box.
7. Call update_order_status to transition the order to "shipped", recording the TTN number in comments.
8. Draft a friendly customer notification in Ukrainian with the tracking number and estimated delivery date, ready to be sent.`,
            },
          },
        ],
      };
    }
  );

  // 3. Quote & Consult
  server.prompt(
    "quote_and_consult",
    "Customer consulting: evaluate 3D model requirements, recommend materials and layer height, and calculate instant quote",
    {
      filePath: z
        .string()
        .describe("Local path to the 3D model file (STL, OBJ, 3MF, STEP)"),
      requirements: z
        .string()
        .optional()
        .describe("Customer requirements: e.g. mechanical strength, temperature resistance, outdoor use, visual smoothness"),
    },
    async ({ filePath, requirements }) => {
      const requirementsContext = requirements ? `Requirements: "${requirements}".` : "Requirements: general purpose prototype/part.";
      return {
        description: `Quote calculation and material consulting for ${filePath}`,
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are an expert 3D Printing Technical Consultant at Placraftic. Provide a manufacturing quote and recommendation for the model at "${filePath}":

${requirementsContext}

1. Call list_materials to check in-stock materials and their properties (PLA, PETG, ABS, ASA, TPU, Resin).
2. Call list_qualities to inspect layer heights (0.12mm detail, 0.20mm standard, 0.28mm draft).
3. Evaluate the optimal material and quality choice for the customer application.
4. Call calculate_quote with the model file path, chosen materialId, and printingQualityId.
5. Provide the customer with an itemized manufacturing breakdown in Ukrainian:
   - Recommended material and justification
   - Recommended layer height
   - Model print time and filament weight
   - Complete cost estimate (materials, machine time, base pricing)
   - Offer to submit the order directly using create_order once approved.`,
            },
          },
        ],
      };
    }
  );

  // 4. Customer Support Inquiry
  server.prompt(
    "customer_support_inquiry",
    "Omnichannel support: lookup customer record, order history, live parcel tracking, and draft empathetic Ukrainian response",
    {
      customerQuery: z
        .string()
        .describe("The customer's message or question"),
      contactInfo: z
        .string()
        .optional()
        .describe("Customer phone number, email, or name to search the directory"),
    },
    async ({ customerQuery, contactInfo }) => {
      const searchHint = contactInfo ? `Customer search term: "${contactInfo}".` : "Customer search info not provided; check recent orders or inbox.";
      return {
        description: "Customer support inquiry resolution and reply drafting",
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `You are Placraftic Studio's Customer Support Specialist. A customer wrote:
"${customerQuery}"

${searchHint}

1. If customer contact info is available, call list_customers to locate their customer profile and past orders.
2. Call list_orders to find their active or most recent order.
3. If their order is shipped, call track_shipment to get the latest Nova Poshta delivery checkpoint.
4. If there is an active support conversation in Telegram or Instagram, call list_inbox_threads to locate the thread ID.
5. Draft an empathetic, helpful, and professional response in Ukrainian answering their inquiry directly.
6. If an inbox thread ID was found, offer to dispatch the reply immediately using send_inbox_reply.`,
            },
          },
        ],
      };
    }
  );
}
