# Convex Boards MCP Server

This MCP (Model Context Protocol) server allows Cursor to interact with Convex game boards directly.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The server requires a Convex URL. It will look for either:
- `CONVEX_URL` environment variable
- `EXPO_PUBLIC_CONVEX_URL` environment variable

You can set this in your shell or create a `.env` file in the project root.

### 3. Configure Cursor

The MCP server configuration has been automatically created in `.cursor/mcp.json` in your project root. This is a project-specific configuration that Cursor will use.

The configuration file uses workspace-relative paths and environment variables:
- `${workspaceFolder}` - automatically resolves to your project root
- `${env:EXPO_PUBLIC_CONVEX_URL}` - uses your existing Convex URL environment variable

**The configuration file (`.cursor/mcp.json`) contains:**
```json
{
  "mcpServers": {
    "convex-boards": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/index.mjs"],
      "env": {
        "CONVEX_URL": "${env:EXPO_PUBLIC_CONVEX_URL}"
      }
    }
  }
}
```

**If you need to customize it:**
- Make sure `EXPO_PUBLIC_CONVEX_URL` is set in your environment, or
- Replace `${env:EXPO_PUBLIC_CONVEX_URL}` with your actual Convex URL directly

**Note**: The `.cursor/mcp.json` file is project-specific and will be used automatically by Cursor when you open this project.

### 4. Restart Cursor

After adding the configuration, restart Cursor for the MCP server to be available.

## Available Tools

The MCP server exposes the following tools:

### `get_todays_board`
Get today's game board.

**No parameters required.**

### `get_random_past_board`
Get a random past board from the pool.

**Parameters:**
- `excludeBoardIds` (optional): Array of board IDs to exclude from selection

### `get_board`
Get a specific board by ID.

**Parameters:**
- `boardId` (required): The ID of the board to retrieve

### `list_boards`
List all boards (for admin purposes).

**No parameters required.**

### `create_board`
Create a new game board.

**Parameters:**
- `groups` (required): Array of 4 groups, each containing:
  - `name`: Group name
  - `words`: Array of 4 words
  - `difficulty`: One of "easy", "medium", "hard", "very-hard"
- `isPastPool` (required): Boolean indicating if board should be in past pool
- `words` (optional): Array of 16 words (will be auto-generated from groups if not provided)
- `date` (optional): Date in YYYY-MM-DD format (defaults to today)

### `update_board`
Update an existing board.

**Parameters:**
- `boardId` (required): The ID of the board to update
- `words` (optional): Updated array of words
- `groups` (optional): Updated groups array
- `date` (optional): Updated date in YYYY-MM-DD format
- `isPastPool` (optional): Updated past pool status

### `delete_board`
Delete a board by ID.

**Parameters:**
- `boardId` (required): The ID of the board to delete

## Testing

You can test the MCP server manually by running:

```bash
npm run mcp-server
```

The server communicates via stdio, so it's designed to be used by Cursor rather than run standalone.

## Troubleshooting

### Server not connecting
- Verify the Convex URL is set correctly in your environment
- Check that the path to `index.js` in your Cursor config is absolute and correct
- Ensure Node.js is available in your PATH

### Permission errors
- Make sure the `index.mjs` file has execute permissions (on Unix systems): `chmod +x mcp-server/index.mjs`

### Convex errors
- Verify your Convex deployment is active and accessible
- Check that the Convex URL matches your deployment URL

