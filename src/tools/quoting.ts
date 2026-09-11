import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { PlacrafticClient } from "../client.js";
import { formatErrorResult } from "../errors.js";

export interface QuotePendingData {
  jobId: string;
}

export interface QuoteCalculatedData {
  totalPrice: {
    amount: string;
    currency: string;
    formatted?: string;
  };
  perUnitPrice: {
    amount: string;
    currency: string;
    formatted?: string;
  };
  setupCost: {
    amount: string;
    currency: string;
    formatted?: string;
  };
  breakdown: {
    materialCost: {
      amount: string;
      currency: string;
    };
    timeCost: {
      amount: string;
      currency: string;
    };
    postProcessingCost?: {
      amount: string;
      currency: string;
    };
    markupAmount?: {
      amount: string;
      currency: string;
    };
    totalWeightGrams?: number;
    printDurationMinutes?: number;
  };
}

export function registerQuotingTools(server: McpServer, client: PlacrafticClient) {
  server.tool(
    "calculate_quote",
    "Upload a local 3D model file (STL, OBJ, 3MF, STEP) and compute an accurate manufacturing cost quote with material and print time breakdown",
    {
      filePath: z
        .string()
        .describe("Local filesystem path to 3D model file (.stl, .obj, .3mf, .step, .stp)"),
      materialId: z
        .number()
        .int()
        .positive()
        .describe("Material numeric ID from list_materials"),
      printingQualityId: z
        .number()
        .int()
        .positive()
        .describe("Printing quality profile numeric ID from list_qualities"),
      quantity: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Number of copies to manufacture (default: 1)"),
      finishingIds: z
        .array(z.number().int().positive())
        .optional()
        .describe("Optional array of post-processing finishing service IDs from list_finishings"),
    },
    async ({ filePath, materialId, printingQualityId, quantity, finishingIds }) => {
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

        const buildFormData = () => {
          const fileBuffer = fs.readFileSync(resolvedPath);
          const fileName = path.basename(resolvedPath);
          const fileBlob = new Blob([fileBuffer], { type: "application/octet-stream" });

          const formData = new FormData();
          formData.append("model", fileBlob, fileName);
          formData.append("materialId", String(materialId));
          formData.append("printingQualityId", String(printingQualityId));
          if (quantity) formData.append("quantity", String(quantity));

          if (finishingIds && finishingIds.length > 0) {
            for (const fId of finishingIds) {
              formData.append("finishingIds[]", String(fId));
            }
          }

          return formData;
        };

        let response = await client.request<QuoteCalculatedData | QuotePendingData>("/quotes", {
          method: "POST",
          body: buildFormData(),
        });

        // If slicing job is pending (202), poll for up to 5 cycles (7.5 seconds)
        if (response.data && "jobId" in response.data) {
          const jobId = response.data.jobId;
          let isDone = false;

          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            try {
              const check = await client.request<{ status: string; errorMessage?: string }>(
                `/slicing-jobs/${jobId}`,
                { method: "GET" },
              );

              if (check.data.status === "done") {
                isDone = true;
                break;
              } else if (check.data.status === "failed") {
                return {
                  isError: true,
                  content: [
                    {
                      type: "text" as const,
                      text: `Error: Slicing failed: ${check.data.errorMessage || "Unknown slicer geometry error"}`,
                    },
                  ],
                };
              }
            } catch {
              // Wait and retry next attempt
            }
          }

          // If finished, retry quote calculation which will now hit cache instantly
          if (isDone) {
            response = await client.request<QuoteCalculatedData>("/quotes", {
              method: "POST",
              body: buildFormData(),
            });
          } else {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(
                    {
                      status: "pending",
                      jobId,
                      message:
                        "3D model slicing is still processing in the background. Use get_slicing_status to check progress, then re-run calculate_quote.",
                      latencyMs: response.latencyMs,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  quote: response.data,
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
