[OPEN] Debug Session: preview-loop

## Symptom
- The app preview is reported to be stuck in a loop.

## Scope
- Investigate runtime behavior first.
- Do not change business logic before evidence collection.

## Initial Hypotheses
- H1: The app is entering a client-side navigation loop caused by `router.push()` or `router.back()` behavior.
- H2: A top-level layout or always-mounted component is re-rendering and triggering repeated navigation.
- H3: The preview loop is caused by a browser asset/cache issue that repeatedly reloads the page rather than an app route loop.
- H4: A page is reading query params or history state and bouncing between routes unintentionally.
- H5: The dev preview itself is unstable because of a runtime error causing repeated hot reload or full page reload.

## Evidence Plan
- Inspect the mounted global client components and routing surfaces.
- Reproduce with HTTP and browser-level checks.
- Add minimal instrumentation only if static inspection cannot confirm the loop source.
