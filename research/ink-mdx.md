# Design of `ink-mdx`: MDX Renderer for React Ink CLI

## Introduction

`ink-mdx` is a package for rendering Markdown/MDX content in [Ink](https://github.com/vadimdemedes/ink), React’s library for building command-line interfaces. It enables CLI applications to leverage MDX – an extension of Markdown that allows embedding JSX components – for rich, interactive text UI. MDX combines the concise syntax of Markdown with the power of JSX components, which is ideal for Ink CLIs that want to include dynamic or interactive elements in their documentation, help text, or UI. This design outlines the architecture of `ink-mdx`, focusing on how it will load and render `.md`/`.mdx` files, map Markdown elements to Ink components, allow customization, and support both build-time bundling and runtime usage. The goal is to provide a seamless developer experience similar to Next.js’s MDX support (including its `mdx-components` convention), while using only well-supported, ESM-compatible Ink components for rendering.

## Objectives and Features

The `ink-mdx` package will provide the following features and adhere to these design goals:

1. **Next.js-Style Component Overrides:** Support a convention where users can define a file (e.g. `mdx-components.js`, `mdx-components.ts`, etc.) to override or extend the default mapping of Markdown elements to Ink components, similar to Next.js’s approach.
2. **`.md` and `.mdx` File Support:** Allow both plain Markdown (`.md`) and MDX (`.mdx`) files to be processed. `.md` files will be handled with the same pipeline (including MDX capabilities) so users don’t need to rename files to use them.
3. **Static Bundling with esbuild:** Provide a way to pre-compile or bundle MDX content at build time using **esbuild**. This will transform MDX files into JavaScript (Ink/React components) so they can be imported or included in a CLI’s bundle for faster startup and distribution.
4. **Runtime Dynamic Loading:** Also support loading and rendering MDX files at runtime (on the fly). This is useful for CLI tools that need to display user-provided or external MDX content without pre-bundling. We will ensure the pipeline can be invoked dynamically in Node (using MDX libraries or an in-memory esbuild process).
5. **Configurable Markdown Pipeline:** Use a Remark/Rehype plugin pipeline that by default supports standard Markdown and GitHub-Flavored Markdown (GFM), but allow customization. The package will include a default set of plugins (e.g. `remark-gfm` for tables, strikethrough, task lists) and allow both build-time and runtime specification of additional Remark/Rehype plugins for extensibility.
6. **Ink-Only Default Components:** Provide a built-in implementation for all standard Markdown elements (including GFM extensions) using Ink-compatible components. We will prefer popular Ink community components (all ESM-ready) like `ink-big-text`, `ink-box`, `ink-link`, `ink-table`, `ink-task-list`, `ink-select-input`, etc., to ensure rich functionality (large text, lists with checkboxes, interactive inputs, etc.) out of the box. These mappings cover headings, text styles, lists, code blocks, tables, links, etc., rendering them appropriately in the terminal UI.
7. **Embedded JSX Support:** Ensure that any JSX or Ink components embedded inside an `.mdx` document are properly rendered. The MDX renderer will handle MDX syntax (imports, JSX expressions, etc.), so users can import and use custom Ink components within their markdown content (e.g. embed an interactive selector or a spinner in documentation).
8. **Ink CLI Integration:** (Optional) Remain compatible with common Ink CLI usage patterns. The solution should integrate cleanly with Ink’s `render()` function and frameworks built on Ink (like Pastel), without requiring special modifications to the CLI runtime. This is a non-strict goal, but we consider it to ensure `ink-mdx` can be dropped into existing Ink projects easily.

## Architecture and Module Structure

The `ink-mdx` package is organized into distinct parts to handle compilation, runtime rendering, and configuration:

- **Core Renderer Module:** The core provides an `InkMDXRenderer` component (or function) that serves as the primary interface for rendering MDX content. This component can be used in two ways: it can statically import a compiled MDX module (when using bundling), or it can dynamically load and render a given MDX file at runtime. Internally, `InkMDXRenderer` uses MDX’s React runtime to create the element tree, then delegates to Ink’s rendering. It will also handle injecting the component mappings (the default + any overrides) via MDX context. For example, if using a compiled MDX file, one would do:

  ```js
  import { render } from 'ink'
  import MDXDocument from './docs/guide.mdx' // MDX file as a compiled component
  import { InkMDXRenderer } from 'ink-mdx'
  render(<InkMDXRenderer Component={MDXDocument} />)
  ```

  If using dynamic loading at runtime, one could call:

  ```js
  render(<InkMDXRenderer file='./docs/guide.mdx' />)
  ```

  The renderer will detect if a `Component` is directly provided (already compiled) or if a `file` path is given, in which case it will trigger on-the-fly compilation. This design cleanly abstracts whether MDX content was bundled ahead or not.

- **MDX Compilation & Bundling Module:** This part integrates with **esbuild** to compile MDX files. It provides a function (and possibly a CLI command) like `bundleMDX({ inputPaths, outputDir, plugins, ... })` that uses esbuild to transform `.md`/`.mdx` files into JavaScript modules. We will leverage the official MDX esbuild plugin (e.g. `@mdx-js/esbuild`) or a custom loader to handle MDX syntax. The esbuild setup will treat `.mdx` and `.md` as entry points and produce ESM output that exports a React component. The bundler will ensure that TypeScript and JSX in MDX are handled (esbuild can transpile TS/JSX as needed), and that imports within MDX are resolved and included. Notably, it will include the MDX Remark/Rehype plugins pipeline in the compile step (e.g. adding `remarkGfm` to support tables and task lists). By default, the bundler will externalize core dependencies like `react`, `ink`, and large Ink components (unless explicitly desired to bundle them) to keep bundle size small – the expectation is the host CLI already depends on Ink. The bundling process allows multiple MDX files to be compiled (for instance, a docs folder) and could optionally output a single combined bundle or separate component modules for each file. We follow Next.js’s practice of supporting `.md` by configuration – effectively treating `.md` files equivalently to `.mdx` (Next allows adding `extension: /\.(md|mdx)$/` in config, and we adopt the same approach). This means `.md` files will be passed through the MDX compiler (so they can include JSX if ever needed, although authors typically won’t embed JSX in `.md`).

- **Dynamic Loader Module:** For runtime use, the package will include a loader that can compile MDX strings or files on the fly. Under the hood, this might use the MDX library’s `compile` function or even call an esbuild transform in-memory (since esbuild’s API can be invoked at runtime). The dynamic loader will read the `.mdx/.md` file from disk (or accept a raw string), apply the same Remark/Rehype plugins as the static pipeline, and then evaluate the result to obtain the component. One implementation strategy is to use `mdx-bundler` internally – as it uses MDX + esbuild to bundle a file and return a component factory at runtime. However, to avoid heavy dependencies, we can directly use `@mdx-js/mdx` to compile the MDX to ESM code and use Node’s `import()` on that code. For example, we can compile to a temporary file or use a `data:` URI import. Alternatively, in a simpler (though limited) mode, we can use `@mdx-js/runtime` if no imports are involved, passing the `components` mapping and letting it render. The dynamic loader will be careful to sandbox or cache results for performance and to avoid executing untrusted MDX without validation (a caution noted in MDX remote usage). In summary, the dynamic module ensures that `InkMDXRenderer` with a file path will asynchronously compile and render the content, making MDX usage as simple as providing a filename.

- **Component Mapping & Context:** A central piece of the architecture is how Markdown/HTML elements are mapped to Ink components. We will maintain a default mapping object (keys are tag names or MDX element identifiers, values are React components or functions) representing how to render each element (detailed in the next section). This mapping is used both at compile time (for static bundling, certain MDX plugins might replace nodes) and at render time. We will integrate with MDX’s standard mechanism for custom components: the `MDXProvider`/`components` prop. The `InkMDXRenderer` internally will wrap content with an MDX provider or pass the `components` prop to the compiled MDX component. For example, MDX’s runtime allows us to do `<MDXContent components={mapping} />` to override rendering. We’ll utilize that – our renderer merges the default mapping with any user-provided overrides (from the `mdx-components` file or props) and supplies it to the MDX content. This design cleanly separates content from presentation: the MDX files remain mostly standard Markdown/JSX, and the `ink-mdx` mapping controls how that content appears in the terminal.

- **Configuration and Overrides:** `ink-mdx` will load user configuration if present. Specifically, if an **`mdx-components.*`** file is found (in the working directory or a known config path), the package will import it to get custom component mappings. We follow Next.js’s convention: the file can export either a mapping object or a function `useMDXComponents` that returns a mapping. For simplicity, we may allow exporting a plain object of components to override. For example, `mdx-components.js` might export:

  ```js
  import { Text } from 'ink'
  import MyCustomHeading from './my-heading.js'
  export default {
    h1: MyCustomHeading,
    p: (props) => <Text color='gray' {...props} />, // override paragraph style
  }
  ```

  The core will merge this with its defaults (with user overrides taking precedence). This merging happens at initialization (for static usage) or at runtime before rendering. Additionally, advanced users could call an API to set components or pass a `components` prop directly to `InkMDXRenderer` if they want to override mappings programmatically for a specific render. The architecture ensures that default components are easily swappable and that new MDX element types (if any) could be added via plugins and mapped by the user.

- **Remark/Rehype Pipeline Configuration:** A default pipeline will be defined as part of the core. This includes at least `remark-gfm` (to enable GFM syntax like tables, autolinks, strikethrough, and task lists), and possibly `remark-breaks` (to treat newlines as breaks like on GitHub), etc., as well as a rehype plugin for syntax highlight if needed (though we plan to handle code via an Ink component). The pipeline is configurable: the bundler function will accept plugin lists to add or replace, and the dynamic loader can be passed an options object with remark/rehype plugins. This dual approach (fixed defaults + optional extensibility) ensures ease of use for most (it “just works” with tables, etc.) but doesn’t block custom transforms (like adding a plugin for footnotes or embedding custom syntax). All plugins must be ESM-compatible since the MDX ecosystem requires it (as noted in Next.js docs). If a user needs to adjust the pipeline globally, we might also support an `mdxOptions` export in the config file or a separate config file (e.g. `inkmdx.config.js`) where they can specify arrays of plugins. Internally, we will apply any user-specified plugins in addition to our defaults (or allow opting out of defaults).

In terms of code structure, the package might have modules like:

- `index.js` (entry that exports the main Renderer and perhaps a convenience `renderMDX` function),
- `bundler.js` (for build-time compilation),
- `load.js` (for runtime compilation),
- `defaults.js` (default components mapping and default plugins), and
- `config.js` (logic to find and load `mdx-components` file and any other config).

This modular breakdown keeps concerns separated. Next, we detail the default component mappings that form the core of the Ink rendering.

## Default Component Mappings (Markdown to Ink)

One of the key tasks of `ink-mdx` is to provide a **default mapping of Markdown/HTML elements to Ink components** that makes the content look good in a terminal. We use only widely-supported Ink components (and base Ink elements) to ensure compatibility. Below is the mapping for standard Markdown elements and GFM extensions:

- **Headings (`<h1> ... <h6>`)**:

  - `<h1>` and `<h2>` – Render using **`ink-big-text`** for a dramatic large text effect. The text of the heading will be passed to a `<BigText>` component (from `ink-big-text`), possibly with different fonts or styles for h1 vs h2. This produces ASCII-art style banner text, suitable for top-level titles. For example, an `# Heading 1` in MDX will appear as a large banner in the terminal by default.
  - `<h3>` through `<h6>` – Use the core Ink `<Text>` component for smaller headings, styled with **bold** (and maybe underlined for distinction). For instance, an `h3` might be `<Text bold underline>` and lower headings just `<Text bold>` or with dim color to indicate sub-section. The Ink `Text` component supports styling props for bold, underline, etc.. Using `<Text>` ensures these headings are just styled text lines in the terminal (no ASCII art), providing a clear hierarchy without overwhelming the display. (Developers can override any of these if a different style is preferred.)

- **Paragraph (`<p>`)**:
  Map to a basic **Ink `<Text>`** component that prints the paragraph content. We will enable `wrap` on the Text (e.g. `<Text wrap="wrap">`) so that long paragraphs automatically wrap within the terminal width. This ensures paragraphs appear as readable blocks of text. By default, the paragraph text will use the terminal’s default color. (Ink’s `<Text>` is used for any span of text; it will render children verbatim, applying any style from parent context like bold/italic if nested.)

- **Strong/Bold (`<strong>`)**:
  Render as `<Text bold>` wrapping the content. If inside a paragraph, for example, MDX will create a `<strong>` element which our mapping replaces with an Ink Text that has the `bold` property. This will make the text bright or bold in the terminal. _Emphasis (Italic)_ (`<em>`) will be `<Text italic>` similarly. These inline styles are simply handled by Ink’s text styling props (no external component needed). If both bold and italic are needed (for nested styling), Ink allows combining props.

- **Strikethrough (`<del>` or `<s>` from GFM `~~text~~`):**
  Use `<Text strikethrough>` to draw a line through the text (if the terminal supports it, many do). This covers GFM strikethrough syntax. Ink `Text` has a `strikethrough` prop which will be utilized.

- **Inline Code (`<code>` within a paragraph):**
  Render inline code snippets using an Ink `<Text>` with a distinctive style. Typically, we can apply a different color (e.g. yellow or cyan) and maybe a background color for visibility. For instance, `<Text backgroundColor="gray" color="black">` to mimic a highlighted code span. Alternatively, we could use a smaller variant of the syntax highlighter, but that may be overkill for short inline code. By default, a simple styled Text will present inline code clearly (developers can override the styling via the components mapping if desired).

- **Code Blocks (`<pre><code>` blocks):**
  Use **`ink-syntax-highlight`** component to nicely format and colorize code blocks. When MDX (with remark-gfm or similar) parses a fenced code block (` ```lang `), the output is typically a `<pre>` wrapping a `<code class="language-lang">`. We will map this pattern to the Ink syntax highlighter. Specifically, we can override the `<pre>` tag in MDX components: our `<pre>` mapping will inspect its child (the `<code>` element) to retrieve the raw code text and language. Then it will return a `<SyntaxHighlight>` component (from `ink-syntax-highlight`) with the code and detected language. The `ink-syntax-highlight` component uses Highlight.js under the hood to apply colors. For example, a JavaScript code block will be rendered with proper syntax colors in the terminal. If no language is specified, the highlighter will auto-detect or default. This approach leverages a well-supported Ink component for code, giving a much better developer experience than plain mono-colored text. (If `ink-syntax-highlight` is not available, we could fall back to plain text or a simpler highlighter, but it is MIT and fairly lightweight, so it’s a good default.)

- **Blockquote (`<blockquote>`)**:
  Render block quotes (lines prefixed by `> ` in Markdown) with an indented, stylized appearance. We will map `<blockquote>` to an Ink `<Box>` or styled `<Text>` that indents its content and perhaps changes the color. One idea is to prefix each line with a vertical bar or `>` in dim color. For simplicity, we might implement the blockquote mapping as:

  ```jsx
  const BlockQuote = ({ children }) => (
    <Box borderStyle='round' borderColor='gray' paddingX={1}>
      {children}
    </Box>
  )
  ```

  However, a full border might be too heavy; alternatively, we could render children with a `dimColor` style or italic to set it apart, and prefix a `>` manually. For now, the default will likely be: indent the content by a couple of spaces (using an Ink `<Box paddingLeft={2}>`) and apply a gray italic style to the text inside. This ensures blockquotes are visually offset, similar to how they appear in Markdown readers, but adapted to terminal capabilities.

- **Lists (Ordered `<ol>` and Unordered `<ul>`):**
  We provide custom renderers for lists and list items to format bullet points and numbers.

  - For `<ul>` (bullet lists), the mapping will use an Ink `<Box flexDirection="column">` to stack list items vertically. We will override `<li>` as well: each list item (`<li>`) in an unordered list will be rendered as an Ink `<Text>` with a bullet symbol prefix (e.g. "• " or "- ") before the item’s content. For example:

    ```jsx
    const Ul = ({ children }) => (
      <Box flexDirection='column' paddingLeft={2}>
        {children}
      </Box>
    )
    const Li = ({ children }) => <Text>- {children}</Text>
    ```

    This results in nicely indented bullet lists. (We indent via paddingLeft in the container so that the bullet and content align under the first bullet.) We could choose a fancier bullet (like a dot •) for better aesthetics.

  - For `<ol>` (numbered lists), we take a similar approach but include numbers. Because the MDX mapping for `<li>` doesn’t automatically know the index, a bit more logic is needed. One approach is to wrap each `<li>` of an `<ol>` with a context that carries the item number. A simpler solution is to not rely on context but rather map `<ol>` to a custom component that manually iterates its children and adds indices. For instance, the `<ol>` mapping function can take `children` (which will be an array of `<li>` elements) and clone or render them prepending the appropriate numbers (1., 2., etc.). Pseudocode:

    ```jsx
    const Ol = ({ children }) => (
      <Box flexDirection='column' paddingLeft={2}>
        {Children.toArray(children).map((child, index) => (
          <Text key={index}>
            {index + 1}. {child.props.children}
          </Text>
        ))}
      </Box>
    )
    ```

    This way, ordered list items are rendered with increasing numbers. The drawback is that any styling inside the `<li>` might be lost if not carefully preserved. We will refine this approach in implementation (possibly by deep-rendering child elements). But conceptually, the default will present ordered lists as numbered lines.

  - **Nested lists:** If lists are nested, our `<Li>` component can detect if its child is another `<ul>`/`<ol>` and adjust (for example, we might add an extra newline or just rely on the nested Box to indent further). Ink’s flexbox support will naturally handle nested Boxes for indentation.

- **Task Lists (GFM Task List Items):**
  GitHub-Flavored Markdown supports task list syntax (`- [ ]` and `- [x]`). These parse into a `<ul>` with list items containing a disabled `<input type="checkbox">` and text. We want to display these with actual checkboxes or similar in the terminal. The **`ink-task-list`** package provides a convenient way to render tasks with states (pending, completed, etc.). We will integrate this as follows:

  - For any `<li>` that contains an `<input type="checkbox">`, we will use a special mapping. For example, if a list item has a child like `<input type="checkbox" checked={true} />`, we interpret it as a task item. Our `<li>` mapping function can check `props.children` for such an element. If found, we will render an `<TaskList>` container with a `<Task>` inside. For a checked box, we use `<Task state="success">` (or simply mark it done), and for an unchecked, use `<Task state="pending">`. The label for the Task will be the text of the list item (excluding the checkbox).
  - Alternatively, to keep it simpler, we might not use `ink-task-list` for static docs, and instead just render `[x]` or `[ ]` manually. But using `ink-task-list` provides nice consistent icons (it may show a checkmark or X). `ink-task-list` is more commonly used for dynamic tasks with spinners, but it can serve static purposes too. We can instantiate `<TaskList>` with children tasks for each item, or even each `<li>` could directly render a `<Task>`.
  - For the initial version, a straightforward mapping is:

    ```jsx
    const Li = ({ children }) => {
      // if the first child is an input checkbox element
      if (children[0] && children[0].props && children[0].props.type === 'checkbox') {
        const checked = children[0].props.checked || children[0].props.defaultChecked
        const label = children.slice(1) // rest of children after checkbox
        return (
          <Text>
            {checked ? '[x]' : '[ ]'} {label}
          </Text>
        )
      }
      // otherwise, normal bullet or number handling
      return <Text>- {children}</Text>
    }
    ```

    This example simply prints `[x]` or `[ ]`. We mention this because implementing `ink-task-list` might require restructuring the list as a whole. In the final design, we plan to support a nicer output (possibly using `ink-task-list` for a group of tasks if tasks are contiguous). The key point is that task list syntax will be recognized and rendered with checkboxes or similar state indicators, rather than showing a literal `[ ]` or leaving the raw HTML input.

- **Horizontal Rule (`<hr>`):**
  Markdown `---` or `***` produce a horizontal rule `<hr>`. In a terminal, there is no horizontal line element, but we can simulate it with a line of characters. The default mapping for `<hr>` will be a full-width line of light gray `─` characters (or `―` or just dashes). We can use the terminal width (Ink’s `useStdoutDimensions` hook to get columns) to generate a line. Simpler, we might choose a fixed length like 50 characters of `-`. This provides a visual separator. (This mapping would be a functional component that prints a newline, then the line, then newline.)

- **Links (`<a>` anchor tags):**
  Use **`ink-link`** to render clickable or copyable links. The `ink-link` component, by Sindre Sorhus, makes hyperlinks clickable in supported terminals and shows the URL in parentheses for unsupported ones. We will map the Markdown `<a href="...">text</a>` to `<Link url="...">text</Link>` from `ink-link`. This way, if a Markdown file contains [Ink website](https://github.com/vadimdemedes/ink) for example, it will render as "Ink website" in cyan (by ink-link default) and clicking it (Ctrl/Cmd + click in many terminals) will open the URL. The user doesn’t have to do anything special – the MDX renderer will automatically use `ink-link` for all anchors. This is a good example of leveraging Ink-specific components to enhance Markdown: normally a CLI might just print the URL, but `ink-link` gives a richer experience.

- **Images (`<img>` tags):**
  Standard Markdown images `![]()` would translate to `<img src="...">`. In a CLI, displaying an actual image isn’t feasible (unless one generates ASCII art or uses iTerm image support, which is niche). For a first version, we might simply output the image’s alt text and URL, or omit images. We will document that images are not rendered (or just display alt text in brackets). This is a common limitation of terminal UIs. (Alternatively, one could imagine an integration with a library that prints images as ANSI art, but that’s beyond our scope by default. We leave this as an extension point – e.g., a user could override `<img>` mapping to use an ASCII image generator component.)

- **Tables (`<table>`, `<tr>`, `<td>`, `<th>`):**
  GFM adds table syntax which results in `<table>` with child `<thead>` and `<tbody>` containing rows (`<tr>`). Rendering tables in text mode requires formatting columns. We will utilize **`ink-table`** for this, which is an Ink component for rendering tables from data arrays. Our approach: when MDX parses a table, we intercept it in the Remark phase or via the component mapping. The simplest solution is a custom Remark plugin that transforms the Markdown table into an MDX JSX node of `<Table>` with a JavaScript object. However, to keep things in the mapping layer, we can map `<table>` to a functional component that examines its children `<thead>` and `<tbody>` to construct data. For example:

  ```jsx
  const TableRenderer = ({ children }) => {
    // children likely [<thead>...</thead>, <tbody>...</tbody>]
    const headers = []
    const rows = []
    React.Children.forEach(children, (child) => {
      if (child.props.mdxType === 'thead') {
        // gather headers from <th> in the first row of thead
        const headerCells = React.Children.map(child.props.children[0].props.children, (th) => th.props.children)
        headers.push(...headerCells)
      } else if (child.props.mdxType === 'tbody') {
        React.Children.forEach(child.props.children, (tr) => {
          const cells = React.Children.map(tr.props.children, (td) => td.props.children)
          rows.push(Object.fromEntries(cells.map((cell, i) => [headers[i] || `col${i + 1}`, cell])))
        })
      }
    })
    return <Table data={rows} />
  }
  ```

  Here, we convert each row into an object with keys from the header row. Then `<Table>` from `ink-table` can take this `data` array and render a formatted table. In practice, implementing this requires careful extraction of text from MDX nodes (since `td.props.children` might be an array of Text nodes). We will handle simple cases (text content in cells). The default behavior will thus display Markdown tables as nice tables in the CLI, with columns aligned. If the table has no header, we might number the columns or just print rows. By using `ink-table`, we avoid manually handling column widths – it will size columns to content automatically.
  If the `ink-table` dependency is undesirable for some (it’s fairly small, and used by other projects), we could instead do a simpler approach: print each row on a new line, joining cells with a separator (like pipes), but that loses alignment. The preference is to use `ink-table` for a polished output.

- **Other HTML elements:**
  Most other raw HTML elements are uncommon in Markdown, but MDX could in theory include any JSX. By default, if MDX produces an element that we haven’t mapped (like `<div>` or a custom tag), it will just fall back to React’s handling. Since there’s no DOM, an unmapped tag like `<div>` will not correspond to an Ink component and likely won’t render anything (or could error). To prevent surprises, we will map a few generic containers:

  - `<div>` or `<section>`: map to an Ink `<Box>` (which is a container for layout in Ink). This way, if someone does `<div style="margin:1 0">` in MDX, it won’t error – though the style is ignored, the content will still render via Box.
  - `<br>`: map to a simple newline (Ink can handle newlines in Text, or we can render `\n` directly).
  - `<hr>` we covered as a line.
  - `<table>` we covered.
  - `<html>, <body>` etc. are not expected in MDX context; we can ignore or strip them if encountered.
  - **MDX Expressions:** While not an HTML element, MDX allows `{` curly brace expressions. Those will be evaluated as JavaScript expressions in the context of the MDX file. Our renderer just passes them through (they become part of the React component logic). So no special mapping needed, but it's worth noting that any dynamic values computed in MDX will work normally in Ink output as they would in React (e.g. `{1+1}` prints `2`, or an MDX file could define a `<Counter/>` component and use it).

All the above default mappings use Ink components that are **ESM-compatible** (most of the listed Ink community components are actively maintained and ship ESM builds). This avoids issues when bundling with esbuild, which prefers ESM for tree-shaking. We specifically chose components like `ink-link`, `ink-big-text`, `ink-table`, `ink-task-list` because they are well-supported and have no heavy dependencies (and support Ink v3+). The default mapping ensures that most common Markdown features render appropriately in the CLI without additional configuration.

## Customizing Component Rendering (mdx-components Override)

While the default mappings cover standard needs, `ink-mdx` allows developers to **override or extend the component mapping** easily. Following the Next.js convention, users can create an **`mdx-components.js` (or `.ts/.jsx/.tsx`)** file at their project’s root (or within `src/`) to define global MDX components. If this file exists, `ink-mdx` will automatically load it.

**Format of mdx-components file:** This file should export either:

- **A mapping object** – where keys are element names (tags or MDX component names) and values are React components or functions to use. For example, one could export `{ h1: MyCustomH1, table: MyTableRenderer }`. This will directly override our defaults for those keys.
- **A `useMDXComponents` function** – which receives the default components and should return a new components object. This pattern is identical to Next.js. For instance:

  ```ts
  import type { MDXComponents } from 'mdx/types';
  import { Text } from 'ink';
  export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
      ...components,
      h1: (props) => <Text backgroundColor="blue" color="white" {...props}/>,
      code: MyCustomInlineCode
    };
  }
  ```

  Using a function allows merging with the provided components easily. If the file exports this function, `ink-mdx` will call it, passing in the default mapping object, and use the returned object as the final mapping. (If the file exports a default object, we merge that onto defaults, with the object’s entries taking precedence.)

**Override capabilities:** Through this mechanism, any element’s renderer can be swapped. For example, if an Ink CLI wants all headings to be simple text instead of using `ink-big-text`, the developer can override `h1`/`h2` to use a custom component (maybe just `Text` with no special styling). Or they could introduce new mappings: say the MDX files use a custom MDX component `<Warning>` (which MDX would treat like an HTML tag unless imported), they can map `Warning` to an Ink component that renders a warning box. This is analogous to MDXProvider usage in other contexts, but using the file convention makes it global and automatic.

**Integration of overrides:** At runtime, `InkMDXRenderer` will combine the default and user-defined components. The merging is done such that user overrides replace defaults for specific keys, and any key not provided uses the default. If the user’s mapping intentionally spreads the incoming components (as in the `useMDXComponents` example above), it will naturally include defaults for unspecified ones. We will document the keys available (the tags mentioned earlier like `'h1', 'p', 'li', 'a', etc.`). Also, if the user wants to completely reset a mapping to native behavior, they could map a tag to a basic Ink component or even a custom implementation. For instance, mapping `'ul': ({children}) => <Box>{children}</Box>` could remove our indentation if they prefer.

**Dynamic overrides:** In addition to the global file, `InkMDXRenderer` can accept a `components` prop (like MDX’s own components prop) for one-off overrides. This prop would take precedence over both default and global ones for that render. This is useful if, for example, you want to inject a different component just for a specific MDX render (maybe a certain page should use a different style). Under the hood, the `components` prop would be merged on top of everything. If using the React component directly, one would do: `<InkMDXRenderer components={{h1: MyHeading}} file="..."/>`. This is akin to how one could use `<MDXContent components={...}/>` manually.

**Loading mechanism:** The `ink-mdx` package will attempt to resolve the `mdx-components` file by searching known locations. By default: the current working directory’s root, or if an environment variable (like `INK_MDX_COMPONENTS`) is set to a path, it will use that. The resolution logic might mimic Next.js’s: e.g., first look for `mdx-components.tsx`, then `.tsx`, `.jsx`, `.js` in either the project root or `src/`. If found, it will require/import it. (We will ensure to handle both CJS and ESM exports depending on the project setup – possibly using dynamic import if it’s ESM.)

**Example Override Use-Case:** Suppose the default uses `ink-big-text` for h1, but a user’s terminal doesn’t render big ASCII well. The user creates `mdx-components.js` with:

```js
module.exports = {
  h1: (props) => <Text bold underline {...props} />,
  h2: (props) => <Text bold {...props} />,
}
```

Now all MDX h1/h2 will render as bold (and h1 also underlined) normal text. Meanwhile, other elements use defaults. This file could also import additional Ink components as needed (make sure to install them). For instance, if they want `<Emoji>` tag in MDX to output an emoji, they can map it. As long as the MDX content uses that tag (and perhaps has it as an import or is a capitalized tag recognized by MDX), it will render.

By providing both sensible defaults and easy overrides, `ink-mdx` ensures flexibility. Projects can theme or style their Markdown content for the CLI as they wish, without modifying the MDX files themselves – just by tweaking the component mappings.

## Bundling Strategy with esbuild

To integrate MDX into an Ink CLI project, we address both build-time and runtime scenarios. Using **esbuild** for compilation offers a fast and simple solution given MDX’s ESM nature and the desire for `.md`/`.mdx` file support.

### Build-Time (Static) Bundling

For production or when distributing a CLI, it’s often preferable to compile MDX ahead of time. Our strategy is as follows:

- **esbuild MDX Plugin:** We utilize the MDX plugin for esbuild, which allows esbuild to recognize imports of `.mdx` or `.md` files. The plugin will parse MDX content into React component code (JSX/TSX to JS). In practice, an MDX file like `guide.mdx` will become a JS module exporting a React component (likely as default export named something like `MDXContent`). We configure esbuild to treat both `.mdx` and `.md` as inputs by the plugin (mirroring Next.js config where needed).

- **Entry Points:** If the CLI project explicitly imports MDX files (like `import Guide from './guide.mdx'`), esbuild will automatically invoke the plugin for those. We also allow specifying MDX files as standalone entry points (for example, to bundle content that’s not explicitly imported elsewhere). The bundling can produce either separate output files for each MDX or bundle them into the main JavaScript. For typical usage, if a CLI has a fixed set of docs, one might import them in the code, so they naturally become part of the bundle. If not, we could generate a content bundle.

- **Output Format:** We target ESM output (if the CLI itself uses ESM) or CJS as needed. esbuild will be configured accordingly (most likely ESM, as Ink itself can be used in either but ESM is future-proof). The MDX plugin outputs a component that uses the React runtime. We need to ensure it uses the correct JSX factory. With React 17+ and MDX v2, the compiled code will likely use the React JSX transform (no explicit `React.createElement` calls), assuming the esbuild JSX settings are proper (or MDX plugin ensures it). We just have to make sure to include `/** @jsxRuntime classic @jsx React.createElement */` if needed or configure MDX to use the automatic runtime with React. Since Ink is basically React, no special runtime changes are needed beyond that.

- **Including Remark/Rehype Plugins:** We will configure the MDX plugin with our default remark/rehype plugins at bundle time. For example, pass `remarkPlugins: [remarkGfm]` in the MDX plugin options to support GFM syntax. If the user has additional plugins (via config), we incorporate those too. This way the MDX is compiled exactly as it would be in runtime scenario – consistency between build and runtime.

- **Asset Handling:** In case MDX files import images or other assets (less likely in CLI usage, but MDX supports import of any file type if bundler is configured), we rely on esbuild’s loaders. We might set `.png` or others to load as data URI or copy files. This is more of an edge consideration; for CLI MDX, images might not be used, or they might be ASCII diagrams which would be just code blocks.

- **Integrating with CLI Build:** The bundling function can be invoked in a build script. We may provide an **InkMDX CLI** command, e.g. `npx ink-mdx build <inputGlob> --out dir`, which wraps esbuild calls. Alternatively, if the project already uses a bundler (like webpack or even Next.js if combining with a web app), they can integrate the MDX plugin there. But since CLI apps often are simpler, including our own bundler invocation could ease adoption. For example:

  ```bash
  # Example usage of a provided CLI (if we include one)
  ink-mdx build "docs/**/*.mdx" --out dist/docs
  ```

  This would compile all MDX files under docs into JS files in dist/docs. Then the Ink app could require those JS files. However, a more integrated approach is to encourage using import statements and let the main bundler do the work. We will document both approaches.

- **Externals and Dependencies:** By default, we will mark `react`, `react-dom` (if any, though Ink doesn’t use react-dom), and `ink` as external in esbuild, meaning they won’t be bundled into the MDX output. The user’s package.json already has those, and bundling them would duplicate code. We also consider marking large Ink components as external if they are already a dependency. For instance, if the CLI explicitly installed `ink-big-text` to use elsewhere, we don’t need to bundle it again inside the MDX output. On the other hand, if MDX content imports some library (e.g., an MDX file does `import { something } from 'some-npm-package';`), esbuild will by default include that in the bundle (unless marked external). We likely leave such packages to be bundled for simplicity, unless the user configures otherwise, because in a CLI scenario it might be fine to have them in one file. The bundler will produce a tree-shaken result courtesy of esbuild’s optimizations.

- **Performance:** esbuild is extremely fast; even dozens of MDX files compile quickly. This means build-time overhead is low. The output is plain JS which can be loaded by Node without MDX parsing, making the CLI startup faster (especially if there’s heavy content). Another benefit is that errors in MDX (syntax errors, etc.) can be caught at build time rather than at runtime in front of end-users.

- **Source Maps:** We can optionally generate source maps for the compiled MDX, useful if debugging. This is not critical for functionality but good for completeness.

**Bundling Example:** Suppose a CLI has documentation pages in MDX and a command to view them (like `mycli docs`). With static bundling, the flow would be:

1. Developer runs `ink-mdx build docs/*.mdx --out docs-build/`.
2. This generates files like `docs-build/intro.js` exporting the MDX component.
3. In the CLI code, they do `import IntroDoc from './docs-build/intro.js';` and then in the Ink render function, use `<IntroDoc />` (wrapped in `InkMDXRenderer` or directly if we embed mapping via MDXProvider in the module).
4. The output shows the nicely formatted doc in the terminal when that command is executed.
   This approach means at runtime, showing the doc is just rendering a React component (no parsing needed, just standard Ink rendering).

### Runtime (Dynamic) Loading

For cases where pre-bundling isn’t feasible or content is truly dynamic (maybe loaded from a CMS, or user-supplied markdown), `ink-mdx` supports dynamic MDX rendering. The dynamic mechanism involves compiling the MDX text to a component on the fly:

- **MDX Compilation at Runtime:** We have two possible implementations:

  - Use the official MDX libraries to compile in memory. `@mdx-js/mdx` (MDX v2) exports an `compile` or `evaluate` function that can take MDX source and return ESM code or even directly evaluate it to a component with a provided environment. We could use `compile(mdxSource, { remarkPlugins, rehypePlugins, ... })` to get a string of JS, then use `import()` via a data URI or a temporary file to execute it. There is also `@mdx-js/runtime` which does evaluation internally, given a scope of variables (components). However, `@mdx-js/runtime` doesn’t support import statements inside the MDX (since it doesn’t bundle), so it’s limited if MDX content relies on importing other modules. For maximum compatibility, we might avoid `MDXRuntime` and do a full compile + execute.
  - Use **esbuild in-memory**. We can call `esbuild.transform(mdxSource, { loader: 'jsx', ...plugins })` after plugging in the MDX plugin programmatically. `esbuild.transform` returns the compiled code as a string (plus source map). Then we can run that code. Another method is to use `mdx-bundler` which essentially orchestrates esbuild for you. In fact, `mdx-bundler` can take MDX content (as a string) and return a JS string that exports a component, and it even can provide a helper to get a React component from it. Under the hood it creates a temporary file and uses Node’s `require` or dynamic import. We can mirror that logic. The benefit of using esbuild at runtime is that we get import resolution – meaning if the MDX file says `import X from './other.mdx'` or imports some npm package, as long as we provide a resolve mechanism and the files, esbuild will handle it. We would need to supply a working directory or set of files to esbuild. For local files, we can point to the real path. For node_modules imports, esbuild can find them. This effectively bundles on the fly.

- **API for runtime:** The `InkMDXRenderer` component abstracted this – if given a `file` prop, it will likely call an async function to load and compile that file’s content. This could be implemented with a React Suspense or a simple spinner while loading. Since Ink CLIs can handle async (the render can await a promise if using Ink’s app structure), we can also provide a hook like `useMDX(filePath)` that returns the compiled component (loading state handled as needed). But for simplicity, we might just block rendering until loaded by calling the compile then render synchronously (Ink’s render is synchronous once data is ready, but we can manage it by reading file sync for local content possibly). Alternatively, we document that dynamic usage is async and the CLI should handle that (e.g., show a spinner while content loads).

- **Performance and Caching:** Compiling MDX at runtime has a cost (parsing markdown, generating JS, etc.), but for reasonable file sizes this is often fine (milliseconds given MDX’s improvements and esbuild’s speed). We will still implement caching to avoid repeat work: if the same file is loaded multiple times, we can cache the compiled component by file path (based on timestamp or hash). Also, if using the same `remarkPlugins` etc., we don’t need to reinitialize anything heavy repeatedly. If content comes from remote sources, caching those in memory is also useful.
  In scenarios where many MDX files might be loaded repeatedly (like a dev who constantly reloads docs), caching improves responsiveness.

- **Limitations:** If MDX content imports other files, the dynamic loader must have access to them. For local relative imports, we can intercept MDX’s import syntax via esbuild (it will read those files). For remote content, we probably disallow import (or require the user to provide a way to resolve it). Our design will note that dynamic loading is best for self-contained MDX or known local includes. If complexity arises, users should prefer bundling.

- **Security:** As noted, executing MDX means executing arbitrary JS from that file. In a CLI context, loading untrusted MDX is a risk (it could run malicious code on the user’s machine). If the MDX content is user-supplied, the CLI author should ensure it’s sanitized or trusted. We will mention this in docs (like Next warns about remote MDX). Our library can provide an option to disable actual JS evaluation (e.g., treat the file as plain Markdown by not allowing imports or JSX) if needed, but by default we assume MDX files are part of the application or trusted data.

**Dynamic Example:** Consider a CLI that takes a filepath from the user, reads that Markdown, and displays it (like a markdown viewer). Using `ink-mdx`, one could do:

```js
import { render } from 'ink'
import { InkMDXRenderer } from 'ink-mdx'

const filePath = process.argv[2]
render(<InkMDXRenderer file={filePath} />)
```

When run, the Ink app will use the runtime loader to parse the given file (supporting MDX syntax if present) and then render it with all the default Ink components. The user sees formatted output in their terminal. This is powerful, as it essentially brings MDX capabilities to any CLI tool with minimal code.

In summary, the bundling strategy uses esbuild to handle MDX both at build-time (for production bundling) and at runtime (for dynamic usage). This dual approach is influenced by tools like `mdx-bundler`, which advocates for runtime bundling for scalability, as well as frameworks like Next.js that primarily bundle at build-time. We give developers the choice, thereby covering use cases from static CLIs to dynamic content viewers.

## Handling MDX Syntax and Embedded Components

Because MDX allows mixing JSX into Markdown, `ink-mdx` is designed to properly handle React/Ink components defined or used within MDX files:

- **JSX Elements in MDX:** When an MDX file contains a JSX tag (e.g., `<MyComponent prop={value} />`), the MDX compiler will treat it as an embedded React component. For this to work in our CLI context, the component must be **in scope** for the MDX file. MDX provides two main ways to supply such components: through explicit imports in the MDX file, or via the `components` mapping for known MDX element names.

  - If the MDX file has an import at the top (`import { MyComponent } from './components.js'`), our bundler will resolve that and include it (static case), or our runtime will attempt to import it during compile. This is fully supported – MDX’s power is that you can import any React (Ink) component and then use it in the markup. So a doc can include interactive or stateful UI from the CLI’s codebase.
  - If the MDX uses a custom tag without an import, MDX will assume it’s a “global” component passed in. For example, writing `<ColorText>hello</ColorText>` in MDX with no import means MDX will at runtime look for a component named `ColorText` in the `components` prop or context. Our design could allow injecting such components via the `mdx-components` override file. For instance, if a user maps `ColorText` to an Ink `<Text color="green">` in the global mapping, then MDX will render that tag with the provided mapping. This approach is useful for “shortcodes” or frequently used custom elements – the CLI author can provide them without each MDX file having to import. We will document that any capitalized tag in MDX is treated as a component and either needs an import or a mapping.
  - If neither is provided, the MDX compilation will treat it as an undefined component and likely throw an error or produce a React element that doesn’t resolve (which would error at runtime). So in practice, custom components must be known either via import or mapping. Our Next.js-like setup encourages using imports for one-off components and the global mapping for cross-cutting overrides or styling.

- **Props and Interactivity:** Any JSX component in MDX can receive props or contain other JSX. This works as in normal React. For example, a MDX file might have:

  ```mdx
  <SelectInput
    items={[
      { label: 'Yes', value: 1 },
      { label: 'No', value: 0 },
    ]}
    onSelect={(item) => console.log(item.value)}
  />
  ```

  If `SelectInput` is imported from `ink-select-input`, this will render an interactive list in the middle of the MDX content. The MDX renderer doesn’t differentiate – it will incorporate that component into the tree. Ink will manage its lifecycle (the input can capture keypresses, etc.). This means our MDX output isn’t limited to static text; it can contain live Ink sub-components (forms, spinners, etc.). This is a major advantage of MDX in CLIs: you can author rich interactive experiences in one file. We ensure that our runtime supports this by not interfering with Ink’s event loop. (We should note: if a component requires to be rendered within an Ink context, our `InkMDXRenderer` is already within one since it’s used inside Ink’s render. So everything is fine. If an MDX component tries to use hooks, that’s fine – it’s just part of the React tree.)

- **MDX Frontmatter:** MDX supports YAML frontmatter (between `---` at top) which by default is parsed out. We do not explicitly use frontmatter in rendering, but the MDX compiler might attach it to the exported content (some setups export it as a metadata property). We will not strip it; if needed, the CLI author can get it by importing the MDX module (some MDX integration export a `metadata` alongside the component). In a CLI help doc scenario, frontmatter could carry a title or order, but that’s outside rendering scope. We’ll simply ignore it in output unless we provide an API to retrieve it.

- **Differences between `.md` and `.mdx`:** By treating `.md` with the same pipeline, we essentially allow JSX in `.md` if someone adds it. However, authors usually won’t put JSX in .md files. Our system can handle it if they do (since MDX compiler will parse it). If desired, we could configure `.md` to disallow JSX (some MDX tools allow toggling “MDX mode”). But for consistency, we’ll assume `.md` = MDX (just without expected JSX). The key difference is often that `.md` files might not include `import` statements at top (which would look weird in pure Markdown). If an `.md` file does contain an import, MDX will still process it (the syntax is valid MDX). So effectively, file extension doesn’t drastically change behavior after our integration.

- **JSX runtime / React version compatibility:** We rely on React (peer dependency) and Ink’s renderer. MDX compilation will produce code targeting React 18 (or the version in use). We must ensure to use the correct JSX runtime. Possibly we set `jsxImportSource: 'react'` in MDX compile options and use the automatic runtime (which is standard for React 17+). The MDX example for Ink from official docs suggests that we might need to configure MDX to use the React runtime properly and swap elements to Ink’s components. Specifically, MDX by default would create `<h1>` as a React element of type 'h1'. But because we provide a components mapping for 'h1', at render time it uses our Ink component. This is how MDX normally works (it doesn’t literally create DOM <h1> because our MDXProvider intercepts it). So no special compile-time swap is needed. However, MDX v2 introduced `providerImportSource` which can automatically inject the components mapping at compile time. Next.js opts not to use that and instead uses the file convention. We will similarly not use `@mdx-js/react` directly with providerImportSource, since our approach is to manually supply components. This is fine. It also means our code stays simpler (just one context to manage).

- **Testing and TypeScript:** If the MDX file or imported components are in TSX, esbuild will handle type stripping. We might supply `.d.ts` for the MDX modules so TypeScript knows the import is a React component (some use `declare module '*.mdx'`). We will likely include a type definition like: `declare module '*.mdx' { import { FunctionComponent } from 'react'; const MDXComponent: FunctionComponent; export default MDXComponent; }` for convenience. That way, TS projects can import MDX without errors. This is an implementation detail but relevant for dev experience.

By addressing MDX’s JSX and import capabilities, `ink-mdx` ensures that writing an MDX file for Ink is as powerful as writing a React component for Ink directly. Authors can mix static Markdown content with dynamic components freely. For example, documentation can have live examples or prompts inlined. The renderer simply treats everything uniformly as part of the Ink component tree.

To illustrate: the MDX content

```mdx
# CLI Tutorial

Welcome to the tutorial.

<InkSpinner /> Loading something...

- Item 1
- [ ] Task not done
- [x] Task done

<CustomChart data={[1, 2, 3]} />
```

will be processed such that:

- `# CLI Tutorial` uses `ink-big-text` for a banner title,
- The paragraph uses `<Text>`,
- `<InkSpinner>` (assuming `InkSpinner` is imported from `ink-spinner`) will render a spinner animation in place,
- The list will render bullets and tasks (with checkboxes as described),
- `<CustomChart>` if defined (maybe a custom Ink component for drawing a chart) will render accordingly.

All of this is possible within one MDX file, and `ink-mdx` makes it work out-of-the-box.

## Integration with Ink CLI Runners (Compatibility)

`ink-mdx` is designed to integrate smoothly with Ink-based CLI applications. There are a few considerations to ensure compatibility:

- **Ink’s Render Loop:** Ink apps typically use `render(<App/>)` to start the UI. `InkMDXRenderer` is just a React component, so it can be used inside any Ink `<App>` component or even as the main component. There’s no special requirement – as long as the Ink `render` is called at some point, our MDX content will display. This means you can use `ink-mdx` in any context where you would normally use an Ink component. For example, if using a framework like [Pastel](https://github.com/vadimdemedes/pastel) (which wraps Ink), you could import an MDX component and include it in your command’s output JSX.

- **CLI Arguments & Dynamic Content:** If the content to display depends on CLI arguments (say `mycli readme --file intro.md`), one can easily pass that file path to `InkMDXRenderer`. Since our renderer supports dynamic loading, frameworks that allow passing props into the React tree (like Commander + Ink patterns) can funnel a file path prop. Our component can pick it up and render accordingly. This flexibility aligns with building tools that show user-specified markdown.

- **Non-TTY Environments:** If the CLI is run in a context without an interactive TTY (piped output, etc.), Ink usually detects it and can still render (though interactive components won’t function). Our MDX content is mostly static output (plus any interactive ones if present). If interactive components (like select inputs) are included, they simply won’t be usable without a TTY. But that’s identical to any Ink app; there’s no additional limitation introduced by `ink-mdx`. The static parts (text, tables, etc.) will still be printed when piped to a file, for instance. So in documentation, we will clarify that `ink-mdx` is as compatible with piping/recording output as Ink is. E.g., you could do `mycli docs > docs.txt` and you’d get the markdown rendered as plain text (with some ANSI codes for colors, which one can strip if needed).

- **Concurrency and multiple renders:** Ink has a reconciliation engine that typically expects one active render at a time. If an MDX content includes interactive components that pause or wait, and then perhaps the app renders a different MDX content, we just ensure to unmount previous content properly. Our API doesn’t inherently create multiple Ink instances; it stays within the one React tree. So unless a developer explicitly tries to render two separate Ink roots concurrently (which they normally wouldn’t), everything runs in one tree. For example, if a user wants to implement a step-by-step tutorial where different MDX pages show sequentially, they can manage state in the Ink app to switch which MDX component is shown (e.g., using Ink’s `useApp` to exit or using state to conditionally render one MDX or another). That’s more an application logic, but `ink-mdx` doesn’t hinder it.

- **Testing:** The Ink ecosystem has `ink-testing-library` for rendering components in tests. MDX components produced by `ink-mdx` are just React components, so they can be tested similarly. For static MDX, one can import the compiled component and render it in a test to inspect output (the testing lib will give the text output, which should match expected). For dynamic MDX, one could simulate it by calling the loader function on a string. We might expose a utility like `renderMDXString(mdxString) => ReactNode` for testing or advanced use (this is essentially what dynamic does but returning a component tree or an element). Ensuring that our output is testable is part of compatibility with typical development workflows.

- **Ink version compatibility:** We plan for `ink-mdx` to be compatible with Ink v3 (current stable) and v4 (if it emerges). Ink’s API for components is stable (the `<Text>`, `<Box>` etc. will remain). If there are breaking changes in a new Ink, we can adjust our default components accordingly in a new version. The design is not tied to an internal Ink behavior – it uses public APIs – so it should remain robust across Ink updates.

In short, `ink-mdx` acts as a facilitator: it doesn’t replace Ink’s `render` or require a custom CLI runner. It simply provides components and utilities to turn MDX files into Ink’s React tree. Thus, any existing Ink CLI can incorporate it with minimal changes (just using the component or loader where needed). We also consider providing a small wrapper for convenience, for example a CLI command to quickly preview an MDX file using Ink (which would essentially do `render(<InkMDXRenderer file="..."/>)` internally). This could be handy for users who want to test how their markdown looks in the terminal without writing their own Ink app – but that’s more of a bonus tool rather than core architecture.

## Conclusion

The `ink-mdx` package brings Markdown/MDX rendering to Ink-based CLIs in a flexible and powerful way. The design emphasizes a clear separation between content and presentation: authors can write content in MDX (with optional interactive JSX), while the Ink-specific rendering details are handled by the package’s default components (and can be tuned via an `mdx-components` file). Key features like Next.js-style component overrides, support for both `.md` and `.mdx` files, pluggable Remark pipelines, and the dual-mode operation (pre-bundle or runtime load) make `ink-mdx` suitable for a wide range of use cases – from static documentation embedded in a CLI to dynamic markdown readers.

By using esbuild for compilation, we achieve fast builds and compatibility with modern JS/TS, and by leveraging the rich Ink component ecosystem (big text, tables, links, etc.), the rendered output is user-friendly and polished. Crucially, MDX’s ability to embed React components means CLI authors are not limited to static text – they can include live elements (forms, spinners, etc.) directly in their documentation, blurring the line between docs and UI in a beneficial way.

This design document outlined the module structure and responsibilities, the default HTML-to-Ink component mapping (covering all standard Markdown and GFM elements), how custom mappings are integrated, the approach to bundling with esbuild, and how the MDX syntax (JSX, imports) is handled in the context of an Ink app. It also touched on compatibility considerations, ensuring `ink-mdx` fits naturally into the Ink CLI development experience.

Overall, `ink-mdx` aims to simplify the process of writing and displaying richly formatted text in CLI applications, using familiar Markdown syntax enhanced by the power of components. By following the patterns established in frameworks like Next.js for MDX and adapting them to the CLI/Ink environment, we provide developers with a powerful tool to build better command-line interfaces.

**Sources:** The design draws on MDX’s documentation and examples for using MDX with Ink, Next.js MDX integration guides, and the APIs of various Ink components such as `ink-link` and `ink-syntax-highlight` to ensure feasibility and alignment with existing best practices.
