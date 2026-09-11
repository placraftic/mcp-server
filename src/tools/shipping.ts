import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface DeliverySettingsData {
  deliveryMethods: Array<{
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
  novaPoshta: {
    isConfigured: boolean;
    senderFrom: string;
    senderCityName?: string | null;
    senderCityRef?: string | null;
    senderAddressName?: string | null;
    senderAddressRef?: string | null;
    sendersPhone?: string | null;
  };
  pickup: {
    isConfigured: boolean;
    address?: string | null;
    workingHours?: string | null;
  };
}

export function registerShippingTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "create_nova_poshta_waybill",
    "Generate a Nova Poshta electronic waybill (TTN) for an order using studio sender settings",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the order to ship"),
      weight: z
        .string()
        .optional()
        .describe("Estimated package weight in kilograms (e.g. '0.5', default: '0.5')"),
      declaredValue: z
        .string()
        .optional()
        .describe("Declared package value in UAH (e.g. '250', default: order total)"),
      description: z
        .string()
        .optional()
        .describe("Parcel description for Nova Poshta invoice (default: '3D Printed Parts')"),
      serviceType: z
        .enum(["WarehouseWarehouse", "WarehouseDoors"])
        .optional()
        .describe("Delivery type: 'WarehouseWarehouse' (branch) or 'WarehouseDoors' (courier)"),
      seatsAmount: z
        .string()
        .optional()
        .describe("Number of box seats (default: '1')"),
      recipientFirstName: z.string().optional().describe("Override recipient first name"),
      recipientLastName: z.string().optional().describe("Override recipient last name"),
      recipientPhone: z.string().optional().describe("Override recipient phone number in international format (+380...)"),
      recipientCityRef: z.string().optional().describe("Nova Poshta Ref for recipient city"),
      recipientWarehouseRef: z.string().optional().describe("Nova Poshta Ref for recipient branch/warehouse"),
    },
    async ({
      orderId,
      weight,
      declaredValue,
      description,
      serviceType,
      seatsAmount,
      recipientFirstName,
      recipientLastName,
      recipientPhone,
      recipientCityRef,
      recipientWarehouseRef,
    }) => {
      try {
        const response = await client.request(`/orders/${orderId}/waybill`, {
          method: "POST",
          body: JSON.stringify({
            weight: weight || "0.5",
            declaredValue: declaredValue || "100",
            description: description || "3D Printed Parts",
            serviceType: serviceType || "WarehouseWarehouse",
            seatsAmount: seatsAmount || "1",
            recipientFirstName,
            recipientLastName,
            recipientPhone,
            recipientCityRef,
            recipientWarehouseRef,
          }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Nova Poshta TTN generated successfully for order #${orderId}`,
                  order: response.data,
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
    "print_waybill",
    "Get the official printable Nova Poshta PDF document link for shipping labels and package stickers",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the order with a generated waybill"),
    },
    async ({ orderId }) => {
      try {
        const response = await client.request<{ url: string }>(`/orders/${orderId}/waybill/print`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  orderId,
                  printUrl: response.data.url,
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
    "track_shipment",
    "Synchronize and retrieve live parcel checkpoints and delivery status from Nova Poshta by order ID",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the shipped order"),
    },
    async ({ orderId }) => {
      try {
        const response = await client.request(`/orders/${orderId}/tracking`, {
          method: "POST",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Tracking status synchronized for order #${orderId}`,
                  order: response.data,
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
    "get_delivery_settings",
    "Retrieve current studio delivery configuration: Nova Poshta sender branch, pickup address, and enabled shipping methods",
    {},
    async () => {
      try {
        const response = await client.request<DeliverySettingsData>("/delivery/settings", {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  deliverySettings: response.data,
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
