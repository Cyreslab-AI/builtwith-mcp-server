import axios, { AxiosInstance } from 'axios';
import {
  BuiltWithApiResponse,
  BuiltWithConfig,
  FormattedDomainResult,
  FormattedTechnology
} from './types.js';

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
   * @param domain Domain to analyze (e.g., example.com)
   * @param detailed Whether to return detailed information
   * @returns Formatted domain result with technology information
   */
  async getDomainInfo(domain: string, detailed: boolean = false): Promise<FormattedDomainResult> {
    try {
      // Normalize domain (remove protocol, www, trailing slashes)
      const normalizedDomain = this.normalizeDomain(domain);

      // Determine which API endpoint to use based on detailed flag
      const endpoint = detailed ? '/v13/api.json' : '/free1/api.json';

      const response = await this.client.get<BuiltWithApiResponse>(endpoint, {
        params: {
          KEY: this.apiKey,
          LOOKUP: normalizedDomain
        }
      });

      if (!response.data.Results || response.data.Results.length === 0) {
        throw new Error(`No results found for domain: ${domain}`);
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
   * Search for domains using a specific technology
   * @param technology Technology name to search for
   * @param limit Maximum number of results to return
   * @returns Array of domains using the specified technology
   */
  async searchByTechnology(technology: string, limit: number = 10): Promise<string[]> {
    // Note: This is a placeholder. The actual implementation would depend on
    // the specific BuiltWith API endpoint for technology search, which may
    // require a different subscription level.
    throw new Error('Technology search is not implemented in this version');
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
