# Proposed CLI Design for a Markdown Processing Tool

## Introduction and Goals

We propose a Node.js/TypeScript CLI tool to recursively process Markdown files with **frontmatter filtering**. This tool uses Velite under the hood for file discovery and parsing of frontmatter metadata. The CLI will enable users to **select a set of Markdown files** (via path globs and frontmatter queries) and then **apply an operation** (such as **generate** new content or **update/enhance** existing content) to each file in that set. Users can supply **natural language instructions** describing the operation (e.g. _“Design a landing page for each domain”_), which the tool will interpret (likely by leveraging an LLM for content generation). Key goals include:

- Intuitive **recursive file selection** (similar to `find`-style traversal) with combined glob and frontmatter filters.
- Support for **batch operations** on each matched file (like a functional map/forEach over files).
- A **consistent, descriptive syntax** (inspired by modern CLI best practices) that is easy to use and remember.
- Safe, **Git-aware behavior** (only modifying version-controlled files by default to prevent accidental changes).
- Dual modes: **scriptable flags for automation** and an **interactive/NLP-driven mode** for user-friendly or AI-assisted usage.
- Output to files by default (in-place modifications or new file creation), with options for dry-run or stdout output for previewing changes.

By synthesizing best practices from Unix tools and contemporary JS CLI design, this proposal outlines an elegant CLI structure, flag design, and usage patterns to meet these goals.

## Inspiration from Existing CLI Tools

We draw inspiration from both classic Unix utilities and modern JavaScript toolchains:

- **find + exec:** The CLI should emulate the recursive discovery of `find` and the per-file action of `-exec`. For example, `find` can locate files by pattern and **execute a command on each matching file** (`-exec gedit "{}" \;`). Our tool will similarly find all matching Markdown files and run a specified operation on each, treating each file as the “{}” placeholder. This map/forEach behavior ensures batch processing is intuitive.

- **xargs:** Like `xargs`, which **reads input (e.g. file list) and executes a command using each item as an argument**, our CLI will accept piped input or integrate with other commands. For instance, users could pipe a list of files into our tool to process them. This fits a composable Unix philosophy, allowing `find ... | ourtool update ...` as an alternative to internal globbing. Supporting **STDIN input** means users (or scripts) can easily chain the tool with others using `|`, instead of manual prompts.

- **jq:** While not directly processing files, `jq` demonstrates powerful filtering in CLI. We aim for a simplified filtering of frontmatter (YAML/JSON) akin to querying object fields. Users might specify conditions like `--filter "draft=false"` or `--filter "tags=project"` to include only files where the YAML frontmatter meets those criteria. This gives a declarative feel to selecting content, somewhat analogous to `jq` filters on structured data.

- **Modern JS/TS CLIs (ESLint, Prettier, Biome):** These tools accept glob patterns and provide **in-place modification flags** (e.g. `eslint "**/*.js" --fix` to auto-fix files). Similarly, our CLI will take a glob or directory and process all matching Markdown files. We’ll follow conventions like quoting globs (e.g. `"**/*.md"`) so that Node’s glob handling works consistently across shells. Like ESLint/Prettier, we include a `--dry-run` or `--stdout` mode to preview changes instead of writing, and verbose vs. quiet output toggles. The CLI design will also be influenced by **Rome/Biome**, which unify multiple actions under one tool with clear subcommands (e.g. `biome format`, `biome lint`, or combined `biome check`). Our tool will likewise have subcommands for distinct operations but a coherent overall syntax.

- **git and kubectl:** We admire `git`’s use of subcommands and consistent flags, as well as how `kubectl` makes it easy to guess commands by following a consistent verb-noun pattern. In our CLI, subcommands (verbs like `generate`, `update`, `enhance`) will be paired with the object (the file set) implied by filters. For example, once a user knows `tool update` applies an update operation to files, they can guess that `tool generate` creates new content in files. We’ll ensure flags behave uniformly across subcommands (e.g., a `--filter` flag works with any operation). This **consistent command hierarchy** improves discoverability and predictability for users. Additionally, `git` influences our approach to safety and output: by default git refuses to touch untracked files without explicit add, and it prints detailed info on changes (e.g. what `git push` does) to help the user understand state changes. Our CLI will similarly default to **safe behavior** (skipping files not under version control unless overridden) and **communicative output** (summarizing what changed in each file).

- **CLI UX guidelines:** We incorporate general CLI UX best practices such as those in the Command Line Interface Guidelines. Notably, the tool will avoid overwhelming first-time users with just a wall of options. If run without sufficient arguments, it can show a concise help or even an example of common usage to guide the user (rather than “screaming documentation” only). We also plan an **interactive mode** (similar to how `npm init` or Python’s `pip install` can prompt the user) to gather instructions or confirm actions, making it more approachable when used manually. This interactive usage is only activated in appropriate contexts – e.g. if the command requires an instruction and none is provided, and we detect an interactive TTY, we’ll prompt the user for input. (In contrast, if the same scenario happens in a non-interactive shell or pipeline, we will **avoid hanging** and instead exit with an error unless a `-i` flag is given.)

## Core Design Principles

Based on the above inspirations, the CLI design will follow these core principles:

- **1. Recursive, Filtered Selection:** The tool should easily recurse through directories to find Markdown/MDX files. Users can filter files by path (glob patterns) and by frontmatter attributes. **Glob filtering** might use familiar wildcards (e.g. `**/notes/*.md`). **Frontmatter filtering** allows queries like `--filter "$type=guide"` or `--filter "tags=project"` to include only files where the YAML frontmatter has that key/value. Multiple `--filter` flags would logically AND together (all conditions must match). This design takes cues from find (for recursion) and static site generators (for using frontmatter metadata to categorize content). It enables treating a collection of content files as a dataset you can query and manipulate.

- **2. Map/ForEach Operations:** After selecting files, the CLI applies an operation to each file in turn, akin to a mapping function. This could be **generating** new content in the file (or creating a new file if needed), **updating/editing** the file’s content, or otherwise **enhancing** it (e.g. appending a section, improving text). The interface will make this batch nature clear – the user essentially describes _what to do for each file_, and the tool handles iteration. This aligns with the `find -exec` and `xargs` philosophy of “do X for each found item”. The CLI will likely implement this internally by loading each file (Velite can help parse frontmatter and content), applying some transformation (possibly via an AI if instructions are in natural language), and then saving the result.

- **3. Natural Language Instructions:** Users can provide a free-form instruction describing the content changes. The CLI will interpret these instructions to perform the desired operation on each file. This is a key feature enabling non-technical or high-level usage. For instance, a user might run:

  ```sh
  mdtool update "./domains/*.md" --filter '$type=domain' -i "Design a landing page for each domain."
  ```

  In this command, the `-i`/`--instruction` flag carries the natural language prompt. The tool would take each Markdown file of type “domain” and, guided by the instruction, generate or modify the content to _design a landing page_ for that domain. Internally, this likely means injecting domain-specific details from the file’s frontmatter or content into an LLM prompt (e.g., “Using the info in this file’s frontmatter, write a landing page...”). The CLI’s job is to reliably feed each file (as context) plus the user’s instruction into the operation.

  **Interactive vs. Scripted:** To support both interactive NLP-driven usage and automation, the instruction can be provided in multiple ways. In a **scripted scenario**, the user will pass `-i "text..."` as shown, or possibly `--instruction-file path/to/prompt.txt` to read a longer instruction from a file. This makes automation (CI jobs, npm scripts, etc.) straightforward. In a **user-driven scenario**, if the user omits the `-i` flag, the CLI can enter an interactive mode (TTY detected) and prompt: _“Enter the instruction or prompt for the operation:”_. The user can then type a multi-line instruction, ending with an EOF (Ctrl+D) or a terminator. This interactive prompt approach is similar to how `git commit` opens an editor if you don’t supply a `-m` message. It ensures a smooth experience when a human is at the terminal, without forcing them to always specify `-i`. (If run in a non-interactive context without `-i`, the tool will **error out** rather than wait for input, instructing the user to use `--instruction` explicitly – following the guideline of not prompting when stdout isn’t a TTY.)

- **4. Subcommand-Based Actions:** We will use **subcommands** to distinguish different high-level operations, which keeps the interface organized and extensible. Proposed subcommands (verbs) include:

  - **`generate`** – create new content or new files for each matched item. For example, `mdtool generate "src/**/*.md" --filter '$type=draft' -i "Write an outline for this draft post"` might generate an outline section for each draft post. If a file doesn’t exist and generation logically creates it (e.g., generating a missing page), the tool could create a new file, but only if explicitly allowed (to avoid surprises).
  - **`update`** – modify existing files in place. This can include enhancing or editing content. For example, `mdtool update "**/*.md" --filter 'tags=AI' -i "Add a glossary section explaining key AI terms."` will find all markdown files tagged with “AI” and append or update a glossary section in each.
  - **`enhance`** – (this might be an alias or a more specific variant of `update`) improve or refine content using AI (e.g., better phrasing, adding examples). It could behave like `update` but perhaps focus on stylistic improvements. Whether this is separate or just a flag (like `mdtool update --enhance`) is a design decision; for clarity we might treat them as synonyms or have sub-subcommands like `update enhance` vs `update edit`. This detail can be ironed out, but the core idea is to support multiple flavors of content modification.

  All subcommands will accept the same filtering options and instruction inputs. This subcommand structure mirrors tools like `git` and `kubectl` where the first argument is the action and subsequent arguments refine the scope. It aids discoverability – typing `mdtool --help` will list available subcommands and their purpose, and each subcommand can have its own help explaining relevant flags.

- **5. Consistent Flag Design:** Flags and options will be thoughtfully chosen for clarity and consistency. Some expected flags:

  - **File selection**: `-p, --path "<glob>"` (or simply a positional arg for the path) and `-f, --filter "key=value"` for frontmatter filters. We may allow multiple `--filter` uses, or a single filter string with logical operators. Simplicity is key: a syntax like `--filter "tags includes Project"` could be allowed for array values, but we might start with basic `key=value` matching and treat comma-separated values or multiple flags as needed.
  - **Instruction input**: `-i, --instruction "<text>"` as discussed, and possibly `--instruction-file <file>` if users want to supply a large prompt from a file (to avoid shell quoting issues for very long instructions).
  - **Output control**: By default, the tool writes changes to the files on disk (or creates new files). Options include `--stdout` to print the result of each operation to standard output (without saving) and `--dry-run` to simulate the operation without actually writing files. `--dry-run` could still show a diff or summary of what _would_ change. These let users preview changes or use the CLI in pipelines (for example, piping output to another program). If multiple files are processed with `--stdout`, the tool will clearly delineate outputs (perhaps by filename headers) to avoid confusion, unless it’s used on a single file.
  - **Git integration**: A flag like `--allow-untracked` could override the Git safety mechanism. By default, the tool will determine if a file is tracked by Git (e.g., using `git ls-files`) and **skip any untracked or ignored files**, warning the user that those were skipped. This prevents accidentally creating or editing files that aren’t under version control (respecting project boundaries). If the user **intends** to operate on new/untracked files (say they’re initializing new content), they can either add those to Git first or run with `--allow-untracked` to bypass the check. This design ensures “no surprises” – users won’t later find unversioned files with AI-generated content without having explicitly allowed it.
  - **General UX flags**:

    - `-q, --quiet` to suppress non-essential output. This is useful in scripts where only the final result or errors matter. (Following best practices, the default will be to print _something_ informative for each action, but a `-q` flag can **suppress output** if needed.)
    - `-v, --verbose` for more detailed logs, which might include the raw instruction, the files being processed, or debug info (especially if something fails).
    - `--yes` or `--force` to bypass confirmation prompts. If an operation is potentially destructive (e.g., overwriting a file section or creating many files at once), and the CLI chooses to ask “Are you sure?” in interactive mode, the `--yes` flag would skip that. Also, if running non-interactively, a `--force` might be required to proceed with a dangerous action (aligned with the common pattern of prompting on TTY vs. requiring `--force` in automation). For example, bulk-deleting files or replacing large content blocks might fall under this – though our use-case is more about content generation than deletion.
    - `--no-color` to turn off colored output (especially for script/AI use where ANSI codes can be problematic). The tool can auto-detect if output is not a TTY and disable color or interactive spinners in that case. We’ll also respect the `NO_COLOR` env var convention for accessibility.

- **6. Human-Friendly and AI-Friendly Output:** Striking a balance between readable output for humans and parseable output for AI/other tools is crucial. By default, the CLI will produce **human-oriented output** – for each file processed, it might print a short summary line such as: `✔ Updated  "about.md" (added introduction section)` or `⚠️ Skipped "draft.md" (no changes made)`. We can use simple symbols (checkmarks, warning signs) and colors (green for success, yellow for skipped, red for errors) to make it scannable, as many CLIs do today. However, these embellishments should disappear or be consistent when needed. We plan the following:

  - **Consistent formatting:** Each processed file outputs one line (or a predictable few lines) describing the action. This consistency helps if an AI or another program is reading the output – it’s easier to parse known patterns. For instance, an AI can be told _“Look for lines starting with ✔ to identify successful file updates”_. We avoid unstructured verbose text intermixed with results.
  - **Machine-parsable mode:** If `--json` is supplied, we output structured data (e.g. a JSON array of objects, each with file name, action taken, and status). This could aid other programs or AI agents to consume the results reliably. Alternatively, a `--porcelain` flag (borrowing Git’s term for stable script-friendly output) could produce tab-delimited or otherwise easily parsed output. This is particularly helpful for AI integration – an LLM controlling the CLI could use such output to reason about what happened.
  - **Interactive feedback:** In interactive mode, the tool might use progress bars or spinners (especially if calling an API like an LLM which takes time). But as noted, if stdout is not a TTY (e.g., piping to a file or an AI tool), we will automatically disable such live animations. Instead, we’ll revert to simple incremental logging (e.g., printing each filename as it starts and/or finishes processing). This ensures that in a non-interactive environment (like an AI agent’s terminal output capture), the logs don’t turn into garbled “Christmas tree” characters.

- **7. Safety and Transparency:** The CLI should never unexpectedly destroy user data. Any operation that _writes_ to files will either create a backup (if appropriate) or be easily undoable via Git. Because we limit to Git-tracked files, the user can always revert changes with a Git reset or checkout. We will also consider adding a `--commit` option that, after updating files, automatically creates a Git commit with a given message. (This again could be useful in AI-driven scenarios – the AI might want the tool not only to modify but also to commit the changes, all in one go, though this is an advanced idea.)
  Transparency also means the CLI **tells the user what it did**. Following CLI guidelines, if our command changes system state (here, the state of many files), we inform the user of exactly what changed. For example, after processing, we might output a summary: “5 files updated, 2 files skipped (no matching frontmatter), 1 file created.” The user can mentally model the result and, if needed, inspect the Git diff for details. Logging each file’s action (added, modified, unchanged) echoes tools like `git push` or `cp` which list results, and helps build user trust that the tool did exactly what they intended.

## Proposed CLI Syntax and Usage Patterns

Bringing it all together, here’s an outline of the CLI syntax and how users would use it:

- **Base Command:** Let’s call the tool `mdtool` for now (short for “Markdown Tool”). The general form is:

  ```bash
  mdtool <subcommand> [path/glob] [--filter condition...] [options...]
  ```

  Users can get help with `mdtool --help` or `mdtool <subcommand> --help` which will show usage examples and options. We’ll make sure the help text **highlights the most common use cases** for quick reference (perhaps showing an example of selecting files and providing an instruction) rather than just listing all flags.

- **Subcommands:** as discussed, e.g. `generate`, `update`, `enhance`. There might also be a generic `run` or `process` command that simply takes an instruction and decides whether to create or update content based on context; however, keeping explicit subcommands is clearer. Another possible command is `list` (or `find`): not to modify files, but just to list which files would match given filters. For example, `mdtool list --filter 'tags=recipe'` could output the file paths that meet the criteria. This is useful for previewing the scope of an operation. It’s analogous to a dry-run but only for the selection step. It can also feed into other tools or debugging (and could support the `--json` output for machine use).

- **Path/Glob Filtering:** If a path or glob is provided as a positional argument (or via a `-p` flag), the tool searches that location recursively for markdown files. If omitted, it could default to the current directory or a configured content directory. We’ll use Node’s globbing (via `fast-glob` or similar) to resolve patterns. It’s important to note that unquoted globs in the shell will be expanded by the shell; thus our documentation and help will remind users to quote patterns (as ESLint’s does) especially if using `**` which might behave differently in Bash vs Windows. Example:

  ```bash
  mdtool update "content/posts/**/*.md" --filter 'draft=true' -i "Convert draft to published: remove draft watermark and add date."
  ```

  This would find all markdown files under `content/posts` with a `draft: true` in their frontmatter, then apply the instruction to each (perhaps the instruction tells the tool to remove a “Draft” notice and insert the current date).

- **Frontmatter Filtering Syntax:** We will support simple expressions for filtering YAML frontmatter. The `--filter` flag can be repeated or possibly accept a comma-separated list of conditions. Each condition is of the form `<key><operator><value>`. By default, the operator is `=` (equals) if not specified. For example: `--filter "status=published"` (select files where frontmatter `status` is `"published"`). We also allow:

  - **Partial matches for arrays/strings:** If the frontmatter value is an array, `key=value` can be interpreted as _contains_ that value (e.g. `tags=project` matches `tags: [ "project", "x" ]`). We might also allow an explicit syntax like `tags includes project` for clarity. For strings, we might allow wildcard or substring match (e.g. `title~=Guide` to match “Guide” in the title). Initially, though, we can keep it simple: direct matching or inclusion for arrays.
  - **Negation or inequality:** A prefix `!` could negate the condition (`--filter "!draft=true"` meaning draft is not true). Or a `!=` operator for not equal. This can be implemented in a straightforward way.
  - **Comparison for numbers/dates:** If needed, support `>` or `<` for numeric frontmatter values or dates (e.g. `--filter "year>=2022"`). This is an advanced feature and might rely on parsing the YAML as types (Velite’s schema knowledge could help here).

  The filtering engine will parse the YAML frontmatter of each file (Velite can provide this as a JSON object), then evaluate the filter expression against it. Only files passing all filters proceed to the operation step. This gives users powerful control to target exactly the content they want (for instance, only apply the AI enhancement to blog posts of a certain category, or generate files only for items that haven’t been generated yet, etc.).

- **Natural Language Instruction Input:** The `-i/--instruction` flag expects a string. Because instructions could be long or contain characters that the shell treats specially, users can enclose it in quotes or use the `--instruction-file` alternative. Another idea is to allow writing the instruction in a heredoc style (some CLIs use `-- <END` to pass multiple lines). For example:

  ```bash
  mdtool update docs/guide.md <<'EOF'
  Rewrite this guide in a more conversational tone and add two examples in the examples section.
  EOF
  ```

  This would feed a multi-line instruction via stdin. Our tool can detect if the `-i` flag is missing and if stdin has piped content that is not a list of files (perhaps by checking if the piped content is longer than a file path, or simply having a separate mode). However, this might conflict with the earlier notion of reading file list from stdin. To avoid ambiguity, we might decide: if the subcommand is `generate/update` and no `-i` is given but STDIN **is not a TTY** (piped), then treat the entire STDIN as the instruction text (assuming it’s not a file list). This would let advanced users provide prompts via shell redirection as shown. It’s a bit complex, so in documentation we could prefer `--instruction-file` for clarity.

  Internally, given an instruction and a file’s content+metadata, the CLI would call into a function or service to carry out the instruction. For example, if integrated with an LLM API, it might construct a prompt with the user’s instruction and the file’s current content, then get the new/edited content. The CLI itself just orchestrates this for each file sequentially (or possibly concurrently with a `--parallel` flag if safe and needed). Concurrency might be an option if using local CPU-bound transformations; but if using an API with rate limits, sequential is safer by default.

- **Output and Confirmation:** When changes are to be made to files, especially a large number, the CLI might ask for confirmation in interactive mode: _“About to update 10 files as per the instruction. Proceed? (y/N)”_. This prompt would only appear if the user is at a terminal and hasn’t used `--yes`. It’s a final safeguard. In a script or with `--yes`, it will skip this and proceed. Each file operation will then be performed, and results printed as discussed. If any file ends up with no change (the AI decided no edit needed, or already up-to-date), we note it as “skipped” or “unchanged” rather than leaving the user guessing. In case of an error (e.g., the AI API fails, or a file is not writable), we print an error message with that file’s name and continue to the next file (unless the error is critical to all operations). The CLI should exit with a non-zero status if any errors occurred, to signal scripts that something went wrong. It could also have distinct exit codes or error summaries if needed.

- **Integration with Other Tools:** Since we expect usage by AI systems or inclusion in shell pipelines, we ensure **proper use of exit codes and streams**. Normal informative output goes to STDOUT, while error messages or debug logs might go to STDERR (so they don’t interfere with data output if piping). We will use exit code 0 for full success, perhaps a special code (or just 0 with a warning printed) if some files were skipped but none failed, and non-zero if any file failed to process. This way, scripts can easily handle outcomes. Logging and verbosity are adjustable as noted, and in quiet/machine mode, we won’t print extraneous info (like progress bars or color codes) that could confuse parsers.

## UX Considerations for AI Compatibility

Designing for **AI compatibility** means anticipating that an LLM agent or similar could be invoking this CLI and parsing its output. We have touched on many such considerations, but to summarize the UX choices that benefit AI (while not harming human UX):

- **Deterministic Output with `--json` or `--porcelain`:** By providing a structured output mode, an AI can directly parse results rather than relying on brittle regexes. For example, if the AI wants to know which files were modified, it could run `mdtool ... --json` and parse the JSON list of `{file: "...", status: "updated", changes: ["added section", ...]}`. For human users, this mode is optional; they can stick to the pretty console output. This separation of human vs machine output (like Git’s porcelain vs plumbing commands) ensures each audience gets what they need.

- **No Undocumented Surprises:** The CLI will avoid output that isn’t documented or enabled by a flag. An AI using the CLI should be able to rely on the format remaining stable. This means refraining from things like random ASCII art, irrelevant quotes or jokes in the output, etc. Every piece of text has a purpose. Even the use of emoji/symbols will be documented (e.g., we’ll mention that “✔” means success). If an AI finds an unknown emoji, it could be confusing, so we keep them minimal and consistent (and they can be turned off with `--no-color` which might also disable emojis).

- **Context-Awareness and Help for AI:** If an AI is trying to figure out how to use the CLI, it might call `mdtool --help`. We ensure the help text is clear and complete. For example, listing all subcommands and flags in a structured manner, possibly with examples. Since the AI might not fully understand abstract descriptions, we include at least one example in the help (e.g., usage template) to ground the instructions. Additionally, providing a man page or online documentation with examples can help the AI find how to use it correctly (if it has browsing tools). Our CLI will also be mindful of echoing the user’s input: if the AI passes a long `--instruction`, we won’t echo that back in full (which could overwhelm the output). We’ll either summarize or just proceed silently. This is similar to how some tools suppress overly verbose feedback when not needed.

- **Interactive Mode explicitly controlled:** If an AI mistakenly runs the tool in interactive mode (no `-i` in a non-TTY context), the tool will detect non-interactivity and **fail fast with an instructional error** (like “No instruction provided. Use -i or run in interactive mode.”). This is actually good for both AI and scripts, because it prevents hanging. We also provide a `--no-input` master flag (or reuse `--yes`/`--force`) to explicitly tell the tool never to prompt. This aligns with CLI best practices. An AI could include `--no-input` in every invocation to guarantee it never gets stuck waiting for a prompt.

- **Graceful Failure and Messages:** Error messages will be written in clear, factual language, typically one line, and if possible, prefixed with the tool name or an error code. This regular structure can help an AI recognize an error occurred. For example: `ERROR [mdtool]: Failed to update "guide.md" (OpenAI API timeout)`. The AI can pick up on the "ERROR" keyword. We avoid multiline stack traces or Node dumps unless `--debug` is set. By default, errors will be user-friendly (“Failed to ... because ...”), which helps both humans and AI understand the cause. In debug mode, we can dump a stack trace for a developer, but an AI likely won’t need that.

- **Testing with AI:** As a final UX note, we would actually test the CLI with an LLM-based agent (prompt it with the `--help` text and some tasks) to see if it can follow the usage. If not, that’s a sign our commands might be too confusing. For instance, if the AI tries `mdtool enhance all drafts with conclusion` (a very natural but incorrect invocation), we might consider whether we should support such syntax or at least provide a helpful error (“Did you mean: mdtool update --filter 'draft=true' ... ?”). While we can’t implement a full natural language parser for commands easily, we can ensure that error messages on wrong usage guide the user/AI to the correct usage (similar to how `git` suggests “Did you mean ‘git <something>’?” when you mistype a subcommand).

## Examples of CLI Usage

To illustrate the proposed CLI in action, here are a few example scenarios with commands and explanations:

- **1. Bulk Enhancing Content:** Suppose we have a bunch of Markdown knowledge base articles and we want to improve any that are tagged "AI". We can run:

  ```bash
  mdtool update "kb/**/*.md" --filter 'tags=AI' -i "Improve the clarity of the article and add a short example in the Introduction section."
  ```

  **What this does:** The tool finds all `.md` files under `kb/` (recursively) whose frontmatter contains `tags: ["AI", ...]`. For each file, it uses the given instruction to refine the text – likely calling an LLM to rewrite sentences for clarity and to insert an example into the intro. All changes are written back to the files. The CLI outputs one line per file indicating the result (e.g., “✔ Improved clarity and added example in Introduction in file X.md”). If a file had no `tags` or did not include "AI", it’s skipped entirely (not even loaded by the LLM). This one-liner example demonstrates recursive glob use and a simple frontmatter filter by tag.

- **2. Frontmatter-Driven Generation:** Imagine a project has Markdown files each containing a **domain name** in its frontmatter (e.g. `$type: domain` and perhaps the domain details). We want to generate a **landing page section** for each of these domain files. The command could be:

  ```bash
  mdtool generate "content/domains/*.md" --filter '$type=domain' \
    -i "For the given domain, create a compelling landing page overview section with a tagline and list of features."
  ```

  **Explanation:** This will iterate through each Markdown file in `content/domains` whose `$type` is `domain`. The instruction tells the tool (and by extension, the AI) to use the file’s data (likely the domain name and description from frontmatter) to produce a landing page snippet. The `generate` subcommand implies we might be _adding_ a new section to each file (as opposed to modifying existing text heavily). If a target file is empty or skeletal, this effectively “creates” content within it. Output goes to the files, and the CLI might say “✔ Generated landing page section in X.md”. If any file already had such a section, the tool could note “Skipped Y.md (already has landing page section)” depending on logic – or it might update it if generate is idempotent. This showcases using natural language to specify a creative task across multiple files.

- **3. Safety and Dry Run:** A user wants to mass-update all markdown files to fix spelling errors using an AI, but they first want to see what would change. They can do:

  ```bash
  mdtool update "./**/*.md" -i "Correct any spelling and grammatical mistakes." --dry-run --stdout
  ```

  **What happens:** The glob `./**/*.md` covers all markdown files in the current directory tree. The tool will load each, instruct the AI to suggest corrections, but **with `--dry-run` it will not write to files**. Instead, because `--stdout` is used, it will print the would-be updated content for each file to the console. Likely it will separate them with clear headers (like “--- <filename> (dry-run preview) ---”) so the user can scroll and inspect changes. The output might be very verbose (all file contents), so in practice one might not do this for _all_ files at once. But it’s useful for a single file or a sample. Alternatively, `--dry-run` without `--stdout` could just report _what changes_ would be made (e.g., “Would fix 5 typos in X.md” without showing full content). We might implement a summary diff view for dry-run mode for usability. The key is that no file is touched, which the CLI can confirm by printing a final message like “Dry run complete, no files written. Use --write or remove --dry-run to apply changes.”. This addresses the scenario of cautious users (or cautious AI) verifying outcomes before committing.

- **4. Interactive Instruction Prompt:** A user knows they want to do some operation but didn’t formulate the instruction ahead of time. Running:

  ```bash
  mdtool update notes/2025/ --filter 'category=journal'
  ```

  (with no `-i` given and assuming a TTY) would cause the CLI to enter interactive mode. It might respond:
  _Prompt:_ `Enter instruction for 'update' operation on 12 files (category=journal):`
  The user can then type: _“Summarize each journal entry into a one-paragraph abstract at the top of the file.”_ and hit Enter (or Ctrl+D if multi-line). The CLI would then confirm, e.g., “Received instruction. Preparing to update 12 files... (y/N)?” The user confirms, and then the tool proceeds as usual. This flow is friendly for ad-hoc use, where the user doesn’t have to remember the `-i` flag. If this command were run in a script or via an AI (non-interactively), the CLI would immediately error with a message about missing instruction, rather than hang, as discussed.

- **5. AI Usage Scenario:** Suppose an LLM agent is helping a user maintain their knowledge base. The agent might use the CLI to achieve tasks like “add a ‘last updated’ timestamp to all docs”. The agent would invoke something like:

  ```bash
  mdtool update docs/ --filter 'tags=docs' -i "Append a 'Last updated: <today>' line at the end of the document."
  ```

  Since the agent might not know the exact date, it could include `<today>` as a placeholder expecting the CLI/AI to substitute the current date. Our tool/AI integration could be smart enough to handle simple placeholders or the agent can fill the date itself. In any case, after execution, the CLI’s structured output (if `--json` was used) might be parsed by the agent to verify success. If the output indicates an error or some files skipped, the agent can adjust its plan (maybe some docs lacked the `tags=docs` frontmatter, so it might remove the filter and try again or inform the user). This demonstrates that our CLI, with clear filtering and feedback, enables higher-level automation by AI without ambiguity.

## Conclusion

In this design, we combined the **recursive power of Unix find/xargs**, the **structured filtering of modern dev tools**, and the **user-friendliness of interactive prompts and natural language processing**. The result is a CLI that lets users (human or AI) intuitively perform bulk operations on Markdown files with precision and confidence. By adhering to proven CLI patterns (subcommands, clear flags, meaningful output) and incorporating safeguards (Git tracking enforcement, dry-run, confirmations), the tool remains reliable in a software development workflow. At the same time, its support for natural language instructions and AI integration makes it a forward-looking productivity tool – essentially bringing the capabilities of an intelligent assistant to the command line.

This proposal provides a blueprint for the CLI’s syntax and behavior. Next steps would include user testing on real-world scenarios, implementing the command parsing and integrating an LLM for instruction execution, and refining the UX based on feedback. With careful implementation, this CLI will significantly streamline content operations for technical writers and developers, whether they invoke it directly or through AI copilots, all while maintaining a consistent and elegant command-line experience.

**Sources:**

- Unix `find` with `-exec` usage
- Linux `xargs` usage for mapping inputs to commands
- Kubernetes `kubectl` intuitive command hierarchy
- Allowing CLI data via `stdin` for composability
- Command Line Interface guidelines on quiet output and state changes
- CLI guidelines on requiring flags vs. prompts in non-interactive use
- Disabling interactive animations in piped/CI usage
