Great, I’ll look into how you can use zx to execute functional `.md`/`.mdx` files with embedded TypeScript code blocks and `vitest` test blocks. I’ll explore strategies to:

- Extract and evaluate `ts` and `ts test` code blocks from Markdown.
- Inject `describe`, `it`, `expect` into test scopes using Vitest.
- Support both local script-style execution and integration into a doc site.
- Provide flexibility for both runtime evaluation and build-time testing.

I’ll get back to you with a plan, including tooling options, best practices, and example implementations.

# Using ZX for Executable Markdown with Embedded TypeScript Tests

## Overview: Documentation as Executable Tests

Embedding code and tests in Markdown is a form of **executable documentation**. The idea is that your Markdown/MDX files double as both human-readable docs and machine-testable scripts. This isn’t entirely new – for example, the **mdtest** tool for Python allowed Markdown files to serve as unit test suites by parsing fenced code blocks and executing them. The goal is similar here: you want to write documentation with fenced code blocks for TypeScript code and test cases (using `describe/it/expect`), and have a system run those tests to ensure the docs stay up-to-date and functional.

## Parsing Markdown/MDX and Extracting Code Blocks

The first challenge is **parsing the `.md`/`.mdx` files** to find code blocks. You have a couple of approaches:

- **Use a Markdown AST parser in Node:** A recommended approach is to use the **Unified/Remark** ecosystem (e.g. the `remark-parse` package) to parse Markdown into an AST. This lets you programmatically walk the document and find code fence nodes. In Remark’s Markdown AST (MDAST), fenced code blocks appear as `code` nodes with properties like `lang` and `meta`. For example, a fence labeled ` ```ts test ` might be parsed as a node with `lang: "ts"` and `meta: "test"` (the info string after the language). You can then filter nodes: collect all `code` nodes where `lang` is `ts`. Among those, distinguish between _regular code_ (no meta or a different meta) and _test code_ (where `node.meta === "test"`). Tools like **`unist-util-visit`** can help traverse nodes.

- **Alternate approach – Pandoc + jq or similar:** Some have used Pandoc to convert Markdown to a JSON AST and then filtered code blocks by language. This was demonstrated by Tom Lankhorst for testing C++ code in a README. While powerful, that approach involves external tools (Pandoc, jq, or Lua filters) and can get complex. In a Node/TypeScript environment, it’s usually simpler to stick with a JS parser like Remark or **markdown-it**.

**MDX files:** If your docs are in MDX, you can still use Remark (the MDX format is an extension of Markdown). The `@mdx-js/mdx` parser (or remark with MDX plugins) can parse MDX AST, allowing you to extract fenced code blocks similarly. MDX-specific syntax (like JSX snippets) will appear as different node types, but standard triple-backtick fences remain as `code` nodes. So the process for extracting ` ```ts ` blocks is essentially the same. Just be sure to ignore or handle any MDX embedded components if present (or run the MDX compiler to strip them out, leaving Markdown AST).

**Grouping code and tests:** Typically, you’ll want to keep code blocks paired with their corresponding test blocks. A simple convention is to put the test block immediately after the code block it’s testing. When parsing, you could iterate through code nodes in order and whenever you see a `lang: "ts"` without meta followed by a `lang: "ts"` with meta `"test"`, treat them as a pair (code snippet + tests). In practice, you might not even need to explicitly pair them – you can just concatenate all code blocks in the original order, since any test block will naturally come after the code it depends on in the document. If you prefer isolation, you could also reset the execution context per section or use headings to delineate test groups (similar to how mdtest uses headings as test suite names). But for most cases, running all code in sequence works if the snippets are independent.

## Injecting `describe/it/expect` for Test Blocks

Your test code blocks use `describe`, `it`, and `expect` just like in a normal test file. To execute these, you need to provide those functions in scope. The plan is to **leverage Vitest** (a Vite-native testing framework) so that we don’t have to build a test runner from scratch. There are two main ways to inject these:

- **Use Vitest’s CLI (or Node API) to run the assembled test file:** The simplest route is to compile the Markdown’s code blocks into a temporary `.spec.ts` file and run `vitest` on it. When running under Vitest, you usually **don’t need to import `describe/it/expect` at all** – Vitest (like Jest) makes those globals available in test files. So you could literally paste the code and test blocks into a `.spec.ts` and as long as you run it with Vitest, the calls to `describe` and `it` will be recognized. For example, Vitest’s documentation plugin approach (see below) assumes that `expect` and co. come from the Vitest runtime environment. If you want to be explicit (or run outside the Vitest CLI), you could import them at the top of the generated file (`import { describe, it, expect } from 'vitest'`), but this is usually unnecessary when using the Vitest test runner.

- **Use Vitest’s programmatic API or importable functions:** Vitest provides a Node API (`startVitest` from `vitest/node`) to run tests programmatically. This is more advanced and primarily useful if you want to avoid spawning a separate process. Alternatively, you might consider using Vitest’s functions directly in a single script: e.g., do `import { describe, it, expect } from 'vitest'` in a Node script and execute the code blocks in that context. _However,_ simply calling `describe()` and `it()` in a standalone script will register tests in Vitest’s internal state but won’t automatically run them to completion (normally the test runner orchestrates running those callbacks). You would end up recreating parts of a test runner. Therefore, sticking with the Vitest CLI or the official Node API to actually run the tests is easier. The CLI approach is straightforward: Vitest will discover the test file(s), run the suites, and give you results.

Vitest also has a concept of **“in-source testing”** via `import.meta.vitest` (inspired by Rust’s doctests), which allows tests inside source files or even markdown. For example, a Vite plugin called **vite-plugin-doctest** enables writing tests in JSDoc comments or Markdown by marking code fences with a special flag. In a Markdown file, one can suffix a code block’s language with `@import.meta.vitest` (and optionally a filename) to indicate it’s a test snippet. The plugin will auto-transform those into real tests at runtime (wrapping them in a `if (import.meta.vitest)` block) when Vitest runs. This is an elegant solution because it **injects the test harness only during test execution** and not in the published docs. The downside is that you have to include that `@import.meta.vitest` tag in your fences and configure Vitest to use the plugin and include `.md` files as test sources. If you’re open to using that plugin, it can save you from writing a custom parser/test-runner – you’d just write docs with `ts @import.meta.vitest` for test blocks, and Vitest will handle it. (Under the hood, it pulls in Vitest’s `expect`, etc., and wraps the snippet in a `vitest.test()` call.)

For a custom solution using ZX, a simpler path is: **generate a test file containing all doc code**. For example, suppose `example.md` contains:

```markdown
Here is how add() works:

\`\`\`ts
export function add(a: number, b: number) {
return a + b;
}
\`\`\`

Now we verify it:

\`\`\`ts test
describe('add', () => {
it('adds two numbers', () => {
expect(add(1, 2)).toBe(3);
});
});
\`\`\`
```

Our script can transform this into a `example.md.spec.ts` file roughly like:

```ts
// (pseudocode – actual implementation concatenates strings)
export function add(a: number, b: number) {
  return a + b
}

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})
```

When run with Vitest, this will execute the test and report success or failure. If multiple such docs exist, you could combine them or generate multiple spec files. It might be wise to wrap each file’s tests in a `describe` named after the doc (or section) to group results, but that’s optional.

## Using ZX to Orchestrate the Process

**ZX** is a tool that makes writing Node.js scripts easier by providing a friendlier syntax for running shell commands and working with files. Notably, the `zx` CLI can actually execute Markdown files directly – it will parse out and run any JavaScript/TypeScript code blocks inside them. However, using ZX’s Markdown execution directly on your docs is not ideal here, because ZX will “blindly” run _all_ code blocks by default. In documentation, you might have code snippets that shouldn’t be executed as part of the test (or should only be run in the test context, not unconditionally). There’s no built-in distinction in ZX’s runner between “this is setup code” and “this is example code”. In fact, an issue was noted that ZX had no way to skip certain fenced blocks – it treats any fenced block (with or without a language tag) as executable script content. So, while you _could_ run your `.md` file with `zx` and hope it runs the tests, it wouldn’t know about injecting `describe/it/expect`, and it might execute things in the wrong order or run non-test snippets unintentionally.

Instead, you can use ZX in a more controlled way: as a scripting environment to **build your own CLI tool** for doc testing. With ZX, you can easily perform tasks like reading files, calling Node libraries, and then invoking shell commands (like `vitest`). Here’s how you might implement it:

1. **Gather Markdown files:** Use Node’s `fs` or `globby` to find all `.md`/`.mdx` files that contain code examples you want to test. For each file, read its content.

2. **Parse and extract code:** Use a library (e.g. `remark`) to parse the Markdown content into an AST. Then iterate through the AST nodes to pull out code blocks. In pseudocode using remark:

   ```ts
   import { unified } from 'unified'
   import remarkParse from 'remark-parse'
   import { visit } from 'unist-util-visit'

   const tree = unified().use(remarkParse).parse(markdownText)
   let collectedCode = ''
   visit(tree, 'code', (node) => {
     if (node.lang === 'ts') {
       if (node.meta === 'test') {
         // It's a test code block – include it
         collectedCode += '\n' + node.value + '\n'
       } else {
         // It's a normal TS code block – include it
         collectedCode += '\n' + node.value + '\n'
       }
     }
     // (If you want, handle other languages or skip them)
   })
   ```

   This will accumulate all TypeScript code. In this simple approach, we treat all TS blocks as one continuous script: any functions or variables from earlier blocks will be in scope for later test blocks. This matches the typical way a Markdown document flows (define something, then maybe test it later).

   If you need to ensure isolation between distinct examples in the same file, you could reset `collectedCode` or output multiple files. But often it’s fine to have one combined output per document. You could also inject some markers like `describe('<DocName>', ...)` around each file’s tests for clarity in output.

3. **Prepare the test file(s):** Decide on generating one big test file or multiple. For simplicity, generate one file per source document (e.g. `example.md` -> `example.md.spec.ts`). You might prepend an import of the module under test if your code blocks are referencing library code. In many cases, though, the code block itself contains the implementation you want to test (like a function defined in the snippet). If the docs are demonstrating usage of an actual library, you might instead have the snippet import the library. For example, if the doc code is meant to show how to use your published package, the snippet might literally have `import { add } from 'my-lib'`. In that case, when running the snippet as a test, it will import the real code. This works as long as the snippet’s import can resolve (so your test environment should have access to the package or source). The Deno documentation tests illustrate this approach: the doc snippet doesn’t explicitly import the function, but Deno’s test runner automatically inserts an import of the exported function into the generated test code. In our case, we have to handle imports ourselves if needed (either require the user to write them in the snippet, or inject them via our tool).

4. **Run the tests with Vitest:** Once the `.spec.ts` file(s) are written, you can invoke Vitest. With ZX, you can simply do: `await $`vitest run --passWithNoTests\`\` (the `--passWithNoTests` flag is useful if some docs don’t produce any tests, to avoid a failure). This will run the tests and exit with an appropriate code. ZX will propagate the exit code, so you can use this in CI to fail if a test fails. You could also use the Vitest Node API (`startVitest('test', [...files], ...):contentReference[oaicite:20]{index=20}`) if you prefer not to spawn a separate process, but using the CLI is straightforward and isolates the test run nicely.

5. **Cleanup (optional):** If you don’t want to keep the generated test files, your script can delete them after running, or generate them in a temp directory. On the other hand, keeping them (perhaps git-ignored) can help with debugging if a test fails – you can open the generated .spec.ts to see what code was actually executed.

By wrapping these steps in a ZX script, you essentially create a CLI tool (e.g. `doctest.mjs`). You might integrate it as an npm script (`"test:docs": "zx scripts/doctest.mjs"`) so that running it is as easy as `npm run test:docs`. This can be run locally during development, and of course in CI pipelines to catch broken examples.

**Tooling tips:** The **Remark** parser is very capable, and you can even use remark plugins to simplify extraction. But a custom small script as above is usually fine. If you wanted to avoid writing even that, there are community tools: for instance, _mdcode_ (an npm tool mentioned in a gist) and others intended for testing markdown examples. There’s also the approach of using **Deno’s built-in doc tester** if you were in a Deno environment – Deno can natively execute markdown code blocks as tests via `deno test --doc`, automatically wrapping them in test cases and importing the relevant symbols. In Node, we rely on external libraries (like Vitest or Jest) to achieve a similar effect.

### Example: Using an Existing ZX Markdown Runner (MZX)

It’s worth noting the existence of **“Markdown ZX” (MZX)**, a tool that wraps ZX to execute Markdown-based scripts. MZX will concatenate all `typescript` code fences in a markdown and run them as a single ZX script, and even handle `shell` fences separately. If your documentation examples were more like tutorial instructions (commands to run, etc.), MZX would be perfect. However, for _unit tests_ with `describe/it`, using MZX directly is not ideal – it doesn’t know about test semantics. You would essentially be running tests as just another script, without the nice reporting that Vitest provides. MZX also would execute all TS fences indiscriminately (similar to raw ZX).

In our scenario, leveraging Vitest gives structure: you get formatted test results, assertions, and integration with other testing tooling (coverage, watch mode, etc.). So, using ZX to orchestrate **Vitest** is a cleaner solution for a testing use-case, while MZX is more for executing example scripts in order.

## Local vs Published Usage and Runtime Trade-offs

One of your requirements is that the Markdown/MDX remains useful both locally (for running tests) and when published (e.g. on GitHub or a static site like VitePress). The good news is that these goals aren’t in conflict – you can keep the Markdown format exactly the same for both. The **test blocks will simply render as code blocks** on GitHub or VitePress, which is fine. You might want to ensure they are syntax-highlighted properly. If your code fences use a non-standard language tag (`ts test`), some highlighters might not recognize that. A quick fix is to **configure your site’s highlighter to treat `ts` or `ts test` as TypeScript**. For instance, in VitePress (which uses Shiki for highlighting), you can map unknown languages to an existing grammar. Alternatively, you could decide to use a convention like `typescript and `typescript test (or even embed a comment in the fence info) – but that’s mostly cosmetic. The important part is that the docs **remain valid Markdown**. They don’t need any special directives (except our `test` tag, which is benign to Markdown renderers).

**At publish time**, you typically **do not execute** the tests. The documentation site build (or GitHub’s Markdown preview) will just render the fences as static code examples. That’s desirable: readers see the usage and the test, but we’re not trying to run tests in users’ browsers or on the docs server. All the execution should happen in your development/CI environment. This separation ensures the docs site is fast and secure – it’s just static content.

**Runtime vs build-time execution:** It’s generally preferable to run these embedded tests at build-time (or in CI) rather than at runtime on the site. Running untrusted code in a user’s browser or on a docs server is risky and unnecessary. By executing tests during development/CI, you catch errors early and can decide whether to publish. The trade-off is that build-time tests make the build process a bit more complex or slow (you need to run the docs through this test harness). But since these are essentially unit tests, that cost is usually low and acceptable.

Consider the scenario of a static site generator like VitePress: one might imagine a plugin that, during the site generation, executes code blocks and perhaps even injects their output into the page. That’s possible (similar to how Jupyter notebooks or some SSGs can show example outputs), but for our use-case, we don’t actually need to show the test results in the docs – we just need to verify them. So integrating with the docs build isn’t necessary; it can be a parallel step. In CI, you might run `npm run test:docs` (which uses ZX/Vitest to verify the markdown) and then `npm run build:docs` (to generate the site) separately. They operate on the same source files but don’t interfere with each other.

**Runtime execution feasibility:** If one insisted, could you run the tests in the live documentation? Possibly – you could ship a bundle of the test code and trigger it in the browser, or have a server evaluate snippets on demand – but this is overkill and poses security issues (especially if docs are user-visible, you wouldn’t want to run arbitrary code there). It’s also bad UX to have documentation pages run a bunch of tests on load. Therefore, nearly all documentation testing setups run at build/test time. For example, Deno’s `deno test --doc` or Rust’s `cargo test --doc` run during the development/test phase, not when someone reads the docs. The same applies here.

## Summary of Trade-offs and Recommendations

- **Parsing method:** Use a robust Markdown parser (Remark for Node.js) to accurately extract code blocks. This is more maintainable than regex scraping, and more flexible than external tools like Pandoc for a Node project. Pandoc+jq or Lua filters can do the job (and are language-agnostic), but since you’re already using Node/ZX, sticking to JS makes sense.

- **Orchestration with ZX:** ZX is a great fit for this task – it simplifies running shell commands (like invoking Vitest) and handling promises for async operations (file reads, etc.). It essentially lets you write the glue in TypeScript instead of bash. Using ZX’s built-in Markdown execution is not granular enough for testing purposes (it can’t distinguish test blocks), so write a custom script with ZX.

- **Vitest integration:** Vitest provides the testing framework so you don’t have to reinvent asserts or test runners. By generating actual test files (or using its plugin mechanism), you leverage all of Vitest’s features (parallel runs, coverage, watch mode). For example, you could run `vitest --watch` and have your tool regenerate the .spec files on doc changes – Vitest will pick up the changes and re-run tests, giving a quick feedback loop as you edit docs. This might require a little coordination (perhaps a file watcher in the ZX script or integrating into Vitest’s workflow via the plugin), but it’s doable. In any case, Vitest’s familiarity (same `describe/it` syntax) means doc tests will look just like regular tests to developers, which is a plus.

- **Build-time vs runtime:** Execute tests at build/test time. This ensures your documentation examples are verified **before** they reach the audience. It also means the published docs remain simple and static – no surprises for readers. The downside (if any) is that you need to maintain the test-runner script and ensure it’s run regularly. But that’s a small price for confidence in your docs. You can automate it via CI (fail the build if docs tests fail) so that broken examples never get deployed. Meanwhile, readers of the docs on GitHub or your site will simply see nicely formatted code blocks. If you ever wanted, you could even note in the docs that “(This example is tested automatically)” to give readers trust that it’s accurate.

In conclusion, **using ZX plus a Markdown parser and Vitest gives a powerful combo** for “literate testing.” You write your `.md/.mdx` files with interleaved code and **`ts test`** blocks, and you get a tool that can parse those, execute the code, and validate the output using real tests. This keeps your documentation truthful and in sync with your code. It’s the same philosophy as Deno’s and Rust’s documentation tests (examples that are actually executed), applied in a custom way for Node/TS. By doing it at build time, you avoid runtime complications and ensure a smooth experience both for documentation readers and for developers running tests.

**References:**

- Lankhorst, T. _“Test codeblocks in markdown documents.”_ (2020) – using Pandoc AST and CMake to test C++ code in README.
- _Vitest Documentation – In-Source Testing & Documentation Tests:_ Demonstrates using `import.meta.vitest` to embed tests in source and markdown, with a plugin to transform them at test run.
- Suranga, S. _“Writing JS-based Bash scripts with zx.”_ LogRocket (2021) – explains ZX’s ability to run code snippets from Markdown files.
- **@amazeelabs/mzx** – “Markdown ZX” tool that runs markdown code blocks as scripts (an example of ZX usage for literate scripting).
- Deno Manual – _“Documentation Tests.”_ Shows how Deno extracts fenced code from JSDoc/Markdown and wraps it into test functions automatically.
