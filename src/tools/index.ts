import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PlacrafticClient } from "../client.js";
import { ServerConfig } from "../config.js";
import { registerPingTool } from "./ping.js";
import { registerStudioTool } from "./studio.js";
import { registerMaterialsTools } from "./materials.js";
import { registerPrintersTools } from "./printers.js";
import { registerQualitiesTools } from "./qualities.js";
import { registerFinishingsTools } from "./finishings.js";
import { registerProductsTools } from "./products.js";
import { registerOrdersTools } from "./orders.js";
import { registerShippingTools } from "./shipping.js";
import { registerCustomersTools } from "./customers.js";
import { registerQuotingTools } from "./quoting.js";
import { registerSlicingTools } from "./slicing.js";
import { registerInboxTools } from "./inbox.js";
import { registerAbandonedQuotesTools } from "./abandoned_quotes.js";
import { registerAnalyticsTools } from "./analytics.js";

export function registerAllTools(server: McpServer, client: PlacrafticClient, config: ServerConfig) {
  registerPingTool(server, client, config);
  registerStudioTool(server, client);
  registerMaterialsTools(server, client);
  registerPrintersTools(server, client);
  registerQualitiesTools(server, client);
  registerFinishingsTools(server, client);
  registerProductsTools(server, client);
  registerOrdersTools(server, client);
  registerShippingTools(server, client);
  registerCustomersTools(server, client);
  registerQuotingTools(server, client);
  registerSlicingTools(server, client);
  registerInboxTools(server, client);
  registerAbandonedQuotesTools(server, client);
  registerAnalyticsTools(server, client);
}

