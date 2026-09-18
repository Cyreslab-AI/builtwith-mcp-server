import { Server, ProtocolError, ProtocolErrorCode } from "@modelcontextprotocol/server";
import { BuiltWithApiClient } from '../api-client.js';
import { DomainLookupHandler } from './domain-lookup.js';
import { DomainLookupInput, TechnologySearchInput } from '../types.js';

/**
 * Register and handle MCP tools for the BuiltWith server
 */
export function registerTools(server: Server, apiClient: BuiltWithApiClient): void {
  const domainLookupHandler = new DomainLookupHandler(apiClient);

  // Register available tools
  server.setRequestHandler('tools/list', async (): Promise<any> => ({
    tools: [
      {
        name: 'domain_lookup',
        description: 'Get technology stack information for a specific domain',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Domain to analyze (e.g., example.com)'
            },
            detailed: {
              type: 'boolean',
              description: 'Whether to return detailed information'
            }
          },
          required: ['domain']
        }
      },
      {
        name: 'technology_search',
        description: 'Find domains using a specific technology',
        inputSchema: {
          type: 'object',
          properties: {
            technology: {
              type: 'string',
              description: 'Technology name to search for'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return'
            }
          },
          required: ['technology']
        }
      }
    ]
  }));

  // Handle tool calls
  server.setRequestHandler('tools/call', async (request): Promise<any> => {
    try {
      switch (request.params.name) {
        case 'domain_lookup':
          return await handleDomainLookup(
            request.params.arguments as unknown as DomainLookupInput,
            domainLookupHandler
          );

        case 'technology_search':
          return await handleTechnologySearch(
            request.params.arguments as unknown as TechnologySearchInput,
            apiClient
          );

        default:
          throw new ProtocolError(
            ProtocolErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    } catch (error) {
      if (error instanceof ProtocolError) {
        throw error;
      }

      // Convert regular errors to MCP errors
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ProtocolError(ProtocolErrorCode.InternalError, message);
    }
  });
}

/**
 * Handle domain lookup tool calls
 */
async function handleDomainLookup(
  params: DomainLookupInput,
  handler: DomainLookupHandler
) {
  try {
    const result = await handler.lookupDomain(params);
    const textResult = handler.formatResultAsText(result);

    return {
      content: [
        {
          type: 'text',
          text: textResult
        },
        {
          type: 'text',
          text: handler.formatResultAsJson(result),
          mimeType: 'application/json'
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}

/**
 * Handle technology search tool calls
 */
async function handleTechnologySearch(
  params: TechnologySearchInput,
  apiClient: BuiltWithApiClient
) {
  try {
    // This is a placeholder since the actual implementation would depend on
    // the specific BuiltWith API capabilities
    return {
      content: [
        {
          type: 'text',
          text: 'Technology search is not implemented in this version. This feature requires a higher-tier BuiltWith API subscription.'
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
}
