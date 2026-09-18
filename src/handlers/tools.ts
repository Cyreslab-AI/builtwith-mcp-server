import { Server, ProtocolError, ProtocolErrorCode } from "@modelcontextprotocol/server";
import { BuiltWithApiClient } from '../api-client.js';
import { DomainLookupHandler } from './domain-lookup.js';
import { TechnologySearchHandler } from './technology-search.js';
import { DomainLookupInput, TechnologySearchInput } from '../types.js';

// ---------------------------------------------------------------------------
// outputSchema fragments mirroring FormattedDomainResult and
// FormattedTechnologySearchResult from ../types.ts. Both handlers always
// return a plain object at the root (technology_search's `domains` array is
// nested under a `domains` key, never the structuredContent root itself),
// so wrapping is inherent to the existing shape rather than something added
// here.
// ---------------------------------------------------------------------------

const FORMATTED_TECHNOLOGY_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    category: { type: 'string' },
    description: { type: 'string' },
    firstDetected: { type: 'string' },
    lastDetected: { type: 'string' },
    link: { type: 'string' }
  },
  required: ['name', 'category']
};

const DOMAIN_LOOKUP_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    domain: { type: 'string' },
    technologies: {
      type: 'object',
      description: 'Technologies detected for the domain, grouped by category name',
      additionalProperties: {
        type: 'array',
        items: FORMATTED_TECHNOLOGY_SCHEMA
      }
    },
    lastUpdated: { type: 'string' }
  },
  required: ['domain', 'technologies', 'lastUpdated']
};

const TECHNOLOGY_SEARCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    technology: { type: 'string' },
    domains: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          domain: { type: 'string' },
          locations: { type: 'array', items: { type: 'string' } },
          firstDetected: { type: 'string' },
          lastDetected: { type: 'string' },
          monthlySpend: { type: 'number' },
          skuCount: { type: 'number' },
          estimatedRevenue: { type: 'number' },
          socialFollowers: { type: 'number' },
          employeeCount: { type: 'number' },
          meta: { type: 'object' }
        },
        required: ['domain']
      }
    },
    nextOffset: { type: 'string', description: 'Pagination cursor for the next page of results, if any' },
    hasMore: { type: 'boolean' }
  },
  required: ['technology', 'domains', 'hasMore']
};

/**
 * Register and handle MCP tools for the BuiltWith server
 */
export function registerTools(server: Server, apiClient: BuiltWithApiClient): void {
  const domainLookupHandler = new DomainLookupHandler(apiClient);
  const technologySearchHandler = new TechnologySearchHandler(apiClient);

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
              description: 'Whether to return detailed information (uses the paid Domain API instead of the free lookup)'
            },
            noMeta: {
              type: 'boolean',
              description: 'When detailed=true, exclude metadata (company name, address, etc.) to reduce response size/cost'
            },
            noPii: {
              type: 'boolean',
              description: 'When detailed=true, strip personal names/emails from the response'
            },
            hideText: {
              type: 'boolean',
              description: 'When detailed=true, hide technology description, link, tag and category fields to reduce response size/cost'
            }
          },
          required: ['domain']
        },
        outputSchema: DOMAIN_LOOKUP_OUTPUT_SCHEMA,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true
        }
      },
      {
        name: 'technology_search',
        description: 'Find domains using a specific technology, via the BuiltWith Lists API. Supports filtering by additional required technologies, country, and recency, plus pagination for large result sets. Note: this requires a BuiltWith plan with list credits (Pro tier or above).',
        inputSchema: {
          type: 'object',
          properties: {
            technology: {
              type: 'string',
              description: 'Technology name to search for (e.g., "Shopify", "Google Analytics")'
            },
            otherTechnologies: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional additional technology names that matching sites must also use (max 16)'
            },
            country: {
              type: 'string',
              description: 'Optional ISO 3166-1 alpha-2 country code(s) to filter by, comma-separated for multiple (e.g., "US" or "AU,NZ")'
            },
            since: {
              type: 'string',
              description: 'Optional filter to only include live sites detected using the technology since this date or phrase (e.g., "2016-01-20" or "30 Days Ago")'
            },
            includeMeta: {
              type: 'boolean',
              description: 'Whether to include metadata (company name, location, contacts, social, etc.) for each matching domain'
            },
            offset: {
              type: 'string',
              description: 'Pagination cursor. Pass the nextOffset value from a previous response to fetch the next page of results'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return from the fetched page (does not request additional pages)'
            }
          },
          required: ['technology']
        },
        outputSchema: TECHNOLOGY_SEARCH_OUTPUT_SCHEMA,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true
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
            technologySearchHandler
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
      ],
      // `result` (FormattedDomainResult) is always a plain object at the
      // root ({ domain, technologies, lastUpdated }), never a bare array.
      structuredContent: result as unknown as Record<string, unknown>
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
  handler: TechnologySearchHandler
) {
  try {
    const result = await handler.searchTechnology(params);
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
      ],
      // `result` (FormattedTechnologySearchResult) is always a plain object
      // at the root ({ technology, domains, nextOffset?, hasMore }); its
      // `domains` array lives under a named key, never at the root itself.
      structuredContent: result as unknown as Record<string, unknown>
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
