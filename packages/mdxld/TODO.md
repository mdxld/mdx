# `mdxld` Package TODO List

This document outlines the development tasks and sequence for the `mdxld` package. `mdxld` aims to integrate linked data principles (JSON-LD via YAML-LD) directly into MDX frontmatter, enabling rich, structured, and machine-readable content. This plan is based on `research/mdx-linkd-data.md` and the core goals of `mdxld`.

## Phase 1: Core Functionality - YAML-LD Frontmatter Processing

This phase focuses on the fundamental parsing and interpretation of MDXLD frontmatter.

- [ ] **Task: Implement YAML-LD Frontmatter Parser:**
  - [ ] Develop a parser that reads MDX frontmatter (YAML).
  - [ ] Recognize and correctly interpret `$`-prefixed JSON-LD keywords (e.g., `$context`, `$id`, `$type`, `$graph`).
  - [ ] Convert the YAML frontmatter into an in-memory JSON-LD data structure.
  - [ ] Handle nested objects and arrays, preserving `$`-prefixed keys.
  - [ ] Support merging of multiple context sources if provided in `$context`.
  - [ ] Implement robust error handling for malformed YAML or incorrect `$`-key usage.

## Phase 2: Schema Ontology Development (MDXLD Vocabulary)

This phase focuses on defining and documenting an extended schema that builds upon schema.org, as detailed in `research/mdx-linkd-data.md`.

- [ ] **Task: Design MDXLD Namespace and Core Context:**
  - [ ] Define a unique namespace for MDXLD vocabulary (e.g., `http://mdxld.org/vocab#`).
  - [ ] Create a primary JSON-LD context file (`mdxld-context.jsonld`) that includes schema.org and MDXLD-specific terms.
- [ ] **Task: Define Core MDXLD Extended Classes:**
  - [ ] **`Component`**: For UI components (subclass of `schema:Thing` or `schema:CreativeWork`).
    - Properties: `framework` (e.g., React, Vue), `propsSchema` (link to JSON schema for props).
  - [ ] **`Function`**: For code functions/API functions (subclass of `schema:CreativeWork`).
    - Properties: `parameters`, `returnType`, `programmingLanguage`.
  - [ ] **`Module`**: For code modules/packages (subclass of `schema:SoftwareSourceCode` or `schema:CreativeWork`).
    - Properties: `version`, `dependencies`, `programmingLanguage`.
  - [ ] **`API`**: For web service APIs/endpoints (align with `schema:WebAPI` or `schema:Service`).
    - Properties: `endpointURL`, `httpMethod`, `requestSchema`, `responseSchema`, `requiresAuth`.
  - [ ] **`App`**: For software applications (subclass of `schema:SoftwareApplication`).
    - Properties: `platform` (Web, iOS, Android), `pricingPlan`, `launchDate`.
  - [ ] **`Marketplace`**: For online marketplace platforms (subclass of `schema:WebSite` or `schema:Organization`).
    - Properties: `sellerCount`, `productCategories`, `commissionModel`.
  - [ ] **`Directory`**: For curated listings/directories (subclass of `schema:ItemList` or `schema:DataCatalog`).
    - Properties: `entryType`, `domainFocus`, `entryCount`.
  - [ ] **`Service`**: For generic online or consulting services (refining `schema:Service`).
    - Properties: `serviceType`, `audience`, `pricingModel`.
- [ ] **Task: Define Properties and Enumerations:**
  - [ ] For each new class, define specific properties (reusing schema.org where possible).
  - [ ] Create necessary enumerations (e.g., `StatusType`: Prototype, MVP, Beta, Production; `PlatformType`: Web, iOS, Android).
  - [ ] Add all new properties and enumerations to the MDXLD JSON-LD context.
- [ ] **Task: Document the Extended Ontology:**
  - [ ] Create comprehensive documentation for each MDXLD class and property.
  - [ ] Provide examples of usage in MDXLD frontmatter.
  - [ ] Explain relationships to schema.org.

## Phase 3: Tooling and Validation

This phase focuses on developer tools for creating and validating MDXLD content.

- [ ] **Task: Develop Schema-DTS Wrapper/Extension:**
  - [ ] Create TypeScript definitions for the MDXLD vocabulary (including `$`-prefixed keys).
  - [ ] Wrap or extend Google's `schema-dts` to provide type-safe autocompletion and validation for MDXLD frontmatter within IDEs.
  - [ ] Ensure this wrapper correctly maps `$type` to schema.org types and MDXLD extended types.
- [ ] **Task: Implement Frontmatter Schema Validator:**
  - [ ] Develop a validation layer that uses the MDXLD TypeScript definitions (or derived JSON Schemas).
  - [ ] Validate that frontmatter data adheres to the defined schema for its `$type`.
  - [ ] Check for required fields, correct data types, and allowed properties.
  - [ ] Report errors and warnings clearly.
- [ ] **Task: Create `mdxld-cli` Tool:**
  - [ ] **`validate` command**: Recursively find and validate MDXLD files in a project.
  - [ ] **`lint` command**: Implement linting rules (e.g., via `remark-lint` plugin) for MDXLD best practices (e.g., missing `$context`, incorrect `$`-key usage).
  - [ ] **`extract-metadata` command**: Extract structured data from MDXLD files into a combined JSON-LD graph or individual JSON files.
  - [ ] **`preview` command (Optional)**: A simple dev server to render MDXLD files and display extracted JSON-LD.
- [ ] **Task: VS Code Extension (Future Goal):**
  - [ ] Plan for a VS Code extension for inline error highlighting, autocompletion, and MDXLD specific tooling.

## Phase 4: MDX Bundler Integration

This phase focuses on integrating MDXLD processing into common MDX build pipelines.

- [ ] **Task: Develop Remark/Rehype Plugins:**
  - [ ] Create a Remark plugin to:
    - Parse YAML-LD frontmatter using the MDXLD parser.
    - Validate the parsed data using the schema validator.
    - Make the validated frontmatter data available to the MDX content (e.g., as an `export const frontmatter = ...`).
    - Optionally remove the raw frontmatter from the final MDX output seen by further MDX processing if it causes issues.
  - [ ] Create a Rehype plugin (optional, if needed post-MDX compilation) to:
    - Inject a `<script type="application/ld+json">` tag containing the extracted JSON-LD into the final HTML output. This should be configurable.
- [ ] **Task: Ensure Integration with Bundlers/SSGs:**
  - [ ] **Vite:** Create a Vite plugin or configure `@mdx-js/rollup` with the MDXLD Remark plugin. Test HMR with frontmatter changes.
  - [ ] **Next.js:** Provide a custom loader or document setup for `@next/mdx` (Webpack/SWC) to use the MDXLD Remark plugin. Guide integration with `next-mdx-remote` and Contentlayer (defining Contentlayer schemas using MDXLD types).
  - [ ] **Other SSGs (Gatsby, Docusaurus, Astro):** Provide documentation and examples for integrating the MDXLD Remark plugin.

## Phase 5: Authoring Guidelines and Examples

This phase focuses on empowering users to write effective MDXLD content.

- [ ] **Task: Develop Authoring Guidelines:**
  - [ ] Document how to create and use custom types within MDXLD (e.g., defining ad-hoc `$context` entries).
  - [ ] Explain the importance and usage of `$id` for unique identification and data linking.
  - [ ] Best practices for reusing schema.org terms vs. MDXLD extended terms.
  - [ ] Guidelines on embedding and utilizing frontmatter data within MDX content (JSX).
- [ ] **Task: Provide Comprehensive Examples:**
  - [ ] Show an example of extending an existing schema.org type (e.g., `CustomArticle extends schema:Article`).
  - [ ] Provide detailed examples for documenting each of the core MDXLD types (`Component`, `API`, `App`, etc.) using realistic frontmatter.

## Phase 6: Integration with other `mdx*` tools

This phase focuses on ensuring `mdxld` works seamlessly within the broader `mdx*` ecosystem.

- [ ] **Task: `mdxdb` Integration:**
  - [ ] Explore how `mdxdb` can recognize and index MDXLD frontmatter.
  - [ ] Enable `mdxdb` to query content based on MDXLD types and properties (e.g., "find all Components with framework: React").
  - [ ] Ensure `mdxdb` can store and retrieve the full JSON-LD data structure.
- [ ] **Task: `mdxui` Integration:**
  - [ ] Investigate creating `mdxui` components that can consume and render structured data from MDXLD frontmatter (e.g., a component to display an `API`'s endpoint details, or a `Person`'s contact card).
- [ ] **Task: `mdxai` Integration (Consideration):**
  - [ ] Explore if `mdxai` could assist in generating or suggesting MDXLD frontmatter based on content.

## Ongoing Tasks

- [ ] **Documentation:** Maintain up-to-date documentation for the MDXLD vocabulary, tooling, and integrations.
- [ ] **Testing:** Rigorous testing for the parser, validator, CLI tools, and bundler plugins. Include tests with various valid and invalid MDXLD examples.
- [ ] **Community Feedback:** Establish a channel for community feedback on the ontology and tooling.

---

_This TODO list is based on the vision for MDXLD to integrate linked data with MDX, primarily drawing from `research/mdx-linkd-data.md`._
