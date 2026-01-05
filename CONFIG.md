# Tuidoscope Configuration Reference

This document provides comprehensive documentation for all tuidoscope configuration options.

## Table of Contents

- [Configuration File Location](#configuration-file-location)
- [Configuration Schema](#configuration-schema)
- [Leader Key System](#leader-key-system)
- [Keybind Configuration](#keybind-configuration)
- [Theme Configuration](#theme-configuration)
- [App Configuration](#app-configuration)
- [Session Configuration](#session-configuration)
- [Path Placeholders](#path-placeholders)
- [Migration from V1](#migration-from-v1)
- [Complete Example](#complete-example)

---

## Configuration File Location

Tuidoscope searches for configuration in this order:

1. **Local**: `./tuidoscope.yaml` (project-specific)
2. **XDG Config**: `~/.config/tuidoscope/tuidoscope.yaml`
3. **Defaults**: Built-in defaults if no file found

On first run without a config file, the onboarding wizard helps you create one.

---

## Configuration Schema

```yaml
version: 2                    # Config schema version (required)
theme: { ... }                # Color theme
keybinds: { ... }             # Leader key and bindings
tab_width: 20                 # Tab sidebar width
apps: [ ... ]                 # Application entries
session: { ... }              # Session persistence
```

---

## Leader Key System

Tuidoscope uses a **tmux-style leader key system**. Instead of reserving multiple `Ctrl+` combinations that might conflict with terminal apps, tuidoscope only needs one key combination: the leader key.

### How It Works

1. Press the **leader key** (default: `Ctrl+A`)
2. A visual indicator appears: `[^A...]`
3. Press an **action key** (e.g., `n` for next tab)
4. The action executes immediately

### Leader Key Options

| Preset | Key | Best For |
|--------|-----|----------|
| tmux-style | `ctrl+a` | tmux users (default) |
| tmux alternate | `ctrl+b` | Original tmux users |
| GNU Screen | `ctrl+\` | screen users |
| Desktop-style | `alt+space` | Avoiding Ctrl conflicts |

### Leader Configuration

```yaml
keybinds:
  leader:
    key: "ctrl+a"       # The leader key combination
    timeout: 1000       # Auto-cancel after this many ms
    show_hints: true    # Show binding hints after delay
    hint_delay: 300     # Delay before showing hints (ms)
```

#### `key` (string)
The key combination to activate command mode. Format: `modifier+key`

Supported modifiers:
- `ctrl` - Control key
- `alt` - Alt/Option key
- `shift` - Shift key
- `meta` - Meta/Command key

Examples: `ctrl+a`, `ctrl+b`, `alt+space`, `ctrl+\`

#### `timeout` (number, default: 1000)
Milliseconds before leader mode automatically cancels. If you press the leader key but don't follow up with an action, it will cancel after this time.

#### `show_hints` (boolean, default: true)
Whether to show a popup with available keybindings after the hint delay.

#### `hint_delay` (number, default: 300)
Milliseconds after leader activation before showing the hints popup. Set to 0 for immediate hints, or increase if hints appear too quickly.

### Double-Tap Passthrough

Press the leader key twice to send it to the terminal. This is essential for:
- Nested tmux sessions using the same prefix
- Applications that use `Ctrl+A` (like readline's beginning-of-line)

---

## Keybind Configuration

### Leader Bindings

These require pressing the leader key first:

```yaml
keybinds:
  bindings:
    next_tab: "n"           # Leader + n
    prev_tab: "p"           # Leader + p
    close_tab: "w"          # Leader + w
    new_tab: "t"            # Leader + t
    toggle_focus: "a"       # Leader + a
    edit_app: "e"           # Leader + e
    restart_app: "r"        # Leader + r
    command_palette: "space" # Leader + Space
    stop_app: "x"           # Leader + x
    kill_all: "K"           # Leader + Shift+K
    quit: "q"               # Leader + q
```

#### Binding Reference

| Binding | Default | Description |
|---------|---------|-------------|
| `next_tab` | `n` | Switch to the next tab |
| `prev_tab` | `p` | Switch to the previous tab |
| `close_tab` | `w` | Close the current tab |
| `new_tab` | `t` | Open the new tab dialog |
| `toggle_focus` | `a` | Switch between Terminal and Tabs mode |
| `edit_app` | `e` | Edit the current app's configuration |
| `restart_app` | `r` | Restart the current application |
| `command_palette` | `space` | Open the fuzzy-search command palette |
| `stop_app` | `x` | Stop the current application |
| `kill_all` | `K` | Kill all running applications (Shift+K) |
| `quit` | `q` | Exit tuidoscope |

### Direct Bindings

These work in **Tabs Mode only** without requiring the leader key:

```yaml
keybinds:
  direct:
    navigate_up: "k"        # Previous tab (vim style)
    navigate_down: "j"      # Next tab (vim style)
    select: "enter"         # Focus selected tab
    go_top: "g"             # First tab (press twice: gg)
    go_bottom: "G"          # Last tab (Shift+G)
```

#### Direct Binding Reference

| Binding | Default | Description |
|---------|---------|-------------|
| `navigate_up` | `k` | Move selection to previous tab |
| `navigate_down` | `j` | Move selection to next tab |
| `select` | `enter` | Focus the selected tab (switch to Terminal mode) |
| `go_top` | `g` | Jump to first tab (requires double-press: `gg`) |
| `go_bottom` | `G` | Jump to last tab (Shift+G) |

### Focus Modes

Tuidoscope has two focus modes:

**Terminal Mode** (default when app is running):
- All keyboard input goes to the terminal
- Only the leader key is intercepted
- `Ctrl+C` always passes through (never intercepted)

**Tabs Mode** (for navigation):
- Direct bindings (`j`, `k`, `gg`, `G`, `Enter`) work
- Use `Leader + a` to switch between modes

---

## Theme Configuration

Tuidoscope uses a 5-color palette. Default is Night Owl:

```yaml
theme:
  primary: "#82aaff"      # Blue - active selections, highlights
  background: "#011627"   # Deep dark blue - main background
  foreground: "#d6deeb"   # Light gray-blue - primary text
  accent: "#7fdbca"       # Cyan/teal - active indicators, checkboxes
  muted: "#637777"        # Gray-blue - inactive elements, hints
```

### Color Properties

| Property | Purpose | Night Owl Default |
|----------|---------|-------------------|
| `primary` | Active selections, focused items, highlights | `#82aaff` (blue) |
| `background` | Main UI background | `#011627` (dark blue) |
| `foreground` | Primary text color | `#d6deeb` (light gray) |
| `accent` | Active indicators, selected checkboxes, success | `#7fdbca` (cyan) |
| `muted` | Inactive tabs, secondary text, hints | `#637777` (gray) |

### Alternative Themes

**Tokyo Night:**
```yaml
theme:
  primary: "#7aa2f7"
  background: "#1a1b26"
  foreground: "#c0caf5"
  accent: "#bb9af7"
  muted: "#565f89"
```

**Dracula:**
```yaml
theme:
  primary: "#bd93f9"
  background: "#282a36"
  foreground: "#f8f8f2"
  accent: "#50fa7b"
  muted: "#6272a4"
```

**Nord:**
```yaml
theme:
  primary: "#88c0d0"
  background: "#2e3440"
  foreground: "#eceff4"
  accent: "#a3be8c"
  muted: "#4c566a"
```

---

## App Configuration

Apps are defined as an array of entries:

```yaml
apps:
  - name: "Shell"
    command: "zsh"
    args: ""
    cwd: "~"
    autostart: true
    restart_on_exit: false
    env:
      TERM: "xterm-256color"
```

### App Entry Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | required | Display name in tab list |
| `command` | string | required | Executable to run |
| `args` | string | `""` | Arguments passed to command |
| `cwd` | string | `"~"` | Working directory (supports placeholders) |
| `autostart` | boolean | `false` | Start automatically on launch |
| `restart_on_exit` | boolean | `false` | Respawn if process exits |
| `env` | object | `{}` | Environment variables |

### Working Directory Examples

```yaml
apps:
  # Home directory
  - name: "Shell"
    command: "zsh"
    cwd: "~"

  # Relative to config file location
  - name: "lazygit"
    command: "lazygit"
    cwd: "<CONFIG_DIR>"

  # Absolute path
  - name: "Project Shell"
    command: "zsh"
    cwd: "/home/user/projects/myapp"
```

### Environment Variables

```yaml
apps:
  - name: "Shell"
    command: "zsh"
    env:
      TERM: "xterm-256color"
      EDITOR: "nvim"
      MY_VAR: "custom_value"
```

### Common App Configurations

**AI Coding Agents:**
```yaml
apps:
  - name: "Claude"
    command: "claude"
    cwd: "<CONFIG_DIR>"

  - name: "OpenCode"
    command: "opencode"
    cwd: "<CONFIG_DIR>"

  - name: "Aider"
    command: "aider"
    cwd: "<CONFIG_DIR>"
```

**System Monitors:**
```yaml
apps:
  - name: "htop"
    command: "htop"
    restart_on_exit: true  # Respawn if quit accidentally

  - name: "btop"
    command: "btop"

  - name: "glances"
    command: "glances"
```

**Git Tools:**
```yaml
apps:
  - name: "lazygit"
    command: "lazygit"
    cwd: "<CONFIG_DIR>"

  - name: "tig"
    command: "tig"
    cwd: "<CONFIG_DIR>"
```

**File Managers:**
```yaml
apps:
  - name: "ranger"
    command: "ranger"
    cwd: "~"

  - name: "yazi"
    command: "yazi"
    cwd: "~"

  - name: "lf"
    command: "lf"
    cwd: "~"
```

---

## Session Configuration

```yaml
session:
  persist: true
  file: "~/.local/state/tuidoscope/session.yaml"
```

### Session Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `persist` | boolean | `true` | Remember running apps between restarts |
| `file` | string | XDG state dir | Custom session file path |

When `persist: true`, tuidoscope saves:
- Which apps were running
- Which tab was active
- App process state

---

## Path Placeholders

These placeholders can be used in `cwd`, `args`, and `session.file`:

| Placeholder | Expands To | Example |
|-------------|------------|---------|
| `~` | User home directory | `/home/username` |
| `<CONFIG_DIR>` | Directory containing the active config file | `~/.config/tuidoscope` |
| `<STATE_DIR>` | XDG state directory | `~/.local/state/tuidoscope` |

### Examples

```yaml
apps:
  - name: "Shell"
    cwd: "~"                        # /home/user

  - name: "Project"
    cwd: "<CONFIG_DIR>"             # ~/.config/tuidoscope

session:
  file: "<STATE_DIR>/session.yaml"  # ~/.local/state/tuidoscope/session.yaml
```

---

## Migration from V1

If you have an older V1 configuration:

```yaml
# V1 format (deprecated)
version: 1
keybinds:
  next_tab: "ctrl+n"
  prev_tab: "ctrl+p"
  toggle_focus: "ctrl+a"
  command_palette: "ctrl+p"
```

Tuidoscope automatically migrates to V2 on load:
- Leader key extracted from `toggle_focus` (e.g., `ctrl+a`)
- `ctrl+` prefixes stripped from bindings
- `command_palette` changed to `space` (resolves conflict with `prev_tab`)
- Direct navigation bindings added with vim defaults

### Manual Migration

To manually convert V1 to V2:

1. Change `version: 1` to `version: 2`
2. Restructure `keybinds` to nested format:

```yaml
version: 2
keybinds:
  leader:
    key: "ctrl+a"           # Was toggle_focus value
    timeout: 1000
    show_hints: true
    hint_delay: 300
  bindings:
    next_tab: "n"           # Strip ctrl+ prefix
    prev_tab: "p"
    # ... etc
  direct:
    navigate_up: "k"
    navigate_down: "j"
    # ... etc
```

---

## Complete Example

```yaml
# tuidoscope configuration
# ~/.config/tuidoscope/tuidoscope.yaml

version: 2

# Night Owl theme
theme:
  primary: "#82aaff"
  background: "#011627"
  foreground: "#d6deeb"
  accent: "#7fdbca"
  muted: "#637777"

# Keybindings
keybinds:
  leader:
    key: "ctrl+a"
    timeout: 1000
    show_hints: true
    hint_delay: 300

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

  direct:
    navigate_up: "k"
    navigate_down: "j"
    select: "enter"
    go_top: "g"
    go_bottom: "G"

# Tab sidebar width
tab_width: 20

# Applications
apps:
  - name: "Shell"
    command: "zsh"
    cwd: "~"
    autostart: true
    env:
      TERM: "xterm-256color"

  - name: "htop"
    command: "htop"
    cwd: "~"

  - name: "lazygit"
    command: "lazygit"
    cwd: "<CONFIG_DIR>"

  - name: "Claude"
    command: "claude"
    cwd: "<CONFIG_DIR>"

# Session
session:
  persist: true
  file: "<STATE_DIR>/session.yaml"
```

---

## Troubleshooting

### Leader key conflicts with terminal emulator

Some terminals (like GNOME Terminal) use `Ctrl+A` for select-all. Solutions:
1. Change tuidoscope's leader to `ctrl+b` or `alt+space`
2. Disable the conflicting shortcut in your terminal

### Leader key conflicts with nested tmux

If running tmux inside tuidoscope with the same prefix:
- Double-tap the leader to send it through
- Or use different prefixes (e.g., tuidoscope: `ctrl+a`, tmux: `ctrl+b`)

### Keys not working in Terminal Mode

In Terminal Mode, only the leader key is intercepted. Navigation keys like `j`/`k` go directly to the terminal app. Use `Leader + a` to switch to Tabs Mode for navigation.

### Ctrl+C exits tuidoscope

This was fixed in v0.2.0. `Ctrl+C` now always passes through to the terminal. Use `Leader + q` to quit.
