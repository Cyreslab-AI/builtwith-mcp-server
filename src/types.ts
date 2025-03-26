/**
 * Types for the BuiltWith MCP server
 */

// BuiltWith API response types
export interface BuiltWithApiResponse {
  Results: BuiltWithResult[];
}

export interface BuiltWithResult {
  Domain: string;
  Paths: BuiltWithPath[];
}

export interface BuiltWithPath {
  Technologies: BuiltWithTechnology[];
  FirstIndexed?: string;
  LastIndexed?: string;
  Path?: string;
}

export interface BuiltWithTechnology {
  Name: string;
  Tag: string;
  Categories: string[];
  Description?: string;
  Link?: string;
  FirstDetected?: string;
  LastDetected?: string;
}

// MCP tool input/output types
export interface DomainLookupInput {
  domain: string;
  detailed?: boolean;
}

export interface TechnologySearchInput {
  technology: string;
  limit?: number;
}

// Formatted response types for better readability
export interface FormattedTechnology {
  name: string;
  category: string;
  description?: string;
  firstDetected?: string;
  lastDetected?: string;
  link?: string;
}

export interface FormattedDomainResult {
  domain: string;
  technologies: {
    [category: string]: FormattedTechnology[];
  };
  lastUpdated: string;
}

// Configuration type
export interface BuiltWithConfig {
  apiKey: string;
  baseUrl?: string;
}
