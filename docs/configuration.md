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

# Session management
session:
  persist: false
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

### `apps`
Each app entry defines a TUI application to be managed.
- `id`: (Optional) Stable identifier; auto-generated if omitted.
- `name`: Display name in the tab list.
- `command`: The executable to run.
- `args`: (Optional) String of arguments to pass to the command.
- `cwd`: (Default: `~`) Initial working directory. Supports `~`, `<CONFIG_DIR>`, and `<STATE_DIR>` placeholders.
- `autostart`: (Default: `false`) If true, the app starts automatically when tuidoscope launches.
- `restart_on_exit`: (Default: `false`) If true, the app will automatically respawn if it exits.
- `env`: (Optional) Key-value pairs of environment variables for the app.

### `session`
- `persist`: (Default: `false`) If true, tuidoscope remembers which apps were running and their state between restarts.
- `file`: Custom path for the session state file. Supports `<STATE_DIR>` placeholder.

`tuidoscope --shutdown` clears the persisted session snapshot so only apps marked `autostart: true` relaunch.

## Path Placeholders
The following placeholders can be used in `cwd`, `args`, and `session.file`:
- `~`: Expanded to the user's home directory.
- `<CONFIG_DIR>`: The directory containing the active `tuidoscope.yaml`.
- `<STATE_DIR>`: The XDG state directory (usually `~/.local/state/tuidoscope/`).

## See Also

- [CONFIG.md](../CONFIG.md) - Comprehensive configuration reference
- [Apps](./apps.md) - App configuration examples
