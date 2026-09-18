import axios, { AxiosInstance } from 'axios';
import {
  BuiltWithApiResponse,
  BuiltWithConfig,
  BuiltWithListsApiResponse,
  DomainLookupInput,
  FormattedDomainResult,
  FormattedTechnology,
  FormattedTechnologySearchResult,
  TechnologySearchInput
} from './types.js';

// Current BuiltWith Domain API version (see https://api.builtwith.com/domain-api).
// Bumped from the previously hardcoded v13, which is stale and risks missing
// fields (e.g. technology `Id`/`confidence`, `company_reg`) or deprecation.
const DOMAIN_API_VERSION = 'v25';

/**
 * Client for interacting with the BuiltWith API
 */
export class BuiltWithApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: BuiltWithConfig) {
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.builtwith.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get technology information for a specific domain
   * @param params Domain lookup parameters
   * @returns Formatted domain result with technology information
   */
  async getDomainInfo(params: DomainLookupInput): Promise<FormattedDomainResult> {
    try {
      // Normalize domain (remove protocol, www, trailing slashes)
      const normalizedDomain = this.normalizeDomain(params.domain);

      // Determine which API endpoint to use based on detailed flag
      const endpoint = params.detailed ? `/${DOMAIN_API_VERSION}/api.json` : '/free1/api.json';

      const queryParams: Record<string, string> = {
        KEY: this.apiKey,
        LOOKUP: normalizedDomain
      };

      // NOMETA/NOPII/HIDETEXT are Domain API (v25) flags for trimming response
      // size/cost; they are not documented for the free lookup endpoint.
      if (params.detailed) {
        if (params.noMeta) queryParams.NOMETA = 'yes';
        if (params.noPii) queryParams.NOPII = 'yes';
        if (params.hideText) queryParams.HIDETEXT = 'yes';
      }

      const response = await this.client.get<BuiltWithApiResponse>(endpoint, {
        params: queryParams
      });

      this.throwIfApiErrors(response.data.Errors);

      if (!response.data.Results || response.data.Results.length === 0) {
        throw new Error(`No results found for domain: ${params.domain}`);
      }

      return this.formatDomainResult(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key or authentication failed');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`BuiltWith API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Search for domains using a specific technology, via the BuiltWith Lists API
   * (https://api.builtwith.com/lists-api). Note: Lists API access requires a
   * BuiltWith plan that includes list credits (Pro tier or above) - a key
   * without that access will get a clear authorization error back from
   * BuiltWith itself (see throwIfApiErrors), not a "not implemented" stub.
   * @param params Technology search parameters
   * @returns Formatted list of domains using the specified technology, with pagination info
   */
  async searchByTechnology(params: TechnologySearchInput): Promise<FormattedTechnologySearchResult> {
    try {
      if (!params.technology) {
        throw new Error('Technology parameter is required');
      }

      const queryParams: Record<string, string> = {
        KEY: this.apiKey,
        TECH: this.normalizeTechnologyName(params.technology)
      };

      if (params.otherTechnologies && params.otherTechnologies.length > 0) {
        queryParams.OTHERTECHS = params.otherTechnologies
          .slice(0, 16)
          .map((tech) => this.normalizeTechnologyName(tech))
          .join(',');
      }

      if (params.country) queryParams.COUNTRY = params.country;
      if (params.since) queryParams.SINCE = params.since;
      if (params.includeMeta) queryParams.META = 'yes';
      if (params.offset) queryParams.OFFSET = params.offset;

      const response = await this.client.get<BuiltWithListsApiResponse>('/lists12/api.json', {
        params: queryParams
      });

      this.throwIfApiErrors(response.data.Errors);

      return this.formatTechnologySearchResult(params.technology, response.data, params.limit);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key or authentication failed');
        } else if (error.response?.status === 403) {
          throw new Error(
            'Access denied by BuiltWith. The Lists API requires a plan with list credits (Pro tier or above).'
          );
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`BuiltWith API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Throw a descriptive error if the BuiltWith API returned a well-formed
   * error payload. BuiltWith commonly responds with HTTP 200 and an `Errors`
   * array for things like a bad/missing API key or an insufficient plan
   * (e.g. `{"Errors":[{"Message":"...","Code":-2}]}`), rather than a 4xx.
   */
  private throwIfApiErrors(errors?: { Message: string; Code: number }[]): void {
    if (errors && errors.length > 0) {
      const message = errors.map((e) => `${e.Message} (code ${e.Code})`).join('; ');
      throw new Error(`BuiltWith API error: ${message}`);
    }
  }

  /**
   * Format the raw Lists API response into a more readable structure
   * @param technology Technology name that was searched for
   * @param apiResponse Raw BuiltWith Lists API response
   * @param limit Optional cap on the number of domains returned from this page
   * @returns Formatted technology search result
   */
  private formatTechnologySearchResult(
    technology: string,
    apiResponse: BuiltWithListsApiResponse,
    limit?: number
  ): FormattedTechnologySearchResult {
    const rawResults = apiResponse.Results || [];
    const limitedResults =
      typeof limit === 'number' && limit > 0 ? rawResults.slice(0, limit) : rawResults;

    const domains = limitedResults.map((result) => ({
      domain: result.D,
      locations: result.LOS,
      firstDetected: typeof result.FD === 'number' ? new Date(result.FD * 1000).toISOString() : undefined,
      lastDetected: typeof result.LD === 'number' ? new Date(result.LD * 1000).toISOString() : undefined,
      monthlySpend: result.S,
      skuCount: result.SKU,
      estimatedRevenue: result.R,
      socialFollowers: result.F,
      employeeCount: result.E,
      meta: result.META
    }));

    // BuiltWith uses the literal string "END" to signal the last page.
    const nextOffset =
      apiResponse.NextOffset && apiResponse.NextOffset !== 'END' ? apiResponse.NextOffset : undefined;

    return {
      technology,
      domains,
      nextOffset,
      hasMore: Boolean(nextOffset)
    };
  }

  /**
   * Normalize a technology name for the Lists API, which expects spaces
   * replaced with dashes (e.g. "Google Analytics" -> "Google-Analytics")
   * @param technology Technology name to normalize
   * @returns Normalized technology name
   */
  private normalizeTechnologyName(technology: string): string {
    return technology.trim().replace(/\s+/g, '-');
  }

  /**
   * Format the raw API response into a more readable structure
   * @param apiResponse Raw BuiltWith API response
   * @returns Formatted domain result
   */
  private formatDomainResult(apiResponse: BuiltWithApiResponse): FormattedDomainResult {
    const result = apiResponse.Results[0];
    const technologies: { [category: string]: FormattedTechnology[] } = {};

    // Process all technologies from all paths
    for (const path of result.Paths) {
      for (const tech of path.Technologies) {
        // Group technologies by category
        for (const category of tech.Categories) {
          if (!technologies[category]) {
            technologies[category] = [];
          }

          // Add technology to its category if not already present
          const formattedTech: FormattedTechnology = {
            name: tech.Name,
            category: category,
            description: tech.Description,
            firstDetected: tech.FirstDetected,
            lastDetected: tech.LastDetected,
            link: tech.Link
          };

          // Check if this technology is already in the category
          const existingTech = technologies[category].find(t => t.name === tech.Name);
          if (!existingTech) {
            technologies[category].push(formattedTech);
          }
        }
      }
    }

    return {
      domain: result.Domain,
      technologies: technologies,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Normalize a domain by removing protocol, www, and trailing slashes
   * @param domain Domain to normalize
   * @returns Normalized domain
   */
  private normalizeDomain(domain: string): string {
    let normalized = domain.trim().toLowerCase();

    // Remove protocol (http://, https://)
    normalized = normalized.replace(/^(https?:\/\/)/, '');

    // Remove www.
    normalized = normalized.replace(/^www\./, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Remove path and query parameters
    normalized = normalized.split('/')[0].split('?')[0];

    return normalized;
  }
}
