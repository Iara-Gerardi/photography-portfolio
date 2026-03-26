# Component Refactor Practices

These practices are derived from the ZoomControls refactor. Use them as a checklist when refactoring any other component.

---

## 1. Component Structure

Every component directory follows this layout:

```
ComponentName/
  ComponentName.tsx      ← presentational, no logic
  types.ts               ← all TypeScript types for this component tree
  hooks/
    useComponentName.ts  ← all state, effects, handlers
  components/
    SubComponent.tsx     ← small, focused sub-components
```

**Before** touching any file, read it fully to understand what exists.

---

## 2. Hook Extraction Rule

Any logic that uses React (`useState`, `useEffect`, `useRef`, `useCallback`, store subscriptions, event handlers) must move to a dedicated hook file.

The component file should only contain:
- Destructuring from the hook
- JSX structure
- Tailwind class conditions (ternaries are fine)

```tsx
// ✅ Good
export function ZoomControls({ containerRef }: ZoomProps) {
  const { zoom, stepZoom, fitToScreen, canDecrease, canIncrease, inputProps } =
    useZoomControls(containerRef);
  return ( /* pure JSX */ );
}

// ❌ Bad — state and logic in the component
export function ZoomControls({ containerRef }: ZoomProps) {
  const [inputValue, setInputValue] = useState("100");
  const zoom = useCanvasStore(s => s.zoom);
  // ...handlers inline...
}
```

---

## 3. Styling: Tailwind Only

All visual styles go into Tailwind class strings. No inline `style` objects except for **dynamic computed values** that cannot be expressed as a class (e.g. pixel coordinates or sizes derived from state).

```tsx
// ✅ Tailwind for all static/conditional styles
className={`w-7 h-7 rounded-md ${disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-black/6"}`}

// ✅ Inline style only for truly dynamic values (position, size)
style={{ left: displayX, top: displayY, width: displayW, height: displayH }}

// ❌ Never use inline style for colors, spacing, fonts, etc.
style={{ backgroundColor: "white", borderRadius: 10, padding: 4 }}
```

**No JS hover handlers** (`onMouseEnter`/`onMouseLeave`) — use `hover:` Tailwind classes instead.

---

## 4. Tailwind v4 Class Names

Use the canonical Tailwind v4 shorthand — avoid arbitrary bracket syntax when a shorthand exists.

| Instead of          | Use              |
|---------------------|------------------|
| `bg-white/[92%]`    | `bg-white/92`    |
| `z-[100]`           | `z-100`          |
| `bg-black/[6%]`     | `bg-black/6`     |
| `text-[13px]`       | `text-[13px]`*   |

*Arbitrary `text-[13px]` is acceptable when no canonical step matches.

---

## 5. Types File

Each component tree has a single `types.ts` that exports all types for that directory.

```ts
// types.ts
export type ZoomProps = { ... };
export type ZoomBtnProps = { ... };
export type ZoomInputProps = { ... };
```

Components import from `"../types"` (sub-components) or `"./types"` (root component). Do not define types inline in component files.

**Reusable wrapper components** (buttons, inputs, etc.) should extend the native HTML element's attributes using `React.ComponentProps<"element">`. This makes all ARIA attributes, event handlers, and HTML attributes available to callers without explicit re-declaration:

```ts
// ✅ Extends all <button> attrs — callers can pass aria-expanded, aria-haspopup, etc.
export type ToolbarButtonProps = React.ComponentProps<'button'> & {
  active?: boolean; // only add props that don't exist on the native element
};

// ❌ Manual prop listing — misses ARIA attrs, data-*, and future HTML attrs
export type ToolbarButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
};
```

In the component, destructure custom props and spread the rest:

```tsx
export function ToolbarButton({ children, active, className, ...props }: ToolbarButtonProps) {
  return (
    <button type="button" {...props} className={`...base classes ${className ?? ''}`}>
      {children}
    </button>
  );
}
```

---

## 6. Sub-component Extraction Rule

Extract a sub-component when a piece of JSX:
- Reappears more than once, **or**
- Has its own distinct responsibility (e.g. an icon, a text input, an action button)

Sub-components are **purely presentational**: they receive typed props, render JSX, and contain no logic.

```tsx
// ✅ FitIcon.tsx — just an SVG
export default function FitIcon() {
  return <svg>...</svg>;
}

// ✅ ZoomBtn.tsx — styled button shell
export function ZoomBtn({ children, onClick, disabled, title }: ZoomBtnProps) {
  return <button ...>{children}</button>;
}
```

---

## 7. Stable Callbacks with useCallback

Wrap all event handlers in `useCallback` to prevent unnecessary re-renders of child components that receive them as props.

**Functional setState** — when updating state based on its current value, always use the functional form. This eliminates stale closures and makes the callback stable (no state needed in deps array):

```ts
// ✅ Functional update — stable reference, no stale closure
const handleToggle = useCallback(() => {
  setShowPopover((v) => !v); // no dependency on showPopover
}, []);

// ❌ Direct update — requires showPopover in deps, recreated on each change
const handleToggle = useCallback(() => {
  setShowPopover(!showPopover);
}, [showPopover]);
```

**When direct assignment is fine** — setting to a static value or a value from arguments, not from current state:

```ts
setUrlValue(e.target.value);  // ✅ from argument, not current state
setUrlError('');               // ✅ static value
```

**Don't expose raw setters from hooks.** Name every interaction explicitly — this keeps the component API clean and all state mutations auditable in the hook:

```ts
// ✅ Named handler in hook
const handleUrlCancel = useCallback(() => {
  setShowPopover(false);
  setUrlValue('');
  setUrlError('');
}, []);

// ❌ Raw setter exposed — mutation logic bleeds into the component
return { setShowPopover, setUrlValue, setUrlError };
```

---

## 8. Store Access Pattern

Inside hooks, use two distinct patterns:

- **Subscribe to reactive values** (causes re-render on change): use the selector form.
- **Read on-demand inside event handlers**: use `getState()` to always get the latest value without creating a subscription.

```ts
// ✅ Subscribe — value needed to render
const zoom = useCanvasStore((s) => s.zoom);

// ✅ On-demand read inside a handler — avoids stale closure
const stepZoom = (dir: 1 | -1) => {
  const { zoom: current } = useCanvasStore.getState();
  ...
};
```

---

## 9. Grouping Related Return Values

When a hook returns several closely related values (e.g. an input's value + setter + commit), and the list of related values is long, group them into a plain object instead of returning them as separate top-level keys.

```ts
// ✅ Grouped
const inputProps = { inputValue, setInputValue, commitInput };
return { zoom, stepZoom, fitToScreen, canDecrease, canIncrease, inputProps };

// ❌ Flat — makes the return surface noisy
return { zoom, stepZoom, fitToScreen, canDecrease, canIncrease, inputValue, setInputValue, commitInput };
```

The consuming component destructures the group: `const { inputProps } = useZoomControls(...)`.

---

## 10. Eliminate Repeated Variable Patterns

When two or more functions inside a hook read the same value through the same expression, extract a private helper:

```ts
// ✅ Private helper — used by both setZoomCentered and fitToScreen
const getViewportSize = () => {
  const rect = containerRef.current?.getBoundingClientRect();
  return { vw: rect?.width ?? window.innerWidth, vh: rect?.height ?? window.innerHeight };
};
```

Helpers that are only meaningful inside a hook stay local to that hook — do not export them.

---

## 11. Accessibility (Non-Optional)

Every interactive component must be usable by keyboard and screen reader users. Accessibility is not an enhancement — it is a baseline requirement per the [WAI-ARIA spec](https://www.w3.org/WAI/ARIA/).

### Semantic HTML first
Always use the correct HTML element. `<button>` for actions, `<input>` for inputs, `<nav>` for navigation. Semantic elements provide keyboard interaction, focus, and ARIA roles for free.

```tsx
// ✅ Semantic
<button onClick={handleClick}>Add image</button>

// ❌ Div pretending to be a button
<div onClick={handleClick}>Add image</div>
```

### ARIA states for interactive widgets
Add `aria-expanded`, `aria-haspopup`, `aria-label`, `role` etc. whenever a widget has state that screen readers can't infer from HTML alone:

```tsx
// ✅ Communicates that a dialog will open
<ToolbarButton
  aria-expanded={showPopover}
  aria-haspopup="dialog"
  onClick={handleToggle}
>
  🔗
</ToolbarButton>

// ✅ Regions and dialogs must be labelled
<div role="toolbar" aria-label="Canvas tools">
<div role="dialog" aria-label="Add image from URL">

// ✅ Error messages should use role="alert" for live announcement
<p role="alert" className="text-xs text-red-500">{errorMessage}</p>
```

### Inputs must have accessible names
Every `<input>` needs either a `<label>` (preferred) or `aria-label`.

```tsx
// ✅ aria-label when a visible label isn't shown
<input aria-label="Image URL" type="url" />
```

### Explicit type on buttons
Always add `type="button"` to buttons inside forms to prevent accidental form submission. This also makes intent explicit.

```tsx
// ✅
<button type="button" onClick={onCancel}>Cancel</button>

// ❌ Defaults to type="submit" inside a form
<button onClick={onCancel}>Cancel</button>
```

### Hidden inputs
Inputs that are programmatically triggered (e.g. a file input clicked by another button) should be hidden from assistive tech:

```tsx
<input type="file" aria-hidden="true" className="hidden" />
```

---

## 12. File Naming & Import Casing

File names must use **PascalCase for components** (`ZoomBtn.tsx`, `FitIcon.tsx`) and **camelCase for hooks/utils** (`useZoomControls.ts`, `generateId.ts`).

Import paths must match the file system casing exactly. A mismatch compiles locally on case-insensitive file systems but causes a `TS1261` error (and a Turbopack panic) in strict mode:

```ts
// ✅ Correct
import FitIcon from "./components/FitIcon";

// ❌ Will crash Turbopack
import FitIcon from "./components/fitIcon";
```

---

## Refactor Checklist

When working on a component, go through these in order:

- [ ] Read the current file completely before editing
- [ ] Extract all hooks/state/effects/handlers to `hooks/useComponentName.ts`
- [ ] Replace all `style={{...}}` with Tailwind classes (keep only dynamic position/size)
- [ ] Remove all `onMouseEnter`/`onMouseLeave` hover handlers → use `hover:` classes
- [ ] Move all type definitions to `types.ts`; use `React.ComponentProps<"el">` for HTML wrappers
- [ ] Extract repeated JSX blocks into sub-components under `components/`
- [ ] Deduplicate repeated expressions inside hooks into private helpers
- [ ] Group related return values into plain objects; do not expose raw setters
- [ ] Wrap all event handlers in `useCallback`; use functional setState where state depends on previous value
- [ ] Add ARIA attributes (`role`, `aria-label`, `aria-expanded`, `aria-haspopup`) to interactive widgets
- [ ] Add `type="button"` to all `<button>` elements that aren't form-submit
- [ ] Mark non-interactive hidden inputs with `aria-hidden="true"`
- [ ] Verify import paths match file casing exactly
- [ ] Run `npx tsc --noEmit` — must report 0 errors before finishing
