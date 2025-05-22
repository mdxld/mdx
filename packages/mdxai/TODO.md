# `mdxai` Package TODO List

This document outlines the development tasks and sequence for the `mdxai` package, focusing on AI-driven generation and editing of Markdown/MDX content. It incorporates insights from the package's own goals, `research/agentic-cli.md`, and `research/markdown-cli.md`.

## Phase 1: Core Functionality - AI-Powered Content Generation & Editing

This phase focuses on establishing the fundamental AI capabilities for `mdxai`.

- [ ] **Task: Basic Prompt-to-Content CLI:**
  - [ ] Design and implement a CLI command that accepts a natural language prompt and generates Markdown/MDX content.
  - [ ] Support generating content for common use cases (e.g., blog post titles, outlines, article drafts, code snippets).
  - [ ] Allow output to a specified file or stdout.
- [ ] **Task: AI-Driven Editing of Existing Files:**
  - [ ] Develop CLI functionality to take an existing Markdown/MDX file and an editing instruction (prompt).
  - [ ] Implement core editing operations (e.g., rephrasing, summarizing, expanding sections, correcting grammar/spelling).
  - [ ] Ensure changes can be saved in-place or output to a new file.
- [ ] **Task: Model Integration:**
  - [ ] Abstract LLM interactions to support multiple models/APIs (e.g., OpenAI, Anthropic).
  - [ ] Implement basic error handling and retry mechanisms for API calls.

## Phase 2: Agentic Features - Enhancing AI Autonomy and Safety

This phase draws heavily from `research/agentic-cli.md` to build more sophisticated and interactive AI capabilities.

- [ ] **Task: Natural Language Understanding (NLU) for Complex Commands:**
  - [ ] Research and implement more advanced NLU to parse complex user requests beyond simple prompt/file inputs.
  - [ ] Allow for multi-step instructions or goal-oriented commands (e.g., "Generate a blog post about X, then write three social media blurbs for it").
- [ ] **Task: Controlled File System Interaction:**
  - [ ] Enable the AI to list directory contents (`ls`-like functionality).
  - [ ] Allow the AI to read specified files (`cat`-like functionality).
  - [ ] Develop capabilities for the AI to propose creating new files or directories.
- [ ] **Task: Version Control (Git) Integration:**
  - [ ] Allow AI to query Git status (e.g., check for uncommitted changes).
  - [ ] Enable AI to propose `git add` for new/modified files.
  - [ ] Explore AI-assisted commit message generation based on changes.
  - [ ] **Crucial:** All Git operations must be proposed and require user confirmation.
- [ ] **Task: Safety Measures for AI-Driven Modifications:**
  - [ ] Implement mandatory user confirmation before any file is written or modified.
  - [ ] Provide diff previews (unified diff format) to show proposed changes clearly.
  - [ ] Develop a mechanism to revert the last applied change (session-based undo).
  - [ ] Ensure Git is used as the primary safety net; encourage or require committing changes frequently.
- [ ] **Task: High-Level Goal Decomposition & Planning (Advanced):**
  - [ ] Explore mechanisms for the AI to break down a high-level goal (e.g., "Write a series of 5 articles on topic Y") into a sequence of actionable steps.
  - [ ] Persist and display the plan, allowing user review and modification (inspired by `CLAUDE.md` or `AGENT.md` concepts from `research/agentic-cli.md`).

## Phase 3: CLI Enhancements - Improving Usability and Power

This phase incorporates best practices from `research/markdown-cli.md` to create a robust and user-friendly CLI.

- [ ] **Task: Recursive File Selection:**
  - [ ] Implement file selection using glob patterns (e.g., `mdxai edit "posts/**/*.mdx"`).
  - [ ] Allow filtering by frontmatter attributes (e.g., `--filter "draft=true"` or `--filter "tags=AI"`).
- [ ] **Task: Batch Operations:**
  - [ ] Enable `mdxai` to apply a given generation or editing instruction to all selected files.
  - [ ] Ensure efficient processing for multiple files.
- [ ] **Task: Output Control:**
  - [ ] Implement a `--dry-run` mode to simulate operations without writing to disk, showing what would happen.
  - [ ] Provide a `--stdout` option to print results to standard output instead of files (useful for piping or preview).
- [ ] **Task: Human-Friendly and AI-Friendly Output Modes:**
  - [ ] Default to human-readable, colored output with clear status messages (e.g., "✔ Updated file.md", "⚠ Skipped file2.md").
  - [ ] Implement a `--json` output mode for machine-readable (AI-friendly) structured output, detailing files processed and actions taken.
  - [ ] Ensure interactive elements (spinners, prompts) are disabled when not in a TTY environment.
- [ ] **Task: Consistent Flag Design and Help Text:**
  - [ ] Adhere to CLI best practices for flag naming and behavior (`-v` for verbose, `-q` for quiet, etc.).
  - [ ] Provide comprehensive help text (`mdxai --help`, `mdxai <subcommand> --help`) with clear examples.

## Phase 4: Integration with other `mdx*` tools

This phase focuses on ensuring `mdxai` works seamlessly within the broader `mdx*` ecosystem.

- [ ] **Task: `mdxdb` Integration:**
  - [ ] Investigate using `mdxdb` as a potential storage or indexing backend for content generated or managed by `mdxai`.
  - [ ] Allow `mdxai` to query `mdxdb` for context or to find files to operate on.
- [ ] **Task: `mdxe` Integration Exploration:**
  - [ ] Explore how `mdxai` could assist in generating or modifying executable code blocks managed by `mdxe`.
  - [ ] Potentially use `mdxai` to scaffold `mdxe` components or generate documentation for them.
- [ ] **Task: `mdxld` Integration Exploration:**
  - [ ] Consider how `mdxai` could help in generating or tagging content with linked data (MDXLD) structures.
- [ ] **Task: `mdxui` Integration Exploration:**
  - [ ] Explore using `mdxai` to generate MDX content that utilizes `mdxui` components.

## Ongoing Tasks

- [ ] **Documentation:** Maintain comprehensive documentation for all features and CLI commands.
- [ ] **Testing:** Develop a robust test suite, including unit tests, integration tests for CLI commands, and potentially tests with mock LLM interactions.
- [ ] **Refinement:** Continuously refine prompts and AI interaction strategies for better quality results and user experience.

---

_This TODO list is based on initial goals for `mdxai` and insights from `research/agentic-cli.md` and `research/markdown-cli.md`._
