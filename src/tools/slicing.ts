import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface SlicingJobResponse {
  id?: string;
  jobId?: string;
  status: string;
  originalFileName?: string;
  technology?: string;
  printingQualityId?: number;
  printingTimeMinutes?: number;
  materialUsed?: number;
  materialUnit?: string;
  result?: {
    printingTimeMinutes?: number;
    materialUsed?: number;
    materialUnit?: string;
    technology?: string;
    modelMetrics?: {
      volumeCm3?: number;
      dimensions?: { x: number; y: number; z: number };
    };
  };
  errorMessage?: string;
  message?: string;
  createdAt?: string;
}

export function registerSlicingTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "submit_slicing_job",
    "Submit a local 3D model file (STL, OBJ, 3MF, STEP) to cloud slicer and obtain an async slicing job ID",
    {
      filePath: z
        .string()
        .describe("Local filesystem path to 3D model file (.stl, .obj, .3mf, .step, .stp)"),
      printingQualityId: z
        .number()
        .int()
        .positive()
        .describe("Printing quality profile numeric ID from list_qualities"),
    },
    async ({ filePath, printingQualityId }) => {
      try {
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) {
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: `Error: 3D model file not found at path: ${resolvedPath}`,
              },
            ],
          };
        }

        const fileBuffer = fs.readFileSync(resolvedPath);
        const fileName = path.basename(resolvedPath);
        const fileBlob = new Blob([fileBuffer], { type: "application/octet-stream" });

        const formData = new FormData();
        formData.append("model", fileBlob, fileName);
        formData.append("printingQualityId", String(printingQualityId));

        const response = await client.request<SlicingJobResponse>("/slicing-jobs", {
          method: "POST",
          body: formData,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  result: response.data,
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
    "get_slicing_status",
    "Check progress of an async 3D slicing job by ID and retrieve print duration and filament weight metrics",
    {
      jobId: z.string().describe("Unique UUID of the slicing job returned by submit_slicing_job or calculate_quote"),
    },
    async ({ jobId }) => {
      try {
        const response = await client.request<SlicingJobResponse>(`/slicing-jobs/${jobId}`, {
          method: "GET",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  job: response.data,
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
