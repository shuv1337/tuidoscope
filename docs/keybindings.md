# Keybindings

Tuidoscope uses a tmux-style **leader key system** combined with a dual-mode focus system to manage keyboard input efficiently.

## Leader Key Concept

The leader key is a special key combination (default: `Ctrl+A`) that activates "command mode". After pressing the leader key, you have a short window (1 second by default) to press a second key that triggers an action.

**How it works:**
1. Press the leader key (`Ctrl+A`)
2. A visual indicator appears in the status bar: `[^A...]`
3. Press an action key (e.g., `n` for next tab)
4. The action executes and leader mode deactivates

This system prevents conflicts with terminal applications - the leader key is the only thing tuidoscope needs to "steal" from your terminal.

### Leader Key Timeout

If you press the leader key but don't follow up with an action key within the timeout period (default: 1000ms), the leader mode automatically cancels. This prevents you from getting stuck in an unexpected state.

### Double-Tap for Passthrough

If you need to send the actual leader key combination to the terminal application (e.g., for nested tmux sessions), press the leader key twice in quick succession:

- **First press:** Activates leader mode
- **Second press:** Sends the leader key to the terminal and cancels leader mode

For example, if you're running tmux inside tuidoscope and both use `Ctrl+A` as their prefix, double-tapping `Ctrl+A` will send it through to the nested tmux.

---

## Focus Modes

### Terminal Mode
In **Terminal Mode**, almost all keyboard input is passed directly to the active terminal application. Only the leader key is intercepted by tuidoscope.

- `Ctrl+C` is **always** passed to the terminal (never intercepted)
- Leader key combinations trigger tuidoscope actions
- All other keys go directly to the terminal app

### Tabs Mode
In **Tabs Mode**, the keyboard is used to navigate the list of applications. Direct navigation bindings (like `j`/`k`) work without needing the leader key.

---

## Choosing a Leader Key

The default leader key is `Ctrl+A` (tmux-style), but you can choose alternatives if this conflicts with your workflow:

| Preset | Key | Notes |
|--------|-----|-------|
| tmux-style | `Ctrl+A` | Default, familiar to tmux users |
| tmux alternate | `Ctrl+B` | Original tmux default |
| GNU Screen | `Ctrl+\` | Classic screen prefix |
| Desktop-style | `Alt+Space` | Avoids Ctrl conflicts |
| Custom | Any combo | Configure your own |

Choose a leader key that doesn't conflict with:
- Your terminal emulator's shortcuts
- Applications you frequently use inside tuidoscope
- Nested multiplexers (tmux, screen)

---

## Leader Bindings

These actions require pressing the leader key first:

| Action | Leader + Key | Description |
|--------|--------------|-------------|
| **Next Tab** | `Leader + n` | Switch to the next tab |
| **Previous Tab** | `Leader + p` | Switch to the previous tab |
| **New Tab** | `Leader + t` | Open the new tab dialog |
| **Close Tab** | `Leader + w` | Close the current tab |
| **Toggle Focus** | `Leader + a` | Switch between Terminal/Tabs mode |
| **Edit App** | `Leader + e` | Edit the current app's configuration |
| **Restart App** | `Leader + r` | Restart the current application |
| **Command Palette** | `Leader + Space` | Open the command palette |
| **Stop App** | `Leader + x` | Stop the current application |
| **Kill All** | `Leader + K` | Kill all running applications |
| **Quit** | `Leader + q` | Exit tuidoscope |

With the default `Ctrl+A` leader, examples:
- `Ctrl+A` then `n` → Next tab
- `Ctrl+A` then `t` → New tab
- `Ctrl+A` then `q` → Quit

---

## Direct Bindings (Tabs Mode Only)

These vim-style navigation keys work in Tabs Mode without requiring the leader key:

| Action | Key | Description |
|--------|-----|-------------|
| **Navigate Up** | `k` | Move to previous tab |
| **Navigate Down** | `j` | Move to next tab |
| **Go to Top** | `gg` | Jump to first tab |
| **Go to Bottom** | `G` | Jump to last tab |
| **Select** | `Enter` | Focus the selected tab (switch to Terminal Mode) |

---

## Special Key Handling

### Ctrl+C (SIGINT)
- **Terminal Mode**: Always passed directly to the terminal application (e.g., interrupts a running process).
- **Tabs Mode**: Does **not** exit the application. Displays a hint: *"Press Ctrl+Q to quit"*.

### Escape
- Closes any open modal (Add Tab, Edit App, Command Palette)
- Cancels leader mode if active

---

## Customizing Keybindings

Keybindings are configured in your `tuidoscope.yaml` file using the V2 nested structure:

```yaml
keybinds:
  # Leader key configuration
  leader:
    key: "ctrl+a"         # The leader key combination
    timeout: 1000         # ms before leader mode auto-cancels
    show_hints: true      # Show available bindings after delay
    hint_delay: 300       # ms before showing hint popup

  # Leader bindings - press Leader + key to execute
  bindings:
    next_tab: "n"         # Leader + n
    prev_tab: "p"         # Leader + p
    close_tab: "w"        # Leader + w
    new_tab: "t"          # Leader + t
    toggle_focus: "a"     # Leader + a
    edit_app: "e"         # Leader + e
    restart_app: "r"      # Leader + r
    command_palette: "space"  # Leader + Space
    stop_app: "x"         # Leader + x
    kill_all: "K"         # Leader + Shift+K
    quit: "q"             # Leader + q

  # Direct bindings - work without leader in Tabs Mode
  direct:
    navigate_up: "k"
    navigate_down: "j"
    select: "enter"
    go_top: "g"           # Press twice: gg
    go_bottom: "G"        # Shift+G
```

### Alternative Leader Key Example

To use `Ctrl+B` as your leader (like original tmux):

```yaml
keybinds:
  leader:
    key: "ctrl+b"
```

### Disable Hint Popup

If you don't want the hint popup appearing after the delay:

```yaml
keybinds:
  leader:
    show_hints: false
```

---

## Troubleshooting

### Leader key conflicts with terminal emulator
Some terminal emulators use `Ctrl+A` for their own purposes. Solutions:
1. Change tuidoscope's leader key to something else (e.g., `ctrl+b`, `alt+space`)
2. Disable the conflicting shortcut in your terminal emulator

### Leader key conflicts with nested tmux/screen
If running tmux inside tuidoscope with the same prefix:
- Double-tap the leader key to send it through to the nested session
- Or configure different leader keys for tuidoscope and tmux

### Keys not registering in Terminal Mode
Remember that in Terminal Mode, only the leader key is intercepted. All other keys (including `j`, `k`, etc.) go directly to the terminal app. Use `Leader + a` to switch to Tabs Mode for navigation.

---

## Migration from V1 Keybindings

If you have an older `tuidoscope.yaml` with V1-style flat keybindings:

```yaml
# V1 format (deprecated)
keybinds:
  next_tab: "ctrl+n"
  prev_tab: "ctrl+p"
  toggle_focus: "ctrl+a"
```

Tuidoscope will automatically migrate this to the V2 format on load. The leader key is extracted from your `toggle_focus` setting, and the `ctrl+` prefixes are stripped from other bindings.

To manually migrate, convert to the nested structure shown above.
