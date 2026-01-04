# Operational Details

## Build & Development
- **Dev:** `bun run dev` (Runs `src/index.tsx` directly)
- **Build:** `bun run build` (Runs `build.ts` and adds shebang)
- **Typecheck:** `bun run typecheck` (`tsc --noEmit`)
- **Global Install:** `bun install -g tuidoscope`

## Configuration
- Default config location: `~/.config/tuidoscope/tuidoscope.yaml` (XDG_CONFIG_HOME) or local `./tuidoscope.yaml`.
- State directory: `~/.local/state/tuidoscope/` (XDG_STATE_HOME).

## Key Tech
- **TUI Framework:** `@opentui/solid`, `@opentui/core`
- **Runtime:** `bun`
- **Language:** TypeScript
