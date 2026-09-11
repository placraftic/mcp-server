import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlacrafticClient } from "../client.js";

export function registerAllResources(server: McpServer, client: PlacrafticClient) {
  // 1. Studio Profile Resource
  server.resource(
    "studio-profile",
    "placraftic://studio/profile",
    {
      description: "Current 3D printing studio profile, name, currency, slug, pricing parameters, and API identity",
      mimeType: "application/json",
    },
    async (uri) => {
      const response = await client.request("/me", { method: "GET" });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );

  // 2. Catalog Materials Resource
  server.resource(
    "catalog-materials",
    "placraftic://catalog/materials",
    {
      description: "Complete inventory of 3D printing materials (filaments, resins), stock levels, and price per kg",
      mimeType: "application/json",
    },
    async (uri) => {
      const response = await client.request("/materials", { method: "GET" });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );

  // 3. Catalog Printers Resource
  server.resource(
    "catalog-printers",
    "placraftic://catalog/printers",
    {
      description: "Studio 3D printer fleet, active machines, build volumes, technology, and maintenance status",
      mimeType: "application/json",
    },
    async (uri) => {
      const response = await client.request("/printers", { method: "GET" });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );

  // 4. Catalog Finishings Resource
  server.resource(
    "catalog-finishings",
    "placraftic://catalog/finishings",
    {
      description: "Available post-processing finishing operations, flat prices, and percentage surcharges",
      mimeType: "application/json",
    },
    async (uri) => {
      const response = await client.request("/finishings", { method: "GET" });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );

  // 5. Catalog Printing Qualities Resource
  server.resource(
    "catalog-qualities",
    "placraftic://catalog/qualities",
    {
      description: "Studio printing quality profiles, layer heights, nozzle sizes, and speed modes",
      mimeType: "application/json",
    },
    async (uri) => {
      const response = await client.request("/printing-qualities", { method: "GET" });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );

  // 6. Delivery Settings Resource
  server.resource(
    "delivery-settings",
    "placraftic://delivery/settings",
    {
      description: "Studio shipping and delivery configuration: Nova Poshta sender warehouse, pickup address, and active delivery methods",
      mimeType: "application/json",
    },
    async (uri) => {
      const response = await client.request("/delivery/settings", { method: "GET" });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    },
  );
}

