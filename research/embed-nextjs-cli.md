Got it. I’ll explore the best way to embed a modern Next.js app (using the app directory) into an NPM package with a CLI that exposes build, dev, and start commands. I’ll also look into strategies for supporting user-defined MDX components, Payload CMS integration, and examples of popular tools or packages that achieve similar functionality.

I’ll get back to you with a detailed overview of how to structure this and what best practices or examples exist.


# Embedding a Next.js 14+ App into an NPM Package (`mdxe`)

## Overview

The goal of **mdxe** is to package a complete Next.js application (using the new `app` directory structure introduced in Next.js 13+) into a reusable NPM module that developers can install and run via a CLI. This allows users to spin up a full-featured MDX-based site (with an embedded CMS) by simply installing a package, instead of copying boilerplate or “ejecting” project files. Key features include CLI commands to develop, build, and serve the app, integration with Payload CMS (with SQLite by default for dev), and extensibility for custom MDX components. This section details how to design the CLI, structure the Next.js app inside a package, handle the Payload CMS integration, allow MDX customizations, and ensure smooth build and deployment for both local and hosted environments.

## CLI Structure and Commands

To provide a good developer experience, `mdxe` should include a CLI tool (exposed via the package’s `bin` in **package.json**) with subcommands for common Next.js workflows. For example, the CLI might use a library like Commander or Yargs to implement commands such as `mdxe dev`, `mdxe build`, and `mdxe start`. These commands will essentially act as wrappers around Next.js CLI commands, similar to how Blitz.js (a framework built on Next) wraps Next’s commands in its CLI. In fact, Blitz’s `blitz dev` and `blitz start` were described as “super thin wrapper\[s] over Next CLI” that mainly load environment variables then call Next’s dev or start internally. We can adopt the same pattern:

* **`mdxe dev`** – Launches the Next.js development server (equivalent to `next dev`). This should enable hot-reloading, error overlays, etc., using Next’s built-in dev server. The CLI can spawn the Next dev process or invoke Next’s API with the appropriate parameters. (Blitz’s implementation simply spawned `next dev`, as noted in an RFC: *“blitz start should start the Next.js development server by spawning next dev”*.) We can do the same, but ensure it runs the *embedded* app.
* **`mdxe build`** – Executes a production build (equivalent to `next build`) to pre-render pages and bundle the app for production. It should output the optimized `.next` directory ready for serving.
* **`mdxe start`** – Starts the production server (equivalent to `next start`) to serve the built app. This will run a Node server that serves the pre-built Next application (requires that `mdxe build` was run first).

These commands can be summarized as:

| **CLI Command** | **Description**                                    | **Under the Hood**                    |
| --------------- | -------------------------------------------------- | ------------------------------------- |
| `mdxe dev`      | Run the app in development mode (hot reload, etc.) | Spawns `next dev` on the embedded app |
| `mdxe build`    | Build the app for production                       | Invokes `next build` for the app      |
| `mdxe start`    | Launch the app in production (after build)         | Runs `next start` (Node server)       |

**Implementing the CLI:** The CLI script (e.g. `mdxe.js`) would determine which command is called and execute the corresponding Next.js action. One straightforward approach is to use Node’s child\_process to spawn the Next.js CLI command. The Next.js CLI supports specifying a target directory for the app – for example, `next dev [directory]` will start a Next dev server for the given directory (defaults to current directory if not provided). We can take advantage of this by pointing it to the app bundled within our package. For instance, if the Next.js app lives inside the package (say under `dist/app` or similar), `mdxe dev` can run:

```js
const { spawn } = require('child_process');
spawn('next', ['dev', pathToEmbeddedApp], { stdio: 'inherit' });
```

Using the directory argument ensures Next runs **our** app code, not whatever is in the user’s current folder. This was the likely fix for a known issue where running a packaged Next app could fail with “Couldn’t find a `pages` directory” if it ran in the wrong working directory. By explicitly specifying the app’s path, we ensure Next finds the `app` directory in the package instead of looking in the current directory.

Alternatively, we could use Next’s Node API to start the server. Next.js can be imported as a module (`require('next')`) and called with options. For example, one can create a custom server:

```js
const next = require('next');
const app = next({ dev: true, dir: pathToEmbeddedApp });
await app.prepare();
// then use app.getRequestHandler() with a custom HTTP server if needed
```

However, since we want to leverage Next’s own server (especially in dev mode for HMR and in production for performance), using the CLI or Next’s internal CLI runner is simpler. Blitz and others have found it sufficient to spawn the Next CLI process. The mdxe CLI can also pass through any extra flags (like `--port` or `--turbo`) to the Next CLI as needed.

In summary, the CLI’s role is to delegate to Next.js commands in the context of the packaged app, plus perform any **additional setup** needed (for example, initializing the CMS or reading user config as described below). It should handle things like ensuring environment variables are loaded (e.g., from a `.env` file in the user’s project or provided via CLI flags), since the packaged app might rely on certain config (similar to how Blitz improved env loading before calling Next).

## Packaging the Next.js App in an NPM Module

The `mdxe` NPM package will contain a fully functional Next.js application under the hood. This includes: a Next.js `app` directory with all the necessary pages, API routes or route handlers, Next.js configuration, and any required assets or components (including default MDX components, styling, etc.). Essentially, the **package is the app**.

Some considerations for structuring the package:

* **Next.js App Directory**: Place the Next.js **`app/`** directory (and any supporting folders like `components/`, `lib/`, `public/`, etc.) inside the package. Next.js 13+ uses the `/app` router for file-based routing (replacing the older `/pages` directory). We will exclusively use the App Router to remain forward-compatible with Next 14+ and avoid legacy patterns. The package’s Next code should be kept up-to-date with the latest Next.js conventions to remain compatible over time (the App Router is the default in Next 13+ and Next 14, which we target).

* **Next Config**: Include a `next.config.js` or `next.config.mjs` in the package. This config can set up things like MDX support, any webpack/turbopack tweaks, and integrate the Payload CMS backend routes (discussed later). It should be prepared for Node ESM if needed (since Next 13/14 often require config to be ESM, especially when importing the Payload plugin). The config might use `experimental` flags suitable for our app and ensure no reliance on a `pages` dir.

* **Dependencies**: The package’s `package.json` needs to list `next`, `react`, `react-dom`, and other runtime dependencies (like Payload CMS, database adapters, MDX libraries, etc.). When a user installs `mdxe`, they’ll automatically get these dependencies. This is similar to how a Next.js project’s own package.json includes those dependencies. Here they are nested inside our package.

* **Binary Entry**: Add a `"bin"` field in `package.json` pointing to the CLI script (e.g., `"bin": { "mdxe": "bin/mdxe.js" }`). This makes `mdxe` available as a command when the package is installed globally or via `npx`. For example, a user can run `npx mdxe dev` after installing, or add `mdxe` to their dev dependencies and use `npx mdxe ...`. This design means the user does **not** need to scaffold a Next.js project or copy any files; the app runs directly from the installed module.

One challenge with packaging a Next app is making sure Next knows where to find its application files. By default, running `next dev` expects to find an `app` (or `pages`) directory in the current working directory. In our case, the app lives inside the npm package. To handle this, as mentioned in the CLI section, we will invoke Next with an explicit path. Next’s CLI supports a positional `[directory]` argument to specify “a directory in which to run the application”. We can pass the path to the `mdxe` package’s app folder. This way, the Next process uses the package’s files as the source.

Another approach is to change the working directory in the CLI script to the package’s directory before invoking Next. For example, the CLI could do `process.chdir(pathToPackageAppDir)` then spawn `next dev` without arguments. This would similarly trick Next into running the correct app. Either approach is viable; using the official directory argument is more explicit.

By encapsulating the Next.js project inside an npm module, we have to be mindful of module resolution and file access:

* The Next app can import its own code easily (since all of it is self-contained in the package).
* If the app needs to import user-defined components or content (like an MDX components file or other external modules the user installs), we need to ensure those can be resolved. Node’s module resolution will find modules in the user’s project `node_modules` if we initiate the process from there. Because the CLI is run in the user’s context, `require('some-user-lib')` from within our app might resolve to the user’s node\_modules. We may need to tweak resolution or document that users should install extra packages alongside `mdxe` if they intend to import them in MDX (more on this in the MDX section).
* Static assets or files that are part of the package (like default styles, or template MDX) should be bundled or accessible. Next will bundle anything imported or placed in `public/` automatically. That should work normally within the package.

One precedent for distributing a pre-built app via npm is **create-react-app’s** `react-scripts`, which hides configuration inside a package. However, `react-scripts` expects the user to actually create the project files. In our case, we distribute the actual runnable app. A closer precedent is perhaps **Nextra** (by Vercel), which is a Next.js-based docs theme distributed as a package. With Nextra, users install the package and then just write MDX files; they don’t write their own Next.js setup. Instead, they configure Next to use Nextra. Our approach is slightly different in that the Next.js setup is entirely within `mdxe`, but conceptually it’s similar — provide a ready-made app so users focus only on content/configuration.

**Keeping Up with Next.js**: Since `mdxe` targets “latest Next.js (14+)” and avoids older conventions, we should monitor Next.js releases for breaking changes. The integration needs to adapt if Next.js changes how apps are configured or if any APIs used (like MDX handling or the Payload integration) evolve. Notably, the Payload team experienced an issue with Next 14 compatibility for their integration package – they paused support for Next 14 in favor of a different approach. This is a reminder that when embedding Next, we should design in a way that is as future-proof as possible (using official APIs, and minimal hacks). Our use of the app router and official CLI arguments aligns with that goal.

## Running in Development vs Production

When running the app via the CLI, there are two main modes:

* **Development (CLI: `mdxe dev`)** – This should fire up the Next.js dev server on a local port (e.g., 3000 by default). In development, we also want to run the Payload CMS in development mode (likely with SQLite and no complex scaling). We can run the Payload server *within the same process* or as a separate child process. One approach is to integrate Payload with Next’s dev server so that visiting the admin routes works seamlessly (for example, proxying or routing to Payload’s admin panel). Another approach is simply to run Payload’s express server on a secondary port and perhaps have the Next app proxy requests. During development, simplicity is key: running `mdxe dev` could concurrently start two servers – Next.js (for the front-end and SSR) and Payload (for the CMS REST API and admin UI) – and output logs for both. The developer gets a fully functional environment with one command.

* **Production (CLI: `mdxe build` + `mdxe start`)** – In production, we’ll build the Next.js app first. This will compile all pages (potentially even statically pre-render MDX content if configured to do so) and bundle the front-end. We should also handle any build-time steps needed for Payload (like generating types or building the Payload admin UI bundle). After building, `mdxe start` should run the Next.js server in production mode. If Payload is integrated serverlessly (see next section), then `next start` alone might handle both front-end and CMS API. If not, we might need to also start the Payload server. Ideally, for simplicity in deployment, we would integrate Payload into the Next app so that only one process is needed. That integration is covered below.

Importantly, the application should also be able to run on platforms like **Vercel** (which expect a front-end app, typically running `next build` and deploying the output) or other Node hosts. To run on a platform like Vercel *without the CLI*, the user can treat `mdxe` as a dependency and use the standard Next.js commands. For example, a user could create a minimal project with just a `package.json` that depends on `mdxe` and perhaps a stub `next.config.mjs` to point to mdxe’s app (if needed). Then running `npm exec next build` (with appropriate config) could build the packaged app. However, a simpler method on Vercel is to define custom build and start commands. In Vercel’s project settings, one could set **Build Command**: `npm install && npx mdxe build` and **Start Command**: `npx mdxe start` (for self-hosted), or just rely on the output if using static export. Note that on Vercel’s managed platform (for Next.js), typically you don’t run `next start` – Vercel will deploy the pre-rendered pages and serverless functions. So for Vercel, it might suffice to run `mdxe build` in the build step and let it detect the `.next` output. We may need to ensure that the build output is in the expected location (the root `.next` directory). Since our build runs in the context of the package, Next might output `.next` inside our package folder. We might have to either configure `distDir` in `next.config` to output to a path Vercel expects, or adjust the build command to move the output. These are deployment details that can be solved with configuration. (In a worst-case scenario, we advise users to clone an example and deploy that, but the aim is to avoid such manual steps.)

**Standalone Next.js**: Next 13+ has an option to output a standalone server bundle, which packages the app and its Node modules for production deployment. We could leverage this to make deployment easier – the user could run `mdxe build --output=standalone` which would produce a standalone server bundle (in `.next/standalone`) containing the app and node\_modules. That bundle could be run with Node without needing the entire source code. This might simplify deploying `mdxe` on a Node host (just copy the standalone bundle and run it). It’s something to consider in build/deployment guidance.

## Integrating Payload CMS

**Payload CMS** will provide the backend for content and an admin UI. Embedding Payload means when a user runs `mdxe`, they also have a CMS running without separate setup. Here’s how we can approach this integration:

* **Including Payload**: The `mdxe` package will list `payload` as a dependency and include a Payload config. Typically, a Payload project has a `payload.config.ts` defining collections, admin options, etc. In `mdxe`, we can define some default collections (perhaps a collection for MDX pages/posts, and any others needed) and use Payload’s built-in admin UI. This config can live in the package, e.g. `cms/payload.config.ts`.

* **Database**: For local development convenience, we default to SQLite. Payload now officially supports SQLite via a Drizzle ORM adapter. We would include `@payloadcms/db-sqlite` in our dependencies and configure Payload to use it by default (with a file like `payload.db` in the project directory or memory). The Payload config’s `db` setting can point to SQLite in development. For production or advanced use, the user could set environment variables to use PostgreSQL or MongoDB. Payload supports Mongo via Mongoose and Postgres via another adapter. We can include those adapters (`@payloadcms/db-postgres` and `mongoose` for Mongo) as optional deps, or instruct users to install them if needed. Alternatively, `mdxe` can depend on all three official adapters so any database choice “just works”. The user might specify `DATABASE_URI` env var; our config can detect its protocol (`mongodb://` vs `postgres://`) and initialize the appropriate adapter.

* **Running Payload with Next**: There are two main ways to combine Payload with Next.js:

  1. **Separate Processes**: Run Payload’s server alongside Next’s. For example, Payload by default runs an Express server on some port, serving the REST API and Admin UI (usually at `/admin`). Next.js would run on another port for the front-end. We could proxy or simply instruct users that the admin interface is at `localhost:port/admin`. This is simple but in production it means managing two servers. It’s doable (the CLI can start both, or one can use process managers to start both). However, on serverless platforms like Vercel, this doesn’t work because you can’t run a separate persistent process easily.
  2. **Serverless Integration (Combined)**: Integrate Payload into the Next.js application itself, so that all requests are handled by a single Next app. The Payload team provided a package called **`@payloadcms/next-payload`** which essentially injects Payload routes into a Next app. It works by adding the Payload admin UI under Next’s `app` directory and wiring up API routes for Payload’s endpoints (Auth, collections CRUD, etc.) under Next’s API routes. In practice, `next-payload` provided a CLI to copy necessary files into the Next project (`npx next-payload install`) and a utility `withPayload` to modify `next.config.js`. Using this approach, running `next dev` or `next start` will also serve the Payload functionality: visiting `/admin` in the Next app actually renders the Payload admin (because the admin is bundled into the Next pages) and API calls to e.g. `/api/payload/[collection]` are handled by Payload’s handlers. This approach makes deployment to Vercel or similar possible (each Payload API route becomes a serverless function, and the admin UI is just another frontend page).

  The challenge: as of Payload 3.x, `@payloadcms/next-payload` had issues with Next 14, and the team decided to work on a more native integration (possibly making Payload itself run on Next’s runtime). By 2025, it’s likely this integration has improved or Payload 4.0 might be more Next-native. For our `mdxe` project, we can attempt to use the same concept: include the admin UI in the app and hook up the routes. We might not even need the `next-payload` package if we handle it ourselves in the package’s code: for example, we can create an `app/admin/` route (or whatever base path) that loads an `<iframe>` or a React component for the admin UI, or we mount a custom route handler in Next 13’s new Route Handlers (in the `app` directory) to forward requests to Payload.

Given that we want minimal fuss for the user, the **ideal** solution is to embed Payload **without requiring a separate server**. This likely means using approach (2). Concretely:

* We define in `next.config.mjs`: `withPayload` integration if possible, pointing to our `payload.config.js`. If `withPayload` (from `next-payload`) is unreliable on Next 14, we might adapt their approach manually.
* We add an `app/(admin)/layout.js` and `page.js` that serve as containers for Payload’s admin panel. A known method (from a community blog) is to use an `<iframe>` that points to the Payload admin route served by an internal server. For example, Atomic Object’s guide suggests creating a Next page that just iframes `src="/adm"` where the Payload admin is served. Alternatively, since we have access to Payload’s admin UI as a React component (Payload can render the admin in an Express app; perhaps it’s possible to directly mount it in a Next page), we might directly import Payload’s admin UI. But simplest is to let Payload run its own server internally.
* If not using an iframe, the `next-payload` approach was to *bundle* the admin app into Next. That likely uses Webpack to compile the admin panel (which is React-based) into the Next build. The `withPayload` helper would handle that. If that’s feasible, it’s the most seamless – the admin is just another Next route.

For the initial version, using an iframe might be acceptable: `mdxe` runs a Payload server on, say, port 3001, and Next’s admin page at `/admin` just iframes `http://localhost:3001/admin`. This gives a quick result (the user sees the admin UI in the Next app context). The downside is authentication might not share cookies across domains (if ports differ), so better to have same domain. A workaround is to proxy requests from Next to Payload. We could implement Next route handlers to catch all requests under `/admin` (or `/api/payload`) and forward them to an internal Payload instance (running in-memory).

An alternative that the Payload team hinted: “moving Payload fully to Next.js”. If that becomes reality, perhaps Payload could run completely as part of Next’s process (maybe using the Edge runtime or server actions). We should keep an eye on Payload’s updates. For now, we can achieve integration with known techniques.

**Database migrations and Admin authentication**: Since the CMS is embedded, we should provide CLI hooks to manage it. For example, Payload uses CLI commands like `payload migration` or an admin user seed. We might provide `mdxe cms:migrate` or automatically run migrations on startup (for SQLite especially, just ensure the schema is up to date). We also might allow configuration of an admin user (perhaps via env or an initial setup prompt) so that once `mdxe` is up, the user can log into the admin UI (Payload typically requires a user account in the `Users` collection).

**Summary of Payload integration options**:

* Use **`@payloadcms/next-payload`** if compatible: it injects admin UI into `/app` and API routes into Next API (pages/api). According to its README, it adds admin at `/admin` by default and provides `withPayload` for config. This would be the cleanest integration (single server) if it works on Next 14+. We’d cite their approach as inspiration: *“This package... allows Payload to be deployed seamlessly, serverless, within an existing NextJS project. It adds the Payload admin UI into the NextJS `/app` folder and adds all Payload endpoints into the `pages/api` folder.”*.
* If not using that, run Payload separately in dev and possibly use the **Local API** in production. Payload’s Local API means you can `import { initPayload } from 'payload'` and use it without HTTP. For example, in Next’s `getStaticProps` or `routeHandler`, we could initialize Payload (pointing it to our config and database) and directly call `payload.find()` or `payload.create()` as needed. This avoids needing HTTP for the front-end to get data. The admin UI, however, is a full React app needing to run – that either needs to be served somehow or foregone on serverless. Perhaps for serverless deployments, one could disable the admin UI and only use Payload’s data via API routes or server actions.

Given the complexity, a reasonable path is:

* Implement combined Next+Payload for Node deployments (dev and production on self-hosted) using the techniques above.
* Ensure that even if deployed to Vercel (where long-running Payload server isn’t possible), the site still *builds and runs* for content delivery (maybe using pre-rendered content or expecting an external Payload endpoint). We might note that the admin UI won’t function on Vercel’s static hosting, so authors should run locally to use the CMS, then deploy the generated output. This is similar to how static site generators work with headless CMS: content is edited on a separate CMS instance, and the site is built from that content.

In summary, **mdxe will embed Payload CMS** by either injecting it into the Next app or by running it in parallel, with a preference for a unified app for ease of use. We will default to **SQLite** for minimal setup (officially supported by Payload), and allow switching to Postgres/Mongo via env config. The admin UI will be accessible (likely at `/admin` route) so users can add/edit content. All of this happens without the user needing to manually set up a separate backend – it’s “batteries included.”

## Extending MDX with Custom Components

One of the core features of mdxe is letting users write content in **MDX** (Markdown with React components) and extend what MDX can do by providing custom components. The requirement is to allow users to define additional MDX components either by importing from other packages or by defining a local file (e.g., `mdx-components.js`) that merges with the default components.

**Default MDX Setup**: The Next.js app inside mdxe will be configured to support MDX out-of-the-box. We’ll use `@next/mdx` (the official Next MDX plugin) or the newer built-in MDX support in Next 13+ App Router. This means `.mdx` files can be part of the Next app (or we can use MDX as data, see content approaches below). We’ll also define a set of default MDX components – for example, maybe shortcodes like `<YouTube />` or stylized `<Alert />` blocks, etc., that are commonly useful in MDX content. These will be provided by mdxe so that content authors have a rich set of components to use in their markdown.

**User-provided MDX Components**: To allow customization, we can follow a pattern similar to **Nextra** (a Next.js MDX-based framework). Nextra allows a project to provide an `mdx-components.js` file at the root which exports a `useMDXComponents` function. This function returns a mapping of component names to React components, merging custom components with the theme’s defaults. We can adopt the same convention:

* If the user creates an `mdx-components.(js|ts|jsx|tsx)` in their project (i.e., the directory where they run `mdxe`), our app will detect and use it. For example, we might attempt `import userComponents from path.join(process.cwd(), "mdx-components.js")`. If it exists, we import it.

* The expected format is that the module exports a function `useMDXComponents(existingComponents)`. The user’s function should merge their components with whatever is passed in (which would be our default components). This is exactly what Nextra documents: *“The `mdx-components.js` file must export a single function named `useMDXComponents`... then you can merge components”*. For instance, Nextra’s example shows: `const themeComponents = getThemeComponents(); export function useMDXComponents(components) { return { ...themeComponents, ...components } }`. In our case, we will supply our default components as the “existingComponents” argument, and the user can spread them in and override or add new ones.

* We need to integrate this with Next’s MDX handling. In an App Router setup, MDX files can import a special context provider from `next/mdx`. Alternatively, Next might automatically use the exported `useMDXComponents` hook if it’s in scope. (Under the hood, MDX in React uses the `MDXProvider` or the newer context via `useMDXComponents` hook from `@mdx-js/react`.) We may need to wrap our MDX content rendering with a provider. Possibly, we can create a root layout or MDX layout that calls the user’s `useMDXComponents`. However, an easier method: leverage the **automatic merging** feature. For example, Nextra simply tells users to have that file; their framework likely ensures it’s imported so that Next’s MDX processing picks it up. We can do something similar: perhaps in our `next.config` we can alias some module to point to the user’s file.

One approach is:

* Provide a default `useMDXComponents` in our app that returns our default mapping.

* If a user file exists, import it and call the user’s `useMDXComponents` inside ours. For example:

  ```js
  import { useMDXComponents as userUseMDX } from 'user-mdx-components'; // pseudo import
  export function useMDXComponents(components) {
     let allComponents = { ...defaultComponents, ...components };
     if (userUseMDX) {
        allComponents = userUseMDX(allComponents);
     }
     return allComponents;
  }
  ```

  We’d have to ensure the `user-mdx-components` import resolves to the user’s file. We can achieve that by using a Webpack alias dynamically. Next config can define an alias like:

  ```js
  config.resolve.alias['user-mdx-components'] = path.resolve(process.cwd(), 'mdx-components.js');
  ```

  Then the above import will succeed if the file exists (or we conditionally set it if exists).

* Alternatively, instruct the user to import our defaults in their file and merge (like the Nextra example). That requires the user to write a little code, but it’s straightforward as shown above.

Using a file gives flexibility: users can write local React components (e.g., in the same file or imported from other local files) and include them in the mapping. They could also import component libraries (like say a charts library’s component) and add those. Because `mdxe` is installed in node\_modules, any additional packages the user installs (for example, `npm install some-chart-lib`) will reside alongside it. The Next app should be able to import them (especially if we don’t bundle everything into one, Next will resolve `require('some-chart-lib')` by climbing node\_modules, finding it in the user’s project).

Another extension point could be configuration via a config file (like `mdxe.config.js`) where users could specify the path to their MDX components file or even directly provide a mapping of component names to module imports. But that might overcomplicate things; using the conventional `mdx-components.js` file is simple and familiar to those who’ve used Nextra or MDX Deck, etc.

**MDX Content Workflows**: We should also consider how users will author MDX content:

* Possibly **local MDX files**: The user might write markdown/MDX files in a content directory. Since the Next app is inside the package, how will it see these files? We can handle this by treating the user’s content directory as external data. One way is to use **Contentlayer** or similar to load MDX from an arbitrary folder. Contentlayer can be configured to scan a folder for MDX files and provide them to Next as typed data. It essentially bridges the gap between content files and the Next app. For example, the mdxe app could include a Contentlayer config that says: look for `**/*.mdx` in `./content` (relative to project root), and define a schema (like type Post { title, body, ... } frontmatter). Then at build time, Contentlayer will read those files (from the user’s directory), and generate a JSON or JavaScript that the Next app can import. This way, our packaged app can have pages that import the generated content. This is a powerful approach because it allows writing MDX files without compiling them manually into the app. Contentlayer is optimized for Next and supports MDX well. If we don’t use Contentlayer, we could also use `next-mdx-remote` to load MDX at runtime. **`next-mdx-remote`** allows us to fetch an MDX string (e.g., from a file or CMS) at request time or build time, compile it to components, and render on the fly. The difference: Contentlayer processes at build time (good for mostly static content), next-mdx-remote can be used at runtime (good if content is truly dynamic or stored in a database). We might use a mix: for any MDX stored in Payload (if we allow that), next-mdx-remote would let us render it in SSR.

* Possibly **CMS-stored MDX**: Perhaps the Payload CMS is used to store some MDX content (for example, a “Posts” collection where each entry has an MDX field for the body). In that case, we’d retrieve the content via Payload’s API or local API and then need to render it. We could still use next-mdx-remote in `getServerSideProps` or a React server component to transform that MDX into React elements. The user’s custom MDX components should still apply in this scenario. We’d need to feed the same components map to the MDX renderer. (next-mdx-remote lets you pass a components object when rendering).

In summary, mdxe should allow an MDX content workflow where:

* The user can drop MDX files in a content directory (or use the CMS to create content) and those become pages or data for pages.
* The user can enhance the rendering of MDX by providing custom React components (via `mdx-components.js` or similar) which are merged with mdxe’s defaults, using the MDX context mechanism.
* They can import third-party components in MDX if needed (ensuring the packages are installed).

This pluggable MDX approach is similar to what many documentation tools provide. For instance, **Docusaurus** (while not Next-based) also allows swizzling or adding custom MDX components in markdown, and **Nextra** explicitly has the mdx-components file as described. We will emulate the Nextra strategy since it aligns well with Next.js App Router usage. The snippet from Nextra’s docs confirms the technique of merging components, which we can cite as a model.

## Similar Tools and Precedents

Several existing frameworks and tools attempt to simplify or enhance Next.js applications in ways relevant to `mdxe`. Understanding them can guide our design:

* **Blitz.js** – Blitz started as a full-stack framework on top of Next.js. In its early versions, Blitz essentially included a Next.js app plus additional conventions (like RPC-style APIs) and provided a CLI (`blitz dev`, `blitz build`, etc.). The Blitz CLI was, as mentioned, mostly a wrapper around Next’s CLI, plus some dev server enhancements. The important takeaway for us is how Blitz delivered a developer experience: you ran one command and both the front-end (Next) and backend (Blitz’s server, which was partly Next API routes) ran together. Blitz eventually moved to a “Toolkit” model, but its CLI approach is proven. We mirror Blitz’s idea of wrapping Next’s commands, and ensure environment variables (.env) are loaded consistently (Next.js now has built-in support for `.env.local`, etc., but our CLI can enforce loading order or custom env files if needed). Blitz also had code-generation features which are beyond our scope, but it shows an example of an **all-in-one Next-based app** distributed to developers.

* **Payload CMS + Next.js** – Payload (the headless CMS we integrate) is often used with Next.js, but typically as two separate services. The **`create-payload-app`** utility can scaffold a project with both Next and Payload configured (either separate or integrated). The **`@payloadcms/next-payload`** package (discussed earlier) is a direct parallel to what we want to do with mdxe’s CMS integration: it effectively *wraps a Next app around Payload*. Our scenario inverts that (we wrap Payload into our Next app), but conceptually it’s the same combined deployment. One key learning from `next-payload` is the method of installing into a Next project (they copy files into the app). We want to avoid copying files manually; instead we ship those files as part of mdxe. Another learning is the pitfalls: as noted in its README, Next 14 introduced issues with the approach. They decided to prioritize “moving Payload fully to Next.js” – essentially making Payload’s core run as part of Next. That suggests that by the time `mdxe` is being built, there may be new patterns available (perhaps official guidance from Payload for Next 14/15). We should stay updated with Payload’s releases. In any case, Payload gives us a rich example of a pluggable CMS in Node, and `mdxe` aims to leverage that power with minimal setup.

* **Nextra** – Nextra is a Next.js static site generator (by Vercel) that lets you build documentation or blogs using MDX files. It is distributed as an npm package (`nextra` and themes like `nextra-theme-docs`) that you install in your Next.js project, and then you mostly just write content. Nextra handles the page layout, MDX processing, and many components (callouts, code blocks, etc.). Users can override or extend components by providing an `mdx-components.js` file, exactly as we plan to do. The way Nextra is used is slightly different (you still run `next dev` on your project, with Nextra acting as a plugin). In our case, `mdxe` is both the plugin and the app itself. But we can definitely take inspiration from Nextra’s **pluggable MDX** approach and its **content convention**. For example, Nextra supports placing MDX files in a `content/` directory rather than `pages/` and uses a catch-all dynamic route to serve them. We could do something similar: our app could have a route like `[...slug].jsx` that fetches an MDX file from the content folder. Or utilize Contentlayer to generate those routes. Nextra 4 (recently released) is built on MDX v3 and App Router, which is directly relevant (we should review its techniques as they likely solved similar problems of merging user content with a packaged theme).

  In short, Nextra demonstrates how to **package a Next.js-based solution as a reusable module**, and how to let users inject content and components. We will apply those lessons to `mdxe` (citing Nextra’s use of `useMDXComponents` merging as an example of our method).

* **Documenso** – Documenso is an open-source DocuSign alternative. While not a documentation generator or MDX tool, it’s mentioned likely because it’s a self-hostable web application built with Next.js (the repository shows Nextauth and Next.js usage). Documenso provides a CLI or at least instructions to run its web app (they mention running `next start` in their docs). The relevance here is perhaps how to distribute a complex Next.js app for others to host. Documenso uses a monorepo with an `apps/web` Next.js project and likely expects users to clone or download the whole thing. We want to instead distribute our app via npm. This is somewhat uncommon for full Next apps, but our use-case is narrower (a documentation/blog site with CMS). We can mention that unlike typical apps (Documenso, or many SaaS starters) which require cloning the source, `mdxe` is designed to be used as a dependency. This makes updating easier (users can just bump the package version to get improvements, rather than manually pulling changes). It’s a bit like how some CLI tools like `gatsby-cli` or `create-react-app` encapsulate logic in a package so the user’s setup stays minimal.

* **Other MDX frameworks**: There are other MDX-based site generators such as *Docusaurus* (not Next.js, uses its own webpack setup), *Docz* (an older MDX doc tool, which used Gatsby in the past), and newer tools like *Astro’s Starlight* (Astro-based MDX docs). While these aren’t built on Next, they show patterns of component injection and content loading. For example, Docusaurus allows swizzling components and using React components in MDX by declaring them in MDX scope. Astro’s approach with MDX is also interesting but since `mdxe` is firmly tied to Next, we focus on Next-centric solutions.

* **Contentlayer** – As discussed, Contentlayer isn’t an end-user tool but a developer library that pairs with Next to simplify content loading. We anticipate possibly using it internally. Contentlayer essentially replaces having to manually write file system reading logic or using next-mdx-remote. It automatically generates TypeScript types for content and refreshes content on dev when files change. If we include it, it further enhances the developer experience for MDX content management. Contentlayer’s documentation notes that it was envisioned as *“the go-to tool for managing content in Next.js projects”* and compares itself favorably over lower-level utilities like next-mdx-remote by handling the entire pipeline (from source files to ready-to-use content). This aligns with `mdxe`’s need to incorporate user content without manual steps.

To summarize the comparisons: **mdxe is somewhat unique** in combining all these aspects (Next.js app + MDX + CMS in one package), but it stands on the shoulders of prior art:

* From **Blitz**, we take the idea of a CLI-managed Next.js app (wrapping Next’s dev/build/start commands).
* From **Payload**, we borrow the concept of embedding a Node.js CMS into a Next app (and we’ll leverage Payload’s own integration efforts).
* From **Nextra**, we learn how to structure MDX content and allow component injection via `mdx-components.js`.
* Tools like Nextra also show that staying up-to-date with Next’s changes (like the move to Turbopack, React Server Components, etc.) is crucial – our package must evolve with Next to avoid locking users into old tech.

By researching these, we reduce the risk of reinventing the wheel and can provide a robust solution from the start.

## Build and Deployment Considerations

Building and deploying an `mdxe` project (which is essentially the packaged app) has some special considerations due to its nature:

* **Installing and Running**: The simplest scenario is a local install. A user can create a directory, run `npm init -y` (to have a package.json), `npm install mdxe`, then run `npx mdxe dev`. This should spin up the dev server and they can start writing content (either in the CMS or in files). No extra config is required by default. If they want to customize MDX components or use a different database, they’d add a couple of files or env vars, but nothing drastic. Because the app lives in node\_modules, the user’s project remains very lean (just config and content). This is a big advantage but also unusual – typically Next expects its source at the project root. We’ve handled that via our CLI. We might document that using `npm install -g mdxe` allows a global usage (`mdxe dev` globally) for quick tries, though for a real project, a local install with a lockfile is better (so they pin a version).

* **Building for Production**: When the user is ready to deploy, they run `mdxe build`. This will produce a `.next` folder **inside the mdxe package directory** (since that’s the app’s location). We need to ensure the output can be served. If using `mdxe start` on the same machine, it knows where to find it (especially if we keep the working dir consistent or pass the dir to `next start`). However, if the user is deploying to a host like Vercel, we need the build output accessible. A potential approach is to configure `distDir` in next.config to point to a folder outside the package, e.g., something like `distDir: '../../.next'` (one level up from node\_modules). Next.js by default disallows setting distDir outside the project root for security, but perhaps since it’s our own package, we might not do that. Instead, instruct the user to run the build and then copy the `.next` from `node_modules/mdxe/.next` to the project root if needed. This is a bit clunky. Another approach: maybe we actually run the Next build with the current working directory set to a temporary path that contains symlinks to content and our app. For instance, create a temp dir, symlink `./app` to `node_modules/mdxe/app`, symlink `./public` similarly, symlink content in, then run `next build` there. This way `.next` ends up in that temp (which could be project root or easily zip-able). This is an implementation detail; from the user perspective it should just work. For deployment, we will document how to get the build output.

* **Deployment on Node Server**: If a user is self-hosting on their server, they can use `mdxe start` in a process manager (like pm2 or a systemd service). For example, Documenso’s docs show using `ExecStart=/usr/bin/next start -p 3500` in a service file. Similarly, one could do `ExecStart=npx mdxe start -p 3000`. Our CLI should accept `-p` (port) and other Next start flags and pass them through. We should also mention security: ensure environment variables for production (like `PAYLOAD_SECRET`, database URL, etc.) are set in the environment or a `.env` file is present in the working directory.

* **Deployment on Vercel**: As mentioned, it might require a custom build command. Because Vercel by default looks for a Next.js app in the repository, we have to slightly tweak the detection. One strategy: Create a stub `next.config.js` in the project root that simply re-exports the config from mdxe, and maybe a stub `app/page.js` that imports something from mdxe – basically trick Vercel into thinking there's a Next app (though all code is actually in mdxe). But this might confuse things. Instead, easiest is to use **“Ignore Build Step”** in Vercel (to prevent auto-detect) and explicitly define build. For example:

  * Set Build Command: `npm run build` (with a script that does `mdxe build`).
  * Set Output Directory: leave it default (expects `.next`).
  * Vercel will then run our build. We might need to ensure `.next` ends up at project root or tell Vercel where it is. Possibly setting `distDir` to `../../.next` is needed (not sure if Next allows that now). If not, we might have to copy after build.

  Another approach for Vercel: publish mdxe as a **template or example**, and users “clone” it on Vercel. But that defeats the no-clone philosophy. Still, for the initial users, providing an example repo (which basically just depends on mdxe and maybe has the config files and content folder) could be helpful. That repo can be one-click deployed to Vercel, demonstrating how it works. The user can then mostly edit content via the CMS.

* **Static Export**: If the use-case allows it (for example, a documentation site where all content is known at build time), `mdxe` could support `next export` to generate a purely static site. However, since we have a dynamic CMS, static export is not a primary goal. But if someone were to not use the CMS and only use MDX files, they could potentially `next export` to get static HTML files for hosting on any static server. We should keep this in mind and not use any Next features that absolutely require Node server (unless CMS is in use). Next’s static generation (SSG) could generate pages from MDX content at build, which is great for performance. The CMS aspect is what introduces server-side needs.

* **Compatibility and Versions**: We must ensure the package peer-dependents (React, etc.) align with the Next version. Also, when Next.js updates to 15, 16, etc., we should update mdxe and publish a new version. Ideally, users can upgrade by just updating the package. Since the user’s content and config is separate, upgrading should be painless (assuming no breaking changes in how MDX components are defined, etc.).

* **Code Examples**: Throughout our documentation, we should provide example usage. For instance, how to create an `mdx-components.js` (like the snippet from Nextra). Or an example of an MDX file using a custom component. Also, perhaps an example of the CLI usage in README format:

  ```bash
  # Install mdxe
  npm install mdxe

  # Add an MDX page (content/hello.mdx) and a custom component (MyChart.js)
  # Add mdx-components.js to map e.g. <Chart> to MyChart component.

  # Run in dev
  npx mdxe dev

  # Build for production
  npx mdxe build

  # Start in production
  npx mdxe start
  ```

  We would include such examples in documentation rather than the research report, but it helps to frame the guidance.

* **Testing**: Ensure that running the CLI in various scenarios (in an empty directory vs in a directory with an existing Next project) does not cause conflicts. If someone accidentally has a `pages/` folder in their current dir, our `next dev [path]` approach avoids it anyway. But if they had environment variables meant for another app, could conflict? Possibly isolate by prefixing ours with e.g. `MDXE_` if needed.

* **Ejecting**: Although we aim for no eject, some advanced users might eventually want to customize deeper (like adding new Next routes or altering webpack config beyond what we expose). We could consider an “eject” command that copies the app out of node\_modules into the user’s project so they have full control. But that’s beyond MVP. Still, it’s how CRA works (allowing eject if needed). We can table this idea as a future feature.

## Conclusion

Packaging a Next.js 14+ application into an npm module with a CLI is a cutting-edge approach that can greatly simplify app setup for end-users, at the cost of some engineering complexity in the package itself. By studying similar projects (Blitz for CLI, Payload for CMS integration, Nextra for MDX theming) and using Next.js’s own features (the App Router, MDX support, CLI options), we can design **mdxe** to be a powerful out-of-the-box tool.

In summary, **mdxe** will behave like a *“batteries-included” Next.js MDX platform*: users install it and get a Next.js app running with one command, complete with a headless CMS (Payload) and support for writing content in MDX. They can extend the content with React components easily and choose their database as needed. The CLI will abstract away Next.js internals (though under the hood it’s using `next dev/build/start` on our embedded app).

There are certainly challenges to overcome (module resolution, keeping in sync with Next releases, ensuring Payload runs smoothly inside Next, deployment nuances), but none are insurmountable given the current ecosystem. As a result of this research:

* We have a clear blueprint for the CLI commands and how they map to Next’s functionality (in fact leveraging Next’s own CLI abilities).
* We know how to structure the package so that Next’s app lives inside it and can be invoked from anywhere (using the directory argument to point to it).
* We have identified strategies to integrate Payload CMS either by embedding it via `next-payload` style or running it alongside, with a default SQLite setup for convenience (taking advantage of Payload’s support for SQLite databases via Drizzle).
* We will enable MDX component customization by merging user components with defaults, following a proven pattern from Nextra.
* We are aware of similar tools and will incorporate their best ideas while avoiding their pitfalls (for example, avoiding the Next 13 vs 14 issue that `next-payload` ran into by staying flexible).

By implementing these guidelines, `mdxe` can provide a **zero-config, extensible** MDX publishing platform on top of Next.js 14+, suitable for documentation sites, blogs, or any content-driven app where developers want the power of React/Next.js and an integrated CMS without the usual setup hassle. The outcome will be a well-structured project and CLI, ready for developers to adopt and for future maintenance as both Next.js and Payload evolve.

**Sources:**

* Next.js CLI Reference (on using `next dev/build/start` with a specified directory)
* Blitz.js CLI design (wrapping Next.js commands for dev/prod)
* Payload CMS integration with Next.js (the `next-payload` approach and Next 14 notes)
* Payload CMS database adapters (official support for Mongo, Postgres, SQLite)
* Nextra MDX components customization (using an `mdx-components.js` to merge default and user components)
* Contentlayer vs. next-mdx-remote (on loading MDX content from files for Next.js)
