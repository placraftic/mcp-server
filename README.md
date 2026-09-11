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

## Core Tools (Phase 1)

- **`ping`**: Healthcheck returning server version, timestamp, and API round-trip latency.
- **`get_studio_info`**: Retrieves studio ID, studio title, and active API key identity via `/api/v1/me`.

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
