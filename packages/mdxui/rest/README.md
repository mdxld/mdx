# @mdxui/rest

REST API implementation with HATEOAS and JSON-LD for MDXUI

## Features

- **HATEOAS Links**: Clickable links for API navigation and discovery
- **JSONAPI Structure**: Consistent resource representation
- **JSON-LD Semantics**: Linked data compatibility
- **Standardized Responses**: Header and footer objects in all responses
- **TypeScript Support**: Full type safety and autocompletion

## Installation

```bash
npm install @mdxui/rest
```

## Usage

```typescript
import { createApiResponse, RestApi } from '@mdxui/rest'

// Create a standardized API response
const response = createApiResponse(
  { message: 'Hello World' },
  { name: 'My API', version: '1.0.0', baseUrl: 'https://api.example.com' },
  { authenticated: true, usage: { requests: 1 } }
)

// Use the default REST API handler
const result = await RestApi.handleRequest('posts', '123')
```

## API Reference

### Types

- `RestApiResponse<T>` - Complete API response structure
- `ApiHeaderObject` - Header with navigation links
- `UserFooterObject` - Footer with auth and usage info
- `HateoasLinks` - HATEOAS navigation links
- `ResourceObject` - JSONAPI resource structure

### Functions

- `createApiResponse()` - Create standardized API responses
- `generateResourceLinks()` - Generate HATEOAS links for resources
- `generatePaginationLinks()` - Generate pagination links
- `responseToJsonLd()` - Convert responses to JSON-LD format
