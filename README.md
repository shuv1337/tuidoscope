# tuidoscope

A centralized TUI management application for running multiple TUI applications in embedded terminal windows. Built with [OpenTUI](https://github.com/anomalyco/opentui) and SolidJS.

## Screenshots

### Main Interface
![Shell](shell.png)

### Running TUI Applications
![btop](btop.png)

### Command Palette
![Command Palette](palette.png)

### Edit App Modal
![Edit App](edit.png)

## Features

- **Embedded Terminals**: Run multiple TUIs in a single window using Ghostty's high-performance terminal emulator.
- **Tab Management**: Organize and switch between different applications using a vertical sidebar.
- **Leader Key System**: tmux-style keybindings with a configurable leader key (default: `Ctrl+A`). Press leader + action key for commands.
- **Command Palette**: Quickly search and switch between apps with a fuzzy-search palette (`Leader+Space`).
- **Runtime Management**: Add, edit, and remove application entries directly within the app without restarting.
- **Session Persistence**: Automatically remembers and restores your running applications and active tab between restarts.
- **Highly Configurable**: Customize themes, keybinds, and application lists via YAML.
- **Path Expansion**: Supports `~`, `<CONFIG_DIR>`, and `<STATE_DIR>` tokens in paths.
- **App Availability Detection**: The onboarding wizard automatically detects which TUI apps are installed on your system.

## Documentation

For detailed guides, see the [`docs/`](./docs/) directory:

- [Getting Started](./docs/getting-started.md) - Installation and first run
- [Configuration](./docs/configuration.md) - YAML config reference
- [Keybindings](./docs/keybindings.md) - Leader key system and shortcuts
- [Apps](./docs/apps.md) - App configuration examples
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions

See also: [CONFIG.md](./CONFIG.md) for a comprehensive configuration reference.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [SolidJS](https://www.solidjs.com/)
- **TUI Engine**: [OpenTUI](https://github.com/anomalyco/opentui)
- **Terminal Emulator**: [ghostty-opentui](https://github.com/remorses/ghostty-opentui)
- **PTY**: `node-pty` (via `spawn-pty`)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed on your system.
- A terminal that supports TUI applications (xterm-256color recommended).

### Quick Start (No Install)

Run tuidoscope instantly without installing:

```bash
bunx tuidoscope
```

### Installation

Install globally:

```bash
bun install -g tuidoscope
```

Then run from anywhere:

```bash
tuidoscope
```

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/shuv1337/tuidoscope.git
cd tuidoscope
bun install
```

Start the application in development mode:

```bash
bun dev
```

Build for production:

```bash
bun run build
```

Run typechecks:

```bash
bun run typecheck
```

## Configuration

Tuidoscope looks for a configuration file at `~/.config/tuidoscope/tuidoscope.yaml`. It also supports a local `tuidoscope.yaml` in the current working directory for project-specific setups.

### Leader Key System

Tuidoscope uses a tmux-style leader key system. Press the leader key (default: `Ctrl+A`), then press an action key:

| Action | Leader + Key | Description |
|--------|--------------|-------------|
| Next Tab | `Leader + n` | Switch to next tab |
| Previous Tab | `Leader + p` | Switch to previous tab |
| Toggle Focus | `Leader + a` | Switch between Terminal/Tabs mode |
| New Tab | `Leader + t` | Open new tab dialog |
| Edit App | `Leader + e` | Edit current app |
| Command Palette | `Leader + Space` | Open command palette |
| Stop App | `Leader + x` | Stop current app |
| Close Tab | `Leader + w` | Close current tab |
| Restart App | `Leader + r` | Restart current app |
| Kill All | `Leader + K` | Kill all running apps |
| Quit | `Leader + q` | Exit tuidoscope |

**Direct navigation** (Tabs Mode only, no leader required):
- `j`/`k` - Navigate up/down
- `gg`/`G` - Jump to first/last tab
- `Enter` - Select tab

**Double-tap leader** to send it to the terminal (useful for nested tmux).

### Theme Customization

Default theme is Night Owl. Customize in your `tuidoscope.yaml`:

```yaml
theme:
  primary: "#82aaff"      # Blue - selections
  background: "#011627"   # Deep dark blue
  foreground: "#d6deeb"   # Light text
  accent: "#7fdbca"       # Cyan - active indicators
  muted: "#637777"        # Gray - inactive elements
```

## Change Log

### v0.2.0
- **Leader Key System**: tmux-style configurable leader key (default `Ctrl+A`) replaces hardcoded `Ctrl+` keybinds.
- **Onboarding Wizard**: New first-run experience with leader key selection and app preset picker.
- **App Availability Detection**: Preset list shows which apps are installed on your system.
- **Expanded Presets**: 30+ TUI apps including AI coding agents (Claude, OpenCode, Aider, Gemini, Codex).
- **V2 Config Schema**: New nested keybind format with automatic migration from V1.
- **Leader Hints**: Visual indicator and hint popup when leader key is active.
- **Night Owl Theme**: Updated default theme to Night Owl color scheme.

### v0.1.0
- Initial release.
- Embedded terminal windows via `ghostty-opentui`.
- Vertical tab sidebar for application management.
- Command palette with fuzzy search.
- Session persistence (running apps & active tab).
- Runtime application configuration (Add/Edit).
- Path expansion for working directories.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request on [GitHub](https://github.com/shuv1337/tuidoscope).

## Acknowledgments

This project is built directly on top of:

- **[OpenTUI](https://github.com/anomalyco/opentui)** - Provides the declarative component model and rendering engine for the entire interface.
- **[ghostty-opentui](https://github.com/remorses/ghostty-opentui)** - Enables high-performance, embedded terminal sessions within the application.

Huge thanks to both for making this possible.

## License

MIT
