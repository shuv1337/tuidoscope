# Configuration

Tuidoscope is configured using a YAML file named `tuidoscope.yaml`. 

## Configuration File Location

Tuidoscope searches for the configuration file in the following order:

1.  **Local Directory**: `./tuidoscope.yaml` (useful for project-specific TUI setups).
2.  **XDG Config Home**: `~/.config/tuidoscope/tuidoscope.yaml` (default on most Linux/macOS systems).

## YAML Structure

The configuration file follows a structured YAML format. Below is a full example with default values and explanations.

```yaml
version: 2

# Theme colors (Night Owl defaults)
theme:
  primary: "#82aaff"    # Blue - selections, highlights
  background: "#011627" # Deep dark blue
  foreground: "#d6deeb" # Light gray-blue text
  accent: "#7fdbca"     # Cyan/teal - active indicators
  muted: "#637777"      # Gray-blue for inactive elements

# UI settings
tab_width: 20

# Keyboard shortcuts - tmux-style leader key system
keybinds:
  # Leader key configuration
  leader:
    key: "ctrl+a"         # The leader key combination
    timeout: 1000         # ms before leader mode auto-cancels
    show_hints: true      # Show available bindings after delay
    hint_delay: 300       # ms before showing hint popup

  # Leader bindings - press Leader + key to execute
  bindings:
    next_tab: "n"
    prev_tab: "p"
    close_tab: "w"
    new_tab: "t"
    toggle_focus: "a"
    edit_app: "e"
    restart_app: "r"
    command_palette: "space"
    stop_app: "x"
    kill_all: "K"
    quit: "q"

  # Direct bindings - work without leader in Tabs Mode
  direct:
    navigate_up: "k"
    navigate_down: "j"
    select: "enter"
    go_top: "g"
    go_bottom: "G"

# Session management
session:
  persist: true
  # file: "<STATE_DIR>/session.yaml" # Optional custom session file

# Application List
apps:
  - name: "Shell"
    command: "bash"
    cwd: "~"
    autostart: true
    restart_on_exit: false
    env:
      TERM: "xterm-256color"

  - name: "System Monitor"
    command: "htop"
    autostart: false
    restart_on_exit: true
```

## Section Details

### `version`
The schema version for the configuration file. Current version is `2`.

**Note:** V1 configs are automatically migrated to V2 on load.

### `theme`
Tuidoscope uses a 5-color palette inspired by the **Night Owl** theme.

| Property | Color | Hex | Description |
|----------|-------|-----|-------------|
| `primary` | Blue | `#82aaff` | Active selections, highlights |
| `background` | Deep Dark Blue | `#011627` | Main UI background |
| `foreground` | Light Gray-Blue | `#d6deeb` | Primary text color |
| `accent` | Cyan/Teal | `#7fdbca` | Active indicators, checkboxes |
| `muted` | Gray-Blue | `#637777` | Inactive tabs, secondary text |

#### Full Night Owl Palette
For reference, these are the base colors used in the default theme:

- **Red:** `#ef5350`
- **Green:** `#22da6e`
- **Yellow:** `#addb67`
- **Blue:** `#82aaff`
- **Magenta:** `#c792ea`
- **Cyan:** `#7fdbca`

### `tab_width`
(Default: `20`) The width of the tab list in the UI.

### `keybinds`

Tuidoscope uses a tmux-style leader key system. See [Keybindings](./keybindings.md) for full details.

#### `keybinds.leader`
Configuration for the leader key:

| Property | Default | Description |
|----------|---------|-------------|
| `key` | `"ctrl+a"` | The leader key combination |
| `timeout` | `1000` | Ms before leader mode auto-cancels |
| `show_hints` | `true` | Show binding hints after delay |
| `hint_delay` | `300` | Ms before showing hints popup |

#### `keybinds.bindings`
Actions triggered by Leader + key:

| Action | Default | Description |
|--------|---------|-------------|
| `next_tab` | `n` | Switch to next tab |
| `prev_tab` | `p` | Switch to previous tab |
| `close_tab` | `w` | Close current tab |
| `new_tab` | `t` | Open new tab dialog |
| `toggle_focus` | `a` | Switch Terminal/Tabs mode |
| `edit_app` | `e` | Edit current app |
| `restart_app` | `r` | Restart current app |
| `command_palette` | `space` | Open command palette |
| `stop_app` | `x` | Stop current app |
| `kill_all` | `K` | Kill all apps (Shift+K) |
| `quit` | `q` | Exit tuidoscope |

#### `keybinds.direct`
Navigation keys that work in Tabs Mode without the leader key:

| Action | Default | Description |
|--------|---------|-------------|
| `navigate_up` | `k` | Previous tab (vim style) |
| `navigate_down` | `j` | Next tab (vim style) |
| `select` | `enter` | Focus selected tab |
| `go_top` | `g` | First tab (press twice: gg) |
| `go_bottom` | `G` | Last tab (Shift+G) |

### `apps`
Each app entry defines a TUI application to be managed.
- `name`: Display name in the tab list.
- `command`: The executable to run.
- `args`: (Optional) String of arguments to pass to the command.
- `cwd`: (Default: `~`) Initial working directory. Supports `~`, `<CONFIG_DIR>`, and `<STATE_DIR>` placeholders.
- `autostart`: (Default: `false`) If true, the app starts automatically when tuidoscope launches.
- `restart_on_exit`: (Default: `false`) If true, the app will automatically respawn if it exits.
- `env`: (Optional) Key-value pairs of environment variables for the app.

### `session`
- `persist`: (Default: `true`) If true, tuidoscope remembers which apps were running and their state between restarts.
- `file`: Custom path for the session state file. Supports `<STATE_DIR>` placeholder.

## Path Placeholders
The following placeholders can be used in `cwd`, `args`, and `session.file`:
- `~`: Expanded to the user's home directory.
- `<CONFIG_DIR>`: The directory containing the active `tuidoscope.yaml`.
- `<STATE_DIR>`: The XDG state directory (usually `~/.local/state/tuidoscope/`).

## See Also

- [CONFIG.md](../CONFIG.md) - Comprehensive configuration reference
- [Keybindings](./keybindings.md) - Leader key system documentation
- [Apps](./apps.md) - App configuration examples
