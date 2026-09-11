import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface PrinterQueueItem {
  orderItemId: number;
  orderNumber: string;
  assignedAt: string;
  status: string;
}

export interface PrinterItem {
  id: number;
  name: string;
  studioId: number;
  technology: {
    id: number;
    code: string;
    name: string;
  };
  model?: string | null;
  buildVolume?: string | null;
  status: string;
  maintenanceNote?: string | null;
  nextMaintenanceAt?: string | null;
  assignedItems?: PrinterQueueItem[];
}

export function registerPrintersTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "list_printers",
    "List all 3D printers in the studio fleet with technology, model, build volume, maintenance notes, and active queue",
    {
      technology: z
        .string()
        .optional()
        .describe("Filter printers by technology code (e.g. 'fdm', 'sla', 'sls')"),
      status: z
        .string()
        .optional()
        .describe("Filter printers by operational status (e.g. 'active', 'idle', 'busy', 'maintenance')"),
    },
    async ({ technology, status }) => {
      try {
        const response = await client.request<PrinterItem[]>("/printers", {
          method: "GET",
        });

        let printers = response.data;

        if (technology) {
          const techLower = technology.toLowerCase();
          printers = printers.filter(
            (p) =>
              p.technology.code.toLowerCase() === techLower ||
              p.technology.name.toLowerCase().includes(techLower),
          );
        }

        if (status) {
          const statusLower = status.toLowerCase();
          printers = printers.filter((p) => p.status.toLowerCase() === statusLower);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  total: printers.length,
                  printers,
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
    "get_printer",
    "Retrieve complete hardware details, maintenance schedule, and active print queue for a specific 3D printer by ID",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the printer"),
    },
    async ({ id }) => {
      try {
        const response = await client.request<PrinterItem>(`/printers/${id}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  printer: response.data,
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
