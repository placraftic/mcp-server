# @placraftic/mcp-server

Official Model Context Protocol (MCP) server for the **Placraftic 3D Printing Operating System**.

Connect your Large Language Model (Claude Desktop, Cursor IDE, Zed, Claude Code CLI) directly to your Placraftic studio to manage orders, check printer fleet queues, inspect 3D models, create Nova Poshta waybills, and automate customer communications.

---

## Quick Start

### 1. Obtain your API Key
1. Log in to your Placraftic studio dashboard.
2. Navigate to **Settings -> API Keys** (`/api-keys`).
3. Click **Створити API-ключ** and copy your key (`pk_live_...`).

### 2. Configure Claude Desktop

Add the following to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "placraftic": {
      "command": "npx",
      "args": ["-y", "@placraftic/mcp-server"],
      "env": {
        "PLACRAFTIC_API_KEY": "pk_live_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 3. Configure Cursor IDE

Add to `.cursor/mcp.json` in your project or global Cursor settings:

```json
{
  "mcpServers": {
    "placraftic": {
      "command": "npx",
      "args": ["-y", "@placraftic/mcp-server"],
      "env": {
        "PLACRAFTIC_API_KEY": "pk_live_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 4. Claude Code CLI

Connect with a single command:

```bash
claude mcp add placraftic -- npx -y @placraftic/mcp-server
```

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PLACRAFTIC_API_KEY` | Studio API token generated in `/api-keys` (required for authenticated operations) | (none) |
| `PLACRAFTIC_BASE_URL` | Base URL for Placraftic Public REST API | `https://placraftic.com/api/v1` |

---

## MCP Resources

The Placraftic MCP server exposes 5 live catalog and studio resources that clients can read or attach directly into LLM context:

| Resource URI | Description |
| :--- | :--- |
| `placraftic://studio/profile` | Authenticated studio profile, currency, slug, and pricing parameters |
| `placraftic://catalog/materials` | Complete catalog of materials (filaments, resins), stock levels, and price per kg |
| `placraftic://catalog/printers` | Studio 3D printer fleet, active machines, build volumes, technology, and maintenance status |
| `placraftic://catalog/finishings` | Available post-processing finishing operations, flat fees, and percentage surcharges |
| `placraftic://catalog/qualities` | Configured print qualities, layer heights, nozzle sizes, and speed modes |

---

## Available Tools

### System & Identity
- **`ping`**: Healthcheck returning server version, timestamp, and API round-trip latency.
- **`get_studio_info`**: Retrieves studio ID, studio title, slug, currency, pricing defaults, and active API key details.

### Catalog & Fleet Management
- **`list_materials`**: List available materials (filaments, resins) with optional filtering by `technology`, `color`, and `inStockOnly`.
- **`get_material`**: Retrieve full specifications, stock levels, and price per kg for a specific material by numeric ID.
- **`list_printers`**: List all 3D printers in the studio fleet with optional filtering by `technology` and operational `status`.
- **`get_printer`**: Retrieve hardware details, maintenance notes, next maintenance date, and active print queue for a specific printer.
- **`list_qualities`**: List configured slicing profiles and layer heights with optional filtering by `technology` and `activeOnly`.
- **`get_quality`**: Retrieve exact layer height, nozzle diameter, speed mode, and infill parameters for a quality profile.
- **`list_finishings`**: List all post-processing finishing services (vapor smoothing, painting, sanding) with optional `technology` filter.
- **`get_finishing`**: Retrieve flat-rate and percentage pricing formulas for a specific finishing operation by ID.
- **`list_products`**: List preconfigured catalog products with fixed prices and estimated lead times.
- **`get_product`**: Retrieve complete specifications, media photos, and lead time for a specific product by ID.

---

## Development

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Run locally in development mode
npm run dev
```

---

## License

MIT
