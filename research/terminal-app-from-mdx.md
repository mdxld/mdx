# Structuring MDX for Interactive Terminal Apps with Ink

Building **interactive CLI applications** with MDX and [Ink](https://github.com/vadimdemedes/ink) is an emerging idea. MDX (Markdown + JSX) traditionally targets web content, but we can extend it to define terminal UIs. Below we explore architectural approaches to make MDX files drive Ink-based CLI apps – enabling navigation menus, forms, and CRUD workflows – and discuss how to execute inline TypeScript code blocks. We’ll propose syntax conventions and design patterns for structured flow and state management in MDX, and consider how to parse and run these files in a Node.js/Ink context.

## Overview: MDX Meets Ink in the Terminal Context

**MDX** lets us embed React/JSX in Markdown, which can be repurposed for CLI interfaces. The concept of **MDXE** (a “MDX Execute” CLI) suggests running MDX files as programs. The goal is to treat an MDX file as a self-contained CLI app description. The system already uses MDX in Next.js (web client/server), so adding a **terminal context** means compiling MDX to a React component and rendering it with Ink’s `render()` in Node. In fact, MDX content can be rendered in Ink by mapping HTML tags to Ink components. For example, an MDX heading can be rendered as an Ink `<Text bold>` for a bold title. This mapping provides the **foundation**: we can reuse MDX content across web and terminal by swapping out component implementations.

Key challenges and goals for the MDX-in-CLI design:

- **Structured Navigation:** Allow multi-step flows or screens (e.g. menus, subviews) within an MDX file.
- **Forms & Input:** Support interactive prompts, text inputs, selects, and confirmations to handle user input in the terminal.
- **CRUD Workflows:** Enable common app actions (list records, create/update entries, confirm deletions) with MDX-driven UI and logic.
- **Inline Logic (TS code):** Execute TypeScript code blocks in the MDX to perform data operations or side effects (e.g. database queries) as part of the flow.
- **Single-File Components:** Favor keeping UI structure and logic in one MDX file (with the option to import external helpers or components when needed).
- **State Management:** Provide patterns to manage state (current view, form data, fetched data, etc.) either implicitly or via React hooks.

Below we present two complementary approaches to structuring MDX for these needs, and discuss how to handle inline code execution. Each approach includes example MDX usage, pros/cons, and notes on implementation (parsing and runtime execution).

## **Approach 1:** Inline Ink Components with React State in MDX

The first approach treats the MDX file as a **React component** for the CLI. The MDX would directly use Ink components and React hooks to manage interactivity. This is the most flexible method, essentially writing a small Ink app within MDX.

**How it works:** You embed Ink’s components (or custom components wrapping Ink) directly in the MDX markup, and use hooks like `useState` or `useReducer` to handle state transitions. MDX supports importing and defining components/logic at the top of the file, so you can bring in Ink and any needed libraries. When the MDX is executed via the CLI runner, it is compiled to a React component, then `Ink.render(<MDXContent/>)` runs the interactive UI.

**Example structure (MDX snippet):**

```mdx
import { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import SelectInput from 'ink-select-input' // for menu selection
import TextInput from 'ink-text-input' // for free text input (if using a package)

// Define any helper components (could also import these):
function Keypress({ key, onPress }) {
// Uses Ink’s useInput to call onPress when `key` is pressed
const { useInput } = require('ink'); // require Ink's hooks
useInput((input, keyInfo) => {
if (keyInfo[key]) onPress();
});
return null;
}

export default function CLIApp() {
  // State for navigation and data
  const [view, setView] = useState('main');
  const [users, setUsers] = useState([]);

// Example: fetch users when entering the "list" view
useEffect(() => {
if (view === 'list') {
(async () => {
const data = await fetchUsersFromDB(); // assume defined or imported
setUsers(data);
})();
}
}, [view]);

// Render different content based on current view:
if (view === 'main') {
return (

<>
  <Text bold>🏠 Main Menu</Text>
  <SelectInput
    items={[
      { label: 'List Users', value: 'list' },
      { label: 'Add User', value: 'add' },
      { label: 'Exit', value: 'exit' },
    ]}
    onSelect={(item) => {
      if (item.value === 'exit') {
        const { exit } = require('ink')
        exit() // terminate app
      } else {
        setView(item.value)
      }
    }}
  />
</>
); }

if (view === 'list') {
return (

<>
  <Text bold>👥 User List</Text>
  {users.length === 0 ? <Text>(No users found)</Text> : users.map((u) => <Text key={u.id}>- {u.name}</Text>)}
  <Text color='cyan'>Press Q to return to menu</Text>
  <Keypress key='q' onPress={() => setView('main')} />
</>
); }

if (view === 'add') {
// Simple form example with one field:
const [name, setName] = useState('');
return (

<>
  <Text bold>➕ Add New User</Text>
  <Box>
    <Text>Name: </Text>
    <TextInput
      value={name}
      onChange={setName}
      onSubmit={() => {
        createUserInDB(name) // e.g. call DB or API
        setView('main')
      }}
    />
  </Box>
  <Text dimColor={true}>Type a name and press Enter to submit. Press Esc to cancel.</Text>
  <Keypress key='escape' onPress={() => setView('main')} />
</>
); }

return null;
}
```

In this MDX example, we directly use Ink primitives (`<Text>`, `<Box>`, etc.) and third-party Ink components (`ink-select-input`, `ink-text-input`) for interactivity. We manage a `view` state to handle navigation between “main menu”, “list users”, and “add user” screens. The JSX syntax is embedded right in MDX (after the import statements), treating the MDX file like a JSX/TSX file. This leverages MDX’s core capability: _MDX compiles to a single React component that can include hooks and conditional rendering._ The example above is essentially how one would write a React Ink app, just stored in an MDX file.

**How the CLI runs it:** The MDX would be processed (e.g. via `@mdx-js/mdx` or MDXE’s processor) into a JS module. The CLI tool then does something akin to:

```js
import { render } from 'ink'
import CLIApp from './app.mdx' // the compiled MDX component
render(
  <CLIApp
    components={
      {
        /* mapping if needed */
      }
    }
  />,
)
```

(If using standard Markdown elements in MDX, we supply a mapping of them to Ink components. In the above example, we mostly used custom JSX, but if the MDX had Markdown headings or paragraphs, we’d map them to `<Text>` as shown in MDX docs).

**Pros of Inline Component approach:**

- _Familiar React pattern:_ Developers can use React hooks, component composition, and the Ink component ecosystem directly. It’s straightforward to implement navigation by maintaining state and conditionally rendering views.
- _Fine-grained control:_ Each interactive element (menu, input, etc.) can be customized or replaced with a different Ink component or logic. Complex flows can be handled with arbitrary JavaScript logic.
- _Immediate execution model:_ This doesn’t require a special parser beyond MDX itself – the MDX is just JSX under the hood. TypeScript code in these sections gets compiled and runs as part of the component’s logic (ensuring type safety if the project is set up with TS).
- _Reusability:_ You can import external modules for heavy lifting (database, APIs) or UI components (for example, using a library like `ink-form` for multi-field forms). The MDX can serve as an orchestration layer gluing these pieces together.

**Cons / Challenges:**

- _MDX verbosity:_ The MDX file starts to look like a .jsx file with a lot of code. The markdown flavor is diminished. For non-developers or simple docs, this might be hard to write. We lose some “declarative” simplicity MDX is known for.
- _Manual state wiring:_ The author must manually manage `useState` and handle navigation events. In larger CLI apps, this can get complicated (lots of conditional blocks or nested components for different modes).
- _Hooks in MDX quirks:_ Using hooks in MDX requires that they are in the MDX component’s body or in a component defined in MDX. MDX doesn’t allow top-level hook calls in the markup itself; thus we either define an `export default function` (as in the example) or define a wrapper component inside MDX. This is doable, but authors must be comfortable structuring MDX as a component.
- _Side-effects in render:_ Care must be taken not to perform side-effects (like `setState` or I/O) directly during rendering. Instead, use `useEffect` or callbacks (as shown with fetching users). Improper use could cause React warnings (e.g., updating state during render). The approach demands understanding of React’s lifecycle even in MDX.

**Parsing & Execution notes:** This approach doesn’t need a **custom MDX parser extension** per se – the author writes MDX that is already valid (since MDX 2 supports ESM import/exports and JSX). The MDX compiler will output a React component with all the logic. We just need to ensure the CLI can import/execute it. For Next.js integration, MDXE could treat `.mdx` files in a “terminal” directory differently, or we use a flag/frontmatter to know this MDX is for CLI. But essentially, _parsing = MDX compile_, and _execution = Ink render_. No additional AST transformations are strictly required (except maybe to handle code fences, which we cover next).

## **Approach 2:** Declarative Screens and Flows in MDX

The second approach introduces higher-level **MDX conventions for screens, navigation, and flow control**. Instead of writing explicit hook logic for navigation as above, the MDX author could use custom MDX components or syntax to declare the structure of the CLI app (pages, menus, etc.), and let the runtime handle the state transitions. This is akin to treating the MDX like a mini “declarative UI flow” language.

**How it works:** We define special MDX components/tags such as `<Screen>` (to denote a screen/view in the CLI), `<Menu>` (to render a list of navigable options), `<Form>` (to gather inputs), etc. The MDX file becomes a series of these semantic components. A runtime system (likely a wrapper around the MDX content) manages which `<Screen>` is currently active and provides navigation functions to the children components.

For example, we might design the MDX like this:

````mdx
import { Screen, Screens, Menu, Form, Text, ItemList } from 'cli-components'
// (Assume cli-components is a library providing Ink bindings for these abstractions)

<Screens initial="main">  {/* Container to manage current screen state */}
  
  <Screen name="main">
    # 🏠 Welcome to AdminCLI

    Use the arrow keys and Enter to choose an option:
    <Menu options={[
        { label: 'List Users', value: 'list' },
        { label: 'Add User', value: 'add' },
        { label: 'Exit', value: 'exit' }
      ]}
      onSelect={(option) => {
        if(option.value === 'exit') option.exit();  // special handling to quit
        else option.go(option.value);               // navigate to the screen by name
      }}
    />

  </Screen>
  
  <Screen name="list">
    # 👥 User Directory

    ```ts
    const users = await fetchUsersFromDB();
    return users;  // returning a value could make it available to the UI below
    ```

    <ItemList items={users} itemProp="name" />
    <Text dimColor>{users.length} users found. Press Esc to go back.</Text>
    <Menu options={[ {label: '↩ Back to Main', value: 'main'} ]}
          onSelect={(opt) => opt.go(opt.value)} />

  </Screen>
  
  <Screen name="add">
    # ➕ Create New User

    <Form onSubmit={(formData) => {
            createUserInDB(formData);  // save new user
            formData.go('main');       // navigate back
         }}
         onCancel={() => form.cancel('main')} >
      <Form.Field name="name" label="Name:" type="text" validate={x => x ? true : "Name required"} />
      <Form.Field name="email" label="Email:" type="text" />
      <Form.Submit label="Create User" />
    </Form>

    <Text dimColor>Press Esc to cancel and return.</Text>

  </Screen>

</Screens>
````

**What’s happening here:** We use a `<Screens>` provider to wrap all our `<Screen>` definitions, with an `initial` screen (the starting point). Each `<Screen name="...">` component contains the MDX/JSX for that “page”. Within a screen, we can include standard Markdown (like the headings for titles) and specialized components:

- `<Menu>` displays a navigable list of options (using an Ink select input under the hood). Instead of manually managing state, it could accept an `onSelect` that gets passed a special object (`option`) with helpers like `option.go(screenName)` to jump to another screen, or `option.exit()` to quit. The `<Menu>` component might internally handle keyboard input and highlight, using Ink’s `<SelectInput>` but abstracting the details.
- We still allow inline code via ` ```ts ` blocks. In this example, inside the "list" screen, a code fence is used to fetch users. We imagine that the MDX runtime will execute this code when the screen is activated (likely by transforming this code block into a piece of logic that runs on mount). The code returns `users`, which we then use in the JSX below (perhaps the runtime injects the returned value into the component’s scope or provides it as a prop to `<ItemList>`). **Design detail:** A convention could be that if a code block is the first thing in a Screen, its exported symbols or returned value become available to that screen’s UI.
- `<ItemList>` is a hypothetical component to render a list of items (similar to mapping `users.map(u => <Text>...`). It could provide niceties like pagination or selection if needed, but here it’s just for display.
- `<Form>` abstracts a multi-field form. In the MDX, we declare fields and the form handles input focus, validation, and submission. In this case, on submit, we call `createUserInDB` (likely imported at top) and then navigate back to main. The form’s `onCancel` might be triggered by pressing Escape, which calls a provided `form.cancel('main')` to go back.
- The “back” navigation could also be done with a special component or by the `<Screens>` context capturing Esc globally. We show a `<Text>` instruction and assume Form or Menu will handle Esc by invoking `go('main')`.

This approach is **declarative** – the MDX reads more like a high-level outline of the app’s interface and flow, rather than low-level state handling. It’s similar to defining routes and pages in a router.

**Pros of Screen/Flow approach:**

- _Clear structure:_ It’s easy to see the available screens and their content. The MDX is organized by **sections**, which aligns with the idea of different CLI “pages” or modes.

- _Less boilerplate for navigation:_ The developer doesn’t have to write `useState` or event handlers for switching screens; the `<Screens>` container and its children coordinate that. This reduces potential for bugs in state handling and makes simple menu-driven apps very concise.

- _Reusability of flow components:_ Components like `<Menu>` or `<Form>` can be provided by the framework. They encapsulate common patterns (list selection, input prompts, etc.) so the MDX author only provides data (menu items, form fields) and a result handler. For instance, a `<Form>` component from an external library can handle multiple inputs easily (there is an `ink-form` library that provides a `<Form>` component and even an imperative `openForm` API).

- _Optional logic via code blocks:_ The author can drop in a TS code fence to perform some logic (data fetching, etc.) without wiring up an explicit `useEffect`. The system will execute it at the right time (e.g., when the screen becomes active) and make results available. This keeps data/logic close to the UI it influences, in a literate programming style.

- _Consistency:_ By using a defined syntax, it’s easier to parse and possibly to **visualize or analyze** the CLI flow. For example, one could write a tool to extract all screen names or to validate that all navigation targets exist, since the structure is declarative.

**Cons / Considerations:**

- _Learning curve for new conventions:_ This approach introduces a mini-DSL within MDX. The developer must learn how to use `<Screen>`, `<Menu>`, etc., and what properties or context are available (`option.go`, `form.cancel`, etc.). This is additional complexity on top of MDX/React knowledge.

- _Reduced flexibility:_ The predefined components handle things in an opinionated way. If a flow deviates from the supported pattern, you might need to drop down to the lower-level approach. For example, if you need highly dynamic screen logic (like conditionally generating a variable number of screens or menu options at runtime), the declarative approach might feel limiting unless the components support callbacks for generating children.

- _Implementation complexity:_ Under the hood, we must build these components and a navigation system. For example, `<Screens>` could use React context to store the current screen and provide a `go(screen)` function to children. Each `<Screen>` registers itself (or simply renders its children if active). This requires careful parsing or runtime handling:

  - We may implement `<Screens>` and `<Screen>` as real React components in the Ink context. The MDX compiler will treat them like any other components (they can be imported or globally provided). At runtime, `<Screens>` (a context provider) wraps all screens. It holds state (like `currentScreen` in a `useState`). It might also handle global key events (e.g., listen for Esc to go back or provide an `exit` function).
  - Each `<Screen>` component likely uses `useContext(ScreensContext)` to check if its `name` matches the current screen. If yes, it renders its children; if not, it returns `null` (so inactive screens don't show or execute their contents).
  - The `<Menu>` component uses `ink-select-input` internally to render the list and captures selection. Instead of the MDX author directly doing `setView`, `<Menu>` would call the `go()` function from context (passed via the `onSelect` callback or even implicitly if we integrate context in it). For example, when an item is selected, `<Menu>` can detect if the item’s value corresponds to a screen name and navigate there. We could allow `onSelect` override for custom logic, but also convenience like `value: 'exit'` being recognized as a special case to exit.
  - The TS code block execution needs to tie into this system. We’ll detail this separately below, but essentially a custom MDX remark plugin can transform those fences into something like `<CodeExec code={async function() { ... }} />` or into an IIFE that runs within a screen’s component. The execution should happen when the screen becomes active (e.g., in a `useEffect` inside `<Screen>` or when `<Screen>` first renders active content). The result can be stored in state or context and then used in the JSX. Implementing this means parsing the MDX AST for fenced code with language `ts` (and perhaps a special marker like `exec` or assuming all `ts` blocks are to run) and injecting the appropriate logic.

- _Performance:_ If there are many screens, we need to ensure we’re not rendering all at once. The context approach with `<Screen>` returning null for inactive ones helps. Also, code blocks should ideally not all run on startup – only when their screen is shown. We’d manage that via effects or lazy evaluation. This adds complexity (e.g., you might mount/unmount screens as user navigates, to re-run code on each entry or cache results).

**Parsing & Execution (Approach 2):** To support this in MDX, we likely need **MDX plugins or a custom loader**:

- A **remark plugin** can recognize our custom MDX components or directives. For instance, it might enforce that `<Screen>` can only appear as a top-level element under `<Screens>` (structure validation).

- For code fences, a plugin could transform \`\`\`\` `ts ` into a JSX element. Perhaps something like `<MDXCode code={"const users = …"} />`. Then we implement `<MDXCode>` in React to execute that code. Alternatively, transform the code into an inline function in the screen component. Example: If a screen contains only static JSX and a code block at top, we could transform it into a component that does:

  ```jsx
  // Pseudo-generated code for Screen "list"
  function Screen_list_Content() {
    const [data, setData] = useState();
    useEffect(() => {
      (async () => {
        // code from the fence
        const users = await fetchUsersFromDB();
        const __result = users;  // capturing returned value
        setData(__result);
      })();
    }, []);
    if (!data) return <Text color="yellow">Loading...</Text>;
    return (
       <><ItemList items={data} ... /> {/* rest of screen JSX */} </>
    );
  }
  ```

  Then `<Screen name="list">` could render `<Screen_list_Content/>` when active. This dynamic compilation is complex but feasible. A simpler implementation is to have a provided `<Execute>` component: e.g., MDX turns \`\`\`ts into `<Execute code={async () => { ... }} resultName="users" />`. The `<Execute>` component (to be provided in scope) runs the code (via `useEffect`) and puts the result into context or a variable that subsequent components (like `<ItemList>`) can access (perhaps via rendering children as a function with the result).

- **MDX provider mapping:** We can also map standard markdown to Ink. If the MDX author uses headings (`#`, `##`) or lists (`- item`), those will by default render as HTML tags. In our CLI, we should map them to `<Text>` or other Ink components. E.g., map `h1` to `<Text bold>`, paragraphs to `<Text>`, lists maybe to some bullet component. MDX’s `components` prop or MDXProvider can do this at runtime.

- **Frontmatter or directives:** Optionally, use MDX frontmatter to configure CLI behavior (for example, frontmatter could declare `terminal: true` or some metadata like title of the app, which screen to start with, etc. MDXE already supports frontmatter extraction which could carry such config). This isn't strictly needed if we have a `<Screens initial="...">` as shown.

**Example MDX Code vs. Generated Behavior:** To make this concrete, consider what the MDX above would translate to at runtime:

- The CLI dev runs `mdxe admin-dashboard.mdx` (for instance). The MDX is compiled and then executed.
- When run, it renders `<Screens initial="main">` which internally might call `useState('main')` for current screen = "main". It renders its children (the Screen components).
- Each `<Screen name="X">` likely registers itself or just renders conditionally. Implementation idea: `<Screens>` could use `Children.map` to clone each child `<Screen>` and pass a prop like `active={screenName === currentScreen}`. Or simpler, each `<Screen>` reads context: `const {currentScreen, go, exit} = useContext(ScreenCtx)`. Then it does `return currentScreen === name ? children : null`.
- On startup, currentScreen = "main", so `<Screen name="main">` will render its content. The others return null (so “list” and “add” content is not shown or executed).
- The “main” screen content shows the menu. The `<Menu>` component from `cli-components` renders an interactive list. When user selects "List Users", the onSelect calls `option.go('list')`. That `go` function comes from context and calls the context’s state setter to `currentScreen = 'list'`.
- That triggers a re-render of `<Screens>` provider and all `<Screen>` consumers. Now `<Screen name="main">` will return null (it’s inactive), and `<Screen name="list">` will render its content for the first time.
- Upon `<Screen name="list">` becoming active, we need the code block inside it to execute. If we implemented it via an effect in a component as described, it will now run (`fetchUsersFromDB()` happens). We might show a loading state during the async fetch. Once `users` are fetched, state is updated and the `<ItemList>` now receives the data to display.
- The user sees the list, then presses Escape. Perhaps our `<Screens>` context or the `<Menu>` inside “list” screen handles Esc: e.g., we could have a global `<Keypress key="escape" onPress={()=>go(initialScreen)} />` or specifically in each screen’s JSX as we did in Approach 1. If using the form or menu components, they could intercept Esc and call `go('main')` internally (or call `onCancel` prop). In our example, the `<Menu>` for back to main has an item, or the `<Text>` is just an instruction. Likely we would implement a global keyboard handler for Esc to navigate to a default (maybe previous screen or main).
- The screen switches back to main, etc. If "Add User" is selected, similar process: currentScreen becomes 'add', “add” screen renders with the `<Form>`. The `<Form>` component (provided by `cli-components` or `ink-form` library) will sequentially prompt for each field. It might render one field at a time or all fields at once with focus on the first. The MDX just lists fields. On Enter at the final field or hitting a submit button (not visible in CLI, so maybe pressing Enter on last field triggers submit), the `onSubmit` runs: we create the user in DB, then go back to main. Esc during the form triggers `onCancel`, navigating away without saving.

**Pros/Cons Summary:**

- **Approach 1 (Manual hooks in MDX):** _Pros:_ maximum flexibility (just React/Ink code), can handle any custom logic. _Cons:_ requires more coding in MDX, less structured, risk of mixing side-effects in render if not careful.
- **Approach 2 (Declarative MDX syntax):** _Pros:_ higher-level abstraction, cleaner MDX structure, easier to reuse patterns (menus, forms, etc.), and to parse flows. _Cons:_ needs custom MDX components and runtime, less flexible if the provided abstractions don’t cover a use case, added layer of “magic” for the developer to learn.

In practice, these approaches can be **combined**. The structured components can handle the common cases, and for one-off complex interactions, the developer can drop to raw Ink/React code within a screen. For example, within a `<Screen>` block you could still write a bit of inline JSX with your own hook logic if needed, or invoke a custom component.

## Executing TypeScript Code Blocks in MDX (Feasibility & Mechanics)

One of the key features to enable is the ability to include ` ```ts ` code fences in the MDX that **execute as part of the CLI app**, rather than just being displayed as literal code. This brings dynamic capabilities (data fetching, imperative logic) into the MDX content.

**Feasibility:** It is feasible by leveraging MDX’s compiler or runtime to intercept code blocks. A similar idea exists in other contexts: for example, the OCaml community’s `mdx` tool executes code blocks in Markdown to ensure documentation stays up-to-date. In our case, since the MDX is being compiled to a React component in Node, we can actually _execute JavaScript/TypeScript during rendering or in effects_.

However, directly executing code during render is tricky (should be free of side-effects). So the **mechanics** would likely involve transforming code blocks into functions that run at appropriate times:

- We can use an MDX **remark plugin** to find fenced code with language "ts". We might add a custom fence flag like ` ```ts exec` or some metadata (\`\`\`\`ts {exec=true}\`\`\`) to clearly mark it for execution (drawing inspiration from a proposed `render=true` flag in MDX discussions). For simplicity, it could assume any triple-backtick TS block in a terminal MDX is meant to run.

- The plugin could replace that AST node with an MDX JSX element. For example, replace the code fence with:

  ```jsx
  <RunCode>{`const users = await fetchUsersFromDB(); return users;`}</RunCode>
  ```

  Here `<RunCode>` is a React component we provide in the runtime.

- `<RunCode>` component’s implementation (in Ink/Node context) would do something like:

  ```ts
  function RunCode({ children }) {
    const codeString = children;  // the code as a string
    const [result, setResult] = useState();
    const [error, setError] = useState(null);
    useEffect(() => {
      let isMounted = true;
      (async () => {
        try {
          // Option 1: use Function constructor to create a function in current scope
          const asyncFn = Object.getPrototypeOf(async function(){}).constructor(
            '"use strict";' + codeString
          );
          const res = await asyncFn.call({});  // call with empty context or a context object
          if (isMounted) setResult(res);
        } catch (err) {
          if (isMounted) setError(err);
        }
      })();
      return () => { isMounted = false; };
    }, []);
    if (error) {
      return <Text color="red">Error: {error.message}</Text>;
    }
    // While loading, maybe show nothing or a placeholder
    if (result === undefined) {
      return <Text color="yellow">Loading...</Text>;
    }
    // If result is a React element, render it; if it's a primitive, stringify it
    return (typeof result === 'string' || typeof result === 'number' || result === null)
      ? <Text>{String(result)}</Text>
      : result;
  }
  ```

  This pseudo-code shows an approach: we create an **async function** from the code string and execute it. This allows use of `await` inside the code block as written. We capture the result (if any). If the result is a React element (e.g., the code returns `<Text>Something</Text>`), we can render it directly; if it’s data, we might just store it. More typically, we expect the code to produce data (object/array) that the MDX will use by reference. But since the MDX file is ultimately one component, scope sharing is a consideration:

  - If the code defines variables (like `const users = [...]`), how do later JSX access `users`? If the plugin simply inlined the code into an effect, those variables might be out of scope in JSX. We could work around by attaching to a global state object or context. For instance, we could have `<RunCode>` insert the result into a context accessible via a hook (`useCodeResult(id)`).
  - Alternatively, the plugin could hoist the code outside the JSX return. For example, transform the code fence into something like:

    ```jsx
    {
      ;(() => {
        /* code here */
      })()
    }
    ```

    which immediately executes. But immediate execution would be during render – not good for async or side-effects (and React would disallow a state update in render). So that’s not ideal for anything but pure computations.

  - A better pattern is to let `<RunCode>` handle it with `useEffect` as above, then use the `result`. We could allow `<RunCode>` to have children as a render-prop: e.g. `<RunCode code={...}>{(res) => <ItemList items={res}/>}</RunCode>`. Then it calls the child function when result is ready. This avoids global state. The MDX might then wrap the code and usage together, but that complicates MDX authoring.

  Given complexity, a simpler approach: **restrict how code blocks can be used**. For instance, decide that code blocks will typically be used at the start of a screen or section to fetch data, and that the code returns data that populates a variable (like `users`). We can then instruct authors to use a specific pattern: “always `return` the value at end of the block.” The framework can capture that return value and inject it in a known place (like as a prop to the Screen’s children or in a context accessible by a hook or by a special MDX expression). For example, maybe we provide a hook `useCodeResult()` that returns the last executed code block’s result within that screen. This is design territory requiring careful thought.

- Another strategy is **compiling MDX to a sequence** rather than one component. For example, treat MDX as a series of segments: content segments (Markdown to text) and code segments. A linear CLI runner could alternate between printing content and executing code imperatively. But this sequential model doesn’t fit well with interactive UIs that stay alive (it’s more for scripts). So we likely prefer the React component model described.

In summary, executing TS in MDX is possible but requires a custom mechanism:

- Use MDX plugins to transform fenced code into executable forms (like wrapping in a component or injecting into the component’s function body in an effect).
- Provide runtime support to actually run the code in Node (using `eval`, `Function()`, or importing a TS compiler/transpiler if needed – although MDX compilation likely already transpiled the code to JS if using an MDX -> JS pipeline).
- Ensure **scoping**: code blocks might need access to variables (e.g., an imported DB client, or props). Using `Function` as above with `"use strict";` ensures it runs in an isolated scope by default. We might want to inject some globals (like making certain imports available without re-importing). MDXE allows remote imports in MDX, so an author could `import DB from 'db-lib'` at top and then use `DB` in the code fence. The execution function would need that in scope. One way is to use `asyncFn.call(context)` where `context` includes the imported symbols (we could create a context object capturing all variables in the module scope). MDX’s evaluation APIs (`@mdx-js/mdx` can evaluate with a given `scope` object) might assist here.
- Handle async properly: likely all code blocks should be treated as async functions so that `await` works. The CLI should perhaps show a spinner or at least not freeze. Ink apps run in a single event loop tick, but our `useEffect` approach above is fine – it runs the async code and re-renders when done.

**Recommendation:** Use of TS code blocks should be **targeted** for specific needs (like simple data retrieval or transformation). For complex logic, it might be cleaner to define a helper function and import it, or define it in an `export function` in MDX. For example, instead of a big code fence, one could do:

```mdx
export async function fetchUsers() {
  // complex logic here
  return await db.query(...);
}

{/* Later in JSX */}
{await fetchUsers()}
```

However, you can’t directly `await` in JSX without making the component async, which React doesn’t support yet (aside from experimental Suspense for data fetching). So we still end up needing an effect or Suspense. A potential future is using React’s concurrent features (if Node Ink supports Suspense) to suspend while loading data. That may be beyond current Ink capabilities.

For now, a **pragmatic design** is:

- Mark code fences with a flag, transform them into a component call (`<Execute>` or `<RunCode>`).
- That component uses `useEffect` to run the code on mount and possibly stores result in a context or state.
- The MDX author can then use a special variable or context hook to get the result. Or the `<Execute>` component itself could render something (maybe it could take a render function as children as noted).

**Example with Execute component usage:**

```mdx
<Execute
  code={async () => {
    const users = await fetchUsersFromDB()
    return users
  }}
>
  {(users) => (
    <>
      {users.length === 0 ? <Text>No users.</Text> : <ItemList items={users} />}
      <Text dimColor>{users.length} total.</Text>
    </>
  )}
</Execute>
```

Here, `<Execute>` runs the code, then calls the child function with the result once ready. This pattern keeps code and UI together in MDX while clearly separating the asynchronous part.

**Pros of enabling code fences:**

- Writers of MDX can embed logic without leaving the file, achieving a form of literate programming. This is great for quickly adding a data-driven section (e.g., fetch and display something).
- It keeps the flow linear in the source order – easier to follow than jumping between file and code.
- TypeScript in these blocks can be type-checked (if we run the MDX through a TS-aware pipeline) to catch errors at build time.

**Cons / Risks:**

- Security: If MDX files might come from untrusted sources, executing arbitrary code is dangerous. In our use case, likely the MDX is authored by the developer of the app, so it’s fine. But it’s worth noting.
- Error handling: We should ensure that exceptions in code blocks don’t crash the whole app without feedback. Wrapping in try/catch and displaying an error (as in the `<RunCode>` pseudo-code) is recommended so the CLI can show a message and perhaps allow navigation back instead of a stack trace.
- State & multiple runs: If a user navigates to a screen multiple times, do we re-run the code block each time or cache the result? This might be policy-driven. Often, one would refresh data on each entry, but maybe not if it’s expensive. We could allow a flag in code fence like `cache=true` to only run once. The implementation could then store the result in context and skip re-running if already done.
- Sequence of multiple code blocks: If a screen had more than one code block separated by text, they would execute likely in parallel (since all effects fire on mount). If order matters, that’s tricky. Possibly better to limit to one code block per screen or require the author to sequence manually (e.g., put second code inside a `.then` of first or inside the render function after first’s result).

Given these trade-offs, the approach is to support simple uses cleanly and defer complex logic to imported code if needed.

## Additional Considerations

**Using External Modules:** Both approaches allow importing external modules or components within MDX. This means you can leverage NPM packages for functionality (just ensure they work in Node). For instance, you might import a database client or an ORM to perform CRUD operations in a code block or hook. MDXE’s support for remote components hints that you could even import UI components from a URL. In a CLI app, you might import a pre-built `<Table>` component to nicely format a table of data, or a `<Confirm>` component to ask yes/no questions. Inline definitions are great for custom logic, but don’t reinvent the wheel – e.g., the `ink-form` package provides a polished form UI out of the box which you could use instead of writing your own `<Form>`.

**State Management Patterns:** For larger apps, passing data between screens might become necessary (e.g., user selects an item in one screen, and the next screen needs that context). In Approach 2, we can incorporate state into the context – e.g., `<Screens>` could hold a context object that screens can read/write (similar to router params or a global store). Alternatively, since MDX is code, one could use something like Zustand or Redux by importing it, though that may be overkill. A simpler pattern is to have a top-level `AppState` object that code blocks or components modify. If needed, one could expose a custom hook `useAppState()` to get a global state object (persisted in a `useRef` inside `<Screens>` perhaps). This can facilitate CRUD flows (e.g., store the current record being edited, etc.).

**Parsing MDX for Terminal Use:** You might maintain separate MDX files for CLI vs web, or use combined ones with conditional logic. If combined, you could add a context check (like if running in Node vs browser) and render accordingly, but that complicates things. It’s cleaner to have MDX files dedicated to CLI interface (possibly in a specific folder or with a naming scheme). The build system (Next.js with MDXE) can detect those and compile them appropriately. For example, Next.js integration of MDXE might allow exporting a page that also runs in CLI – but likely we treat it as a separate entry point.

To parse MDX with custom syntax (like our `<Screen>`), the MDX compiler needs to know about these components. Usually, unknown JSX tags in MDX will be left as is and expected to be provided at runtime. So simply importing or injecting these components into MDX scope is enough for it to compile. If we want more than basic parsing (like transforming code fences), we implement remark plugins in the MDX compilation pipeline. MDX is built on remark/rehype (Unified), so we can hook in at the markdown AST level for code blocks, or at the MDX JSX level if needed.

**Pros/Cons Recap in Context:**

- Using MDX as a React/Ink component (Approach 1) gives full power but relies on the developer to manage the UI flow. This is essentially manually doing what frameworks like Pastel (for Ink) do with state and components. The **upside** is that anything possible in Ink is possible in MDX. The **downside** is it’s not much simpler than writing a .jsx file, aside from maybe some Markdown formatting for text.

- Introducing a structured syntax (Approach 2) can greatly simplify common app structures like dashboards or wizards. It aligns with how one might describe an interface in documentation: you list screens and what’s on them. The system then **auto-wires** the navigation. The developer focuses on **what** happens, not the plumbing of state. The trade-off is the complexity moved into the framework implementation.

In practice, a hybrid approach might emerge: MDX could allow **imperative escape hatches** (like an `MDX.run()` function or the `<Execute>` component for custom code) within a primarily declarative structure. This way we handle 90% of use cases with easy syntax and still support the 10% advanced cases.

## Recommendations for Implementation

1. **Leverage MDX compilation**: Continue using MDX to compile files to JS. Extend it with a plugin to handle code fences marked for execution. Ensure the Next.js/MDXE setup can output a Node-friendly bundle (perhaps using ESM that Node can import or bundling the MDX into the CLI binary).
2. **Create a CLI runtime wrapper**: Develop a small runtime library (e.g. `cli-components` as hypothesized) that exports components like `<Screens>`, `<Screen>`, `<Menu>`, `<Form>`, etc., and utilities like `<Execute>` for code. This library wraps Ink components and exposes a simpler API to MDX authors.
3. **Design MDX conventions**: Document how to write MDX for CLI. For example:

   - Always start with a `<Screens initial="...">` wrapper (or the tool might implicitly wrap the MDX content with one if not present).
   - Use one `<Screen>` per “page”, give it a unique `name`.
   - Use Markdown inside screens for text content and headings; use `<Menu>` for navigation options.
   - Use `<Form>` for multi-step input and `<Execute>` or code fences for running logic.
   - Possibly allow an MDX frontmatter to declare global settings (app name, maybe description, or needed permissions, etc.).

4. **Ink component mapping**: Provide default mappings for basic tags so Markdown renders nicely in terminal. (E.g., `*italic*` or **bold** in MDX should perhaps translate to colored or styled text in Ink – could map markdown emphasis to `Text italic` or so. This may require using `remark-gfm` for MD syntax and then customizing render).
5. **Testing interactivity**: Ensure that interactive components like `<SelectInput>` (used in `<Menu>`) and `<TextInput>` (in `<Form>`) work together. One challenge in Ink is handling multiple input components at once. The design might need the form to only mount one field at a time or use a custom input manager (the `ink-text-input` docs note how to manage focus when multiple inputs exist).
6. **Error and exit handling**: Provide a straightforward way to exit (maybe a built-in "Exit" menu item that calls `process.exit()` or Ink’s `useApp().exit()`). Also catch errors from code execution and display them without blowing up the whole app.
7. **Prospective features**: If the MDX-to-CLI concept grows, you could incorporate features like:

   - **Routing logic**: conditional navigation (like go to different screen based on a condition in code result).
   - **State persistence**: maybe store some state between runs or sessions (less likely needed for ephemeral CLI tools, but maybe for long-running daemon UIs).
   - **UI theming**: since it’s MDX, one could allow styling via props (Ink supports color, etc.). Possibly allow theme objects or styling props on the custom components (e.g., `<Screen style={{borderColor:'green'}}>` if we implement borders around screens).

In conclusion, **structuring MDX for a terminal app** involves deciding between a raw React approach or a higher-level DSL approach – or a mix of both. A recommended path is to implement the core navigation context (`Screens`/`Screen`) and a few common interactive components, so authors can quickly scaffold CLI apps like “admin dashboards” with minimal code. They can declare screens and actions in MDX, and rely on the framework to handle user input and state. Inline TypeScript code blocks can be executed by transforming them into runtime calls, enabling MDX to not just _describe_ but also _execute_ logic (much like embedding serverless functions in the markdown). This fusion of **content, components, and code** in MDX could significantly streamline building text-based UIs, in the same spirit that MDX revolutionized writing interactive docs for the web.

By following these patterns, we can use MDX as a unified format to define UIs for web, server, _and now CLI_. The MDX file becomes a single source of truth for an app’s interface, whether it’s rendered in a browser or a terminal. With the approaches outlined above – and careful implementation of the parsing and runtime support – interactive terminal experiences (like CRUD admin tools or rich dashboards) can be authored with the same ease as writing a Markdown document, _powered by React Ink under the hood_.

**Sources:**

- MDX official docs – using MDX with Ink by mapping components.
- Christian Hansen, _Basic Navigation in Ink CLI apps_ – using state and `<SelectInput>` to switch views.
- MDXE project description – “CLI to evaluate and execute MDX files”.
- _Ink for interactive CLIs_ – Ink’s components and ecosystem (e.g., `ink-form` for forms).

Citations

mdx.org.ai/content/packages/mdxe.mdx at main · ai-primitives/mdx ...
https://github.com/ai-primitives/mdx.org.ai/blob/main/content/packages/mdxe.mdx

Getting started | MDX
https://mdxjs.com/docs/getting-started/

Creating a terminal application with ink + React + Typescript — An introduction | by Christian Hansen | Medium
https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8

GitHub - lukasbach/ink-form: Complex user-friendly form component for React Ink
https://github.com/lukasbach/ink-form

Creating a terminal application with ink + React + Typescript — An introduction | by Christian Hansen | Medium
https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8

GitHub - lukasbach/ink-form: Complex user-friendly form component for React Ink
https://github.com/lukasbach/ink-form
MDX Processing Features – MDXe
https://mdxe.js.org/features/mdx-processing

realworldocaml/mdx: Execute code blocks inside your documentation
https://github.com/realworldocaml/mdx

Introduce evaluated code block for JSX · Issue #17 · mdx-js/specification · GitHub
https://github.com/mdx-js/specification/issues/17
MDX Processing Features – MDXe
https://mdxe.js.org/features/mdx-processing

@mdx-js/mdx | MDX
https://mdxjs.com/packages/mdx/
MDX Processing Features – MDXe
https://mdxe.js.org/features/mdx-processing

vadimdemedes/ink-text-input: Text input component for Ink - GitHub
https://github.com/vadimdemedes/ink-text-input

Creating a terminal application with ink + React + Typescript — An introduction | by Christian Hansen | Medium
https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8

Introduction to MDX — How To Create Interactive Documentation.
https://medium.com/@techwritershub/introduction-to-mdx-how-to-create-interactive-documentation-d3fe5c5b6b23

Creating a terminal application with ink + React + Typescript — An introduction | by Christian Hansen | Medium
https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8

Creating a terminal application with ink + React + Typescript — An introduction | by Christian Hansen | Medium
https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8
