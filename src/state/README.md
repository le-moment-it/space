# state/

Zustand stores that glue `engine/` to `ui/`. This layer dispatches into engine
functions and holds UI-facing state — it must not contain game rules itself.
See `docs/ARCHITECTURE.md` §3.
