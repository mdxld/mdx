# `mdxe` Package TODO List

This document outlines the development tasks and sequence for the `mdxe` package. `mdxe` aims to be a zero-config CLI to execute, test, and deploy Markdown/MDX files, potentially with web-based notebook capabilities. This plan is based on its README and insights from `research/velite-executable.md`, `research/zx-executable-markdown.md`, and `research/next-notebook.md`.

## Phase 1: Core CLI Functionality & Executable Content Engine

This phase focuses on establishing the basic CLI structure and the engine for running code embedded in Markdown/MDX.

-   [ ] **Task: CLI Framework Setup:**
    -   [ ] Define CLI command structure (`mdxe <command> [options]`).
    -   [ ] Integrate a CLI argument parsing library (e.g., Yargs, Commander.js).
    -   [ ] Implement basic flags: `--help`, `--version`, `--watch`.
-   [ ] **Task: Markdown/MDX Code Block Extraction (Inspired by `velite-executable.md`, `zx-executable-markdown.md`):**
    -   [ ] Implement file discovery for `.md`/`.mdx` files.
    -   [ ] Use a Markdown AST library (e.g., Remark) to parse files and extract fenced code blocks (`ts`, `js`).
    -   [ ] Identify code blocks tagged for testing (e.g., ` ```ts test ` or ` ```ts @import.meta.vitest `).
    -   [ ] Create an internal representation for code blocks (filePath, code, language, isTest, other meta).
-   [ ] **Task: Code Execution Engine (Inspired by `velite-executable.md`):**
    -   [ ] Develop a system to execute extracted `ts`/`js` code blocks.
    -   [ ] Support TypeScript execution (e.g., via `ts-node` or on-the-fly transpilation with ESBuild/SWC).
    -   [ ] Implement a shared execution scope/context so variables and functions persist across code blocks within a sequence.
    -   [ ] Ensure `console.log` and other outputs from executed code are visible.
    -   [ ] Handle errors gracefully, reporting file and block information.
-   [ ] **Task: Vitest Integration for Test Blocks (Inspired by `velite-executable.md`, `zx-executable-markdown.md`):**
    -   [ ] Integrate Vitest as the test runner for test-tagged code blocks.
    -   [ ] Ensure `describe`, `it`, `expect` are globally available within the scope of these test blocks.
    -   [ ] Aggregate test code blocks (e.g., into a single in-memory test suite or temporary spec files).
    -   [ ] Execute tests programmatically using Vitest's Node API or by spawning the Vitest CLI.
    -   [ ] Capture and display Vitest results.
-   [ ] **Task: Initial `mdxe exec` (or similar) Command:**
    -   [ ] Create a command to execute all runnable (non-test) code blocks from specified Markdown/MDX files.
    -   [ ] This command will form the basis for `dev` and other execution-related commands.

## Phase 2: CLI Commands for Development Workflow

This phase implements the primary CLI commands for a typical development lifecycle.

-   [ ] **Task: Implement `mdxe dev`:**
    -   [ ] Start a development server (likely Next.js based, given the integrations).
    -   [ ] Enable watch mode: monitor Markdown/MDX files and other relevant source files for changes.
    -   [ ] On change, re-execute relevant code blocks and/or rebuild/HMR the Next.js application.
    -   [ ] Integrate with Velite for content sourcing if `mdxdb` is not yet fully available.
-   [ ] **Task: Implement `mdxe build`:**
    -   [ ] Perform a production build of the Next.js application.
    -   [ ] This may involve pre-rendering pages from Markdown/MDX, bundling assets, etc.
    -   [ ] Potentially run all tests as a pre-build step.
-   [ ] **Task: Implement `mdxe start`:**
    -   [ ] Start the production server for the built Next.js application.
-   [ ] **Task: Implement `mdxe test`:**
    -   [ ] Specifically run all test-tagged code blocks using the Vitest integration.
    -   [ ] Allow passing through options to Vitest (e.g., for specific files, watch mode for tests).
-   [ ] **Task: Implement `mdxe lint`:**
    -   [ ] Integrate ESLint for linting TypeScript/JavaScript code within Markdown/MDX blocks and any project source files.
    -   [ ] Provide sensible default ESLint configurations.

## Phase 3: Web-Based Notebook Capabilities (Inspired by `next-notebook.md`)

This phase explores turning `mdxe` into a system that can power interactive, web-based notebooks.

-   [ ] **Task: Dynamic MDX Rendering with Interactive Cells:**
    -   [ ] Develop a Next.js application structure that can render MDX files as notebook pages.
    -   [ ] Customize MDX rendering to replace static code blocks with interactive cell components.
    -   [ ] Each interactive cell should include:
        -   A code editor (e.g., Monaco Editor).
        -   An output area for results or previews.
        -   Controls (e.g., "Run" button, though live execution is preferred).
-   [ ] **Task: Live Code Execution and Preview:**
    -   [ ] Implement live execution of code edited in notebook cells (debounced, on valid code).
    -   [ ] Display outputs (text, HTML, React components) in the cell's output area.
-   [ ] **Task: Secure Sandboxed Code Execution:**
    -   [ ] Research and implement a secure sandboxing mechanism for client-side code execution (e.g., sandboxed iframes, Web Workers, or libraries like Sandpack).
    -   [ ] Ensure the sandbox can execute JS/TS and potentially render React components.
    -   [ ] Integrate the Vitest test execution within this sandbox for test cells.
-   [ ] **Task: Persistence (Consideration with `mdxdb`):**
    -   [ ] Define how notebook content (MDX or structured cells) is stored and retrieved, likely via `mdxdb`.
    -   [ ] Implement saving changes made in the web notebook UI back to the storage.

## Phase 4: Integrations and Ecosystem

This phase focuses on integrating `mdxe` with other `mdx*` tools and refining the overall system.

-   [ ] **Task: Core Tooling Integration:**
    -   [ ] Ensure seamless use of MDX, ESBuild (for on-the-fly transpilation if needed, or bundling), Next.js (as the primary web framework), React (for UI), and Velite (potentially for initial content loading or if `mdxdb` relies on it).
-   [ ] **Task: `mdxdb` Integration:**
    -   [ ] Utilize `mdxdb` as the primary mechanism for accessing and managing Markdown/MDX content that `mdxe` operates on.
    -   [ ] `mdxe dev` should source content through `mdxdb`'s API.
    -   [ ] Notebook capabilities should use `mdxdb` for persistence.
-   [ ] **Task: `mdxui` Integration:**
    -   [ ] Enable and document the use of `mdxui` components within MDX content processed by `mdxe`.
    -   [ ] Ensure `mdxe dev` and `mdxe build` correctly handle `mdxui` components for Next.js applications.
-   [ ] **Task: Zero-Configuration Goal:**
    -   [ ] Continuously refine the CLI to minimize required configuration.
    -   [ ] Provide sensible defaults for all aspects (builds, tests, linting, Next.js setup).
    -   [ ] Allow extending default configurations if necessary (e.g., `next.config.js`, `eslint.config.js`).

## Ongoing Tasks

-   [ ] **Documentation:** Comprehensive documentation for all CLI commands, notebook features, and integration points.
-   [ ] **Testing:** Robust test suite for the CLI itself, code execution engine, and any notebook components.
-   [ ] **Error Handling & UX:** Clear error messages, helpful guidance, and a smooth user experience for both CLI and notebook interactions.
-   [ ] **Performance Optimization:** Monitor and optimize build times, execution speed, and notebook responsiveness.

---
*This TODO list is based on the `mdxe` README and research from `research/velite-executable.md`, `research/zx-executable-markdown.md`, and `research/next-notebook.md`.*
