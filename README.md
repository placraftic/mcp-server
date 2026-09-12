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
| `PLACRAFTIC_BASE_URL` | Base URL for Placraftic Public REST API | `https://api.placraftic.com/v1` |

---

## MCP Resources

The Placraftic MCP server exposes 6 live catalog, shipping, and studio resources that clients can read or attach directly into LLM context:

| Resource URI | Description |
| :--- | :--- |
| `placraftic://studio/profile` | Authenticated studio profile, currency, slug, and pricing parameters |
| `placraftic://catalog/materials` | Complete catalog of materials (filaments, resins), stock levels, and price per kg |
| `placraftic://catalog/printers` | Studio 3D printer fleet, active machines, build volumes, technology, and maintenance status |
| `placraftic://catalog/finishings` | Available post-processing finishing operations, flat fees, and percentage surcharges |
| `placraftic://catalog/qualities` | Configured print qualities, layer heights, nozzle sizes, and speed modes |
| `placraftic://delivery/settings` | Current studio delivery configuration: Nova Poshta sender warehouse, pickup address, and shipping methods |

---

## MCP Prompts

The Placraftic MCP server includes 4 built-in workflow prompt templates that appear as slash commands or suggested actions in Claude Desktop and Cursor IDE:

- **`daily_production_standup`**: Zero-argument prompt that inspects active `printing` and `pending` orders, checks printer fleet utilization, groups queued jobs by material and print quality to minimize spool changeovers, and delivers an actionable morning briefing in Ukrainian.
- **`pack_and_ship_order`**: Fulfillment workflow taking `orderId`: verifies order readiness, checks sender/recipient branches, prompts for confirmation to create a Nova Poshta electronic waybill (TTN), retrieves the printable sticker PDF, updates order status to `shipped`, and drafts customer notification text.
- **`quote_and_consult`**: Technical consulting workflow taking `filePath` and optional `requirements`: evaluates application strength and temperature requirements, recommends optimal material and layer height, runs quote calculations, and generates a structured cost estimate and advice.
- **`customer_support_inquiry`**: Omnichannel care assistant taking `customerQuery` and optional `contactInfo`: looks up customer order history, queries real-time tracking checkpoints, and drafts an empathetic, professional reply in Ukrainian with one-click dispatch via `send_inbox_reply`.

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

### Order Lifecycle & Kanban Management
- **`list_orders`**: Query production orders with filtering by Kanban status (`pending`, `confirmed`, `printing`, `post_processing`, `ready`, `shipped`, `completed`, `cancelled`), customer search, and pagination.
- **`get_order_details`**: Retrieve full order manifest by ID including items, 3D model download links, chosen materials, and shipping status.
- **`update_order_status`**: Advance or change an order Kanban stage and dispatch studio timeline events with optional comments.
- **`update_order`**: Modify order total price or update customer internal notes.
- **`cancel_order`**: Terminate an order with an explicit audit reason.

### Shipping & Nova Poshta Logistics
- **`create_nova_poshta_waybill`**: Generate an electronic waybill (TTN) using studio sender warehouse and recipient details.
- **`print_waybill`**: Retrieve official PDF document URL for printing package stickers and shipping marks.
- **`track_shipment`**: Query real-time delivery status and latest Nova Poshta tracking checkpoints.
- **`get_delivery_settings`**: Inspect sender branch, pickup address, and enabled delivery channels.

### Customer Directory & CRM
- **`list_customers`**: Search customer directory by name, phone, or email with total orders count and lifetime spend.
- **`get_customer_profile`**: Retrieve complete customer profile, lifetime value, breakdown of orders by status, and order history.

### Slicing, Quoting & Instant Ordering
- **`calculate_quote`**: Upload a local 3D model file (STL, OBJ, 3MF, STEP) along with chosen material and print quality to calculate precise manufacturing cost, filament weight, print time, and itemized fee breakdown. Automatically polls asynchronous slicing when calculation is in progress.
- **`submit_slicing_job`**: Upload a local 3D model file to the studio slicing engine to initiate background toolpath generation. Returns a unique slicing `jobId`.
- **`get_slicing_status`**: Check asynchronous slicing progress, status (`pending`, `processing`, `done`, `failed`), filament consumption, print time, and error diagnostics by `jobId`.
- **`create_order`**: Create a complete production order directly from the agent. Accepts customer contact details, one or more local 3D model files, selected materials, qualities, quantities, optional finishings, and delivery preferences.

### Unified Support Inbox & Omnichannel CRM
- **`list_inbox_threads`**: List active customer conversations across Telegram, Instagram, email, and web portal with unread status and last message timestamps.
- **`get_conversation_messages`**: Retrieve complete chronological message history and attachments for a customer thread.
- **`send_inbox_reply`**: Send outbound messages directly to customers across Telegram or Instagram, with optional canned templates or attachments.
- **`list_canned_responses`**: List preconfigured studio quick-reply templates for fast customer communication.
- **`create_canned_response`**: Create new studio quick-reply templates with titles, shortcuts, and bodies.

### Abandoned Quotes Recovery
- **`list_abandoned_quotes`**: List unfinished 3D print quote checkouts with customer contact details, item counts, and direct recovery links.
- **`review_abandoned_quote`**: Mark an abandoned quote lead as reviewed/reminded to track follow-up and prevent duplicate customer outreach.

### Studio Production & Financial Analytics
- **`get_studio_stats`**: Aggregate financial metrics (GMV/revenue, completed orders count, average order value), Kanban status breakdown, active printer fleet utilization, and top materials for a given period (`today`, `this_week`, `this_month`, `last_30_days`).

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
