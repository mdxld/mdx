# Building an MDX-Based Web Notebook System

## Overview of the Architecture

Building a web-based notebook **à la Jupyter** with MDX involves a full-stack solution that spans content storage, dynamic MDX rendering, interactive code execution, and a rich client UI. At a high level, the system consists of:

- **Next.js 13+ (App Directory)** as the web framework (using React 18). Next.js will fetch notebook content from the CMS and render MDX pages. It allows mixing **Server Components** (for data fetching and initial render) with **Client Components** (for interactive editors/previews) in the new App Router.
- **MDX for Notebook Format:** Notebooks are written in MDX (Markdown + JSX). MDX provides a Markdown-like syntax for text and code, but also allows embedding React components. This means notebook authors can include interactive UI directly in the content. Each code cell is represented as a fenced code block in MDX.
- **Payload CMS** (self-hosted, SQLite DB) as the persistence layer. Payload will store the MDX content (and any metadata like title, author, etc.) for each notebook. Next.js (server) fetches this content via Payload’s REST/GraphQL API or SDK. (Payload _does_ support MDX content serialization, which can be leveraged to store and retrieve MDX safely.)
- **Monaco Editor** on the client for code editing. Monaco (the VS Code editor core) provides a rich in-browser code editing experience (syntax highlighting, autocompletion, etc.). Each code cell in the notebook will be rendered with a Monaco editor instance for live editing of the code.
- **Interactive Code Execution Sandbox** running in the browser to execute user-entered code securely. This sandbox can be implemented with sandboxed iframes or Web Workers to isolate the code execution from the main application for security. The sandbox executes JavaScript/TypeScript/JSX code from the notebook cells and returns outputs or UI previews.
- **Vitest in-browser test runner** integrated for code cells marked as tests. Special code blocks annotated as tests will execute using Vitest (or a similar testing library) in the browser, with `describe`, `it`, and `expect` APIs available globally. Test results should be captured and displayed in the notebook UI.

Below is a simplified architecture diagram of the system:

**Figure: Isolated code execution via a sandboxed iframe.** The Next.js app (parent window) loads notebooks and contains interactive editors. Code is executed in a sandboxed iframe (or Web Worker), which receives code via `postMessage` and returns results via messages, ensuring the main app stays safe from the executed code.

## Full-Stack Component Breakdown

- **Backend (Next.js + Payload CMS):** The Next.js 13 App Router will include a route (e.g. `/notebooks/[id]`) that is a **Server Component**. This server component fetches the notebook MDX content from Payload CMS (which is likely running as a separate server or embedded API) – for example, via Payload’s REST API or using Payload’s Node SDK if co-located. The MDX content (a text string, possibly with frontmatter) is then compiled or processed for rendering. Next.js 13 supports remote MDX content and can even render MDX as part of a Server Component **stream**. We can use the official `@next/mdx` plugin or `next-mdx-remote` to handle MDX. The MDX is **not** statically known at build time (it’s user-created), so it will be loaded and compiled at runtime on the server.

- **MDX Rendering Pipeline:** The MDX content will be transformed into a React component tree. We can use **MDX compilation** via `@mdx-js/mdx` or similar. A crucial part is **customizing how code blocks render**. We will provide a custom MDX component for code blocks (and possibly for inline code or other notebook-specific syntax). For example, using a rehype plugin like `rehype-mdx-code-props`, we can interpret fenced code metadata and pass them as props. Each code block in MDX would then render as a custom `<NotebookCell>` React component instead of a plain `<pre><code>` block. In Next.js, we can achieve this by passing a `components` mapping to the MDX renderer (or MDXProvider) where `'code': NotebookCodeBlockComponent`. This custom component will handle displaying the Monaco editor and the output area for that cell.

- **Client-Side Interactive Components:** The `<NotebookCell>` component would be a **Client Component** (because it involves state and interactive editing). The overall MDX page can still be mostly server-rendered (static text, etc.), but code cells hydrate into client-side components. Each cell component will include a Monaco Editor instance (for editing code) and an output region (for rendered results or test outcomes). We can lazy-load Monaco (since it’s large) when a notebook page loads, and instantiate the editor with the code content from the MDX. Using a React wrapper for Monaco (like `react-monaco-editor` or similar) is a common approach. It’s also possible to use VSCode’s Web Worker for language services for TypeScript/JS inside Monaco, to get IntelliSense (there’s a package `@mdx-js/monaco` for MDX IntelliSense as well, though not crucial).

- **Data Flow:** When the user edits code in a cell, the NotebookCell component can either automatically re-run the code (live mode) or await a run action (like a “Run” button per cell). Given the goal of “live rendering like ObservableHQ,” **live execution** on change is desirable (perhaps debounced to avoid running on every keystroke). The code content is sent to the sandbox environment for evaluation. For _test_ cells, execution might also be triggered automatically or on a run action, running the tests and collecting results.

- **Persistence:** When the user saves a notebook, the updated MDX (or a structured representation of the cells) must be sent back to the server to store in Payload CMS. This could be done via a Next.js API route or direct Payload REST call. We have two options for storing notebook content:

  1. **Store raw MDX**: Simply treat the entire MDX document as a text field in Payload. This preserves the notebook as one portable chunk of MDX. The MDX can include frontmatter for metadata (title, etc.) if needed. Payload doesn’t have a special “MDX field” out of the box (beyond rich text), so it would be stored as plain text. (Payload’s rich text Lexical editor can convert to MDX, but using that may be overkill if we manage the MDX ourselves).
  2. **Store structured cells**: Use a **Blocks** field in Payload to store an array of notebook cells. Each cell could be a block type with fields like `{ type: 'markdown' | 'code', content: string, language: string, isTest: boolean }`. This makes it easy to query or update specific cells (and to implement reordering, since the array order corresponds to cell order). The structured approach can be synchronized with an MDX representation (e.g., when delivering to the client, we can compile it into an MDX string or render directly from the JSON). This can simplify implementing features like reordering or inserting new cells (no need to manually manipulate a big MDX string in the client). The downside is an extra transformation step to/from MDX, but it aligns well with Payload’s strengths (using block collections).

  _Recommendation:_ Use the **structured block approach** for internal storage to facilitate advanced UX (drag-and-drop reordering of cells, etc.), but provide an export/import to raw MDX if needed. This approach would still render via MDX or via custom logic mapping blocks to React components.

## Secure Sandboxed Code Execution

Running arbitrary user code requires strong isolation to protect the host application. **Sandboxing** can be achieved in the browser through either sandboxed iframes or Web Workers (or a combination):

- **Sandboxed Iframe Approach:** A sandboxed `<iframe>` can execute untrusted JS with limited capabilities. By using an `iframe` with `sandbox="allow-scripts"` (and without `allow-same-origin`), we create a **unique origin** for the iframe content, preventing it from accessing the parent DOM or cookies. This is the “**principle of least privilege**” applied to embedded code: the iframe has no ability to affect the parent app except via allowed communication channels. We can load a blank HTML page in the iframe (or use `srcdoc`) that sets up a simple message-passing interface. For example, the iframe’s script can listen for `window.message` events and `eval` any code sent from the parent, then post back the result. The parent page uses `iframe.contentWindow.postMessage()` to send code for execution and listens for messages back. This technique is illustrated by the _Evalbox_ example, where the parent posts code to a sandboxed iframe which evals it and returns the result via `postMessage`. By not allowing `same-origin`, the executed code cannot reach out to the parent via the DOM – communication is only through the controlled `postMessage` interface. The parent can validate messages (e.g., ensure they conform to an expected format, originate from the correct iframe, etc.).

  - _Iframe Implementation details:_ We can generate the iframe’s content at runtime. For instance, an HTML template for the sandbox could preload certain scripts (like a UMD bundle of Vitest or any polyfills) and define a message handler. We might give each iframe a unique ID or name so the parent can distinguish messages if multiple notebooks or multiple iframes are running. Each code execution request could include an ID so responses can be mapped to the right cell. The iframe can be kept hidden if we don’t need to visually display it – but in this case, since we may want to display _UI output_ (e.g., if the code renders a React component or manipulates the DOM), we _could_ also show the iframe’s content as the output. One approach is to **reuse a single iframe per notebook** to execute all cells in sequence (preserving state between cells), and have that iframe actually render the UI outputs. Another approach is one iframe per cell output, but then sharing state between cells becomes harder. To emulate a Jupyter/Observable style where earlier cells define variables used later, a **single persistent iframe** acting as the notebook’s kernel is preferable. The state (variables, function definitions, etc.) will live in that iframe’s global context as code is executed sequentially.

  - _Capturing Output:_ To handle outputs, we can intercept `console.log` in the iframe (override it to send messages to parent) or use a special API. Observable-style notebooks consider the _value of the last expression_ as the cell’s output. We could mimic that by wrapping the code: e.g., after eval, take the result of the eval (which we get if we use `new Function` or similar instead of raw `eval` for more control) and send it as a message. However, dealing with complex objects or React elements as results is tricky (non-serializable). A simpler scheme: for purely textual or data output, sending back JSON or strings works; for DOM/visual output, we might actually **render inside the iframe** and then either snapshot it or just display the iframe itself. For instance, if code creates a DOM element or uses a library like D3 to draw charts, letting it manipulate the iframe’s document is fine – the iframe itself can be shown as the output container beneath the editor. Another pattern is to provide a helper function in scope, e.g. a global `render()` function (similar to how Docusaurus live code uses a `render()` for noInline mode) that the user calls to mount a React component. That `render()` can post a message or directly mount to a known `<div>` in the iframe’s body. In practice, using the **iframe as the output view** is straightforward: whatever the iframe’s document shows is the output. We just have to size the iframe appropriately and maybe apply some CSS resets inside it. In summary, sandboxed iframes provide strong isolation and the ability to run and display arbitrary DOM-manipulating code, at the cost of some complexity in message-passing and performance (each iframe has its own context).

- **Web Worker Approach:** Web Workers run JS in a separate thread with no direct DOM access, which also provides isolation. The main page can communicate with a worker via `postMessage`. The advantage of workers is that they are lightweight and cannot touch the DOM or external resources except via messaging or fetch (subject to CORS). They are ideal for pure computations or running test logic. For our use case, a worker could be used to execute **non-visual code**, such as running unit tests or performing calculations. The technique typically involves creating a Blob URL of the code to run or bundling a small worker script that accepts code strings. For example, one can do:

  ```js
  const blob = new Blob([userCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  worker.onmessage = (e) => { ... };
  worker.onerror = (e) => { ... };
  ```

  This will execute `userCode` in an isolated thread. Any console logs won’t automatically surface (they happen inside the worker), but we can override `console` similarly or just use `postMessage` for output. The **limitation** is that if the code tries to manipulate the DOM or use any browser APIs not available in workers, it will fail. Therefore, workers are best for sandboxing **tests and logic**. We could run all test cells in a worker environment (which matches how Vitest runs tests in Node or jsdom by default – no real DOM unless using a jsdom polyfill). For rendering UI, workers won’t work (you would instead send data back and have the main thread build UI).

- **Choosing a Sandbox:** We can use _both_: the iframe as a persistent “kernel” for any code that needs a DOM (especially for JSX/React output), and a worker for heavy computation or test evaluation, keeping the UI thread responsive. However, using both adds complexity. It may be simpler to use a single iframe sandbox for everything, loading any needed libraries into it. Modern JS engines handle a single additional thread or context fine for moderate code. If performance becomes an issue, tests could be offloaded to a worker thread.

- **Security Considerations:** By sandboxing (iframe with no same-origin), we prevent access to the parent window and sensitive APIs. The iframe should also use `sandbox="allow-scripts allow-same-origin"` _only if_ we need to allow loading external scripts (like React/Vitest libraries via CDN) inside it – but allowing same-origin means the iframe’s content is considered same origin and then could potentially interact with parent if not careful. A safer pattern is to serve a dedicated **iframe HTML file** from a different origin (like an `/sandbox.html` served by Next that has a restrictive CSP). Alternatively, use `sandbox="allow-scripts"` _without_ same-origin and include any needed scripts by injecting them as blobs or via `postMessage` (e.g., send over a large string of Vitest UMD bundle if necessary – not ideal). A compromise is to allow same-origin but still use the fact that it’s a separate window context with no access to `window.parent` (one can intentionally break `window.parent` in the iframe script to be safe). In any case, we must ensure user code can’t exfiltrate data. Also, limit what the code can do: e.g., an infinite loop in user code could freeze the iframe thread – using a Worker for execution can avoid freezing the UI, and one can terminate a worker that runs too long. If using an iframe, we might need to implement a timeout mechanism (e.g., if no response after X seconds, assume infinite loop and reload the iframe or inform the user).

- **Open-Source Tools:** Instead of reinventing the entire sandbox, consider using **Sandpack** by CodeSandbox. Sandpack is an open-source library that provides an in-browser bundler and sandboxed execution environment for code, including support for React/JSX. It essentially spins up a web worker running esbuild to bundle code, and an iframe to render the result. Sandpack can be configured with templates (like a “React” template that has React and ReactDOM available). It even supports multiple files and hot-reloading them. This could handle a lot of the heavy lifting: you could create a Sandpack instance per notebook (or per cell) with a single file, and let it compile + execute in an isolated context. Sandpack also has a component for a **Monaco editor integration** (though by default it uses CodeMirror, it’s flexible). Using Sandpack would give you a secure iframe sandbox and even error handling out-of-the-box. Another relevant tool is **StackBlitz WebContainers**, which run a Node.js environment in the browser (WASM-based). WebContainers could allow running Node code for server-side examples, but they’re heavier and not as easily customizable as Sandpack for our needs.

In summary, for **secure sandboxing**, a **sandboxed iframe** (with `allow-scripts` and communication via `postMessage`) is a proven approach. It isolates execution and allows DOM rendering. A **Web Worker** sandbox is also effective for non-UI code. The main application should treat the sandbox as an untrusted black box – only exchanging structured messages (e.g., {cellId, type: 'log', data: ...}) and sanitizing any output if inserting into the DOM. This ensures that even if malicious code is executed, it cannot escape the sandbox or harm the main app beyond its own output frame.

## Injecting Testing Utilities (Vitest Integration)

One unique feature of this notebook system is the ability to write test cells that execute with Vitest (a Vite-compatible testing framework). We want the user to be able to write something like:

```js test=true
describe('MyFunction', () => {
  it('should return 42 for input 40+2', () => {
    expect(myFunction(40, 2)).toBe(42)
  })
})
```

and have those tests run in-browser, showing success/failure. Achieving this entails providing the `describe`, `it`, and `expect` functions in the execution scope and then running a test runner.

**Option 1: Use Vitest’s Browser Mode** – Vitest has an experimental **browser mode** which allows running tests directly in a real browser environment. Vitest can bundle tests (via Vite) and execute them, giving access to `window`, `document`, etc. In our scenario, we aren’t using Vite as the main build (the app is Next.js), but we can still leverage Vitest’s libraries. The @vitest/browser package provides a way to run tests in-browser. We might incorporate Vitest’s core runtime into the sandbox. For example, include Vitest’s UMD bundle (if available) or use a `<script>` to pull in Vitest’s browser script. Once loaded, we have the Vitest global APIs.

However, **Vitest is designed as a full test runner** and might be heavyweight to integrate on a per-notebook basis. Instead, we could emulate a mini test runner:

**Option 2: Lightweight In-Browser Test Runner** – There are open-source projects that enable Jest-like testing in the browser. One is **jest-lite**, which was created to run Jest tests on CodeSandbox. Jest-lite provides the core `describe/it` syntax and an assertion library, and can output results as JSON or HTML. This could be perfect for our use-case: we can inject jest-lite’s `core` (which defines global `describe`, `it`, etc.) into the sandbox and use its `run()` function to execute tests, then use its `prettify` module to format results to HTML. For example, in an iframe we could do:

```html
<script src="https://unpkg.com/jest-lite@1.0.0-alpha.4/dist/core.js"></script>
<script src="https://unpkg.com/jest-lite@1.0.0-alpha.4/dist/prettify.js"></script>
<script>
  // expose describe, it, expect from jestLite
  const { describe, it, expect, run } = window.jestLite.core
  Object.assign(window, { describe, it, expect })
</script>
```

Now, when the test cell code runs, it will register tests via jest-lite. After evaluation, we call `const results = run();` to execute all collected tests. The results can be formatted to HTML with `jestLite.prettify.toHTML(results, someContainer)` or we send the `results` JSON to the parent and let the parent format it.

**Option 3: Use Vitest’s APIs directly** – We could try to use Vitest’s code programmatically. For example, Vitest’s expectation library could be imported (it is very similar to Jest’s expect). We might do:

```js
import { expect } from 'vitest'
window.expect = expect
```

However, the `describe` and `it` from Vitest are tied to its runner. Instead of digging into Vitest’s internals, using jest-lite or a small custom harness might be easier.

Given the preference for open-source and the familiarity of Jest syntax, **jest-lite** is a great fit. It is specifically aimed at “code sandbox maintainers” to integrate a test runner. Vitest itself is open-source but more complex. That said, if we want to match Vitest exactly, we could attempt to use Vitest’s browser mode. Vitest’s docs indicate you can run tests in the browser and even have a UI (Vitest UI). In fact, StackBlitz’s online Vitest example shows it is possible to run Vitest directly in browser. Possibly we could include the Vitest browser bundle and call an API to run tests. Since Vitest is built on Vite, it might expect a module environment to import the test code, so this might be non-trivial without using Vite’s infrastructure.

**Scoping and Injecting:** In either approach, the core idea is to **inject the test functions into the sandbox’s global scope** _before_ running the user’s test code. For an iframe sandbox, you can include a script that defines `window.describe = ...` etc. For a worker, you can do the same (e.g., send an initialization code to define global functions or import a testing library script via `importScripts`). The user’s test code will then find `describe` and `it` already defined and will register tests accordingly.

After the code is executed, we need to trigger the test run and gather results:

- With jest-lite: call `run()` and get results.
- With a custom approach: we could accumulate tests in arrays and then evaluate them. (This is similar to what jest-lite does internally – it collects test definitions, then runs through them, catching assertions.)
- If using Vitest: we might call into Vitest’s runtime API to execute tests. (Vitest likely doesn’t expose a simple global `run()` since it orchestrates test files; it might need to be configured at startup to auto-run when tests are defined.)

The results should then be displayed in the UI. A simple approach: produce an HTML report (jest-lite’s prettify can convert results to HTML elements) and inject it into the output area. We can style it (jest-lite has a CSS, or Vitest’s reporter styles could be mimicked). For instance, show each test with green (pass) or red (fail), and failure messages/stack trace. Alternatively, just show a summary (X passed, Y failed, and details collapsed).

**Vitest vs Jest-lite vs Mocha:** We chose jest-lite for simplicity, but one could also embed **Mocha** (a browser-friendly test framework) and Chai for assertions. Mocha can run in the browser and you can call `mocha.run()` to execute tests. Chai’s `expect` can be global. This is another viable route – Mocha is well-known and lightweight for in-browser use. Since Vitest is similar to Jest, any approach that supports Jest syntax will satisfy the requirement. Vitest’s advantage is familiarity and feature parity with Jest (like handling snapshots, etc.), but those advanced features might be out of scope for a first version.

**Summary for Tests:** The notebook will treat code blocks annotated with `test=true` (or perhaps \`\`\`ts test) specially. The MDX component for these blocks might render with a different icon or UI (to indicate this is a test). When executed, the sandbox injects the test helpers and runs the tests. The outcome (pass/fail) could be indicated next to the block (e.g., a green checkmark if all passed, or a red X if something failed), and the detailed report shown in the output area. By injecting a testing library in the sandbox, we **scope** these test helpers to the sandbox only – the main app doesn’t expose `describe` globally, only the sandbox environment does, which is what we want. This ensures normal code cells don’t accidentally access these (unless we leave them defined, but we could choose to only inject for test cells).

Vitest’s own documentation encourages running tests in browsers for UI components, and the **browser mode** being experimental suggests that our approach is cutting-edge but feasible. We can confidently say: **Vitest (or a similar test runner) can run in the browser context**. We leverage that capability by bundling the testing utilities with our sandbox and thus provide a seamless experience for writing tests in notebooks.

## MDX + Live Preview Integration

Integrating MDX with live editing involves bridging static content with interactive React components. The strategy is to **replace static code fences with a dynamic playground component**. This can be done via the MDX compilation step or via the runtime MDX rendering:

- **MDX Compilation with Custom Components:** As mentioned, we use an MDX provider or custom MDX components. When the MDX is compiled, each \`\`\` code block will become something like: `<pre><code class="language-js" live />...</code></pre>` (depending on meta). Our rehype plugin or MDX setup ensures that `live=true` or `test=true` in the fence becomes a prop on the rendered component. Then our `<NotebookCodeBlock>` component can read those props (`live`, `test`, `language`, etc.) and decide how to render:

  - If `live` (or by default for any code cell), it renders an interactive editor+preview.
  - If the code block is purely for display (say, no `live` flag and perhaps explicitly marked `static`), it could just render highlighted code (like typical blog posts). This way, not every code fence must execute – some could be explanatory snippets.
  - If `test` is true, it may also set up a test runner interface (maybe showing a “Run tests” button or automatically running them and showing results).

  Using MDX’s **meta** string to control behavior is powerful: _“After the language in code fences you can add `key=value` pairs which will be automatically passed as props”_. For example, `jsx live=true filename="App.jsx". We can extend this: e.g., `js live=true test=true could indicate this block should both execute and be treated as containing tests (though typically code is either a snippet to run or a test spec; we could separate them). More likely, we have distinct flags: `live` for executable snippet, `test` for unit test block.

- **React Live / LiveEditor integration:** A popular approach in MDX docs is to use **React Live** (by Formidable) which provides `<LiveEditor>`, `<LivePreview>`, etc., as shown in MDX docs. React Live compiles and evaluates JSX code on the fly (using a browser-safe Babel transform) and renders the result in a preview. While React Live is great for simple cases, our needs are more complex (TypeScript support, capturing console, running tests, sandboxing, etc.). React Live runs eval in the main window context (which is not safe for arbitrary code) and doesn’t handle Vitest. Instead, we might use **React Live’s pattern** in a modified way: for a given code cell, if it’s purely React UI code, we could use LiveProvider/LivePreview to show it. But to support general JS (which might not return a React component) and to enforce sandboxing, it’s better we route all eval through our sandbox mechanism. So, rather than LivePreview, we will manage our own “execute code and display output” logic.

- **Monaco Editor embedding:** Each code cell component should render a Monaco editor. Monaco is not a small dependency, so consider dynamically importing it. There’s an official `monaco-editor` package; for React, `@monaco-editor/react` or similar can simplify usage. In Next.js 13, which supports React 18, we have to ensure Monaco runs on client side only. Possibly, we mark our NotebookCell component as `use client` and then inside it do a `useEffect` to create the Monaco editor (or use the React wrapper which handles mounting). We can configure Monaco’s language based on the code block’s language (JavaScript, TypeScript, maybe allow Python if later extended, etc. but for now JS/TS/JSX). Monaco can also be configured with TypeScript definitions for the DOM, for Vitest’s globals, etc., to provide hinting. For instance, we could inject type definitions so that `describe` and `it` are recognized in test blocks (preventing editor errors).

- **Live Preview Update Cycle:** When code is edited, we have a few approaches:

  - **Auto-run on edit:** like ObservableHQ or many REPLs, whenever the code changes (perhaps with a short debounce), we send it to the sandbox to run and update the output.
  - **Manual run:** like Jupyter, requiring the user to click “Run” for each cell. Given the “live rendering like ObservableHQ” requirement, auto-run is implied. We should still guard against running too frequently (e.g., a syntax error on every keystroke is annoying). A compromise is to auto-run only when the code is syntactically valid or after a brief pause in typing.

  We also must consider **cell dependencies**: If cell B uses a variable from cell A, and cell A changes, cell B should re-run. In a fully reactive notebook (like ObservableHQ), cells declare their dependencies and the runtime manages re-execution. In our simpler MDX approach, a basic strategy is to execute the notebook top-to-bottom whenever needed. For example, we might always run all previous cells before a given cell to ensure state is up to date (like a linear re-run). This is less efficient but easier to reason about: essentially, treat the entire notebook as one script segmented by cells. On any change or initial load, re-run everything (or everything from the changed cell onward). This requires caution: if earlier cells have side effects (like adding DOM elements) and are rerun, you might duplicate outputs. A more sophisticated approach would track state and only update minimal parts, but that can be an advanced future improvement. Initially, we might require explicit run to avoid such complexities.

  Implementation-wise, if using a single sandbox iframe:

  - When executing, combine the code from all cells up to that point, or send them sequentially. For instance, on initial page load, send all code in order as separate messages to sandbox so it defines all functions and variables.
  - When a cell is edited, we could reset the sandbox and replay all prior cells (like a fresh run) to get a clean state. Or update just that cell and subsequent ones. Some notebooks do a full re-run on changes (Observable does a smarter dependency graph instead).
  - Alternatively, maintain an _incremental state_ in the sandbox: e.g., “append” the code of new cells. But if an earlier cell changes, we have to either patch that state (which might not be possible without a reset) or reload.

  Given this complexity, a **simple but robust approach**: always re-run the entire notebook when a cell changes (in the sandbox context). Since this is in the browser, this could be okay for relatively small notebooks. We can optimize later by preserving state of unaffected cells if needed.

- **Integration with Next.js App Router:** In Next.js 13+, MDX content can be rendered as part of the server component tree. However, since our NotebookCells are client components, we might render placeholders on the server. For example, the MDX compilation could output `<NotebookCell index={i} code={...} meta={...} />` for each code block. The server will render an empty shell for that (maybe just a container div) and then on the client it hydrates and loads Monaco, etc. This means initial page can show static content except code outputs, which will appear after hydration. We could improve perceived performance by server-rendering a static code listing as a placeholder (so user sees the code immediately, even before Monaco loads). For instance, the NotebookCell could have a `fallback` that simply prints the code in a `<pre>` for SSR, then replaces with Monaco on client. This is a UX detail.

- **Hot Reloading & Fast Refresh:** Since we’re building an editor environment, we likely want to preserve state within the Monaco editors when navigating or editing. The app could treat each notebook page as a persistent state (maybe using React state or context to keep track of code contents separate from the MDX source, until saved).

- **MDX and JSX runtime:** If code blocks include JSX that returns React elements, and if we run them in the sandbox, we need React available in the sandbox. We should pre-inject React (and ReactDOM) into the sandbox environment. If using an iframe, one way is to include React UMD scripts in the iframe head. Or if using bundling, bundle React in. That way, user code can do e.g. `const element = <MyComp />;` and it will have React in scope. Actually, if they want to use JSX inside a `LiveProvider` approach, React Live solves it by transforming JSX to `React.createElement` calls. In our sandbox, if the user’s code has JSX, we either need to **transpile the code** (e.g., with Babel or esbuild) before executing it. **Important:** The sandbox likely should run **transpiled ES5/ES6 code**, not raw TSX/JSX. So our execution pipeline likely will include a compile step:

  - If code language is TypeScript or has JSX, run it through a compiler (like `esbuild-wasm`, `swc`, or Babel) to produce plain JavaScript.
  - Then send that JavaScript to the sandbox for execution.
  - Alternatively, one can use the sandbox’s environment to do the compile. For example, Sandpack uses esbuild in a web worker to compile code and then injects into an iframe.

  Using **esbuild in a web worker** is an efficient way to handle TS/JSX. We can set up an esbuild worker that takes code and returns compiled code (with sourcemaps for debugging ideally). Another simpler route: use Babel stand-alone (`@babel/standalone`) on the client to transpile. Babel can transpile JSX/TS if configured. That would add overhead on each run, but for moderate code sizes it's fine. Since this is a one-page app, using esbuild via `esbuild-wasm` might be more performant.

  After transpilation, the sandbox receives a plain JS string. We might wrap it in some boilerplate (for capturing output, etc.). For example, we could prepend `console.clear();` or some cell identifier context.

- **Reactive Updates and State**: One challenge with MDX is that it doesn’t inherently manage cross-component state. In a React-based notebook, if one cell defines `window.x = 5` and another cell uses `x`, that works if executed in the same global (like the iframe). But within React rendering, those cells are separate components – they aren’t automatically aware of changes. That’s okay, because our execution model is outside of React (in the sandbox). Essentially, the MDX’s job is just to layout the editors and outputs; the actual code execution side-effects live in the sandbox context. We should be mindful that if a code cell produces a visual, we need to show it. If the sandbox is persistent, one approach is: when code executes, the sandbox posts a message like “Output ready for cell N” and then the NotebookCell component listens and updates its output area (maybe by embedding the iframe or by receiving an HTML blob or serializable data).

  For example, for textual results we could send back `stdout` or `result` as a string and simply render that in the cell’s output panel (with proper styling, maybe in a `<pre>` for objects via `console.log`). For DOM elements or React components, I lean towards actually rendering in the iframe and potentially showing that. Perhaps each NotebookCell can have an associated hidden div in the iframe that it “owns” for output, and we use some identifier to scroll that into view in the main page. This gets complex; a simpler approach: one iframe per cell’s output, which we inject the code into and that iframe’s body is effectively the output. That isolates outputs but sacrifices sharing state between cells (each cell iframe is separate global). Unless we give iframes access to a shared worker or context, that won’t share variables. So probably one iframe for all is best to share state, and manage outputs internally (like how Jupyter has one kernel and captures outputs per cell).

  We might implement a **notebook manager** in the parent that orchestrates the sandbox:

  - Sends all code up to cell N to sandbox and captures outputs (mapping them to cell IDs).
  - Stores the latest output for each cell in React state, so the UI can render it (for e.g., for textual results, just put in a state variable; for DOM, possibly use a portal or an iframe in the UI as well).
  - Alternatively, mount the sandbox iframe itself in the UI and use anchors to portions of its content. Possibly not worth it.

Given time constraints, a feasible approach is: on each cell run, re-run the sandbox from scratch and gather outputs for each cell sequentially. This guarantees consistency at cost of performance, and you then have concrete outputs to display (which could just be strings or simple HTML). This is more like how static notebook export works (but here it’s happening client-side).

**Integration Summary:** The MDX integration will rely on customizing the MDX rendering to use our NotebookCell component. **Open-source tools** to mention:

- _MDX compilation_: `@mdx-js/mdx` or `next-mdx-remote` to parse MDX at runtime.
- _Remark/Rehype plugins_: e.g., `rehype-mdx-code-props` to handle code meta, or `remark-gfm` if we want GitHub flavored MD, etc.
- _Monaco Editor_: `monaco-editor` (MIT licensed by Microsoft). Possibly `monaco-editor/esm` in Next to tree-shake languages.
- _Compiler for TS/JSX_: `esbuild-wasm` (by Figma, MIT) or `@babel/standalone` (MIT).
- _Sandbox execution_: we might implement directly with DOM APIs. Or use **Sandpack** (MIT) which encapsulates bundler + iframe logic (but then tying that with MDX would mean each cell is a separate Sandpack instance, which might be heavy).
- _React library for UI components in MDX_: If needed, libraries like Code Hike (MIT) for fancy code presentations (tabs, annotations) can be integrated. For example, Code Hike can render multiple file code blocks with a tabbed interface, which could be useful if a notebook wants to show a couple of files side by side (though in our interactive scenario, we might not need that immediately).

## Persistence with Payload CMS (MDX Storage)

Payload CMS will serve as the headless CMS to store notebooks. We should design a **Notebook** collection in Payload with fields such as:

- `title` (text)
- `slug` (text, unique, used for URL or identification)
- `content` (MDX, likely a **Textarea** or **Code** field type). We might use a JSON field if storing structured cell data instead.
- `author` (relation to User collection, if multi-user)
- `updatedAt/createdAt` (timestamps)

Payload doesn’t natively “understand” MDX content beyond storing it, but as noted in their docs, they have utilities to convert MDX if using their Lexical editor in the admin panel. If we want, we could create a custom field in Payload for MDX (for example, a code editor in the admin UI with MDX syntax mode). However, since our primary editing interface is the notebook front-end itself, the CMS might mainly be used behind the scenes or for admin overview.

To save notebooks, our Next.js app can communicate with Payload via its REST API. For example, a `PATCH /api/notebooks/:id` with JSON body `{"content": "new MDX here"}` can update the content. Since we control both front-end and CMS, we could also integrate directly (Payload provides a Node API if on the same server). But a clean separation is to treat Payload as a separate service accessible via API token.

For **serializing MDX + metadata**: If we go with structured blocks in front-end, we need to decide how to store them:

- Possibly store a single MDX string for simplicity (embedding any metadata as frontmatter if needed). The “metadata” mentioned might include things like which cells are tests (though that’s already indicated in the MDX by the code fence meta).
- Or store an array of cell objects in a JSON field. Payload does allow an **Array** type of blocks. We could define a **Block** type for CodeCell with fields: `code`, `language`, `isTest`, etc., and another block type for Markdown content with a `markdown` field. This way, non-technical authors could even use Payload’s GUI to edit text and code separately. Payload’s rich text editor could be used for Markdown blocks (although mixing MDX could be tricky there, but it can probably just handle basic markdown).

Given that **Payload supports MDX** through its rich text Lexical editor (they mention “MDX converters on blocks”), one approach is to use Payload’s editor for non-code content while treating code blocks as special blocks. But that might complicate development, possibly out of scope. Simpler: treat the entire notebook as code (MDX) and use our front-end to edit it, letting Payload just store it.

**Storing outputs** in CMS is generally not needed (outputs are computed). We might store outputs for caching or versioning if we wanted (like nbdev or similar systems sometimes store expected outputs for testing, etc.), but not necessary here.

## Notebook UX Best Practices (Tabs, Reordering, etc.)

Creating a smooth UX for an MDX-based notebook is challenging but there are known patterns:

- **Cell Management:** Users should be able to add new cells (code or markdown) and rearrange them. If we use the structured approach (array of cells), implementing “add cell” and “move up/down” is straightforward by manipulating the array and re-rendering the MDX accordingly. If we use raw MDX text, we’d have to parse and splice strings (possible but error-prone). Many modern notebook UIs (e.g., JupyterLab, Observable) allow dragging cells to reorder. We can implement drag-and-drop (with libraries like dnd-kit or React Beautiful DnD) on the list of cells.

- **Multiple Views / Tabs:** The mention of “tabs” could mean a few things:

  - **Tabbed code examples:** Sometimes, documentation sites show tabs for multiple languages or multiple files. For instance, Code Hike allows defining multiple files in a single code block and will render a tab bar with filenames. We can leverage Code Hike if we want to allow notebooks to include multi-file code examples. In an interactive notebook context, “tabs” might also mean you can have different _perspectives_ of the same code – e.g., an “Editor” tab and a “Result” tab if screen space is constrained. But since we likely show editor and result together (one above the other), that may not apply.
  - **Multiple open notebooks:** If our UI ever allows opening several notebooks simultaneously (like JupyterLab interface with tabs for each notebook), then “tabs” would be at an application level. This is more of an app design choice. Given Next.js is web pages, probably one notebook at a time (so likely not this meaning).
  - **Tabs within a notebook for sections:** Possibly splitting a notebook into sections accessible via tabs – not common in Jupyter style though.

  The Code Hike example is a concrete one: it supports **filenames and tabs** in code blocks. For scalability, adopting Code Hike could give us features like code diff views, focus highlights, etc., which enhance learning notebooks. Code Hike works as a remark/rehype plugin and a set of MDX components. If used, we’d incorporate it in the MDX compilation pipeline. It’s compatible with React only (which is fine for us). Using it might conflict with our interactive execution because Code Hike is primarily for static presentation, but perhaps we could combine them (e.g., use Code Hike’s styling but still run the code).

- **Layout & Styling:** A good UX will likely have a split view or a clear separation between the notebook’s _content editing area_ and _output area_. In Jupyter, each cell has input and output. We will mimic that: each NotebookCell component can render two sub-components: **Editor** (Monaco) and **Output**. We can make the output collapsible or hidden until code is run to reduce clutter. Also show status (e.g., a spinner while running code, or a “✓” when a test passes, etc.).

- **Indicators and Controls:** For test cells, we might add an indicator like “Tests: all passed” or “1 failed” after execution. Each code cell (especially if not auto-run) could have a small “Run” ▶️ button. It’s also useful to have a “Run All” to execute the whole notebook. If auto-run is on, we might not need explicit run, but a user might still want to re-run manually if something weird happened.

- **Scalability:** As notebooks grow, performance might dip if re-running everything often. To scale, consider:

  - Virtualizing the list of cells (e.g., using `react-window`) so that very long notebooks don’t render all editors at once (Monaco is heavy; dozens of Monaco instances could be slow). We could unmount editors that are far off-screen or render them as read-only until focused.
  - Possibly limit the number of concurrent iframes/workers (if one per cell output).
  - Offload heavy computations to web workers or even a server function (though that reintroduces server execution, which might be needed if some code must run in Node).
  - Caching compiled code to avoid re-transpiling every time (could use a hash of code as key).

- **Server vs Client code execution:** The requirement _“support both server and client components and code execution”_ suggests maybe allowing certain code to run on the server side. For example, a user might write a cell with `// server` meta, meaning this code should run in a Node.js environment (perhaps for accessing a database or using Node-specific APIs). Implementing that would require a server-side sandbox as well (for Node). One approach is to have a **serverless function endpoint** that accepts code and runs it (with similar sandbox precautions using Node’s VM module or an isolated process). This is complex and potentially dangerous, but could be done with heavy sandboxing (e.g., using the `vm2` package, or running in a Docker container). For the scope of our project, it might suffice to note that this is _possible_ but not our first priority. We could simply tag certain cells to run on server and then call an API route to execute them (Next.js API route that uses `vm2` to eval safely). The output would be returned and displayed. This is useful if someone wants to do, say, a secure database query or use filesystem – but those capabilities may not be desired in a multi-user environment for security reasons. Likely, this point was to emphasize using Next 13 features for mixing server/client rendering of components, rather than actually executing untrusted server code (which is a significant risk).

Given that, our primary focus remains on client-side execution for now, but we architect in a way that we could plug in a server execution path if needed (perhaps by distinguishing cell “types” and handling accordingly).

- **Collaboration** (just to note): While not explicitly asked, one might wonder if the system should support real-time collaboration (like two users editing a notebook together). Solutions like **Yjs** + **WebRTC or Liveblocks** could enable that (Monaco can integrate with Yjs for shared editing). This is an advanced feature; we mention it as a possible future improvement if aiming to match the Google Colab/Observable multi-user experience. Initially, a single-user editing session is fine.

- **Versioning**: Not asked, but often notebooks benefit from version control. Since Payload CMS is storing content, one could use Payload’s built-in revision history or integrate with Git (export MDX to files). This is out of scope here but worth keeping in mind.

**Diagrams & Sketches:**

Below is an example high-level component diagram of the notebook front-end:

_Figure: The Starboard Notebook project is an example of an in-browser notebook runtime (JS and Python support). Ours will be similar but focused on JS/TS + MDX. We combine content (MDX) with an execution runtime in the browser._

(Starboard is fully client-side, using a portable runtime. In our case, we also include a CMS and Next.js server to store/fetch notebooks.)

To summarize best practices:

- **Keep the UI intuitive**: Make it clear which part is editable code vs. output. Use distinct styling (for instance, a light background for code cells and a slightly shaded background for outputs).
- **Leverage existing tools**: Use Monaco for editing experience, possibly Code Hike or MDX Editor for enhanced Markdown editing, Sandpack for execution, Vitest/jest-lite for testing.
- **Ensure stability**: A poorly sandboxed eval or a heavy unthrottled live update can ruin the UX. Use debouncing, clear error messages (e.g., if code throws an error, catch it and show it in the output area with stack trace, styled red). The `<LiveError>` component in React Live is an example that displays compilation/runtime errors inline – we should have an equivalent.
- **Scalability**: For a large number of cells, consider dynamic loading of cells (don’t mount all Monaco editors at once if not needed), and optimize re-execution logic to avoid unnecessary work.
- **Extensibility**: Design the cell component in a way it could support other languages in the future (maybe one day adding Python via Pyodide, etc., as Starboard does). Also, structure the code execution so that adding a “server execution cell” is possible by routing to an API.

By following these approaches, we can create a notebook system where **MDX provides the structure and rich content**, **React/Next.js provides the interactive and modular UI**, and **sandboxed execution (iframe/worker)** provides a safe, live coding experience. This brings together the best of Jupyter (interactive code + results), Observable (reactive, live execution), and MDX (mixing prose and React components) into one platform.

## References

1
Writing Interactive Documents in Markdown with MDX | by Alex Krolick | Medium
https://medium.com/@alexkrolick/writing-interactive-documents-in-markdown-with-mdx-4b6dd7db683d
2 34
Converting Markdown | Documentation | Payload
https://payloadcms.com/docs/rich-text/converting-markdown
3 4 11 12 13 14 19
Play safely in sandboxed IFrames | Articles | web.dev
https://web.dev/articles/sandboxed-iframes
5
Guides: MDX | Next.js
https://nextjs.org/docs/pages/building-your-application/configuring/mdx
6 7 8 9 31 32 40
MDX
https://v1.mdxjs.com/guides/live-code
10
@mdx-js/monaco - npm
https://www.npmjs.com/package/@mdx-js/monaco
15 16
Code blocks | Docusaurus
https://docusaurus.io/docs/markdown-features/code-blocks
17 18 20
A Deep Dive into JavaScript Sandboxing - DEV Community
https://dev.to/leapcell/a-deep-dive-into-javascript-sandboxing-97b
21
Browser Mode | Guide | Vitest
https://vitest.dev/guide/browser/
15
22 23 24 25 26 27 28
GitHub - kvendrik/jest-lite: Run Jest in the browser.
https://github.com/kvendrik/jest-lite
29
Getting Started | Guide | Vitest
https://vitest.dev/guide/
30
Vitest Browser Mode - Mock Service Worker
https://mswjs.io/docs/recipes/vitest-browser-mode/
33 35
Powerful Code Blocks With Code Hike and MDX | by Anish De | Better Programming
https://medium.com/better-programming/powerful-code-blocks-with-code-hike-and-mdx-4cd60049463f
36
how-to-create-a-collaborative-code-editor-with-monaco-yjs-nextjs ...
https://github.com/liveblocks/liveblocks/blob/main/guides/pages/how-to-create-a-collaborative-code-editor-with-monaco-yjs-
nextjs-and-liveblocks.mdx?plain=1
37
GitHub - gzuidhof/starboard-notebook: In-browser literate notebooks
https://github.com/gzuidhof/starboard-notebook
38 39
Embedding a Starboard Notebook | Kyle Johnsen
https://kjohnsen.org/post/embed-starboard/
