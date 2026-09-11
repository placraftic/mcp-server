import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

const OrderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "printing",
  "post_processing",
  "ready",
  "shipped",
  "completed",
  "cancelled",
]);

export interface OrderCustomerSummary {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  totalOrders?: number;
  totalSpent?: string;
}

export interface OrderItemSummary {
  id: number;
  materialName?: string;
  technologyName?: string;
  qualityName?: string;
  quantity: number;
  price?: {
    amount: string;
    currency: string;
    formatted?: string;
  };
  fileDownloadUrl?: string | null;
}

export interface OrderDetails {
  id: number;
  status: string;
  totalPrice: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomerSummary;
  items: OrderItemSummary[];
  delivery?: {
    method?: {
      id: number;
      name: string;
      slug: string;
    };
    cityName?: string | null;
    warehouseName?: string | null;
    trackingNumber?: string | null;
    deliveryStatus?: string | null;
  } | null;
}

export function registerOrdersTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_orders",
    "List studio production orders with filtering by Kanban status, customer search, and pagination",
    {
      status: OrderStatusEnum.optional().describe(
        "Filter orders by Kanban status: 'pending', 'confirmed', 'printing', 'post_processing', 'ready', 'shipped', 'completed', or 'cancelled'",
      ),
      search: z
        .string()
        .optional()
        .describe("Search query matching customer name, phone number, email, or order ID"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .optional()
        .describe("Maximum number of orders to return (default: 20, max: 100)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Pagination page number (default: 1)"),
    },
    async ({ status, search, limit, page }) => {
      try {
        const queryParams = new URLSearchParams();
        if (status) queryParams.set("status", status);
        if (search) queryParams.set("search", search);
        if (limit) queryParams.set("limit", String(limit));
        if (page) queryParams.set("page", String(page));

        const queryStr = queryParams.toString();
        const endpoint = `/orders${queryStr ? `?${queryStr}` : ""}`;

        const response = await client.request<OrderDetails[]>(endpoint, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  orders: response.data,
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
    "get_order_details",
    "Retrieve complete order manifest by ID including customer profile, ordered parts, slicing files, and shipping tracking",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the order"),
    },
    async ({ orderId }) => {
      try {
        const response = await client.request<OrderDetails>(`/orders/${orderId}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
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
    "update_order_status",
    "Transition an order to a new Kanban stage and dispatch studio timeline events",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the order"),
      status: OrderStatusEnum.describe(
        "Target Kanban status: 'pending', 'confirmed', 'printing', 'post_processing', 'ready', 'shipped', 'completed', or 'cancelled'",
      ),
      comment: z
        .string()
        .optional()
        .describe("Optional operator comment or internal reason for the status transition"),
    },
    async ({ orderId, status, comment }) => {
      try {
        const response = await client.request<OrderDetails>(`/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status, comment }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Order #${orderId} status successfully updated to '${status}'`,
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
    "update_order",
    "Update order details such as total price and customer operator notes",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the order"),
      totalPrice: z
        .string()
        .optional()
        .describe("Adjusted total order price in studio currency (e.g. '350.00')"),
      customerNotes: z
        .string()
        .optional()
        .describe("Operator internal notes or preferences for this customer"),
    },
    async ({ orderId, totalPrice, customerNotes }) => {
      try {
        const response = await client.request<OrderDetails>(`/orders/${orderId}`, {
          method: "PATCH",
          body: JSON.stringify({ totalPrice, customerNotes }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Order #${orderId} updated successfully`,
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
    "cancel_order",
    "Cancel an order, record the cancellation reason, and trigger cancellation notifications",
    {
      orderId: z.number().int().positive().describe("Unique numeric ID of the order to cancel"),
      reason: z
        .string()
        .describe("Explicit reason for cancelling the order (e.g. 'Customer requested cancellation', 'Model unprintable')"),
    },
    async ({ orderId, reason }) => {
      try {
        const response = await client.request<OrderDetails>(`/orders/${orderId}/cancel`, {
          method: "POST",
          body: JSON.stringify({ reason }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Order #${orderId} has been cancelled`,
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
    "create_order",
    "Submit a new production order with customer contact info, 3D model files (STL, OBJ, 3MF, STEP), materials, and delivery preferences",
    {
      customer: z.object({
        firstName: z.string().describe("Customer first name"),
        lastName: z.string().describe("Customer last name"),
        phoneNumber: z.string().describe("Customer phone number in international format (+380...)"),
        email: z.string().email().describe("Customer email address"),
        locale: z.string().optional().describe("Locale language code (default: 'uk')"),
      }),
      items: z
        .array(
          z.object({
            materialId: z.number().int().positive().describe("Material numeric ID from list_materials"),
            printingQualityId: z.number().int().positive().describe("Printing quality profile ID from list_qualities"),
            filePath: z.string().describe("Local filesystem path to 3D model file (.stl, .obj, .3mf, .step)"),
            quantity: z.number().int().positive().optional().describe("Number of units to manufacture (default: 1)"),
            finishingIds: z.array(z.number().int().positive()).optional().describe("Array of post-processing finishing service IDs"),
          }),
        )
        .min(1)
        .describe("List of items to manufacture with 3D model files"),
      delivery: z
        .object({
          deliveryMethodId: z.number().int().positive().optional().describe("Delivery method ID from get_delivery_settings"),
          cityName: z.string().optional().describe("Recipient city name"),
          cityRef: z.string().optional().describe("Nova Poshta City Ref"),
          warehouseName: z.string().optional().describe("Nova Poshta Warehouse description or number"),
          warehouseRef: z.string().optional().describe("Nova Poshta Warehouse Ref"),
          streetName: z.string().optional().describe("Street name for courier delivery"),
          buildingNumber: z.string().optional().describe("Building number for courier delivery"),
          apartmentNumber: z.string().optional().describe("Apartment number"),
          npServiceType: z.enum(["WarehouseWarehouse", "WarehouseDoors"]).optional(),
        })
        .optional()
        .describe("Delivery options and shipping destination"),
    },
    async ({ customer, items, delivery }) => {
      try {
        const formData = new FormData();
        formData.append("customerFirstName", customer.firstName);
        formData.append("customerLastName", customer.lastName);
        formData.append("customerPhoneNumber", customer.phoneNumber);
        formData.append("customerEmail", customer.email);
        formData.append("customerLocale", customer.locale || "uk");
        formData.append("source", "mcp");

        const itemsPayload: Array<{
          materialId: number;
          printingQualityId: number;
          quantity: number;
          finishingIds?: number[];
        }> = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const resolvedPath = path.resolve(item.filePath);
          if (!fs.existsSync(resolvedPath)) {
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: `Error: 3D model file for item #${i + 1} not found at path: ${resolvedPath}`,
                },
              ],
            };
          }

          const fileBuffer = fs.readFileSync(resolvedPath);
          const fileName = path.basename(resolvedPath);
          const fileBlob = new Blob([fileBuffer], { type: "application/octet-stream" });

          formData.append("models[]", fileBlob, fileName);
          itemsPayload.push({
            materialId: item.materialId,
            printingQualityId: item.printingQualityId,
            quantity: item.quantity || 1,
            finishingIds: item.finishingIds,
          });
        }

        formData.append("items", JSON.stringify(itemsPayload));

        if (delivery) {
          if (delivery.deliveryMethodId) formData.append("deliveryMethodId", String(delivery.deliveryMethodId));
          if (delivery.cityName) formData.append("deliveryCityName", delivery.cityName);
          if (delivery.cityRef) formData.append("deliveryCityRef", delivery.cityRef);
          if (delivery.warehouseName) formData.append("deliveryWarehouseName", delivery.warehouseName);
          if (delivery.warehouseRef) formData.append("deliveryWarehouseRef", delivery.warehouseRef);
          if (delivery.streetName) formData.append("deliveryStreetName", delivery.streetName);
          if (delivery.buildingNumber) formData.append("deliveryBuildingNumber", delivery.buildingNumber);
          if (delivery.apartmentNumber) formData.append("deliveryApartmentNumber", delivery.apartmentNumber);
          if (delivery.npServiceType) formData.append("deliveryNpServiceType", delivery.npServiceType);
        }

        const response = await client.request<OrderDetails>("/orders", {
          method: "POST",
          body: formData,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: "Order created successfully!",
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
}

