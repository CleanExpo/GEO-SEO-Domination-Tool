#!/usr/bin/env node

/**
 * GEO Builders MCP Server
 *
 * Discovers, previews, and applies modular builders into existing projects.
 * Next.js-first with SQLite/Postgres+Supabase baseline.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BuilderRegistry } from "./registry.js";
import { listBuilders } from "./tools/list-builders.js";
import { inspectBuilder } from "./tools/inspect-builder.js";
import type { BuilderListParams, BuilderInspectParams } from "./types.js";

const SERVER_NAME = "geo-builders-mcp";
const SERVER_VERSION = "0.1.0";

class GEOBuildersMCPServer {
  private server: Server;
  private registry: BuilderRegistry;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize builder registry
    this.registry = new BuilderRegistry({
      sources: [
        {
          type: "local",
          path: "./builders",
        },
      ],
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_builders",
          description: "List available builders from configured sources.",
          inputSchema: {
            type: "object",
            properties: {
              source: {
                type: "string",
                enum: ["local"],
                default: "local",
                description: "Source to list builders from",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Filter by tags",
              },
            },
            additionalProperties: false,
          },
        },
        {
          name: "inspect_builder",
          description:
            "Show manifest details and requirements for a specific builder.",
          inputSchema: {
            type: "object",
            required: ["id"],
            properties: {
              id: {
                type: "string",
                description: "Builder ID to inspect",
              },
            },
            additionalProperties: false,
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_builders": {
            const params = args as BuilderListParams;
            const result = await listBuilders(this.registry, params);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "inspect_builder": {
            const params = args as BuilderInspectParams;
            const result = await inspectBuilder(this.registry, params);
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
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling() {
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
    console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
  }
}

// Start the server
const server = new GEOBuildersMCPServer();
server.run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
