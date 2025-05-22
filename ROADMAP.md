# Project Roadmap

This document outlines the high-level roadmap for the `mdx*` suite of tools, based on the collective insights from our research.

## Phase 1: Foundational Tooling

This phase focuses on establishing the core functionalities and infrastructure for Markdown/MDX processing and interaction.

- **Core CLI Functionalities:** Develop robust command-line interface (CLI) tools for efficient Markdown and MDX processing. This includes parsing, transforming, and validating content. (Inspired by `research/markdown-cli.md`)
- **Secure and Interactive Terminal Applications:** Create secure and interactive terminal applications that leverage MDX capabilities. This will enable developers to build powerful command-line experiences. (Inspired by `research/agentic-cli.md`, `research/terminal-app-from-mdx.md`)

## Phase 2: Content as Data and Code

This phase aims to enhance MDX by treating content as data and enabling executable code within documents.

- **MDXLD for Linked Data:** Implement MDXLD (MDX Linked Data) to support structured and linked data within MDX documents. This will allow for richer content relationships and querying. (Inspired by `research/mdx-linkd-data.md`)
- **Executable Content and In-Browser Testing:** Enable executable code blocks and in-browser testing environments within MDX. This will facilitate interactive documentation, tutorials, and live demonstrations. (Inspired by `research/next-notebook.md`, `research/velite-executable.md`, `research/zx-executable-markdown.md`)

## Phase 3: Advanced Features and Integration

This phase focuses on developing advanced features, improving existing tools, and ensuring seamless integration with popular frameworks.

- **Velite Enhancements:** Enhance the Velite tool for content management with support for mutations (data modifications) and Software Development Kit (SDK) capabilities for programmatic access. (Inspired by `research/velite-mutations.md`)
- **Streamlined Next.js Integration:** Improve integration with Next.js, particularly focusing on the `next-mdx-remote-client` for efficient and flexible MDX rendering in Next.js applications. (Inspired by `research/next-mdx-remote-client.md`)
- **Comprehensive Packaging and Release Strategy:** Develop a clear and robust packaging and release strategy for the `mdx*` suite of tools, ensuring easy adoption and updates. (Inspired by `research/velite-pkg-pr-new.md`)
- **Automated Prerelease Workflow:** Build and publish preview packages for each commit using pkg.pr.new. See `RELEASING.md` for details.

## Phase 4: Ecosystem Maturation

This phase outlines the long-term vision for the project, focusing on AI-driven development and expanding the capabilities of the MDX ecosystem.

- **AI-Driven Development and Agentic Workflows:** Explore and integrate AI-powered features to assist with content creation, analysis, and automation, enabling more sophisticated agentic workflows.
- **Expanding MDX-based Notebook System:** Further develop the MDX-based notebook system to provide a comprehensive and versatile platform for interactive computing, data analysis, and knowledge sharing.

## This roadmap is a living document and will be updated as the project evolves.

_This roadmap is based on research documents including: `agentic-cli.md`, `markdown-cli.md`, `mdx-linkd-data.md`, `next-mdx-remote-client.md`, `next-notebook.md`, `terminal-app-from-mdx.md`, `velite-executable.md`, `velite-mutations.md`, `velite-pkg-pr-new.md`, and `zx-executable-markdown.md`._
