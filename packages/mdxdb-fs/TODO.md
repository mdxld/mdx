# `mdxdb` Package TODO List

This document outlines the development tasks and sequence for the `mdxdb` package, which aims to treat Markdown/MDX files as a queryable and mutable database. It draws heavily from the concepts in `research/velite-mutations.md` and the core goal of `mdxdb`.

## Phase 1: Core Functionality - Database-like Interface

This phase focuses on establishing the basic CRUD (Create, Read, Update, Delete) operations and Velite integration.

-   [ ] **Task: Velite Integration Setup:**
    -   [ ] Configure `mdxdb` to use Velite for file discovery (globbing) and initial parsing of Markdown/MDX files and their frontmatter.
    -   [ ] Implement Velite's watch mode (`velite dev --watch` or programmatic `build({ watch: true })`) to enable real-time updates to the in-memory database when files change.
-   [ ] **Task: Implement `list()` Operation:**
    -   [ ] Develop a `list(collectionName?: string)` method that returns all content entries (or entries for a specific Velite collection).
    -   [ ] Ensure this method leverages Velite's build output (e.g., `.velite/collection.json` or in-memory `result.collection`).
-   [ ] **Task: Implement `get()` Operation:**
    -   [ ] Develop a `get(id: string, collectionName?: string)` method to retrieve a single content entry by a unique identifier (e.g., slug, file path).
    -   [ ] Utilize Velite's parsed data and potentially maintain an ID-to-entry map for efficient lookups.
-   [ ] **Task: Implement `set()` Operation (Initial - File Overwrite):**
    -   [ ] Develop an initial `set(id: string, contentObject: object, collectionName?: string)` method that creates a new Markdown/MDX file or fully overwrites an existing one.
    -   [ ] The `contentObject` should define frontmatter and body content.
    -   [ ] Ensure file creation/modification triggers Velite's watch mode to update its internal database.
-   [ ] **Task: Implement `delete()` Operation:**
    -   [ ] Develop a `delete(id: string, collectionName?: string)` method that removes a content entry by deleting its corresponding file.
    -   [ ] Ensure file deletion triggers Velite's watch mode.

## Phase 2: Advanced Mutation Capabilities

This phase enhances the `set()` operation with more granular control, as inspired by `research/velite-mutations.md`.

-   [ ] **Task: Granular Frontmatter Merging for `set()`:**
    -   [ ] Modify the `set()` operation to support partial updates to frontmatter.
    -   [ ] If `set()` is called with only specific frontmatter fields, it should merge these changes into the existing frontmatter without overwriting other fields.
    -   [ ] Use a library like `gray-matter` to parse existing frontmatter, merge changes, and rewrite only the frontmatter block if possible.
-   [ ] **Task: Content Body Editing for `set()`:**
    -   [ ] Extend `set()` to allow targeted modifications to the Markdown/MDX body.
    -   [ ] Support appending content to the body.
    -   [ ] Explore replacing specific sections or manipulating the content using a Markdown AST (e.g., via `remark` or `unified`, similar to Velite's internal tools).
    -   [ ] Ensure these targeted changes are written back to the file and picked up by Velite.
-   [ ] **Task: Schema Validation for Mutations:**
    -   [ ] Leverage Velite's Zod schemas to validate data being written via `set()` against the defined collection schema.
    -   [ ] Prevent invalid data from being written to files.

## Phase 3: Querying and Data Transformation

This phase focuses on retrieving and transforming data effectively.

-   [ ] **Task: Frontmatter-Based Filtering for `list()`:**
    -   [ ] Enhance the `list()` method to accept filter criteria to select entries based on frontmatter fields (e.g., `list({ filters: { draft: true, tags: ['AI'] } })`).
-   [ ] **Task: Advanced Querying (Exploration):**
    -   [ ] Investigate possibilities for full-text search within Markdown content.
    -   [ ] Explore indexing strategies for frontmatter and content to speed up queries.
-   [ ] **Task: Expose Velite's Data Transformations:**
    -   [ ] Ensure that the data returned by `get()` and `list()` includes transformations provided by Velite's schema helpers:
        -   Rendered HTML content (via `s.markdown()`).
        -   Compiled MDX code string (via `s.mdx()`).
        -   Processed image data (via `s.image()`), including paths to copied assets.
        -   Excerpts (via `s.excerpt()`), metadata (via `s.metadata()`), ToC (via `s.toc()`).
-   [ ] **Task: Access to Named MDX Exports:**
    -   [ ] Ensure that the compiled MDX `code` string (or a helper utility) allows access to named exports from MDX files (e.g., constants, sub-components).
    -   [ ] Provide documentation or utilities for users to hydrate the MDX code string into a usable module/component.

## Phase 4: SDK Development and DX

This phase focuses on creating a developer-friendly TypeScript SDK.

-   [ ] **Task: Define Core SDK Interface:**
    -   [ ] Design a clean, intuitive TypeScript interface for all `mdxdb` operations.
    -   [ ] Ensure methods are well-documented with JSDoc/TSDoc comments.
-   [ ] **Task: Type Definitions:**
    -   [ ] Leverage Velite's generated TypeScript definitions for content collections to provide strong typing for entries returned by `mdxdb`.
    -   [ ] Ensure the SDK's methods have clear input and output types.
-   [ ] **Task: Error Handling:**
    -   [ ] Implement robust error handling for file operations, Velite interactions, and data validation.
-   [ ] **Task: Configuration:**
    -   [ ] Define how users will configure `mdxdb` (e.g., pointing to Velite config, specifying content directories).

## Phase 5: Integration with other `mdx*` tools

This phase focuses on ensuring `mdxdb` plays well within the `mdx*` ecosystem.

-   [ ] **Task: `mdxai` Integration:**
    -   [ ] Design an API or mechanism for `mdxai` to use `mdxdb` as a storage backend. `mdxai` should be able to `set()` content it generates/modifies into `mdxdb`.
    -   [ ] `mdxai` should be able to `get()` or `list()` content from `mdxdb` to use as context or for editing.
-   [ ] **Task: `mdxe` Integration:**
    -   [ ] Explore how `mdxe` (for executable content) can retrieve content (including compiled MDX code) from `mdxdb`.
    -   [ ] `mdxe` might use `mdxdb` to access the `code` field of an MDX entry for execution.
-   [ ] **Task: `mdxld` Integration (Consideration):**
    -   [ ] Consider if/how `mdxdb` could store or query linked data relationships defined by `mdxld`.
-   [ ] **Task: `mdxui` Integration (Consideration):**
    -   [ ] Determine if `mdxdb` needs specific features to support content that heavily utilizes `mdxui` components (likely handled by MDX compilation).

## Ongoing Tasks

-   [ ] **Documentation:** Create comprehensive documentation for the `mdxdb` API, setup, and usage patterns, including examples for granular updates and querying.
-   [ ] **Testing:** Develop a thorough test suite covering:
    -   CRUD operations.
    -   Frontmatter and content mutations.
    -   Filtering and querying.
    -   Interactions with Velite's watch mode.
    -   Data transformations.
-   [ ] **Performance Optimization:** Monitor and optimize the performance of file operations and querying, especially for large content sets.

---
*This TODO list is based on the goal of `mdxdb` to treat Markdown/MDX as a database, with significant inspiration from `research/velite-mutations.md` for implementation details using Velite.*
