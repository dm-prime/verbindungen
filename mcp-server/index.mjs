#!/usr/bin/env node

/**
 * MCP Server for Convex Game Boards
 * 
 * This server exposes tools to interact with Convex game boards,
 * allowing Cursor to query, create, update, and delete boards.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ConvexHttpClient } from "convex/browser";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { api } from "../convex/_generated/api.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load Convex URL from multiple sources
function getConvexUrl() {
  // 1. Check environment variables (set by Cursor MCP config)
  if (process.env.CONVEX_URL) return process.env.CONVEX_URL;
  if (process.env.EXPO_PUBLIC_CONVEX_URL) return process.env.EXPO_PUBLIC_CONVEX_URL;

  // 2. Try to read from .env file in project root
  const envPath = join(__dirname, "..", ".env");
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, "utf-8");
      const match = envContent.match(/EXPO_PUBLIC_CONVEX_URL=(.+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    } catch (e) {
      // Ignore errors reading .env
    }
  }

  // 3. Try to read from .env.local file
  const envLocalPath = join(__dirname, "..", ".env.local");
  if (existsSync(envLocalPath)) {
    try {
      const envContent = readFileSync(envLocalPath, "utf-8");
      const match = envContent.match(/EXPO_PUBLIC_CONVEX_URL=(.+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    } catch (e) {
      // Ignore errors reading .env.local
    }
  }

  return null;
}

// Initialize Convex client
const CONVEX_URL = getConvexUrl();

if (!CONVEX_URL) {
  console.error(
    "Error: CONVEX_URL or EXPO_PUBLIC_CONVEX_URL environment variable is required.\n" +
    "Please set it in one of the following ways:\n" +
    "1. Set CONVEX_URL in .cursor/mcp.json env section\n" +
    "2. Set EXPO_PUBLIC_CONVEX_URL in a .env file in the project root\n" +
    "3. Set CONVEX_URL or EXPO_PUBLIC_CONVEX_URL as an environment variable"
  );
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

class ConvexBoardsServer {
  constructor() {
    this.server = new Server(
      {
        name: "convex-boards",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_todays_board",
          description: "Get today's game board",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_random_past_board",
          description:
            "Get a random past board from the pool. Optionally exclude specific board IDs.",
          inputSchema: {
            type: "object",
            properties: {
              excludeBoardIds: {
                type: "array",
                items: { type: "string" },
                description: "Array of board IDs to exclude from selection",
              },
            },
          },
        },
        {
          name: "get_board",
          description: "Get a specific board by ID",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The ID of the board to retrieve",
              },
            },
            required: ["boardId"],
          },
        },
        {
          name: "get_board_words_testplay",
          description: "Get only the words for a board (without the solution/groups)",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The ID of the board to retrieve words from",
              },
            },
            required: ["boardId"],
          },
        },
        {
          name: "list_boards",
          description: "List all boards (for admin purposes)",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "create_board",
          description: "Create a new game board",
          inputSchema: {
            type: "object",
            properties: {
              words: {
                type: "array",
                items: { type: "string" },
                description: "Array of 16 words for the board",
              },
              groups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    words: {
                      type: "array",
                      items: { type: "string" },
                    },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard", "very-hard"],
                    },
                  },
                  required: ["name", "words", "difficulty"],
                },
                description:
                  "Array of 4 groups, each containing 4 words and a difficulty level",
              },
              date: {
                type: "string",
                description:
                  "Date in YYYY-MM-DD format (optional, defaults to today)",
              },
              isPastPool: {
                type: "boolean",
                description:
                  "Whether this board should be in the past pool for random selection",
              },
            },
            required: ["groups", "isPastPool"],
          },
        },
        {
          name: "update_board",
          description: "Update an existing board",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The ID of the board to update",
              },
              words: {
                type: "array",
                items: { type: "string" },
                description: "Updated array of words (optional)",
              },
              groups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    words: {
                      type: "array",
                      items: { type: "string" },
                    },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard", "very-hard"],
                    },
                  },
                  required: ["name", "words", "difficulty"],
                },
                description: "Updated groups (optional)",
              },
              date: {
                type: "string",
                description: "Updated date in YYYY-MM-DD format (optional)",
              },
              isPastPool: {
                type: "boolean",
                description: "Updated past pool status (optional)",
              },
            },
            required: ["boardId"],
          },
        },
        {
          name: "delete_board",
          description: "Delete a board by ID",
          inputSchema: {
            type: "object",
            properties: {
              boardId: {
                type: "string",
                description: "The ID of the board to delete",
              },
            },
            required: ["boardId"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_todays_board": {
            const result = await convex.query(api.boards.getTodaysBoard, {});
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_random_past_board": {
            const result = await convex.query(api.boards.getRandomPastBoard, {
              excludeBoardIds: args.excludeBoardIds || undefined,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_board": {
            if (!args.boardId) {
              throw new Error("boardId is required");
            }
            const result = await convex.query(api.boards.getBoard, {
              boardId: args.boardId,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_board_words_testplay": {
            if (!args.boardId) {
              throw new Error("boardId is required");
            }
            const board = await convex.query(api.boards.getBoard, {
              boardId: args.boardId,
            });
            if (!board) {
              throw new Error("Board not found");
            }
            // Return only words, without groups/solution
            const result = {
              boardId: board._id,
              words: board.words,
              date: board.date,
            };
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "list_boards": {
            const result = await convex.query(api.boards.listBoards, {});
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "create_board": {
            if (!args.groups || !Array.isArray(args.groups)) {
              throw new Error("groups array is required");
            }
            if (typeof args.isPastPool !== "boolean") {
              throw new Error("isPastPool boolean is required");
            }

            const result = await convex.mutation(api.boards.createBoard, {
              words: args.words || undefined,
              groups: args.groups,
              date: args.date || undefined,
              isPastPool: args.isPastPool,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: true, boardId: result },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "update_board": {
            if (!args.boardId) {
              throw new Error("boardId is required");
            }

            const updateArgs = {};
            if (args.words) updateArgs.words = args.words;
            if (args.groups) updateArgs.groups = args.groups;
            if (args.date) updateArgs.date = args.date;
            if (typeof args.isPastPool === "boolean")
              updateArgs.isPastPool = args.isPastPool;

            const result = await convex.mutation(api.boards.updateBoard, {
              boardId: args.boardId,
              ...updateArgs,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: true, boardId: result },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case "delete_board": {
            if (!args.boardId) {
              throw new Error("boardId is required");
            }

            const result = await convex.mutation(api.boards.deleteBoard, {
              boardId: args.boardId,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}\n${error.stack || ""}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Convex Boards MCP server running on stdio");
  }
}

const server = new ConvexBoardsServer();
server.run().catch(console.error);

