# Using Velite for a TypeScript Markdown/MDX Content SDK

## File System Access and Globbing with Velite

Velite is designed to turn local content files into structured data. It uses glob patterns to locate Markdown/MDX (and other) files in your project. For example, you can define a **collection** of content with a pattern like `'posts/**/*.md'` in `velite.config.js`. Under the hood, Velite relies on Node’s file system and a globbing library (e.g. **fast-glob**) to scan directories for matching files. This means the SDK can leverage Velite’s glob pattern support to **list content files** (for a `list` method) and watch specific folders. By using Velite’s collection definitions, the SDK can easily gather all Markdown/MDX files that belong to a content set.

When Velite builds the content, it reads each file from disk (using Node’s fs APIs) and processes it. The SDK can call Velite’s JavaScript API (e.g. `build()`) to perform this scanning and get a structured result of all entries. This result is essentially a JSON-like object mapping each collection name to an array of entries (or a single entry) representing the parsed content. For example, after running `build()`, you might access `result.posts` to get an array of blog post entries. Velite’s output is **framework-agnostic** – it writes JSON files for each collection and even an index file to import them easily in code. The SDK can take advantage of this by either reading the generated JSON or by using the in-memory result returned by the `build()` function.

Because Velite’s content discovery is based on glob patterns, the **`list`** operation in the SDK can simply return the array of entries Velite found (e.g. all posts). This gives a complete listing of content with minimal effort. Each entry includes metadata and content derived from the file (more on that structure below).

## Real-Time Updates with Velite’s Watch Mode

Velite supports a watch mode that monitors the file system for changes and rebuilds content on the fly. When you run Velite with the `--watch` flag (or via `velite dev`), it uses **Chokidar** internally to watch the content directory. On any file change (create, update, delete), Velite will automatically re-read and rebuild the affected content. For example, running `npx velite dev --watch` will output initial build results and then log “watching for changes in 'content'”. In watch mode, if you edit a Markdown file, you’ll see Velite detect the change and regenerate the JSON/output for that entry almost immediately.

For the SDK, this means we can leverage Velite’s watch capability to provide **real-time updates**. The SDK could invoke Velite’s programmatic API with `{ watch: true }` (since the `build()` function accepts a `watch` option) to start watching. As files change, Velite will keep the output data up-to-date. To integrate this, the SDK can listen for changes in the generated data or hook into Velite’s watch events. One approach is to monitor the output JSON files for modifications, or if Velite exposes an event emitter for changes (it doesn’t currently via public API, but this could be extended), subscribe to those events. In practice, a simple strategy is: run `build({ watch: true })` and then whenever a user calls an API method like `get` or `list`, fetch the latest data from Velite’s result (which will reflect any changes due to watch mode).

By using watch mode, the SDK’s data layer becomes reactive. A **`get`** call will always see the latest content, and the SDK doesn’t need to manually rescan everything on each change – Velite does the heavy lifting. If we extend Velite’s API, we could add callbacks on file events (e.g. onAdd, onChange, onDelete) to update in-memory caches or trigger client updates. This would make the SDK suitable for a dev server where content edits (even from an editor or CMS UI) immediately propagate to the application.

## Database-like API: `get`, `set`, `delete`, `list`

Using Velite’s content handling, we can implement a database-like interface in TypeScript. Here’s how each operation can work:

- **`list()`** – Returns all content entries (or all keys) in the collection. Velite’s build result already provides an array of entries for each collection. For example, `list('posts')` could simply return the array of post entries. This is essentially reading the `.velite/posts.json` data (or the in-memory `result.posts`). Because Velite validates and types the content, these entries will have a known shape (defined by your schema). Listing is straightforward since Velite’s glob + build finds all files initially.

- **`get(id)`** – Retrieves a single entry by some identifier. Often a slug or filepath serves as the primary key. In Velite, you can enforce unique slugs via `s.slug()` schema or generate one from the path via `s.path()`. For example, each post might have a `slug` field (from frontmatter) that Velite validated as unique. The SDK can maintain a map from slug to entry (or just search the list) to implement `get(slug)`. Since Velite includes all frontmatter fields in the output, the slug or any unique frontmatter property is accessible. If using file paths as IDs, those can be derived from Velite’s internal data as well (Velite’s `path` or even the file name). Essentially, `get` will look up the appropriate entry from the current data.

- **`set(id, changes)`** – Creates or updates a Markdown/MDX file. This is where we move beyond Velite’s read-only operations into writing. To **create** a new entry, the SDK can generate a new Markdown/MDX file in the content directory. For example, to create a new blog post, the SDK might write a file like `content/posts/new-post.md` with given frontmatter and content. To **update** an existing entry, the SDK would open the corresponding file (Velite’s entries can store a reference to the original filepath or we derive it from slug) and apply changes. Velite itself doesn’t have a direct “set” function, but we can use Node’s `fs` module to write changes to the file system. After writing, if Velite’s watch mode is active, it will detect the file modification and automatically reprocess that file – effectively updating the entry in the data layer. In this way, the SDK delegates the heavy lifting to Velite: we only ensure the file is saved, and Velite updates the in-memory representation and output.

- **`delete(id)`** – Removes a content entry by deleting its file. Again, using Node’s filesystem API, the SDK can `fs.unlink` the Markdown/MDX file corresponding to the entry. Velite’s watcher will catch that the file was removed and will update the content output (e.g. removing that entry from the JSON data). This means after deletion, a `list` or `get` will no longer include the deleted item. Velite also handles cleaning up any derived outputs; for instance, if that content had copied images into the `public/static` folder, those might remain unless Velite cleans them up (currently Velite may not auto-delete static assets, so an extension could be needed to remove orphaned files).

Internally, Velite uses **fast-glob** to initially discover files and **Chokidar** to watch changes, so these create/update/delete operations all tie into those mechanisms. The SDK essentially performs the file operation and relies on Velite to pick up the change. If not running in watch mode, the SDK could manually trigger a rebuild after a set/delete (e.g. calling `build()` again to refresh the data). However, for a smooth dev experience, using watch mode is ideal.

Because Velite’s build is quite fast (it processes only changed files in watch mode), the overhead of these operations is low – akin to updating a database and having an indexed view update. The **end result** is a content store that you can query (`get/list`) and mutate (`set/delete`) with changes reflected in near-real-time.

## Granular Frontmatter Merging and Content Edits

A key requirement is updating only parts of a Markdown file – for example, merging a specific property into the YAML frontmatter, or appending content to the body, rather than overwriting the whole file. Velite’s focus is on reading and transforming content, so it doesn’t provide a built-in function to merge frontmatter, but we can implement this using Velite’s parsing capabilities and common libraries:

- **Merging YAML frontmatter**: Frontmatter is the YAML section at the top of a Markdown/MDX file (delimited by `---`). To merge or update specific fields (e.g. update the `title` without touching other fields), the SDK can parse the frontmatter, modify the desired key, and rewrite it. One way is to use a library like **gray-matter** (which Velite itself likely uses under the hood via its “matter” loader) to parse the file. For example, Gray-matter can split a file into `{ data, content }` where `data` is the frontmatter object. The SDK would take `data`, merge in the new properties (e.g. update a value or add a new field), and then stringify the frontmatter back together with the content. Gray-matter provides a `stringify` method to recombine data + content into a Markdown string with frontmatter. Using this approach ensures the existing frontmatter format is preserved as much as possible (ordering of keys might change unless handled, but YAML doesn’t guarantee order anyway). By **merging**, we only alter the specified fields and leave any other frontmatter values intact.

  Another approach is using Velite’s Zod schema capabilities: If the schema is known, the SDK could validate new frontmatter data against it before writing. For example, if the collection’s schema expects a certain type for a field, we ensure the merged value conforms to that. Velite’s schema doesn’t directly rewrite files, but the SDK can use it to validate and then perform the file write. The important part is isolating just the YAML block. This can be done by reading until the closing `---` line and replacing just that section. Using a YAML library (like js-yaml) to dump the merged object to a YAML string ensures proper formatting.

- **Appending or replacing content body**: To append content, the simplest method is to open the file and add text at the end. However, for more structured editing (like inserting content at a specific section or replacing a particular paragraph), the SDK might use a Markdown AST. Velite’s pipeline already parses Markdown into an AST (Abstract Syntax Tree) using **mdast** (markdown AST) utilities. We could tap into similar utilities (like the Remark library) to parse the markdown, manipulate it, and stringify it back. For example, if we want to append a new section with a specific heading, we could:

  1. Parse the Markdown content (excluding frontmatter) to an AST.
  2. Construct a new AST node for the section (e.g. a heading node and some paragraph nodes).
  3. Append that node to the AST.
  4. Serialize the AST back to Markdown text.

  This approach ensures the Markdown remains well-formed. For simple appends, directly writing to the file (e.g. adding text after the last line) is fine, but for inserting or replacing a middle section, AST manipulation is safer. The SDK could use **unified** + **remark-parse** and **remark-stringify** for this. Since Velite itself is already using unified internally, an advanced extension might expose Velite’s parser to perform these transformations. In absence of a direct Velite API, using the same ecosystem libraries is effective.

In summary, the SDK can implement **granular updates** by reading the file, doing a targeted edit (merge YAML or edit markdown) and then saving. Thanks to watch mode, as soon as the file is saved, Velite will rebuild that file’s data. From the outside, it looks like we did an atomic update of a “record” in a database. For example, if you call `set('post-slug', { data: { published: true } })`, the SDK would locate `content/posts/post-slug.md`, parse and set `published: true` in its frontmatter, write the changes, and Velite would update the output entry with the new frontmatter field included.

## Markdown-to-HTML Conversion and MDX Compilation

One of Velite’s strengths is content **transformation**. The SDK should return not just the raw markdown but also rendered HTML and compiled MDX for each entry. Velite provides built-in schema fields to handle these transformations:

- **Markdown to HTML**: Velite can automatically convert Markdown content into HTML string using the `s.markdown()` schema helper. In a collection schema, you might define a field like `content: s.markdown()` which tells Velite: “take the body of the document and output it as HTML.” In the Velite config example, they used `content: s.markdown()` to populate an HTML version of the post content. This uses a Markdown processor (with GFM, etc.) under the hood and produces sanitized HTML. The SDK can include this field so that every entry’s HTML is readily available. This is useful if the SDK is used in a context where you want to display the content as HTML (e.g. in a non-React environment or for preview).

- **MDX compilation to code**: Velite also supports MDX out of the box. Using `s.mdx()` in the schema will compile the content into an **MDX module function body**. By default, Velite takes an MDX file’s JSX/MDX content and compiles it into a string of JavaScript code representing the React component **without bundling it** (so components referenced are external). For example, if your MDX file exports a constant or includes JSX, Velite’s `s.mdx()` will output a string that, when executed, returns an object with a default render function and any named exports. In the documentation’s MDX example, a file contained `export const year = 2023` and some JSX. Velite produced a `code` string that, when run, returns `{ year: 2023, default: function MDXContent(...) { … } }`. The SDK can use this to provide a **compiled module**.

  _Velite’s MDX runtime:_ Because the output is a raw function body, running it requires providing the React runtime. The Velite docs illustrate how to do this: by using `new Function(code)` and passing in `React/jsx-runtime` as an argument. The result is a component that can be rendered. For the SDK, we could wrap this in a utility – e.g. a function `getMdxModule(entry)` that takes the `entry.code` string and executes it, returning the actual module. This would let you extract named exports or the default component easily. For instance:

  ```ts
  const fn = new Function(entry.code)
  const module = fn({ ...runtime }) // runtime is React's jsx runtime
  const Component = module.default
  // any named exports like module.year or module.SomeComponent are accessible
  ```

  With this, the SDK’s consumers can either render the MDX via React (using the `Component`) or even use the constants. This fulfills the requirement to **extract named exports** like React sub-components or constants defined in the MDX frontmatter. (In MDX v3, exports can be created with `export` keyword as shown; Velite ensures they end up in the module object).

- **Other transformation utilities**: Velite includes many helpers that our SDK benefits from. For example, `s.image()` will process an image file path in frontmatter: copying the image to your public folder and returning an **Image object** with metadata (including a blurDataURL for placeholders). Similarly `s.file()` copies any file to the static folder and gives you its public URL. There are also `s.excerpt()` to generate a summary excerpt of the markdown, `s.metadata()` to get word counts or reading time, and even `s.toc()` to produce a table of contents. All these are built on Velite’s internal **unified** processing pipeline (using mdast/hast utilities) and Node fs operations. The SDK can simply enable these in the schema, and Velite will handle the heavy lifting. For example, if an MDX file contains an image link `![...](image.png)`, Velite (with `copyLinkedFiles: true` option) will copy `image.png` into `.velite/static` with a hashed name and update the HTML or image field accordingly. This means our SDK’s returned `html` or `data.cover` can directly include the correct references (like `{ src: "/static/cover-<hash>.jpg", blurDataURL, width, height }`). This is extremely useful for integration with Next.js (which can use those blur data and dims for `<Image>` components).

In summary, Velite’s transformation capabilities allow the SDK to provide **rich output** for each entry:

- **`data`** – an object of frontmatter fields (possibly with some fields transformed, like dates to ISO strings, images to image metadata, etc.).
- **`content`** – the raw Markdown content (if we include it via `s.raw()`).
- **`html`** – the rendered HTML string of the Markdown (via `s.markdown()`).
- **`code`** – for MDX entries, a compiled code string that can be turned into a React component/module (via `s.mdx()`).
- **`module`** (if we choose to expose it) – we could go a step further and execute the code string to provide an actual module object. However, doing so on every file change might be expensive; it may be better to let the application decide when to compile the MDX string (e.g. as in Next.js, they might import the code string and use a dynamic component loader).

Notably, **Velite ensures that all these outputs stay in sync**. When a file changes, the HTML, code, and other derived fields are all regenerated together. The SDK doesn’t have to manage separate pipelines for markdown vs MDX vs assets – Velite’s unified pipeline covers it.

## Resulting Content Structure and Integration

Bringing it all together, the SDK built on Velite would present each content entry similar to a database record with rich fields. For example, an entry might look like:

```ts
{
  data: {
    title: "Hello world",
    slug: "hello-world",
    date: "1992-02-25T13:22:00.000Z",
    cover: { src: "/static/cover-2a4138dh.jpg", width: 1200, height: 800, blurDataURL: "...", ... },
    // ...other frontmatter fields...
  },
  content: "*Lorem ipsum dolor sit amet...*",    // raw markdown text (optional)
  html: "<p>Lorem ipsum dolor sit amet, ...</p>", // HTML string (for Markdown)
  code: "const { Fragment, jsx, jsxs } = ...",    // MDX function-body string (for MDX files)
}
```

Velite can be configured to produce such an object. We might use a schema with `s.raw()` for the raw content and then use a Zod transform to nest frontmatter fields under a `data` key. For instance, one could define the schema as an object and call `.passthrough()` to allow unknown frontmatter fields, then use `.transform()` to separate `content`/`html` from the frontmatter. Velite’s extensibility allows this kind of customization – we can capture all frontmatter as an untyped record and then restructure it. (In Velite’s example, they directly list frontmatter fields in the schema, but one could instead accept any and group them.)

Finally, integrating this SDK into a Node.js context or a Next.js/React project is straightforward because Velite was built to be framework-agnostic. In a Node environment (like a local CLI or script), you can run `build()` and get the data in memory or read the `.velite/*.json` outputs. In a Next.js project, you could run Velite as part of the build (or dev process) to generate content data, then import the data. Velite even generates TypeScript definitions (`.d.ts`) for the content, ensuring type safety. Next.js integration can be done by treating the content as static props or using a headless CMS approach: for example, one might use Next’s file system routes to load content via the SDK at request time. However, a simpler method (for static blogs) is to let Velite output an `index.js` that exports collections, and import from there. The Velite docs show `import { posts } from './.velite'` which gives you the array of posts in your Next.js app. This is similar to how Contentlayer works, and it means after running the SDK’s build, your Next app has a JSON dataset to use.

Looking forward, if we want **live edit integration with Next.js**, we could run the SDK in watch mode alongside Next’s dev server. When the SDK (Velite) detects a change, it could communicate to Next (perhaps via HMR or a custom API route) to refresh the data. Next.js doesn’t automatically reload static imports when a file outside of its build changes, but one could force re-fetching of data through a dynamic route or even use Next’s new file-based MDX loader (Velite could potentially plug into that). Since Velite’s content is just data, another approach is to not rely on static import in dev: instead, query the SDK (which holds the data in memory) via an API route. The SDK could expose the `get/list` methods through an HTTP API in development, so that the Next app can fetch fresh data on each request (or subscribe via websockets for changes). This would make content editing appear instantaneous in the Next front-end.

In conclusion, **Velite provides the core engine for this content SDK**. It handles low-level concerns: file I/O, parsing frontmatter, converting Markdown to HTML, compiling MDX to JS, copying asset files, and even watching for changes. By wrapping Velite with a friendly TypeScript interface (`get/set/delete/list`), we can treat the filesystem as a database of Markdown content. We can update YAML frontmatter or markdown sections in a fine-grained way by parsing and rewriting, then lean on Velite to re-validate and output updated data. The resulting object structure gives us everything: structured frontmatter (`data`), raw content (`content`), rendered HTML (`html`), and even a ready-to-use MDX component code (`code`). Because Velite was built with type safety and extensibility in mind, our SDK can maintain robust types and even extend Velite’s loaders or schemas if needed (for example, adding a custom transformation or field).

Overall, using Velite as the foundation means the SDK inherits a proven content processing pipeline, making it much easier to implement a full CRUD interface over Markdown/MDX content with real-time feedback and seamless integration into Node.js and Next.js contexts. The heavy lifting of reading/writing files and performing transformations is handled by Velite’s API, while the SDK focuses on orchestrating those capabilities into a cohesive developer-friendly package.

**Sources:**

- Velite documentation and examples for content collections, watch mode, and schema transformations
- Velite API Reference (build function and output structure)
- Velite extended schema utilities (Markdown to HTML, MDX compilation, image/file handling)
- MDX support in Velite (compiled code and runtime usage)
- Velite’s philosophy (framework-agnostic output, integration with Next.js)
