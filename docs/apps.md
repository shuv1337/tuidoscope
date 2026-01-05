# App Configuration Examples

This guide provides examples and best practices for configuring TUI applications in tuidoscope.

## App Configuration Basics

Each app in tuidoscope is defined in the `apps` section of your `tuidoscope.yaml` configuration file. An app entry can have the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | *required* | Display name shown in the tab list |
| `command` | string | *required* | The executable to run |
| `args` | string | `""` | Arguments passed to the command |
| `cwd` | string | `~` | Working directory for the app |
| `env` | object | `{}` | Environment variables |
| `autostart` | boolean | `false` | Start automatically on launch |
| `restart_on_exit` | boolean | `false` | Restart if the app exits |

### Basic Example

```yaml
apps:
  - name: "htop"
    command: "htop"
```

### Full Example

```yaml
apps:
  - name: "Project Shell"
    command: "zsh"
    cwd: "~/projects/myapp"
    autostart: true
    restart_on_exit: false
    env:
      TERM: "xterm-256color"
      EDITOR: "nvim"
```

## Path Placeholders

You can use these placeholders in `cwd` and `args`:

- `~` - Expands to your home directory
- `<CONFIG_DIR>` - Directory containing your `tuidoscope.yaml`
- `<STATE_DIR>` - XDG state directory (`~/.local/state/tuidoscope/`)

```yaml
apps:
  - name: "Config Editor"
    command: "nvim"
    args: "<CONFIG_DIR>/tuidoscope.yaml"
```

## Tips

- Set `autostart: true` for apps you always want running (like a shell or system monitor)
- Use `restart_on_exit: true` for long-running apps that should stay alive
- Apps that exit quickly (like `dust` or `duf`) work best without `restart_on_exit`
- Some apps require specific `TERM` settings - see troubleshooting if you have display issues

---

## Shell Examples

Shells are the most common apps to run in tuidoscope. Here are examples for popular shells:

### Bash

```yaml
apps:
  - name: "Bash"
    command: "bash"
    autostart: true
```

With a custom profile:

```yaml
apps:
  - name: "Bash (custom)"
    command: "bash"
    args: "--rcfile ~/.bashrc.tuidoscope"
```

### Zsh

```yaml
apps:
  - name: "Zsh"
    command: "zsh"
    autostart: true
```

Project-specific shell:

```yaml
apps:
  - name: "Project Shell"
    command: "zsh"
    cwd: "~/projects/myapp"
    autostart: true
    env:
      PROJECT_ENV: "development"
```

### Fish

```yaml
apps:
  - name: "Fish"
    command: "fish"
    autostart: true
```

With a specific config directory:

```yaml
apps:
  - name: "Fish (custom)"
    command: "fish"
    args: "--config ~/.config/fish/tuidoscope.fish"
```

### Nushell

```yaml
apps:
  - name: "Nushell"
    command: "nu"
    autostart: true
```

With custom config:

```yaml
apps:
  - name: "Nushell (custom)"
    command: "nu"
    args: "--config ~/.config/nushell/tuidoscope.nu"
```

### Shell Tips

- Use `autostart: true` for your primary shell
- Set `cwd` to frequently-used project directories
- Use `env` to set shell-specific environment variables
- Consider having multiple shell tabs for different projects

---

## System Monitor Examples

System monitors are excellent candidates for tuidoscope tabs. They provide at-a-glance system status while you work in other tabs.

### htop

The classic interactive process viewer.

```yaml
apps:
  - name: "htop"
    command: "htop"
    autostart: true
```

With custom config:

```yaml
apps:
  - name: "htop"
    command: "htop"
    args: "--tree"  # Show processes as a tree
```

### btop

A modern resource monitor with a beautiful interface.

```yaml
apps:
  - name: "btop"
    command: "btop"
    autostart: true
```

With low update mode for reduced CPU usage:

```yaml
apps:
  - name: "btop"
    command: "btop"
    args: "--low-color"
    env:
      BTOP_UPDATE_MS: "2000"  # Update every 2 seconds
```

### glances

Cross-platform monitoring tool with extensive metrics.

```yaml
apps:
  - name: "glances"
    command: "glances"
    autostart: true
```

Minimal mode (less resource-intensive):

```yaml
apps:
  - name: "glances"
    command: "glances"
    args: "--disable-plugin all --enable-plugin cpu,mem,load"
```

Web server mode (access from browser):

```yaml
apps:
  - name: "glances (web)"
    command: "glances"
    args: "-w"  # Starts web server on port 61208
```

### bottom (btm)

A graphical process/system monitor with vim-like keybindings.

```yaml
apps:
  - name: "bottom"
    command: "btm"
    autostart: true
```

With custom options:

```yaml
apps:
  - name: "bottom"
    command: "btm"
    args: "--battery --enable_gpu_memory"  # Show battery and GPU info
```

Basic mode (no graphs, more processes visible):

```yaml
apps:
  - name: "bottom"
    command: "btm"
    args: "--basic"
```

### System Monitor Tips

- Set `autostart: true` for your preferred monitor to have system stats always visible
- Consider using `restart_on_exit: true` if you want the monitor to restart after pressing `q`
- Most monitors support custom configs - check their documentation for personalization options
- Use lightweight options (like `--low-color` or reduced update intervals) if running many tabs
