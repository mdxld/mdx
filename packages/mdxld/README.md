# `mdxld` - Linked Data for Markdown & MDX

`mdxld` brings JSON‑LD style metadata to MDX documents using a YAML‑LD frontmatter syntax. By annotating content with `$id`, `$type` and related fields you can express rich relationships and schema.org data directly alongside your Markdown. The package will include parsers and tooling to consume this structured information.

## Features

- YAML‑LD frontmatter with support for `$context`, `$id`, `$type` and `$graph`.
- Schema definitions for common content types.
- CLI utilities and bundler plugins for processing MDXLD files.
- Works with `mdxai`, `mdxdb` and `mdxe` to provide a unified content pipeline.

## JSON-LD Context

The `context` folder contains `mdxld-context.jsonld`, which defines the MDXLD
namespace and core classes. Reference this file in your frontmatter to enable
terms like `Component` and `API`:

```yaml
---
$context: ./context/mdxld-context.jsonld
$type: Component
name: Button
framework: React
---
```

This context also includes `schema.org` so you can freely use standard schema
properties alongside the MDXLD vocabulary.

## Schema.org Types with $-prefix

`mdxld` provides TypeScript types for Schema.org entities with $-prefixed keys (especially `$type` instead of `@type`) for compatibility with YAML and ease of use in JS/TS. These types are generated from the `schema-dts` package.

### Usage

You can import the types directly:

```typescript
import { Person, Article, $, SchemaOrg } from 'mdxld';

// Use individual types
const person: Person = {
  $type: 'Person',
  name: 'John Doe',
  jobTitle: 'Software Engineer'
};

// Or use the namespace
const article: $.Article = {
  $type: 'Article',
  headline: 'How to use MDXLD',
  author: {
    $type: 'Person',
    name: 'Jane Smith'
  }
};

// Access original schema-dts types if needed
const originalType: SchemaOrg.Person = {
  '@type': 'Person',
  name: 'Original Format'
};
```

### YAML-LD Frontmatter Examples

Use these types in your MDX frontmatter:

```yaml
---
$context: https://schema.org
$type: BlogPosting
headline: Getting Started with MDXLD
author:
  $type: Person
  name: John Doe
  url: https://example.com/john
datePublished: '2023-05-21'
image:
  $type: ImageObject
  url: https://example.com/images/article.jpg
  width: 1200
  height: 630
---

# Getting Started with MDXLD

This article explains how to use MDXLD...
```

For product pages:

```yaml
---
$context: https://schema.org
$type: Product
name: Premium Widget
description: The best widget for all your needs
offers:
  $type: Offer
  price: 49.99
  priceCurrency: USD
  availability: https://schema.org/InStock
review:
  $type: Review
  reviewRating:
    $type: Rating
    ratingValue: 4.8
    bestRating: 5
  author:
    $type: Person
    name: Jane Customer
---
```

### Design Decisions

- **Naming Convention**: Types maintain the same names as in schema-dts but use the `Dollarize` utility type to transform `@`-prefixed keys to `$`-prefixed keys.
- **Export Approach**: Both individual exports and a namespace (`$`) approach are provided for flexibility.
- **Type Organization**: Common types are exported directly at the top level, while all types are available through the `$` namespace.
- **Original Types**: Original schema-dts types are re-exported as `SchemaOrg` for reference.
