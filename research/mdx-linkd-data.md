# MDXLD Implementation Roadmap

MDXLD aims to integrate multiple content paradigms into a single format, combining markdown text, structured linked data, code, and UI components. It uses **YAML-LD**-style frontmatter (with `$`-prefixed keys for JSON-LD keywords) to embed structured schema data, alongside standard MDX content (markdown with JSX and ES module imports). This roadmap outlines the tasks needed to fully implement MDXLD.

## Tooling Tasks

- [ ] **Schema-DTS Wrapper:** Create a TypeScript utility that wraps or extends Google's `schema-dts` library to support MDXLD's `$`-prefixed keys. The wrapper should map JSON-LD keys like `@context`, `@id`, `@type` to `$context`, `$id`, `$type`, etc., so that developers get type-safe autocompletion using MDXLD syntax. For example, an object with `$type: Person` should be recognized similarly to an object with `@type: Person` in schema-dts types. This may involve generating custom type definitions or a pre-processing step to convert MDXLD frontmatter into a schema-dts compliant object for validation.

- [ ] **YAML-LD Frontmatter Parser:** Implement a parser to read MDX frontmatter and interpret it as YAML-LD. This parser should recognize all `$`-prefixed JSON-LD keys (such as `$context`, `$id`, `$type`, `$graph`) and convert the YAML into a JSON-LD data structure in memory. It must handle nested objects (maintaining the `$` keys for inner objects as well) and merge multiple context sources if provided. The output should be a normalized JSON object that can be easily validated or injected into the MDX runtime. Include robust error handling for common mistakes (e.g. using `@type` instead of `$type`, or malformed YAML) and clear messages to help authors fix their frontmatter.

- [ ] **Frontmatter Schema Validator:** Integrate the parser with a validation layer to ensure the structured data adheres to the schema. Using the schema-dts types (or JSON Schema definitions derived from them), validate that properties and values in the frontmatter are allowed for the given `$type`. For example, if `$type: Article`, check that properties like `author` or `headline` are used correctly and are of the right data type. Custom rules should cover the extended MDXLD vocabulary as well. The validator should warn if required fields for certain types are missing (e.g., a custom `$type: API` might require an `endpoint` URL field by convention) or if unknown \$-keys or properties appear. This can be packaged as a reusable function or even a Remark plugin so that it can run during the build process.

- [ ] **MDX Bundler Integration:** Develop plugins or middleware to integrate MDXLD processing into build tools (Remark/Rehype, MDX compilers, static site generators). For example, a **Remark plugin** can intercept the frontmatter: it would parse and validate the YAML-LD, then remove it from the content (since MDX does not natively support frontmatter) while preserving the data for export. The plugin can then inject an export named `frontmatter` containing the parsed data, so that MDX content can use it (e.g. `frontmatter.title`) at runtime. Ensure this works with popular MDX bundlers:

  - **Vite:** Create a Vite plugin or use `@mdx-js/rollup` with our Remark plugin to handle `.mdx` files. The plugin should output both the JSX for content and an object for the frontmatter. We might auto-insert a JSON-LD `<script>` tag into the HTML during bundling, embedding the structured data for SEO purposes (configurable). Testing should confirm that HMR (hot reload) picks up frontmatter changes.
  - **Next.js:** Provide integration for Next.js (which uses Webpack or SWC for MDX). This could be a custom loader that applies the MDXLD Remark plugin. Additionally, document how to use MDXLD with Next.js MDX solutions (like next-mdx-remote or Contentlayer). For instance, if using Contentlayer, define a content schema that leverages our MDXLD validator so that Next can statically validate frontmatter and generate TypeScript types for it.
  - **Other Bundlers/SSGs:** Ensure compatibility with Gatsby (via gatsby-plugin-mdx), Docusaurus, or Astro by writing appropriate plugin wrappers or providing instructions. The goal is that any MDX pipeline can adopt MDXLD with minimal configuration.

- [ ] **Developer CLI & Tools:** Create a CLI tool (`mdxld-cli`) to assist authors and integrators:

  - **Validate Command:** A command to validate MDXLD files in a project (runs the parser and validator on all MDX files, reporting errors or schema mismatches). This helps catch issues early in CI pipelines or pre-commit hooks.
  - **Linting Rules:** Provide a set of lint rules (possibly as a **remark-lint** plugin) to enforce best practices. For example, warn if frontmatter is missing a `$context`, or if a custom `$type` is used without the proper context definition. Also enforce style conventions (like using `$` keys for reserved JSON-LD terms only, using lowercase for keys, etc.).
  - **Metadata Extraction:** A tool or command to extract structured data from MDXLD files. This could output a combined JSON-LD graph for the site, or individual JSON files per document. This is useful for generating sitemaps, feeding search indices, or just debugging the linked data.
  - **Interactive Preview:** Possibly extend the CLI with a dev server or preview mode that renders MDXLD files, showing both the rendered page and the extracted structured data. This would help authors see the effect of their frontmatter in real-time. (This could be achieved by a simple web app that reloads on file changes and prints out the JSON-LD in a panel.)
  - **VS Code Extension (future):** (Optional) As an extended goal, develop editor tooling like a VS Code extension that highlights frontmatter errors, provides autocomplete for \$ keys and schema terms (leveraging schema-dts types), and previews component output. This can significantly improve the authoring experience.

## Schema Ontology Development

To make MDXLD truly useful for modern web projects, we need to extend the standard schema.org ontology with concepts specific to web development and startups. This involves designing a **superset ontology** (an MDXLD vocabulary) that includes types and properties beyond schema.org, while remaining compatible with JSON-LD. The following tasks outline the ontology development:

- [ ] **MDXLD Vocabulary Design:** Define a namespace (e.g., `http://mdxld.org/vocab#`) and JSON-LD context for MDXLD's extended schema. This context will include all schema.org terms (by referencing `https://schema.org` as a base context) and add new terms. Ensure that `$context` in MDXLD frontmatter can simply include this one context to get both schema.org and MDXLD extensions. The context file should map new `$type` names and any custom property names to full IRIs. For example, it would map `"Component"` to `http://mdxld.org/vocab#Component`.

- [ ] **Core Extensions:** Extend schema.org with classes covering common domain-specific needs. Each of the following should be defined as a new **Class** in the MDXLD vocabulary (with an `rdfs:subClassOf` link to an appropriate schema.org class where possible):

  - [ ] **Component** – represents a UI component (e.g. a React or Vue component in a design system). Likely a subclass of `schema:Thing` or `schema:CreativeWork` (since a component can be seen as a piece of software or creative content). Define properties such as `framework` (what technology or framework the component is built with) and possibly `props` (to describe its API) under this class.
  - [ ] **Function** – represents a reusable code function or an API function. This could extend `schema:CreativeWork` or be linked to `schema:SoftwareSourceCode`. It should capture metadata like parameters, return type, and maybe complexity. For MDXLD, this allows documenting utility functions or algorithms with structured data.
  - [ ] **Module** – represents a code module or package (collection of functions or components). Could be a subclass of `schema:CreativeWork` or `schema:SoftwareSourceCode` as well. Properties might include `language` (programming language), `version`, or dependencies. This helps document libraries or modules in a structured way.
  - [ ] **API** – represents a web service API or endpoint. We might align this with the pending schema.org type `WebAPI` or use `schema:Service` as a base. An API type would have properties like `endpointURL`, `httpMethod`, `requiresAuth`, etc., to capture how to interact with it. This is useful for documenting REST/GraphQL endpoints or third-party services.
  - [ ] **App** – represents a software application (web or mobile app). Schema.org has `SoftwareApplication`, which can be our base class. In our extended ontology, _App_ can cover startup products (web apps, SaaS, mobile apps) with properties like `platform`, `pricingPlan`, or `launchDate`.
  - [ ] **Marketplace** – represents an online marketplace platform. This might be modeled as a subtype of `schema:WebSite` or `schema:Organization` (if focusing on the entity running it), but we can treat it as a distinct concept to capture marketplace-specific data (e.g., number of sellers, categories of products, commission fees).
  - [ ] **Directory** – represents a directory or listing (often a curated list of resources, companies, or individuals). Possibly extend `schema:ItemList` or `schema:DataCatalog`. Include properties for the domain of the directory (what it lists), and maybe number of entries, and an `entryType` to indicate what type of item it contains.
  - [ ] **Service** – (if not adequately covered by schema.org’s `Service`). We may refine `schema:Service` to better fit generic online services or consulting services. This could include properties like `serviceType` (category of service), `audience`, or `pricing`. Many startups offer services that aren’t software per se, so this class is useful for documenting those.

- [ ] **Enumerations & Data Types:** Identify any enumerations or data types needed for the above classes. For instance, a **Status** enum (Prototype, MVP, Beta, Production) for use in `Component` or `App` status; or a **Platform** enum for App (Web, iOS, Android). Define these in the vocabulary as enum types (schema.org style) or expected textual values, and include them in the context. Also consider if any new data types (like a code snippet type) are needed.

- [ ] **Property Definitions:** For each new class, list out the key properties (some mentioned above) and provide definitions. Many properties can reuse schema.org ones (e.g., `name`, `description`, `url`, `creator`). New properties (like `framework` for Component, or `endpointURL` for API) should be added to the context. Ensure each property either maps to a schema.org property or a new MDXLD IRI. Document the expected value types for each property (string, URL, Person, etc.).

- [ ] **Schema Documentation:** Create documentation for the extended ontology (similar to schema.org’s documentation). This should include a brief description of each new type and property, examples of usage, and how they link to schema.org. This will guide users in understanding and adopting the extended schema. For example, document that **Component** is an MDXLD type for UI components, subclass of CreativeWork, and list its properties and an example in YAML-LD.

- [ ] **Integration with Tools:** Update the MDXLD parser/validator to recognize the new types and properties. This might involve generating updated TypeScript types for the extended schema (possibly using `schema-dts-gen` on our custom ontology) so that the validator can check, for instance, that a `$type: Component` frontmatter can have a `framework` property (and that `framework` is a string). Provide these types in the schema-dts wrapper so that editors can autocomplete MDXLD-specific terms as well.

## Authoring Guidelines and Examples

To ensure MDXLD is used consistently, we will provide clear authoring guidelines. This helps content writers and developers create new schema types or use existing ones correctly in MDXLD.

- **Creating New Types:** If an author needs a schema type that isn't covered by schema.org or the built-in MDXLD vocabulary, they have two options: 1) propose it to the MDXLD ontology (for wider reuse), or 2) define it ad-hoc with a custom context. In MDXLD, new types can be created by adding a custom context entry in the frontmatter. Always include a `$context` that either points to a context file URL or inlines a mapping for your new terms. For example, to define a new type `CustomType`, you might use: `$context: { "CustomType": "http://yourdomain.com/schema/CustomType" }` along with `$type: CustomType`. This ensures that when transformed to JSON-LD, `CustomType` is understood as an IRI, not just a string. Whenever possible, base your new type on an existing schema.org class (to inherit its properties and meaning) – you can indicate this by documentation or by using an `$extends` key in the frontmatter (though `$extends` might be a custom extension of YAML-LD rather than a standard JSON-LD keyword).

- **Using \$id and Linking Data:** It’s a good practice to give an identity to the document’s subject using `$id`. The `$id` should be a URI (it could be a permalink of the page or a URN) that uniquely identifies the thing you are describing. This allows multiple MDXLD files to interlink their data (for example, a Person defined in one file could be referenced elsewhere by its ID). If no `$id` is provided, tools might default to using the file path or URL as the identifier. Always ensure that IDs are stable and unique across your content.

- **Reusing Schema.org Terms:** MDXLD encourages using existing schema.org properties whenever applicable. For example, use `name` and `description` for naming things, `url` for links, `author` for attribution, etc., exactly as you would in JSON-LD. You do **not** prefix normal schema.org properties with `$` (the `$` is only for JSON-LD keywords like \$type, \$id). If you need a custom property, you should add it to the context as well. For instance, if documenting a _Component_ you might want a `framework` property – you can extend the context to include `"framework": "http://mdxld.org/vocab#framework"` so that `framework` in your frontmatter is recognized. In general, prefer semantic keys that already exist in schema.org or your extended context rather than inventing too many ad-hoc keys.

- **Embedding Code and Components:** One of the strengths of MDXLD is that after the frontmatter, you can write normal MDX content – import React components or write JSX directly. When doing so, you can also utilize the frontmatter data within the content. The MDX bundler will make the frontmatter available (commonly as a `frontmatter` object) to your JSX. You can interpolate values, pass them as props, or even generate dynamic content from them. For example, you might use the frontmatter’s structured data to render a `<script type="application/ld+json">` in your component, or simply display metadata (as shown below). Keep MDX content focused on human-readable documentation, while the frontmatter carries the machine-readable data.

### Example: Extending an Existing Schema.org Type

Suppose we want to create a new content type **CustomArticle** for our documentation, which extends the schema.org `Article` type. We can achieve this by defining a custom context and using MDXLD frontmatter:

```mdx
---
$context:
  - https://schema.org
  - { 'CustomArticle': 'https://example.com/vocab#CustomArticle' }
$id: https://example.com/docs/custom-article-1
$type: CustomArticle
$extends: Article
title: 'My Custom Article'
author:
  $type: Person
  name: Alice
  url: https://example.com/alice
---

# {frontmatter.title}

Written by [{frontmatter.author.name}]({frontmatter.author.url}).
```

In the frontmatter above, we set `$context` to include both the core schema.org vocabulary and our custom vocabulary (where `CustomArticle` is defined). We give our article an `$id` (so it can be unambiguously referenced), declare its `$type` as **CustomArticle**, and even use a custom key `$extends` to indicate it conceptually extends schema\:Article. We then provide normal properties: a **title** (not prefixed, as it's a regular property) and an **author** object. The author itself is structured, with `$type: Person` and a name and URL.

In the MDX body, we use `{frontmatter.title}` to display the title, and we link the author’s name to their URL using Markdown syntax with the frontmatter values. This illustrates how the structured data in frontmatter can directly feed into the content. An MDXLD processor would also understand that _CustomArticle_ is a subtype of _Article_, and could include that information in the generated JSON-LD (e.g., using `@type`: "Article" as a supertype if needed for Linked Data consumers).

### Example: Documenting a UI Component with MDXLD

Now imagine we are documenting a UI component – a common task in design system docs. We’ll use the MDXLD extended type **Component** to semantically describe the component in the frontmatter, and then write the usage and description in the markdown/JSX body:

```mdx
---
$context: https://mdxld.org/context.jsonld
$type: Component
$name: 'Button'
$description: 'A reusable UI button component.'
framework: 'React'
status: 'Prototype'
---

import Button from './Button.js'

# {frontmatter.name} Component

Description: {frontmatter.description}

This component is built with **{frontmatter.framework}**.  
Status: {frontmatter.status}

Example usage:

<Button label='Click me' />
```

Here, the `$context` is set to an MDXLD context URL which is assumed to include the definition of **Component** and its properties (it likely extends schema.org internally, e.g., Component might subclass schema\:Thing or schema\:CreativeWork). We use `$type: Component` in the frontmatter to identify what kind of thing we're describing. We also provide `$name` and `$description` – these keys are prefixed with `$` here to indicate they are special (in JSON-LD, `@name` isn’t a thing, but we use `$name` as a convention for the name of the item; alternatively, we could just use `name` since schema\:Thing has **name** – in this example we show `$name` to illustrate prefix usage, but this could be context-dependent). Additionally, we include two custom properties: **framework** and **status**. These are not standard schema.org properties, but our MDXLD context knows about them (they might be defined as properties in the MDXLD vocab, applicable to Component).

In the content, we import the actual `Button` React component so we can display it. We then render the title of the component as a header, use the frontmatter’s description in text, and even pull in the framework and status metadata to display as part of the documentation. Finally, we show an example usage of the `<Button>` component in JSX.

This example demonstrates a few key points:

- We can mix **structured data** (the frontmatter block) with **executable code and JSX** (the body) seamlessly in one `.mdx` file.
- The frontmatter’s data (like framework or author or any property) can be referenced via the `frontmatter` object in the JSX, ensuring consistency between the metadata and what’s shown to users.
- By using `$type: Component`, a parsing tool could automatically generate a JSON-LD script for this page identifying it as a `Component` with the given properties. Search engines or other tools can then pick up that structured data.
- Authors are free to extend the schema by adding new context entries, but they should do so in a controlled way (preferably aligned with the project’s ontology). In this case, _framework_ and _status_ were used as plain keys assuming the MDXLD context covers them. If they were truly ad-hoc, we would have needed to augment `$context` with their definitions similar to how we did for CustomArticle.

With these guidelines and tooling in place, MDXLD will enable writing rich documentation and content that is both **human-readable** and **machine-readable**. Developers can document their APIs, components, and services in MDX, while automatically generating structured data that can power knowledge graphs, search engine snippets, or cross-document linking. The above roadmap tasks will ensure the MDXLD ecosystem has robust support for parsing, validation, integration with build systems, an extended schema for modern needs, and clear guidance for authors creating content.

**Sources:** The concept of MDXLD builds upon MDX’s capability to blend Markdown and JSX, and on Linked Data principles using JSON-LD (adapted to YAML frontmatter with `$` keys as per YAML-LD conventions). We leverage existing tools like _schema-dts_ for schema.org types and MDX plugins to export frontmatter data to the runtime. These foundations will guide the implementation of the features outlined in this roadmap.
