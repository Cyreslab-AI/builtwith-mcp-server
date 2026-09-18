[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/cyreslab-ai-builtwith-mcp-server-badge.png)](https://mseep.ai/app/cyreslab-ai-builtwith-mcp-server)

# BuiltWith MCP Server

A Model Context Protocol (MCP) server that provides tools for querying the BuiltWith API to get information about website technology stacks. This server can be used with any AI assistant that supports the Model Context Protocol.

[![GitHub](https://img.shields.io/badge/GitHub-Cyreslab--AI-blue)](https://github.com/Cyreslab-AI)
[![Contact](https://img.shields.io/badge/Contact-contact%40cyreslab.ai-green)](mailto:contact@cyreslab.ai)

## Features

- **Domain Lookup**: Get detailed information about the technologies used by a specific domain
- **Technology Search**: Find domains across the web that use a specific technology, via the BuiltWith Lists API
- **Technology Categorization**: View technologies grouped by categories (Analytics, CMS, Frameworks, etc.)
- **Detailed Information**: Access descriptions, detection dates, and links for each technology

## Prerequisites

- Node.js 20 or higher
- A BuiltWith API key (get one at [BuiltWith API](https://builtwith.com/api))

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/Cyreslab-AI/builtwith-mcp-server.git
   cd builtwith-mcp-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

The server requires a BuiltWith API key to function. You can provide this through environment variables when running the server or by adding it to your MCP settings configuration.

### Running Directly

You can run the server directly with the API key as an environment variable:

```bash
BUILTWITH_API_KEY=your-api-key-here node build/index.js
```

### MCP Settings Configuration

Add the server to your MCP client's settings file. The exact location depends on which MCP-compatible AI assistant you're using.

#### Generic MCP Configuration

Most MCP clients follow a similar configuration pattern:

```json
{
  "mcpServers": {
    "builtwith": {
      "command": "node",
      "args": ["/absolute/path/to/builtwith-mcp-server/build/index.js"],
      "env": {
        "BUILTWITH_API_KEY": "your-api-key-here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### Claude-Specific Configuration

For Claude Desktop:

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "builtwith": {
      "command": "node",
      "args": ["/path/to/builtwith-mcp-server/build/index.js"],
      "env": {
        "BUILTWITH_API_KEY": "your-api-key-here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

For Claude Developer Tools:

```json
// ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json (macOS)
// %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json (Windows)
{
  "mcpServers": {
    "builtwith": {
      "command": "node",
      "args": ["/path/to/builtwith-mcp-server/build/index.js"],
      "env": {
        "BUILTWITH_API_KEY": "your-api-key-here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Usage

Once the server is configured and running, you can use it with any MCP-compatible AI assistant to query website technology stacks.

### Example Queries

With your MCP-compatible AI assistant, you can ask questions like:

- "What technologies does example.com use?"
- "Show me the technology stack for github.com"
- "What analytics tools does amazon.com use?"
- "What frameworks are used by netflix.com?"
- "Is wordpress.com using any e-commerce technologies?"
- "Find sites using Shopify"
- "Which sites in Australia use Google Analytics and Optimizely?"

### Programmatic Usage

For developers who want to integrate directly with the server:

The server communicates using the Model Context Protocol over stdio. You can also use the API client directly in your Node.js applications:

```typescript
import { BuiltWithApiClient } from "./src/api-client.js";

const client = new BuiltWithApiClient({
  apiKey: "your-api-key-here",
});

const result = await client.getDomainInfo("example.com");
console.log(result);
```

### Available Tools

The server provides the following tools:

#### domain_lookup

Get technology stack information for a specific domain. Uses the free BuiltWith lookup by default, or the paid [Domain API](https://api.builtwith.com/domain-api) (currently v25) when `detailed` is set.

Parameters:

- `domain` (required): Domain to analyze (e.g., example.com)
- `detailed` (optional): Whether to return detailed information (boolean)
- `noMeta` (optional): When `detailed` is true, exclude metadata (company name, address, etc.) to reduce response size/cost (boolean)
- `noPii` (optional): When `detailed` is true, strip personal names/emails from the response (boolean)
- `hideText` (optional): When `detailed` is true, hide technology description, link, tag and category fields to reduce response size/cost (boolean)

#### technology_search

Find domains using a specific technology, via the BuiltWith [Lists API](https://api.builtwith.com/lists-api). This calls BuiltWith's real Lists endpoint and supports pagination for large result sets.

Note: the Lists API is billed through the same BuiltWith API key as the Domain API, but requires a plan that includes list credits (Pro tier or above). Calling it with a key that doesn't have that access returns a clear authorization/upgrade error from BuiltWith itself, surfaced as the tool's error message.

Parameters:

- `technology` (required): Technology name to search for (e.g., "Shopify", "Google Analytics")
- `otherTechnologies` (optional): Additional technology names that matching sites must also use, max 16 (array of strings)
- `country` (optional): ISO 3166-1 alpha-2 country code(s) to filter by, comma-separated for multiple, e.g. "US" or "AU,NZ" (string)
- `since` (optional): Only include live sites detected using the technology since this date or phrase, e.g. "2016-01-20" or "30 Days Ago" (string)
- `includeMeta` (optional): Include metadata (company name, location, contacts, social, etc.) for each matching domain (boolean)
- `offset` (optional): Pagination cursor - pass the `nextOffset` value from a previous response to fetch the next page (string)
- `limit` (optional): Maximum number of results to return from the fetched page; does not request additional pages (number)

## Development

### Running in Development Mode

```bash
npm run dev
```

### Project Structure

- `src/index.ts`: Main server entry point
- `src/api-client.ts`: BuiltWith API client
- `src/handlers/`: Request handlers
- `src/types.ts`: Type definitions

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

For major changes, please open an issue first to discuss what you would like to change.

## Support

If you encounter any issues or have questions, please:

- Open an issue on [GitHub](https://github.com/Cyreslab-AI/builtwith-mcp-server/issues)
- Contact us at [contact@cyreslab.ai](mailto:contact@cyreslab.ai)

## License

MIT License

Copyright (c) 2025 Cyreslab-AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
