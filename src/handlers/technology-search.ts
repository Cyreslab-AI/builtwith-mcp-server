import { BuiltWithApiClient } from '../api-client.js';
import { FormattedTechnologySearchResult, TechnologySearchInput } from '../types.js';

/**
 * Handler for technology search operations (BuiltWith Lists API)
 */
export class TechnologySearchHandler {
  private apiClient: BuiltWithApiClient;

  constructor(apiClient: BuiltWithApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Search for domains using a specific technology
   * @param params Technology search parameters
   * @returns Formatted technology search result
   */
  async searchTechnology(params: TechnologySearchInput): Promise<FormattedTechnologySearchResult> {
    try {
      if (!params.technology) {
        throw new Error('Technology parameter is required');
      }

      return await this.apiClient.searchByTechnology(params);
    } catch (error) {
      // Re-throw with a more user-friendly message
      if (error instanceof Error) {
        throw new Error(`Failed to search for technology: ${error.message}`);
      }
      throw new Error('An unknown error occurred during technology search');
    }
  }

  /**
   * Format the technology search result into a human-readable text
   * @param result Formatted technology search result
   * @returns Human-readable text representation
   */
  formatResultAsText(result: FormattedTechnologySearchResult): string {
    let output = `# Sites Using ${result.technology}\n\n`;

    if (result.domains.length === 0) {
      output += 'No matching domains found.\n';
      return output;
    }

    output += `Found ${result.domains.length} domain(s) on this page.\n\n`;

    for (const site of result.domains) {
      output += `- **${site.domain}**`;

      const details: string[] = [];
      if (site.firstDetected) {
        details.push(`first detected ${new Date(site.firstDetected).toLocaleDateString()}`);
      }
      if (site.lastDetected) {
        details.push(`last detected ${new Date(site.lastDetected).toLocaleDateString()}`);
      }
      if (typeof site.monthlySpend === 'number') {
        details.push(`~$${site.monthlySpend}/mo est. tech spend`);
      }

      if (details.length > 0) {
        output += ` (${details.join(', ')})`;
      }

      output += '\n';
    }

    output += '\n';

    if (result.hasMore && result.nextOffset) {
      output += `More results are available. Pass offset="${result.nextOffset}" to fetch the next page.\n`;
    }

    return output;
  }

  /**
   * Format the technology search result as JSON
   * @param result Formatted technology search result
   * @returns JSON string representation
   */
  formatResultAsJson(result: FormattedTechnologySearchResult): string {
    return JSON.stringify(result, null, 2);
  }
}
