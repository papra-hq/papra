# Client devtools

Available only with `import.meta.env.DEV`. Open the bottom-center **Devtools** button; minimize the panel by clicking anywhere on its header or pressing Escape while focus is inside it. Tabs support keyboard navigation. Minimizing or switching tabs preserves tool state.

- **Documents** appears inside an organization. Generate 1–100 random TXT (default), Markdown, or CSV documents using the existing upload queue. Starting a batch minimizes devtools to reveal the import progress panel. Uploads are real unless demo mode is enabled.
- **Demo mode** saves `papra:dev:demo-mode` in local storage and reloads the page. The override only enables demo mode; `VITE_IS_DEMO_MODE=true` still takes precedence. Production ignores local overrides.

## Adding a tool

Keep each tool in a dedicated folder under `tools/`, with its helpers and tests colocated:

- `tools/demo-mode/`: demo mode toggle.
- `tools/document-generation/`: document generation tool, models, and tests.

Load its registration component from the relevant provider using a compile-time-gated dynamic import:

```tsx
const ExampleDevtool = import.meta.env.DEV
  ? lazy(async () =>
      import('@/modules/devtools/tools/example/example.devtool').then((mod) => ({
        default: mod.ExampleDevtool,
      })),
    )
  : null;

// Render inside the provider whose hooks the tool needs:
{
  ExampleDevtool && <ExampleDevtool />;
}
```

Register during component setup:

```tsx
import { useDevtools } from '../../devtools.context';

export function ExampleDevtool() {
  const { registerTool } = useDevtools();
  const scopedApi = useSomeProvider();

  registerTool({
    id: 'example', // Unique and stable; a new registration replaces the same ID.
    title: 'Example',
    icon: 'i-tabler-code',
    order: 10, // Optional, defaults to 0. Demo mode is 100.
    component: () => <ExampleTool api={scopedApi} />,
  });

  return null;
}
```

Registration automatically cleans up when its owning component unmounts; `registerTool` also returns an idempotent unregister function. Capture provider-specific hooks in the registration component and pass them to the tool: tab content renders under the global `DevtoolsProvider`, not the registering route. Pass reactive props through the component closure rather than copying their values.

Do not statically import devtools from production modules. Both the root provider and scoped registrations use `import.meta.env.DEV` so Vite removes their imports and implementation in production builds.
