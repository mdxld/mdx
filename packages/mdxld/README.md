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
