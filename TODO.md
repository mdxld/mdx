# Project TODO List

This document outlines the major epics and tasks for the `mdx*` project, based on research and project goals.

## Epic 1: Core MDX Tooling Development

This epic focuses on the creation of the foundational packages for the MDX ecosystem.

-   [ ] Task: Develop `mdxai` for AI-powered content generation, editing, and augmentation within MDX.
-   [ ] Task: Develop `mdxdb` for treating MDX files and repositories as a queryable database.
-   [ ] Task: Develop `mdxe` for building, executing, testing, and deploying code embedded within MDX documents.
-   [ ] Task: Develop `mdxld` for integrating linked data principles and ontologies with MDX content.
-   [ ] Task: Develop `mdxui` for creating a rich UI component library specifically designed for use with MDX.

## Epic 2: Enhanced CLI and Agentic Capabilities

This epic aims to build powerful command-line interfaces and agent-like functionalities.

-   [ ] Task: Implement a modern, AI-aware CLI for Markdown processing (Inspired by `research/markdown-cli.md`).
-   [ ] Task: Develop agentic CLI capabilities for interactive and automated workflows, leveraging AI (Inspired by `research/agentic-cli.md`).
-   [ ] Task: Explore and implement terminal applications derived directly from MDX content (Inspired by `research/terminal-app-from-mdx.md`).

## Epic 3: Executable and Testable Content

This epic focuses on making MDX documents interactive and verifiable.

-   [ ] Task: Develop an MDX-based web notebook system for interactive computing and documentation (Inspired by `research/next-notebook.md`).
-   [ ] Task: Implement capabilities for executing TypeScript/JavaScript code blocks within Markdown/MDX environments (Inspired by `research/velite-executable.md`, `research/zx-executable-markdown.md`).
-   [ ] Task: Integrate in-browser testing frameworks (e.g., Vitest) for live testing of code blocks within MDX.

## Epic 4: Advanced Data Management and Integration

This epic aims to improve how data is handled and how MDX integrates with other systems.

-   [ ] Task: Extend Velite (or a similar content management tool) to support content mutations and provide an SDK-like interface for programmatic access (Inspired by `research/velite-mutations.md`).
-   [ ] Task: Improve Next.js integration, particularly focusing on `next-mdx-remote-client` and related tooling for optimal performance and developer experience (Inspired by `research/next-mdx-remote-client.md`).

## Epic 5: Packaging, Release, and Ecosystem

This epic covers the essential aspects of distributing the tools and growing the ecosystem.

-   [ ] Task: Establish a robust packaging and preview release workflow (e.g., using a system like `pkg.pr.new`) for all `mdx*` packages (Inspired by `research/velite-pkg-pr-new.md`).
-   [ ] Task: Define and document schema ontologies for MDXLD to ensure interoperability and data consistency (Inspired by `research/mdx-linkd-data.md`).

---
*This TODO list is derived from insights found in the research documents located in the `research/` directory.*
