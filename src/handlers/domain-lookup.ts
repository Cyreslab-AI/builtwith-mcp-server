import { BuiltWithApiClient } from '../api-client.js';
import { DomainLookupInput, FormattedDomainResult } from '../types.js';

/**
 * Handler for domain lookup operations
 */
export class DomainLookupHandler {
  private apiClient: BuiltWithApiClient;

  constructor(apiClient: BuiltWithApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Look up technology information for a specific domain
   * @param params Domain lookup parameters
   * @returns Formatted domain result with technology information
   */
  async lookupDomain(params: DomainLookupInput): Promise<FormattedDomainResult> {
    try {
      if (!params.domain) {
        throw new Error('Domain parameter is required');
      }

      return await this.apiClient.getDomainInfo(params.domain, params.detailed || false);
    } catch (error) {
      // Re-throw with a more user-friendly message
      if (error instanceof Error) {
        throw new Error(`Failed to lookup domain: ${error.message}`);
      }
      throw new Error('An unknown error occurred during domain lookup');
    }
  }

  /**
   * Format the domain result into a human-readable text
   * @param result Formatted domain result
   * @returns Human-readable text representation
   */
  formatResultAsText(result: FormattedDomainResult): string {
    let output = `# Technology Stack for ${result.domain}\n\n`;

    // Add last updated timestamp
    output += `Last updated: ${new Date(result.lastUpdated).toLocaleString()}\n\n`;

    // Process each technology category
    const categories = Object.keys(result.technologies).sort();

    if (categories.length === 0) {
      output += 'No technologies detected for this domain.\n';
      return output;
    }

    for (const category of categories) {
      output += `## ${category}\n\n`;

      const technologies = result.technologies[category];
      for (const tech of technologies) {
        output += `- **${tech.name}**`;

        if (tech.description) {
          output += `: ${tech.description}`;
        }

        if (tech.firstDetected) {
          output += ` (First detected: ${new Date(tech.firstDetected).toLocaleDateString()})`;
        }

        output += '\n';
      }

      output += '\n';
    }

    return output;
  }

  /**
   * Format the domain result as JSON
   * @param result Formatted domain result
   * @returns JSON string representation
   */
  formatResultAsJson(result: FormattedDomainResult): string {
    return JSON.stringify(result, null, 2);
  }
}
