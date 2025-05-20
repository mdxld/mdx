# CLI Tool Implementation TODO

This TODO list outlines tasks for building a Node.js CLI (in TypeScript) that executes `ts`/`js` code blocks from Markdown (`.md`/`.mdx`) files. Tasks are grouped by key components of the implementation for clarity.

## CLI Interface and Command Structure

- [ ] **Define CLI usage and name:** Decide on the CLI command name and overall usage pattern (single command with flags vs subcommands).
- [ ] **Argument parsing library:** Set up a CLI argument parser (e.g. Commander.js or Yargs) to handle command-line input.
- [ ] **Flags and options:** Implement required flags:

  - [ ] `--test` flag to enable "test mode" (execute only test-tagged code blocks via Vitest).
  - [ ] `--watch` flag to enable watch mode (auto-rerun on file changes, see Watch Mode tasks).
  - [ ] (Optional) Flag or argument for specifying target files or directories (default to a content folder or current directory if not provided).

- [ ] **Shared scope behavior:** No separate subcommand for normal vs test mode – the presence of `--test` will alter behavior. Ensure the CLI can combine flags (e.g. `--test` with `--watch`).
- [ ] **Help and version:** Provide `--help` output and usage examples, and a `--version` flag (could be auto-handled by the CLI library).
- [ ] **CLI entry point:** Configure the package.json `"bin"` field or use a shebang in the compiled script so the CLI can be invoked (e.g. `md-runner` command).
- [ ] **UX messaging:** Print clear messages on start (e.g. what files are being processed, mode active) so the user understands what the CLI is doing.

## Code Block Extraction and Tagging Mechanism

- [ ] **File discovery:** Traverse the target directory (or given file list) to find all `.md` and `.mdx` files. Read file contents as UTF-8 text.
- [ ] **Markdown parsing:** Use Velite's Markdown processing or a Markdown AST library (e.g. **remark** with plugins) to parse each file and extract code blocks. Ensure the parser can handle MDX syntax if `.mdx` files contain JSX (consider using `@mdx-js/mdx` or remark-mdx for MDX support).
- [ ] **Identify code blocks:** For each parsed file, collect all fenced code block nodes. Filter for code blocks with language identifier `ts`/`typescript` or `js`/`javascript`. Utilize the AST node properties (`lang` and `meta`) to identify language and any tags.
- [ ] **Detect "test" blocks:** Check the code block’s info string or meta for the word "test". For example, a fence starting with ` ```ts test` might have `lang: 'ts'` and `meta: 'test'` in the AST. Mark these blocks as **test blocks** versus **normal blocks**.
- [ ] **Data structure for blocks:** Create an internal representation for code blocks (e.g. an array of objects containing `{ filePath, code, isTest, lang }`). This will be used by the execution engine. Preserve the order of code blocks in each file.
- [ ] **Ordering across files:** Decide on an execution order for multiple files. For now, a simple approach is to process files in alphabetical order (or as provided) so that the combined execution is deterministic. All code blocks will share a single global scope, so order can affect behavior.
- [ ] **Flexible tagging (future):** Note if additional tags or metadata in code fences might be needed later (e.g. to isolate or name code blocks). For now, only the `test` tag is recognized; document this assumption.

## Execution Engine (Normal Mode vs Test Mode)

- [ ] **Unified execution flow:** Implement a function to iterate through the collected code blocks and execute them according to the mode:

  - In **normal mode** (no `--test` flag): execute all code blocks _except_ those tagged as tests.
  - In **test mode** (`--test` flag present): execute only the test-tagged code blocks (handled via Vitest, see below).

- [ ] **Execution context (shared scope):** Create a shared runtime context for executing code blocks so that variables and state persist across blocks and files (no isolation per file). For example, use a single Node `vm.Context` or global object that all code evaluations share. Inject standard globals like `console` (so that `console.log` in blocks works as expected) into this context.
- [ ] **TypeScript support in execution:** Decide how to run TypeScript code:

  - Option 1: Transpile TS to JS on the fly using the TypeScript compiler API or ts-node, then run the JS in the shared context.
  - Option 2: Use **ts-node** register to execute TS directly. If using `vm` for isolation, manual transpilation will be needed (e.g. via `ts.transpileModule`).
  - Ensure that both `.ts` and `.js` blocks can execute seamlessly (e.g., by transpiling `.ts` blocks and directly eval-ing `.js` blocks).

- [ ] **Perform execution:** For each code block in normal mode, evaluate the code in the shared context (e.g., with `vm.runInContext(transpiledCode, context)` or `eval` if not isolating). Provide access to Node globals as needed (e.g., possibly allow `require` in the context if code blocks need to import modules).
- [ ] **Maintain order:** Execute code blocks in the determined order, since later blocks might depend on earlier ones (especially with shared scope). If a block throws an error (in normal mode), decide whether to stop further execution or continue (see Error Handling).
- [ ] **Output capturing:** Ensure that any `console.log` or standard output from the code blocks is visible to the user (since the CLI should print outputs). If using a `vm` context, bind the context’s `console` to the real `console`. Also, capture thrown errors to report them (handled in Error Handling section).
- [ ] **Pre-run setup (optional):** If certain global setup is needed (for example, polyfills or certain variables), execute that in the context before running user code. Currently not specifically required except injecting test globals in test mode (see Vitest integration).

## Vitest Integration and In-Memory Test Declaration

- [ ] **Vitest as test runner:** Integrate **Vitest** to execute test-tagged code blocks. Rather than running test blocks as regular code, use Vitest to leverage its testing API (which provides `describe`, `it`, `expect` globally).
- [ ] **Global test APIs:** Ensure that within test code blocks, `describe`, `it`, and `expect` are available without import. Vitest can be configured to inject these globals (via its `globals` option or by default behavior in test environment).
- [ ] **Aggregate test code:** Collect all `isTest` code blocks (from all files) into a single test suite or multiple suites:

  - For simplicity, consider concatenating all test code blocks into one combined test file (as a string). This file can contain multiple `describe` or `it` blocks as defined in the markdown. By aggregating, all tests run together and share any common setup code included.
  - Alternatively, generate one test file per markdown file (or per block) for isolation, but given “shared scope” is allowed, a single combined suite is easier initially.

- [ ] **Include setup code for tests:** If test blocks depend on prior non-test code blocks (e.g. a code block defines a function, and a subsequent test block tests it), ensure that function is defined in the test context. One approach is to prepend all normal code blocks (or specific setup code) into the combined test code before the test definitions. This way, when Vitest runs the tests, it has the necessary context. (Alternatively, run normal blocks in the same VM and share state, but Vitest typically runs tests in isolation – combining into one suite avoids isolation issues).
- [ ] **In-memory test execution:** Implement the test run without requiring the user to manually create test files:

  - Option A: **Programmatic API:** Use Vitest’s Node API to run tests from memory. For example, call `startVitest('test', [...], ...)` to programmatically initiate Vitest. Provide the combined test code to Vitest by writing it to a temporary `.spec.ts` file in memory or disk, then pass that file path as a filter to `startVitest` (so Vitest only runs our generated tests).
  - Option B: **CLI invocation:** Alternatively, write the combined test code to a temp file and spawn the `vitest` CLI as a child process pointing to that file. This is simpler but involves I/O. Option A keeps it in-process.
  - Decide which approach to implement (prefer the Vitest Node API if feasible for efficiency and better integration).

- [ ] **Vitest configuration:** If using the Node API, pass appropriate configuration:

  - Disable watch mode (the CLI will handle watching externally).
  - Use `globals: true` (if needed) to automatically inject `describe/it/expect` globals.
  - Possibly set the environment to Node (since we are executing Node code blocks).
  - Ensure Vitest does not isolate the environment per test file if we want a truly shared scope (if using one combined file, this is moot; if multiple, consider setting `threads: false` or similar to avoid separate processes).

- [ ] **Run and report tests:** Execute the Vitest run. Allow Vitest’s default reporter to print results to stdout (so the user sees which tests passed/failed). If using the Node API, collect results from `vitest.state` if needed to determine overall success programmatically.
- [ ] **Cleanup:** If a temporary test file was created, delete it after execution. If using an in-memory approach, ensure any allocated resources are cleaned (or process exits to free them).
- [ ] **Integration with watch:** If `--watch` is also enabled in test mode, consider leveraging Vitest’s watch mode or rerunning `startVitest` on each change (see Watch Mode section for coordinating this).

## Error Handling and Reporting

- [ ] **Normal mode errors:** Wrap execution of each normal code block in try/catch. If an error is thrown, catch it and print a clear error message to stdout:

  - Include the file name and possibly the code block (or an index/identifier) in the error message to help locate the failing code.
  - Print the error stack trace or at least the error message. Use `console.error` for clarity.
  - Decide whether the CLI should continue executing subsequent blocks after one fails. For initial implementation, it may stop on the first error (failing fast), but this could be made configurable. Document this behavior.

- [ ] **Vitest errors:** In test mode, Vitest will handle assertion errors and output them as test results. Ensure these are not swallowed:

  - If using Vitest’s output, it will show failing test details. The CLI should propagate Vitest’s exit code or result (Vitest will typically set process.exitCode = 1 if tests fail). If using the API, manually set the CLI’s exit code based on `vitest.state` results or caught errors.
  - If the test code itself throws outside of a test (like in global setup), Vitest should treat that as a failure. Still, capture any unexpected exceptions during the test run and log them.

- [ ] **Process exit codes:** Implement exit codes for the CLI:

  - In normal mode, if any code block threw an error, exit with a non-zero code (to signal failure in scripts).
  - In test mode, exit with non-zero if any tests failed (align with typical test runner behavior), or zero if all tests passed.

- [ ] **Edge cases:** Handle gracefully:

  - No code blocks found: print a warning or message that nothing was executed.
  - Files that fail to parse as Markdown/MDX: catch parse errors and report them.
  - If a code block execution hangs or is asynchronous, consider adding a timeout or at least inform the user (though implementing timeouts is optional).

- [ ] **Logging and verbosity:** Make error messages clear and perhaps provide a `--verbose` flag to show more details (like full stack traces or the code of the block that failed). Ensure normal logs (non-error `console.log` from user code) are not mistakenly treated as errors.

## Watch Mode Wiring

- [ ] **File watcher setup:** Implement watch mode so that changes in source markdown files trigger re-execution:

  - Use Velite’s built-in watch if accessible (Velite can watch the `content` directory on `velite dev`). If Velite’s API allows hooking into its watch events or running in the same process, explore that.
  - Otherwise, use a file watching library like **chokidar** to monitor the same files discovered for execution. Watch for file modifications (and possibly additions/deletions) in the target directories.

- [ ] **Re-run on change:** When a watched file changes, re-run the relevant execution:

  - If in normal mode, re-run all normal code blocks. (For simplicity, re-run _all_ blocks from all files on any change. An optimization could be to run only the changed file’s blocks, but since scope is shared and order matters, full re-run ensures consistency.)
  - If in test mode, re-run the test suite. If using Vitest’s API, you may restart the Vitest instance or use Vitest’s built-in watcher. Alternatively, explicitly watch and re-invoke the test run each time (possibly creating a fresh Vitest instance per cycle to avoid stale state).

- [ ] **Debounce rapid changes:** Implement a short delay or debounce to handle rapid file saves. Ensure that only one execution runs at a time and queue/delay new triggers until the current run finishes to avoid race conditions.
- [ ] **User feedback:** Print a message when a change is detected and when re-execution starts (e.g. “File X.md changed, re-running code...”). Also indicate when the run is complete (especially for tests, where Vitest output will show results).
- [ ] **Persistence of context:** Decide if the execution context should reset on each watch cycle or persist across changes:

  - Likely, start fresh on each change (clear the context/global state before re-running) to avoid side effects from previous runs. This ensures each run reflects the current file contents only. (E.g., if a code block was removed or changed, the old definitions should not linger in memory).
  - For test mode, a fresh Vitest run on each change is expected (Vitest’s own watch does this by default).

- [ ] **Termination:** Ensure the watch mode can be cleanly stopped. For example, on Ctrl+C, exit the process. If using Vitest in watch, ensure to close any Vitest watchers/threads on exit. If using our own watcher, close file watchers to release resources.

## TypeScript Build/Runtime Setup

- [ ] **Project initialization:** Set up the Node.js project structure for the CLI:

  - Create `package.json` (if not already) and add necessary dependencies/devDependencies.
  - Initialize a TypeScript configuration (`tsconfig.json`) targeting a Node LTS (ES2020 or later) environment. Include type definitions for Node.

- [ ] **Dependencies:** Add required libraries:

  - Markdown parsing: e.g. `remark` and `remark-parse` (and `remark-mdx` if needed for MDX).
  - CLI framework: e.g. `commander` or `yargs`.
  - Execution helpers: `ts-node` (to run TS code) or include `typescript` for compiler API, and possibly `vm2` if using an isolated VM environment (or use Node’s built-in `vm` module which requires no extra package).
  - Testing framework: `vitest` (as a dependency, since the CLI will invoke it programmatically).
  - File watching: `chokidar` (for watch mode).
  - (Optional) Utilities: e.g. `fast-glob` for file patterns, `chalk` for colored output.

- [ ] **TypeScript compilation:** Configure build scripts:

  - In package.json, add a script like `"build": "tsc"`. Ensure the output (JavaScript) is placed in a `dist/` folder or similar.
  - Decide on module format: CommonJS vs ESM. For a CLI, CommonJS may simplify usage of `require` and interoperability (especially if using ts-node, which works in CommonJS by default). Alternatively, use ESM if desired, but ensure all dependencies (and Vitest API usage) are compatible. Document the choice.

- [ ] **Development workflow:** For convenience during development, set up either:

  - `ts-node` for running the CLI directly in development (so you can test without building each time).
  - Or use `npm link` / `yarn link` to test the CLI globally after build.
  - Possibly integrate Velite’s dev server if relevant (e.g., run `velite dev` alongside the CLI during development to see both working).

- [ ] **Running TS code blocks:** If using `ts-node` for executing code blocks, ensure it’s properly required or registered in the CLI runtime when needed. For example, if not using manual transpilation, you might call `require('ts-node').register({...})` at startup so that any `vm.runInContext` or dynamic `require` of TS will transpile on the fly.
- [ ] **Binary distribution:** After building, ensure the resulting JavaScript bundle can be invoked. If bundling to a single file (optional), use a tool like esbuild or pkg. Otherwise, distributing as an npm package with a bin entry is sufficient (the user can install globally or use npx to run it).
- [ ] **Velite integration (optional):** Since Velite is already used in the project, ensure compatibility:

  - The CLI should not interfere with Velite’s own build process. For example, if Velite generates a `.velite` directory or transforms content, our CLI can operate in parallel on the raw content files.
  - If desired, configure the CLI to run after Velite’s build (perhaps via an npm script or concurrently) to ensure content is up-to-date, though this is not strictly required if watching the raw files.

- [ ] **Testing build:** Verify that the CLI can be built and run on different platforms (Windows, Linux, Mac) and Node versions (ideally matching the project’s Node version). Check that all path manipulations use `path` module for cross-platform safety.

## Testing and Validation of the CLI

- [ ] **Unit tests for internals:** Write unit tests for the parsing and execution logic (using a testing framework, possibly even Vitest itself for the CLI’s own tests):

  - Test the Markdown parsing function with sample markdown strings (including various combinations of code fences, with and without `test` tag) to ensure it correctly identifies code blocks and tags.
  - Test the execution engine functions in isolation: e.g., a small JS code snippet that sets a global variable and a second snippet that reads it, to verify shared scope works.
  - Test the error handling by feeding in code that throws, and check that the error is caught and formatted as expected.

- [ ] **Integration tests (CLI behavior):** Simulate the CLI usage:

  - Use a tool like [execa](https://github.com/sindresorhus/execa) or Node’s child_process to run the CLI command on sample markdown files. Verify it exits with the correct code and output.
  - Example: create a temp markdown file with a `console.log("Hello")` code block, run the CLI, and assert that "Hello" appears in stdout.
  - Create a markdown with a known failing snippet (e.g. `throw new Error("fail")`) and ensure the CLI prints an error and exits non-zero.
  - Test `--test` mode: create a markdown file with a simple test (e.g., ``ts test` describe('math', it('adds', () => expect(1+1).toBe(2))) ``), run the CLI with `--test`, and confirm that Vitest runs it and reports a success. Do the same with an intentionally failing expect to see the failure report.

- [ ] **Watch mode tests:** Manually (or with an automated approach) validate watch mode:

  - Run the CLI with `--watch` on a sample project directory. Modify a markdown file (e.g., add a new `console.log`) and observe that the CLI detects the change and reprints the output.
  - If possible, automate this by spawning the CLI in watch mode in a child process, then programmatically editing a file and listening for the process stdout to include the expected new output.
  - Ensure that multiple saves in quick succession don’t break the tool (the debounce logic should handle it).

- [ ] **Performance and memory:** If the content has many code blocks, test that the CLI can handle it without excessive slowdown or memory leaks. For example, 100+ code blocks execution should be tested to see that the overhead (especially of starting Vitest in test mode) is acceptable.
- [ ] **Validation in real scenario:** Test the CLI in the context of the actual project using Velite:

  - Run it on the project’s real markdown files to ensure it behaves correctly with that content.
  - Use Velite’s dev mode concurrently: start `velite dev --watch` and the CLI `--watch`, ensure they both run without conflicts (e.g., one watching does not prevent the other from seeing file changes).
  - Verify that the CLI’s outputs and Velite’s outputs (if any) can coexist in the terminal (maybe use prefix messages to distinguish).

- [ ] **Documentation and examples:** Once validated, update README or docs to include usage examples of the CLI, so users (or other team members) know how to run it in normal vs test mode, and how to interpret the output. (Not a code task, but important for completeness.)
