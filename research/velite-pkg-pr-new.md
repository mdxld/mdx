# Velite + pkg.pr.new Starter

This project is a template for creating an **NPM package** that bundles content files (with YAML frontmatter, Markdown/MDX, etc.), source code (ES modules, JSX/React components), and a continuous release workflow. It uses **Velite** to load/parse content and **pkg.pr.new** to automate preview releases. The goal is to streamline development and distribution – content is transformed into a typed data layer, and every commit or pull request can produce an installable preview package for testing. This ensures you can iterate quickly on content and code changes, with **type-safe data** from Velite and frictionless preview releases via pkg.pr.new.

## Project Structure and Content

The repository organizes source files into a `content/` directory for Markdown/MDX and data files, plus standard directories for code (e.g. `src/` or component folders). Velite supports **structured frontmatter** and various content types out-of-the-box – you can include YAML metadata at the top of Markdown or MDX files, and Velite will parse it according to a schema you define. Unstructured Markdown content is also handled; for example, you might define a schema field like `content: s.markdown()` to transform Markdown body text into HTML. Velite even supports **MDX** (Markdown with JSX) content: _“Velite supports MDX out of the box. You can use MDX to write your content, and Velite will automatically render it for you.”_. In practice, MDX files can be processed with `s.mdx()` in your Velite schema, which compiles the MDX to a **function body string** that can later be executed to render React components at runtime. (Velite’s default MDX output is a string of JavaScript code; you can use a small runtime helper to convert it into a React component when consuming the data in an application.)

**Velite Configuration:** To make this work, a `velite.config.(js|ts)` defines collections for your content types. For example, you might have a `posts` collection for blog articles in `content/posts/*.mdx`. Each collection has a schema mapping frontmatter fields and content to typed data (Velite uses [Zod](https://zod.dev/) under the hood for schema definitions). Here’s a snippet of what a Velite schema might look like:

```js
// velite.config.ts (example)
import { defineConfig, s } from 'velite'

export default defineConfig({
  collections: {
    posts: {
      name: 'Post',
      pattern: 'posts/*.mdx',
      schema: s.object({
        title: s.string(),
        slug: s.slug('posts'),
        date: s.isodate(),
        content: s.mdx(), // MDX content compiled to function-body string
      }),
    },
    // ...other collections or fields as needed
  },
})
```

In this schema, Velite will extract **YAML frontmatter** keys like `title`, `slug`, `date` from each MDX file and validate/transform them (e.g. ensure `slug` is unique in posts, parse `date` to ISO string). The MDX content itself is captured as `content` and compiled. You can extend schemas with computed fields or custom processors (Velite provides helpers like `s.image()`, `s.file()`, `s.excerpt()`, etc., to handle images, file links, excerpt generation, reading time, and more). This ensures **structured data** for all content – for instance, frontmatter plus Markdown body can yield a JSON object with title, date, and HTML content.

**Content and Components:** Because MDX allows embedding React components in Markdown, you can include interactive UI pieces. Velite will treat the MDX as content (it doesn’t execute the JSX at build time, but preserves it in the compiled code string). Any React components or ES module code you want to bundle can live in the `src/` folder (or be referenced in MDX). Those source files (e.g., utility functions, React components in JSX/TSX) should be built with the rest of the package using a bundler or compiler (see Build process below). For example, if your MDX file uses a `<Chart>` component, ensure that component is exported by your package or included for consumers to import. Velite’s output for MDX will expect to receive the actual component at render time – typically, consumers of your package will use a helper to inject or globally register such components when rendering the MDX content. (Velite’s docs provide an example `useMDXComponent` utility that takes the code string and returns a React component, which we can include in our package or document for users.)

## Build Process and Output

Run `npm run build` (or `pnpm/yarn build` depending on your setup) to transform and bundle all source files. The build script is configured to perform the following steps:

1. **Run Velite** to process content files. Velite will scan the `content/` directory according to the patterns in `velite.config.js` and output a **`.velite/` directory** with structured data:

   - JSON files for each collection (e.g. `posts.json`, `others.json`, etc.) containing arrays of content objects.
   - An `index.js` (ESM) and `index.d.ts` (TypeScript definitions) that aggregate those collections for easy import. For example, `.velite/index.js` will re-export each collection’s data:

     ```js
     export { default as posts } from './posts.json'
     export { default as others } from './others.json'
     ```

     This means you can import the compiled data in code, e.g. `import { posts } from './.velite/index.js'`. The TypeScript `index.d.ts` provides typed definitions for the shape of your collections (inferring from your Velite schema).

   - Any static assets referenced in your content (images, videos, etc.) will be copied to `public/static/` with hashed filenames, and the JSON data will contain links to these files. For example, if a frontmatter field references `cover: cover.jpg`, after build you might get `cover: "/static/cover-2a4138dh.jpg"` (with a hash) in the JSON.
   - **Note:** The `.velite/` folder and `public/static/` outputs are build artifacts. They should be added to **.gitignore** (Velite’s documentation recommends ignoring them in version control).

2. **Compile Source Code**. After Velite generates the content data, we compile any remaining source files (ES modules, TypeScript, JSX, etc.) into the distributable format. This project is set up for **ESM output** (Node 18+ supports ES modules natively). If using TypeScript or modern JS, configure your bundler or tsc to output ESM (`"module": "ESNext"` in tsconfig, and `"type": "module"` in package.json for Node). We use a simple bundler configuration (for example, using [tsup](https://tsup.dev) or ESBuild) that takes `src/index.ts` (and any other entry points) and produces output in `dist/` or similar. The Velite-generated `.velite/index.js` can be re-exported or included in these outputs so that consumers of the package can access the content. For instance, our `src/index.ts` might do `export * from '../.velite/index.js';` along with any other exports (like custom React components). After this step, the **package bundle** will contain both the processed content JSON and the compiled code.

3. **Packaging**. The final package (ready to publish or distribute) will include the compiled content data and code. Verify that `package.json` **files** or **exports** fields are configured to include `.velite/` outputs or their re-exports. Typically, you’d include the `dist/` folder and possibly the content JSON. Since Velite’s output is JSON/JS, it’s fine to publish those as part of your package. The TypeScript declarations from Velite (`.velite/index.d.ts`) can be combined with your package’s d.ts outputs for full type coverage.

After running the build, your repository will have an output structure like this (simplified):

```plaintext
 my-package/
 ├── content/
 │   ├── posts/             # MDX/MD files with YAML frontmatter
 │   └── data.yml           # Example YAML data file (if any)
 ├── src/                   # Your source code (ES modules, components, etc.)
 ├── .velite/
 │   ├── posts.json         # Velite output for posts collection
 │   ├── ...other.json      # Velite output for other collections
 │   ├── index.js           # ESM entry aggregating content
 │   └── index.d.ts         # Type definitions for content
 ├── public/
 │   └── static/            # Copied static assets (images, etc.)
 ├── dist/
 │   ├── index.js           # Bundled ESM code (includes content exports)
 │   └── ...                # Other build outputs (if any)
 ├── velite.config.ts
 ├── package.json
 └── README.md
```

You can now test the package locally (e.g., `npm pack` to create a tarball, or `npm link` to another project) to ensure everything works. If you open the JSON files in `.velite/`, you’ll see your content transformed into JavaScript objects (with frontmatter values and converted content). For example, a `hello-world.mdx` file with `title: Hello World` frontmatter would appear in `posts.json` as an object `{ "title": "Hello World", ... }`. If that MDX had JSX, the `code` field would contain a compiled function string that can be rendered in a React app.

## Continuous Preview Releases (GitHub Action with pkg.pr.new)

To streamline testing and feedback, this project integrates **pkg.pr.new**, which enables “continuous releases” for every commit and pull request. Once set up, **each commit** pushed to any branch (or any PR) will trigger a workflow that builds the package and publishes a preview release to a temporary registry. This means contributors and users can install a specific commit’s version of the package _without_ waiting for an official version bump on NPM. As the StackBlitz team explains, _pkg.pr.new uses a CLI and GitHub Actions to publish unreleased packages to a temporary npm-compatible registry, providing instant access to preview packages with a unique URL structure_. In practice, after each successful build, pkg.pr.new will upload the package to a special URL tied to the commit hash or PR number. For example:

- By commit hash: `npm i https://pkg.pr.new/<owner>/<repo>/<package>@<commit-hash>` – e.g. `npm i https://pkg.pr.new/tinylibs/tinybench/tinybench@a832a55`.
- By PR number: `npm i https://pkg.pr.new/<package>@<PR-number>` – e.g. `npm i https://pkg.pr.new/valtio@906` (installs the preview for PR #906 of the **valtio** project).

Using these URLs, anyone can try the latest build from any branch or PR. The preview packages are **npm-compatible** (you install them as if they were from a registry) but they don’t clutter the real NPM registry with extra versions. This is extremely useful for testing in downstream projects or providing quick feedback (“does this commit fix my issue?”) without publishing official releases.

**GitHub Action Workflow:** The repository includes a GitHub Actions workflow file (e.g., `.github/workflows/preview.yml`) that runs on every push and pull request. The workflow will:

- **Checkout** the repository code.
- Set up Node.js (using Node 20 in CI for compatibility with Node 18+ features) and install dependencies (with caching for faster builds).
- **Build the package**: run our build script (`npm run build` which invokes Velite and the bundler as described above) to produce the latest content and bundle.
- **Publish preview**: run the pkg.pr.new CLI to publish the built package to the temporary registry.

For example, the core part of the workflow looks like this:

```yaml
on: [push, pull_request]
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm' # using pnpm for speed (adjust if using npm/yarn)
      - name: Install dependencies
        run: pnpm install
      - name: Build package
        run: pnpm build
      - name: Publish preview (pkg.pr.new)
        run: pnpx pkg-pr-new publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This uses the official pkg.pr.new CLI command `pkg-pr-new publish` to handle the publishing. **No configuration is needed** beyond this – pkg.pr.new infers the package name and version from your package.json and uses the commit info provided by GitHub. The only requirement is to have installed the **pkg.pr.new GitHub App** on your repository (granting it permission to publish previews for this repo). The workflow passes in the `GITHUB_TOKEN` (provided automatically by GitHub Actions) so that pkg.pr.new can authenticate the request. Once this runs, pkg.pr.new will comment on the pull request with a message about the preview (including install instructions and a one-click StackBlitz example if you configured templates).

**Security & Approvals:** By default, the above workflow publishes on every push, including commits to PRs. In public projects, you might want to restrict this to avoid running untrusted code. A recommended approach is to only publish when a PR is approved by a maintainer. For instance, you could trigger `pkg-pr-new publish` on the `pull_request_review` event for approved reviews (as shown in pkg.pr.new docs). This ensures that only vetted changes get distributed as preview packages. Adjust the workflow to suit your risk tolerance (for internal/private repos, publishing every commit may be fine).

**Official Releases (Optional):** The continuous preview releases do **not** replace regular versioned releases. For public packages, you will still want to occasionally publish an official version to NPM (or a private registry). You can integrate this by, for example, adding a separate workflow that runs on a Git tag or a manual trigger to run `npm publish` (with proper authentication). Tools like **pkg-pr.new** actually make the release process easier – you can gather feedback on changes via preview packages, then bump the version and publish once things are stable. We recommend using **semantic versioning** and maintaining a **changelog** for official releases. You can automate version bumps and changelog generation using conventional commit messages and tools like [Changesets](https://github.com/changesets/changesets) or [release-it](https://github.com/release-it/release-it) with a changelog plugin. This project’s workflow with pkg.pr.new complements that by handling interim builds; when you’re ready for an official release, you update the package version (e.g. via `npm version` or an automated script) and publish as usual.

## Installation and Usage (for Consumers)

If you are using this package (as a dependency in another project), you have two ways to install it:

- **Official release (from NPM):** Install the latest published version with the normal command, e.g. `npm i <package-name>` or add to your `package.json`. This will fetch the version from the NPM registry (for example, `"<package-name>": "^1.0.0"`). Then, in your code, import what you need from the package. For example, if this package is named `my-content-lib`, you might do:

  ```js
  import { posts } from 'my-content-lib'
  ```

  This gives you access to the content data processed by Velite. Each `post` in `posts` will have the fields defined by the schema (like `title`, `date`, etc.), and possibly a `content` field which could be an HTML string or MDX code string depending on configuration. If it’s MDX code, you can use a utility (provided or as in Velite docs) to render it as JSX. Alternatively, if the package exports React components directly (for example, a component that already encapsulates rendering the content), use those as documented.

- **Preview release (from pkg.pr.new):** If you want to test a version of this package from a specific commit or pull request (that hasn’t been officially released), you can install from the pkg.pr.new temporary registry. Use the URL format mentioned earlier. For example, to install the package from a commit with hash `abcdef0` on this repo, run:

  ```
  npm i https://pkg.pr.new/<your-org>/<repo-name>/<package-name>@abcdef0
  ```

  Or if testing a pull request number 5:

  ```
  npm i https://pkg.pr.new/<package-name>@5
  ```

  This will download the build artifact for that commit/PR. You don’t need any special setup – it works with npm/Yarn/PNPM directly. Keep in mind these preview packages are meant for testing; they might have an “0.0.0-<sha>” version or similar. You should not rely on a preview release for production, but it’s great for trying out the latest features or fixes.

**Using the Content Data:** Once installed, the usage of the content depends on how the package is structured:

- If the package exports the data collections (as in the above import example), you can directly use them. For instance, you can map over `posts` to generate blog pages, access `post.content` for the HTML/JSX content, etc. The data is plain JavaScript objects (with some fields possibly being strings of HTML or code).
- If the content is MDX and you have a code string, you can use a runtime function to render it. A simple approach (if not already provided by the package) is:

  ```jsx
  import * as ReactJSXRuntime from 'react/jsx-runtime'
  const mdxCode = posts[0].content // the function body string
  const mdxModule = new Function(String(mdxCode))({ ...ReactJSXRuntime })
  const ContentComponent = mdxModule.default
  // Now <ContentComponent /> will render the MDX content.
  ```

  The above is essentially what Velite suggests for rendering MDX. Our package might include a helper component (`<MDXContent code={...} />`) to abstract this. Check the package documentation (or source) for any utilities included for MDX.

## Getting Started (Development)

If you want to set up this project from scratch or modify it, here are the basic steps:

1. **Requirements:** Ensure you have Node.js 18 or newer (which supports ES module syntax and is compatible with our toolchain). Also install a package manager like PNPM (preferred for this template for speed) or Yarn/NPM.

2. **Install dependencies:** This project depends on **Velite** (for content processing) and **pkg-pr.new** (for preview publishing) among other things. After cloning or initializing the project, run `pnpm install` (or `npm install`) to install all dependencies. Key packages include `velite` and `pkg-pr-new` (the CLI tool) as devDependencies, plus any runtime deps your content or components need (React, etc., if applicable).

3. **Configure Velite:** Edit `velite.config.ts` to define your content collections and schema. Use the examples provided in this README (or Velite’s documentation) as a guide. Adjust the file patterns and schema fields to match your content. If you add new content types or directories, update the config accordingly. Velite will automatically pick up `.md`, `.mdx`, `.yaml/.yml`, `.json` files and process them if they match a collection pattern and schema.

4. **Add content files:** Put your Markdown/MDX files, YAML data files, etc., under the `content/` directory. For example, create `content/posts/hello.md` with some frontmatter and content to test. Make sure frontmatter keys align with what the Velite schema expects (otherwise, Velite will throw validation errors).

5. **Run a build locally:** Use `npm run build` to execute the build. This should generate the `.velite` folder with JSON and index, copy any static assets, and compile your code into `dist/`. Check the output to ensure everything looks correct (open the JSON files or import the package locally in a test script).

6. **Adjust package settings:** Update `package.json` fields like name, version, author, repository, etc. Ensure the `"type": "module"` field is set if using ESM. Also verify that the `files` or `exports` field includes the built outputs. For example, you might list `"dist"` and `".velite"` in `"files"` so that when you publish, those folders are included. If using TypeScript, make sure the `types` field points to your bundled `.d.ts` (which could include Velite’s types, possibly you’ll combine them or reference `.velite/index.d.ts`).

7. **Set up GitHub Actions:** The continuous release workflow should be in place (see `.github/workflows`). If you copied this from a template, double-check the workflow file name and triggers. Make sure the workflow uses the right package manager commands (e.g., if you prefer npm, change `pnpm install` to `npm install`, etc.). Also, verify that the `GITHUB_TOKEN` is being passed to `pkg-pr-new publish` step (as shown above).

8. **Install pkg.pr.new App:** Visit the **[pkg.pr.new GitHub App page](https://github.com/apps/pkg-pr-new)** and install it on your repository. You may need owner permissions to do this. Without the app, the `pkg-pr-new publish` command won’t be authorized to upload packages (the action will log an error if not installed). This app installation is a one-time setup.

9. **Push to GitHub and test:** Commit your changes and push to GitHub. Check the Actions tab to see the workflow run. If it succeeds, it should output a link or mention that a preview package was published. For a pull request, the pkg.pr.new bot typically leaves a comment with instructions. Try installing the preview package in another project by using the URL. It should fetch your built package. If something isn’t working (e.g., content not accessible, or missing files), revisit the build logs and configuration.

10. **Iterate and Release:** Continue adding content or code as needed. The CI will provide preview builds for testing. When you’re satisfied and ready to publish an official release, update the version (following semantic versioning). It’s good practice to generate a **CHANGELOG.md** (consider using a tool to automate this based on commit messages). Finally, publish to NPM (if public) using `npm publish` or through a release workflow. After publishing, users can install via the normal package name\@version, and you might remove older previews as they become superseded (pkg.pr.new’s registry is temporary, but it handles cleanup automatically).

For more detailed guidance, refer to Velite’s official documentation and examples, and the pkg.pr.new announcement blog for advanced usage of templates and other features. Happy coding!

---

**TODO.md**

- **Project Initialization:** Set up a new Node.js project with **ESM** support (Node 18+). Create a `package.json` (use `"type": "module"` for ESM) and install dev dependencies: `velite` (for content processing) and `pkg-pr-new` (for preview releases) along with any build tools (e.g., TypeScript, bundler) and runtime deps (React if MDX content uses React components, etc.).

- **Velite Config & Schema:** Create `velite.config.ts` (or `.js`) in the project root. Define collections for each content type you plan to include:

  - e.g. a `posts` collection for markdown/MDX files with YAML frontmatter.
  - Use Velite’s schema helpers (`s.object({...})`) to define frontmatter fields (strings, dates, slugs, etc.) and content transformations (`s.markdown()` for HTML, `s.mdx()` for MDX code, etc.).
  - Ensure each collection’s `pattern` matches the file locations (e.g. `'posts/*.mdx'`).
  - (Optional) Add additional collections for any structured data (YAML/JSON files) or other groupings as needed.

- **Content Files:** Create a `content/` directory structure that matches the config. Add sample files:

  - Markdown/MDX files with YAML frontmatter (keys like title, date, etc. as per schema) and some body content.
  - If using MDX, include JSX usage to test (and create the corresponding React components in the src folder).
  - If you want to include pure data files (YAML/JSON), add them (and include in Velite config as separate collection or load in code).
  - Add any media assets (images, etc.) referenced in frontmatter or content to verify Velite’s asset handling.

- **Source Code (ES Modules/Components):** Set up a `src/` folder for any JavaScript/TypeScript source code and React components:

  - Create components for any custom MDX elements (e.g., `Chart.jsx` if referenced in MDX).
  - Create an entry point (e.g., `src/index.ts`) that will export the content and components. For example, export Velite’s output: `export { posts } from '../.velite/index.js';` and also export any React components or utilities.
  - Ensure any types are handled (e.g., if using TypeScript, ensure `.d.ts` generation includes your component props and Velite data types).

- **Build Scripts:** Configure the build process:

  - Add a npm script in `package.json` for building, e.g. `"build": "velite && tsc"` or a script that runs Velite then your bundler.
  - Make sure Velite is invoked (e.g., `npx velite` or via API) **before** bundling so that the `.velite` output exists.
  - If using a bundler like [tsup](https://tsup.dev) or Rollup, configure it to include the content output. For instance, you might treat `.velite/index.js` as an external or bundle it in.
  - Test the build locally by running `npm run build`. Verify that:

    - `.velite/` is created with JSON and `index.js`/`index.d.ts`.
    - `dist/` (or equivalent) contains the final bundle (check that content data is accessible, and types are included).
    - Static assets are copied to `public/static` with hashed names (if applicable).

  - Add `.velite/` and any generated static asset directories to **.gitignore** (they are build artifacts).

- **Testing the Package:** Before setting up CI, do a manual test:

  - Use `npm pack` to create a `.tgz` of the package, then install that in a dummy project to ensure it works.
  - Or use `npm link` to link the package into a sample app and try importing the content and components.
  - If using MDX content, test rendering it with your components (simulate how an end-user would use your package).
  - Fix any issues (e.g., missing exports, incorrect paths in the bundle, etc.) and repeat until the package can be consumed as expected.

- **GitHub Actions – Continuous Preview Workflow:** Create a workflow file (e.g., `/.github/workflows/preview.yml`) to enable pkg.pr.new:

  - Trigger on relevant events (push to any branch, pull requests). For security on open-source, consider restricting to `pull_request` events and/or only after PR approval.
  - Steps:

    1. **Checkout** the repository (use actions/checkout).
    2. **Setup Node** (use actions/setup-node, specify Node 20 for example, and enable caching for `npm`/`yarn`/`pnpm`).
    3. **Install Dependencies** (e.g., `npm ci` or `pnpm install`).
    4. **Build** the project (run the build script to produce content and bundle).
    5. **Publish Preview** using pkg.pr.new CLI:

       - Run `npx pkg-pr-new publish` (or `pnpx pkg-pr-new publish` if using PNPM) with the `GITHUB_TOKEN` environment variable set (so the CLI can authenticate to GitHub).
       - (If the repository has multiple packages, specify the package directories as arguments, or use `--compact` if you want shorter URLs and have set up the repository field in package.json.)

    6. Optionally, add any notifications or status badges. pkg.pr.new can comment on PRs automatically; you can also add a badge in the README to indicate the project uses pkg.pr.new.

- **pkg.pr.new App Installation:** Go to **pkg.pr.new** GitHub App and install it on your repository (usually found at `github.com/apps/pkg-pr-new`). This is required for the GitHub Action to successfully publish preview packages. Without this, the `pkg-pr-new publish` step will fail (it needs app integration for permissions).

- **Verify CI Workflow:** Push a commit or open a PR to trigger the workflow. Monitor the Actions log:

  - Ensure the build passes (fix any build errors or content schema validation issues).
  - Check that the pkg.pr.new step outputs a confirmation or a link. For a PR, check that the bot commented with the preview link.
  - Try installing the preview package using the URL provided (in a test environment) to verify it includes the latest changes.

- **Versioning and Changelog:** Implement a strategy for versioning official releases and maintaining a changelog:

  - Decide on a versioning scheme (Semantic Versioning is standard).
  - Optionally use **Conventional Commits** style for commit messages to automatically generate release notes.
  - Set up a tool like [Changesets](https://github.com/changesets/changesets) or [release-it](https://github.com/release-it/release-it) with a changelog plugin to handle bumping the version and writing a **CHANGELOG.md** when you’re ready to publish.
  - Document this in the README so contributors know how releases are done (e.g., “run `npm run release` to cut a new version, which will tag and publish the package”).

- **Official Release Workflow (Optional):** If automating actual NPM releases, create a separate GitHub Action workflow (e.g., `release.yml`) triggered on tags or manual dispatch:

  - This workflow might run tests (if any), ensure the version is bumped, then use `npm publish` (with an npm token) or `yarn publish` to push to the NPM registry.
  - For private packages, you could publish to GitHub Packages or another private registry by configuring the registry in `.npmrc` and using the appropriate publish command.
  - Make sure to exclude the pkg.pr.new step from this workflow – that is only for previews. The release workflow deals with the real registry.

- **Documentation and Examples:** Write documentation for end-users of the package (most of this is covered in README.md). Provide examples of how to import and use the content or components in a project. If possible, set up a small demo or an example directory (you can even use pkg.pr.new’s **templates** feature to link StackBlitz examples).

  - E.g., you might include an `examples/` folder with a minimal project that consumes your package. This can double as a test to ensure everything works.
  - Update the README with any new features or usage tips as the project evolves.

- **QA and Iteration:** As you develop, continuously use the preview packages to test integration in real scenarios. Encourage others (or your team) to install specific preview builds when reviewing PRs or trying out new content. This fast feedback loop will help catch issues early.

  - If you encounter issues with pkg.pr.new (e.g., extremely large packages or private repo nuances), consult the [pkg.pr.new documentation](https://github.com/stackblitz-labs/pkg.pr.new) or community forums for troubleshooting.
  - Keep Velite up to date for improvements or bug fixes in content processing (check Velite’s releases).

- **Finalize for Production:** Before publishing a production version, double-check that all content is correctly packaged and that no sensitive or unnecessary files are included. Ensure the license and attribution are correct for any content. Then publish the official version and celebrate 🎉. Users can now benefit from both stable releases and on-demand previews of your package’s latest content and features.
