#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BuiltWithApiClient } from './api-client.js';
import { registerTools } from './handlers/tools.js';
import { BuiltWithConfig } from './types.js';

/**
 * Main entry point for the BuiltWith MCP server
 */
async function main() {
  try {
    // Get API key from environment variables
    const apiKey = process.env.BUILTWITH_API_KEY;
    if (!apiKey) {
      console.error('Error: BUILTWITH_API_KEY environment variable is required');
      process.exit(1);
    }

    // Create API client
    const config: BuiltWithConfig = {
      apiKey,
      baseUrl: process.env.BUILTWITH_API_URL
    };
    const apiClient = new BuiltWithApiClient(config);

    // Initialize MCP server
    const server = new Server(
      {
        name: 'builtwith-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Register tools
    registerTools(server, apiClient);

    // Set up error handling
    server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await server.close();
      process.exit(0);
    });

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('BuiltWith MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
