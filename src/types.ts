/**
 * Types for the BuiltWith MCP server
 */

// Error object returned by BuiltWith APIs (HTTP 200 with an Errors array is common,
// e.g. bad/missing API key or insufficient plan/credits)
export interface BuiltWithApiError {
  Message: string;
  Code: number;
}

// BuiltWith API response types
export interface BuiltWithApiResponse {
  Results: BuiltWithResult[];
  Errors?: BuiltWithApiError[];
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
  /** Domain API v25 flag: exclude metadata (address, company names, etc.). Only applies when detailed=true. */
  noMeta?: boolean;
  /** Domain API v25 flag: strip personal names/emails. Only applies when detailed=true. */
  noPii?: boolean;
  /** Domain API v25 flag: hide technology description/link/tag/category fields. Only applies when detailed=true. */
  hideText?: boolean;
}

export interface TechnologySearchInput {
  /** Technology name to search for, e.g. "Shopify" or "Google Analytics" */
  technology: string;
  /** Additional technology names that matching sites must also use (max 16) */
  otherTechnologies?: string[];
  /** ISO 3166-1 alpha-2 country code(s), comma-separated for multiple, e.g. "US" or "AU,NZ" */
  country?: string;
  /** Only include sites detected as live using the technology since this date or phrase, e.g. "2016-01-20" or "30 Days Ago" */
  since?: string;
  /** Include metadata (company name, location, contacts, social, etc.) for each matching domain */
  includeMeta?: boolean;
  /** Pagination cursor: pass the nextOffset value from a previous response to fetch the next page */
  offset?: string;
  /** Maximum number of results to return from the fetched page (does not request additional pages) */
  limit?: number;
}

// Raw BuiltWith Lists API (lists12) response types
export interface BuiltWithListsApiResult {
  D: string;
  LOS?: string[];
  FD?: number;
  LD?: number;
  S?: number;
  SKU?: number;
  R?: number;
  F?: number;
  E?: number;
  A?: number;
  Q?: number;
  M?: number;
  U?: number;
  META?: Record<string, unknown>;
}

export interface BuiltWithListsApiResponse {
  NextOffset?: string;
  Results?: BuiltWithListsApiResult[];
  Errors?: BuiltWithApiError[];
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

export interface FormattedTechnologySearchDomain {
  domain: string;
  locations?: string[];
  firstDetected?: string;
  lastDetected?: string;
  monthlySpend?: number;
  skuCount?: number;
  estimatedRevenue?: number;
  socialFollowers?: number;
  employeeCount?: number;
  meta?: Record<string, unknown>;
}

export interface FormattedTechnologySearchResult {
  technology: string;
  domains: FormattedTechnologySearchDomain[];
  /** Pagination cursor for the next page of results, if any (omitted when there are no more results) */
  nextOffset?: string;
  hasMore: boolean;
}

// Configuration type
export interface BuiltWithConfig {
  apiKey: string;
  baseUrl?: string;
}
