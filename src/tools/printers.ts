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

const PrinterStatusEnum = z.enum(["active", "maintenance", "offline"]);

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

  server.tool(
    "list_technologies",
    "List all 3D printing technologies (FDM, SLA, SLS, etc.) with their numeric IDs — use this to resolve the technologyId required by create_printer and update_printer",
    {},
    async () => {
      try {
        const response = await client.request<Array<{ id: number; name: string; slug: string }>>(
          "/technologies",
          { method: "GET" },
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  technologies: response.data,
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
    "create_printer",
    "Register a new 3D printer in the studio fleet. Use list_technologies to resolve technologyId first.",
    {
      name: z.string().describe("Display name for the printer (e.g. 'Bambu Lab X1 Carbon #2')"),
      technologyId: z.number().int().positive().describe("Technology numeric ID from list_technologies"),
      status: PrinterStatusEnum.optional().describe(
        "Operational status: 'active', 'maintenance', or 'offline' (default: 'active')",
      ),
      model: z.string().optional().describe("Hardware model name (e.g. 'Bambu Lab X1 Carbon')"),
      buildVolume: z.string().optional().describe("Build volume dimensions (e.g. '256x256x256mm')"),
      maintenanceNote: z.string().optional().describe("Free-text maintenance note"),
      nextMaintenanceAt: z.string().optional().describe("Next scheduled maintenance date (YYYY-MM-DD)"),
    },
    async ({ name, technologyId, status, model, buildVolume, maintenanceNote, nextMaintenanceAt }) => {
      try {
        const response = await client.request<PrinterItem>("/printers", {
          method: "POST",
          body: JSON.stringify({ name, technologyId, status, model, buildVolume, maintenanceNote, nextMaintenanceAt }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Printer "${response.data.name}" (#${response.data.id}) created`,
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

  server.tool(
    "update_printer",
    "Update a 3D printer's details. Only the fields provided are changed; omitted fields keep their current value.",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the printer"),
      name: z.string().optional().describe("Display name for the printer"),
      technologyId: z.number().int().positive().optional().describe("Technology numeric ID from list_technologies"),
      status: PrinterStatusEnum.optional().describe("Operational status: 'active', 'maintenance', or 'offline'"),
      model: z.string().optional().describe("Hardware model name"),
      buildVolume: z.string().optional().describe("Build volume dimensions (e.g. '256x256x256mm')"),
      maintenanceNote: z.string().optional().describe("Free-text maintenance note"),
      nextMaintenanceAt: z.string().optional().describe("Next scheduled maintenance date (YYYY-MM-DD)"),
    },
    async ({ id, name, technologyId, status, model, buildVolume, maintenanceNote, nextMaintenanceAt }) => {
      try {
        const response = await client.request<PrinterItem>(`/printers/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, technologyId, status, model, buildVolume, maintenanceNote, nextMaintenanceAt }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Printer #${id} updated`,
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

  server.tool(
    "delete_printer",
    "Permanently remove a 3D printer from the studio fleet",
    {
      id: z.number().int().positive().describe("Unique numeric ID of the printer to delete"),
    },
    async ({ id }) => {
      try {
        const response = await client.request<null>(`/printers/${id}`, {
          method: "DELETE",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  message: `Printer #${id} deleted`,
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
