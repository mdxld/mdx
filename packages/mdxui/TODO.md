# `mdxui` Package TODO List

This document outlines the development tasks and sequence for the `mdxui` package. `mdxui` will provide a library of reusable UI components designed to support and enhance applications built with the `mdx*` ecosystem. Its components will be compatible with React, Next.js, and MDX, focusing on ease of use, theming, and integration with other `mdx*` packages.

## Phase 1: Core Component Library Foundation

This phase focuses on establishing the basic set of UI components and the infrastructure for the library.

-   [ ] **Task: Setup Component Development Environment:**
    -   [ ] Configure Storybook or a similar tool for isolated component development and showcasing.
    -   [ ] Establish a build process for the component library (e.g., using Rollup, esbuild, or SWC).
    -   [ ] Set up testing environment (e.g., Vitest, React Testing Library).
-   [ ] **Task: Develop Basic Reusable UI Components:**
    -   [ ] **`<Card>`**: A versatile card component for displaying content snippets. (Based on existing `packages/mdxui/components/card.tsx`)
    -   [ ] **`<Button>`**: Standard button component with variants (primary, secondary, text).
    -   [ ] **`<List>` / `<ListItem>`**: Components for rendering ordered and unordered lists with flexible content.
    -   [ ] **`<Tabs>` / `<TabPanel>`**: Components for creating tabbed interfaces.
    -   [ ] **`<Accordion>` / `<AccordionItem>`**: Components for collapsible content sections.
    -   [ ] **`<Modal>`**: Component for displaying modal dialogs.
    -   [ ] **`<Tooltip>`**: Component for showing informational tooltips on hover.
    -   [ ] **`<Input>` / `<Textarea>` / `<Select>` / `<Checkbox>` / `<Radio>`**: Basic form elements.
    -   [ ] **`<Form>`**: A component to structure forms, handling layout and potentially state.
    -   [ ] **`<Hero>`**: A prominent hero section component for landing pages or headers (as per subtask prompt).
    -   [ ] **`<GradientText>`**: Component for text with gradient styling (based on existing `packages/mdxui/components/gradient.tsx`).
-   [ ] **Task: Theming and Customization:**
    -   [ ] Implement a theming system (e.g., using CSS Variables, Theme UI, or a similar context-based approach).
    -   [ ] Ensure components are easily customizable via props and potentially CSS overrides or styled-system patterns.
    -   [ ] Provide a default theme.
-   [ ] **Task: Accessibility (a11y):**
    -   [ ] Ensure all components adhere to WCAG accessibility standards (keyboard navigation, ARIA attributes, color contrast).

## Phase 2: Integration with `mdxe` (Executable Content & Notebooks)

This phase focuses on providing UI components specifically for `mdxe`-powered environments, such as interactive notebooks.

-   [ ] **Task: Automatic Component Availability in `mdxe`:**
    -   [ ] Develop a mechanism (e.g., MDX provider, Next.js plugin) to make `mdxui` components readily available in `mdxe` projects without manual imports for common elements.
-   [ ] **Task: Notebook UI Components (for `mdxe`'s web-based notebook capabilities):**
    -   [ ] **`<CodeCell>`**: Component to render an interactive code editor (e.g., Monaco) within a notebook cell.
        -   Props for language, initial code, read-only state.
        -   Event handlers for code changes.
    -   [ ] **`<OutputDisplay>`**: Component to render the output of a code cell.
        -   Support for various output types: text, HTML, images, React components, errors.
        -   Styling for different output types (stdout, stderr, results).
    -   [ ] **`<TestResultDisplay>`**: Component to show formatted test results from Vitest (or similar) execution within `mdxe`.
        -   Display pass/fail status, individual test results, error messages, and stack traces.
    -   [ ] **`<NotebookToolbar>`**: A toolbar for notebook-level actions (e.g., Run All, Save, Add Cell).
    -   [ ] **`<CellWrapper>`**: A component to wrap individual notebook cells, providing common controls (e.g., run button for cell, move up/down, delete cell).
-   [ ] **Task: Interactive Terminal-Like Components (for `mdxe` terminal apps or web simulations):**
    -   [ ] **`<TerminalOutput>`**: Component to display styled terminal output, supporting ANSI escape codes.
    -   [ ] **`<CommandInput>`**: A specialized input field for command entry.
    -   [ ] **`<Menu>` / `<MenuItem>`**: Components for building interactive text-based menus.

## Phase 3: Support for `mdxld` (Linked Data)

This phase focuses on creating components to visualize and interact with structured data defined using MDXLD.

-   [ ] **Task: Generic Structured Data Renderer:**
    -   [ ] **`<StructuredDataViewer>`**: A component that can take a JSON-LD object (from MDXLD frontmatter) and render it in a human-readable way (e.g., as a tree, a table, or a definition list).
-   [ ] **Task: Schema.org Type Renderers:**
    -   [ ] Develop specific components for rendering common schema.org types:
        -   **`<PersonCard>`**: Displays information for a `schema:Person`.
        -   **`<ArticleHeader>`**: Displays metadata for a `schema:Article`.
        -   **`<EventDisplay>`**: Displays details for a `schema:Event`.
        -   **`<ProductSnippet>`**: Displays key information for a `schema:Product`.
-   [ ] **Task: Custom MDXLD Type Renderers:**
    -   [ ] Develop components for rendering the custom MDXLD types (e.g., `Component`, `API`, `App` as defined in `packages/mdxld/TODO.md`).
        -   **`<ApiEndpointDoc>`**: Displays documentation for an `mdxld:API` type, including endpoint URL, method, parameters, and response schemas.
        -   **`<ComponentPropsTable>`**: Displays properties for an `mdxld:Component`.
-   [ ] **Task: Data-Driven UI Generation (Exploration):**
    -   [ ] Investigate how `mdxui` components could be dynamically chosen or configured based on the `$type` or other properties of MDXLD data.

## Phase 4: Framework Compatibility and Developer Experience

This phase ensures seamless integration with Next.js/React and provides good DX for users of `mdxui`.

-   [ ] **Task: Next.js and React Compatibility:**
    -   [ ] Thoroughly test all components in Next.js (App Router and Pages Router) and standard React environments.
    -   [ ] Ensure server-side rendering (SSR) compatibility for components where applicable.
    -   [ ] Leverage React best practices (hooks, context, composition).
-   [ ] **Task: `useMDXComponents` Hook Integration:**
    -   [ ] Provide a `useMDXComponents` hook or similar mechanism that users can easily integrate into their MDX provider to make `mdxui` components available for Markdown elements (e.g., mapping `table` to `<mdxui.Table>`).
-   [ ] **Task: Tree Shaking and Performance:**
    -   [ ] Ensure the library is structured to allow for effective tree shaking, so users only bundle the components they use.
    -   [ ] Optimize component rendering performance.

## Phase 5: Documentation and Examples

This phase focuses on providing comprehensive documentation and usage examples.

-   [ ] **Task: Component Documentation:**
    -   [ ] Write detailed documentation for each component, including:
        -   Props API.
        -   Theming/customization options.
        -   Accessibility considerations.
    -   [ ] Use Storybook to generate and host interactive documentation.
-   [ ] **Task: Usage Examples in MDX:**
    -   [ ] Provide rich examples of how to use `mdxui` components within MDX files.
    -   [ ] Showcase integration with `mdxe` (e.g., building a simple notebook UI).
    -   [ ] Showcase integration with `mdxld` (e.g., rendering structured data).
-   [ ] **Task: Starter Templates/Themes (Optional):**
    -   [ ] Consider creating a few starter templates or themes for common use cases (e.g., a blog, a documentation site).

## Ongoing Tasks

-   [ ] **Testing:** Maintain high test coverage (unit, integration, visual regression tests).
-   [ ] **Issue Tracking and Community Support:** Set up mechanisms for users to report issues and get support.
-   [ ] **Performance Monitoring:** Continuously monitor component performance.
-   [ ] **Dependency Management:** Keep dependencies up-to-date and manage security vulnerabilities.

---
*This TODO list is based on the inferred requirements for a UI library supporting the `mdx*` ecosystem, drawing from the functionalities of `mdxe`, `mdxld`, and general best practices for component libraries.*
