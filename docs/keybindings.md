# Keybindings

Tuidoscope uses a dual-mode focus system to manage keyboard input efficiently between the application itself and the terminal apps it hosts.

## Focus Modes

### Terminal Mode
In **Terminal Mode**, almost all keyboard input is passed directly to the active terminal application. This allows you to interact with your shell, editor, or system monitor as you normally would.

Global keybindings (like switching tabs) still work in Terminal Mode, but the terminal app has priority for most other keys.

### Tabs Mode
In **Tabs Mode**, the keyboard is used to navigate the list of applications, manage tabs, and control the tuidoscope interface. This mode is ideal for quickly switching between apps or managing your workspace.

---

## Navigation & Mode Switching

| Action | Keybinding (Default) | Mode |
|--------|----------------------|------|
| **Toggle Focus** | `Ctrl+A` | Both |
| **Next Tab** | `Ctrl+N` / `j` / `Down` | Both (j/Down in Tabs only) |
| **Previous Tab** | `Ctrl+P` / `k` / `Up` | Both (k/Up in Tabs only) |
| **Go to Top** | `gg` | Tabs |
| **Go to Bottom** | `G` | Tabs |
| **Select App** | `Enter` / `Return` | Tabs |

---

## Tab Management

| Action | Keybinding (Default) | Mode |
|--------|----------------------|------|
| **New Tab** | `Ctrl+T` | Both |
| **Close Tab** | `Ctrl+W` | Both |
| **Edit App** | `Ctrl+E` | Tabs (Shows hint in Terminal) |
| **Command Palette** | `Ctrl+Space` | Both |

---

## App Control

| Action | Keybinding (Default) | Mode |
|--------|----------------------|------|
| **Restart App** | `Ctrl+Shift+R` | Both |
| **Stop App** | `Ctrl+X` | Both |
| **Kill All Apps** | `Ctrl+Shift+K` | Both |
| **Quit Tuidoscope**| `Ctrl+Q` | Both |

---

## Special Key Handling

### Ctrl+C (SIGINT)
- **Terminal Mode**: Passed directly to the terminal application (e.g., interrupts a running process or cancels a shell command).
- **Tabs Mode**: Does **not** exit the application. Instead, it displays a hint: *"Press Ctrl+Q to quit"*.

### Escape
- Closes any open modal (Add Tab, Edit App, Command Palette).

---

## Customizing Keybindings

You can customize any of these keybindings in your `tuidoscope.yaml` file. Keybindings use the format `mod+key` (e.g., `ctrl+x`, `alt+p`, `ctrl+shift+r`).

```yaml
keybinds:
  toggle_focus: "ctrl+f"
  next_tab: "alt+n"
  prev_tab: "alt+p"
  command_palette: "ctrl+p"
  quit: "ctrl+shift+q"
```

Available actions for customization:
- `next_tab`
- `prev_tab`
- `close_tab`
- `new_tab`
- `toggle_focus`
- `edit_app`
- `restart_app`
- `command_palette`
- `stop_app`
- `kill_all`
- `quit`
