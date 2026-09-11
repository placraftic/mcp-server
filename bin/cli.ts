#!/usr/bin/env node

import { startServer } from "../src/server.js";

startServer().catch((error) => {
  console.error("[Placraftic MCP Fatal Error]", error);
  process.exit(1);
});
