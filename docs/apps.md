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

---

## File Manager Examples

Terminal file managers are perfect for tuidoscope - navigate your filesystem in one tab while working in another.

### yazi

A blazing fast terminal file manager written in Rust with async I/O.

```yaml
apps:
  - name: "yazi"
    command: "yazi"
    cwd: "~"
```

Open in a specific directory:

```yaml
apps:
  - name: "yazi (projects)"
    command: "yazi"
    args: "~/projects"
```

### ranger

A vim-inspired file manager with previews and extensive customization.

```yaml
apps:
  - name: "ranger"
    command: "ranger"
    cwd: "~"
```

With a custom config directory:

```yaml
apps:
  - name: "ranger"
    command: "ranger"
    args: "--confdir=~/.config/ranger-tuidoscope"
```

Clean mode (no preview column):

```yaml
apps:
  - name: "ranger"
    command: "ranger"
    args: "--cmd='set column_ratios 1,3'"
```

### lf

A terminal file manager inspired by ranger, written in Go.

```yaml
apps:
  - name: "lf"
    command: "lf"
    cwd: "~"
```

With custom config:

```yaml
apps:
  - name: "lf"
    command: "lf"
    args: "-config ~/.config/lf/tuidoscope.lfrc"
```

Open in a specific path:

```yaml
apps:
  - name: "lf (downloads)"
    command: "lf"
    args: "~/Downloads"
```

### nnn

A fast and minimal file manager with a focus on simplicity.

```yaml
apps:
  - name: "nnn"
    command: "nnn"
    cwd: "~"
```

With plugins enabled:

```yaml
apps:
  - name: "nnn"
    command: "nnn"
    args: "-e"  # Open text files in $EDITOR
    env:
      NNN_PLUG: "f:finder;o:fzopen;p:preview-tui"
```

Detail mode (show file details):

```yaml
apps:
  - name: "nnn"
    command: "nnn"
    args: "-d"  # Show file details
```

### Midnight Commander (mc)

A classic dual-pane file manager with built-in editor and viewer.

```yaml
apps:
  - name: "mc"
    command: "mc"
    cwd: "~"
```

With specific directories in each pane:

```yaml
apps:
  - name: "mc"
    command: "mc"
    args: "~/projects ~/Downloads"  # Left pane, right pane
```

Viewer mode only:

```yaml
apps:
  - name: "mc (viewer)"
    command: "mc"
    args: "--view ~/logs/app.log"
```

### vifm

A vim-like file manager with two panes and extensive customization.

```yaml
apps:
  - name: "vifm"
    command: "vifm"
    cwd: "~"
```

With specific directories:

```yaml
apps:
  - name: "vifm"
    command: "vifm"
    args: "~/projects ~/backups"  # Left pane, right pane
```

Single pane mode:

```yaml
apps:
  - name: "vifm"
    command: "vifm"
    args: "--select ~/projects"
```

### File Manager Tips

- File managers work great alongside a shell tab for quick navigation
- Most file managers support opening files in your `$EDITOR` - set it in `env`
- Use `cwd` to start in your most-used directory
- Consider having multiple file manager tabs for different project roots
- For file managers that exit when you press `q`, omit `restart_on_exit` to avoid loops

---

## Git Tool Examples

Git TUI tools provide powerful visual interfaces for git operations. They're excellent tuidoscope companions for development workflows.

### lazygit

A simple terminal UI for git commands with intuitive keybindings.

```yaml
apps:
  - name: "lazygit"
    command: "lazygit"
    cwd: "~/projects/myrepo"
```

With a specific path:

```yaml
apps:
  - name: "lazygit"
    command: "lazygit"
    args: "--path ~/projects/myrepo"
```

With custom config:

```yaml
apps:
  - name: "lazygit"
    command: "lazygit"
    args: "--use-config-file ~/.config/lazygit/tuidoscope.yml"
```

In work tree mode (for git worktrees):

```yaml
apps:
  - name: "lazygit"
    command: "lazygit"
    args: "-w"  # Open in worktree mode
    cwd: "~/projects/myrepo"
```

### tig

A text-mode interface for git with a powerful log viewer.

```yaml
apps:
  - name: "tig"
    command: "tig"
    cwd: "~/projects/myrepo"
```

View specific branch:

```yaml
apps:
  - name: "tig (main)"
    command: "tig"
    args: "main"
    cwd: "~/projects/myrepo"
```

View a specific file's history:

```yaml
apps:
  - name: "tig (file)"
    command: "tig"
    args: "-- src/main.ts"
    cwd: "~/projects/myrepo"
```

Blame mode (see line-by-line authorship):

```yaml
apps:
  - name: "tig blame"
    command: "tig"
    args: "blame src/main.ts"
    cwd: "~/projects/myrepo"
```

Status mode (like `git status` but interactive):

```yaml
apps:
  - name: "tig status"
    command: "tig"
    args: "status"
    cwd: "~/projects/myrepo"
```

### gitui

A blazing fast git TUI written in Rust.

```yaml
apps:
  - name: "gitui"
    command: "gitui"
    cwd: "~/projects/myrepo"
```

With a specific directory:

```yaml
apps:
  - name: "gitui"
    command: "gitui"
    args: "--directory ~/projects/myrepo"
```

With custom theme:

```yaml
apps:
  - name: "gitui"
    command: "gitui"
    args: "--theme ~/.config/gitui/theme.ron"
```

With watcher for auto-refresh on file changes:

```yaml
apps:
  - name: "gitui"
    command: "gitui"
    args: "--watcher"
    cwd: "~/projects/myrepo"
```

### Git Tool Tips

- Set `cwd` to your repository root for automatic context
- Git tools exit when you press `q` - avoid `restart_on_exit` unless you want them to restart
- lazygit and gitui are full-featured alternatives to git CLI commands
- tig excels at viewing history and blame - pair it with lazygit or gitui for staging/commits
- Consider having multiple git tool tabs for different repositories in a monorepo workflow

---

## Container Tool Examples

Container management TUIs are invaluable for monitoring and managing Docker containers and Kubernetes clusters. They integrate seamlessly with tuidoscope for DevOps workflows.

### lazydocker

A simple terminal UI for Docker and docker-compose.

```yaml
apps:
  - name: "lazydocker"
    command: "lazydocker"
```

With a specific docker-compose file:

```yaml
apps:
  - name: "lazydocker"
    command: "lazydocker"
    args: "--file ~/projects/myapp/docker-compose.yml"
    cwd: "~/projects/myapp"
```

With custom config:

```yaml
apps:
  - name: "lazydocker"
    command: "lazydocker"
    args: "--config ~/.config/lazydocker/tuidoscope.yml"
```

For a specific project directory:

```yaml
apps:
  - name: "lazydocker (myapp)"
    command: "lazydocker"
    cwd: "~/projects/myapp"  # Finds docker-compose.yml in this directory
```

### k9s

A powerful Kubernetes CLI to manage clusters with a TUI.

```yaml
apps:
  - name: "k9s"
    command: "k9s"
```

With a specific kubeconfig:

```yaml
apps:
  - name: "k9s"
    command: "k9s"
    args: "--kubeconfig ~/.kube/staging-config"
```

With a specific context:

```yaml
apps:
  - name: "k9s (production)"
    command: "k9s"
    args: "--context production-cluster"
```

With a specific namespace:

```yaml
apps:
  - name: "k9s (default ns)"
    command: "k9s"
    args: "--namespace default"
```

All namespaces view:

```yaml
apps:
  - name: "k9s (all)"
    command: "k9s"
    args: "--all-namespaces"
```

Read-only mode (safer for production):

```yaml
apps:
  - name: "k9s (readonly)"
    command: "k9s"
    args: "--readonly"
```

With custom skin/theme:

```yaml
apps:
  - name: "k9s"
    command: "k9s"
    env:
      K9S_CONFIG_DIR: "~/.config/k9s-tuidoscope"
```

Start directly in a specific resource view:

```yaml
apps:
  - name: "k9s (pods)"
    command: "k9s"
    args: "--command pods"
```

```yaml
apps:
  - name: "k9s (deployments)"
    command: "k9s"
    args: "--command deployments"
```

### Container Tool Tips

- lazydocker requires Docker to be running and accessible (your user must be in the `docker` group or using rootless Docker)
- k9s requires a valid kubeconfig and kubectl access to your cluster
- Use `--readonly` flag with k9s on production clusters to prevent accidental changes
- Consider having multiple k9s tabs for different clusters (staging, production)
- lazydocker is excellent alongside a shell tab for quick container debugging
- Both tools support custom themes - match them to your tuidoscope Night Owl theme for consistency

---

## Editor Examples

Terminal text editors are a natural fit for tuidoscope, allowing you to edit files in one tab while running commands, monitoring logs, or managing files in others.

### Neovim

A hyperextensible Vim-based text editor with a modern plugin ecosystem.

```yaml
apps:
  - name: "nvim"
    command: "nvim"
    cwd: "~/projects/myapp"
```

Open a specific file:

```yaml
apps:
  - name: "nvim (config)"
    command: "nvim"
    args: "<CONFIG_DIR>/tuidoscope.yaml"
```

Open a directory (file explorer mode):

```yaml
apps:
  - name: "nvim (project)"
    command: "nvim"
    args: "."
    cwd: "~/projects/myapp"
```

With a specific config (for different setups):

```yaml
apps:
  - name: "nvim (minimal)"
    command: "nvim"
    args: "-u ~/.config/nvim/minimal.lua"
```

Diff mode (compare two files):

```yaml
apps:
  - name: "nvim (diff)"
    command: "nvim"
    args: "-d file1.txt file2.txt"
    cwd: "~/projects"
```

With custom environment for plugins:

```yaml
apps:
  - name: "nvim"
    command: "nvim"
    cwd: "~/projects/myapp"
    env:
      NVIM_APPNAME: "nvim-tuidoscope"  # Use alternate config directory
```

### Helix

A post-modern modal text editor with built-in LSP support and tree-sitter integration.

```yaml
apps:
  - name: "helix"
    command: "hx"
    cwd: "~/projects/myapp"
```

Open a specific file:

```yaml
apps:
  - name: "helix"
    command: "hx"
    args: "src/main.rs"
    cwd: "~/projects/myapp"
```

Open multiple files:

```yaml
apps:
  - name: "helix"
    command: "hx"
    args: "src/lib.rs src/main.rs Cargo.toml"
    cwd: "~/projects/myapp"
```

With a specific config directory:

```yaml
apps:
  - name: "helix"
    command: "hx"
    args: "--config ~/.config/helix/tuidoscope.toml"
```

Health check mode (verify LSP and tree-sitter):

```yaml
apps:
  - name: "helix (health)"
    command: "hx"
    args: "--health"
```

With verbose logging for debugging:

```yaml
apps:
  - name: "helix (debug)"
    command: "hx"
    args: "-v"  # -vv for more verbose
    cwd: "~/projects/myapp"
```

### micro

A modern and intuitive terminal-based text editor with familiar keybindings (Ctrl+S, Ctrl+C, etc.).

```yaml
apps:
  - name: "micro"
    command: "micro"
    cwd: "~/projects/myapp"
```

Open a specific file:

```yaml
apps:
  - name: "micro"
    command: "micro"
    args: "README.md"
    cwd: "~/projects/myapp"
```

With a custom config directory:

```yaml
apps:
  - name: "micro"
    command: "micro"
    args: "-config-dir ~/.config/micro-tuidoscope"
```

With plugin enabled:

```yaml
apps:
  - name: "micro"
    command: "micro"
    env:
      MICRO_TRUECOLOR: "1"  # Enable true color support
```

Open file at a specific line:

```yaml
apps:
  - name: "micro"
    command: "micro"
    args: "+42 src/main.go"  # Open at line 42
    cwd: "~/projects/myapp"
```

Read-only mode (view files without editing):

```yaml
apps:
  - name: "micro (viewer)"
    command: "micro"
    args: "-readonly true ~/logs/app.log"
```

### Editor Tips

- Editors work well without `autostart` - launch them when you need to edit
- Set `cwd` to your project root so relative paths work correctly
- Most editors support opening directories for file browsing - useful for project navigation
- Neovim and Helix use modal editing (vim-style), while micro uses standard keybindings
- For Neovim with many plugins, consider a minimal config for faster startup in tuidoscope
- Helix has built-in LSP support - no plugins needed for code intelligence
- micro is excellent for quick edits if you're not familiar with vim keybindings
- Consider setting `TERM=xterm-256color` in `env` if you see color issues

---

## AI Coding Agent Examples

AI coding agents are terminal-based tools that use large language models to help write, review, and debug code. They work exceptionally well in tuidoscope - run the AI agent in one tab while monitoring system resources, browsing files, or running tests in others.

### Claude Code

Anthropic's official CLI for Claude, providing AI-powered coding assistance.

```yaml
apps:
  - name: "claude"
    command: "claude"
    cwd: "~/projects/myapp"
```

Start in a specific project:

```yaml
apps:
  - name: "claude (project)"
    command: "claude"
    cwd: "~/projects/myapp"
    env:
      ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}"  # Uses your shell's env var
```

With a specific model:

```yaml
apps:
  - name: "claude"
    command: "claude"
    args: "--model claude-sonnet-4-20250514"
    cwd: "~/projects/myapp"
```

### OpenCode

An open source AI coding agent with support for multiple LLM providers.

```yaml
apps:
  - name: "opencode"
    command: "opencode"
    cwd: "~/projects/myapp"
```

With a specific provider and model:

```yaml
apps:
  - name: "opencode"
    command: "opencode"
    cwd: "~/projects/myapp"
    env:
      OPENCODE_MODEL: "anthropic/claude-sonnet-4-20250514"
```

In a git worktree workflow:

```yaml
apps:
  - name: "opencode (feature)"
    command: "opencode"
    cwd: "~/projects/myapp-feature-branch"
```

### Aider

AI pair programming in your terminal - works with many LLM providers.

```yaml
apps:
  - name: "aider"
    command: "aider"
    cwd: "~/projects/myapp"
```

With Claude:

```yaml
apps:
  - name: "aider"
    command: "aider"
    args: "--model claude-3-5-sonnet-20241022"
    cwd: "~/projects/myapp"
    env:
      ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}"
```

With OpenAI:

```yaml
apps:
  - name: "aider"
    command: "aider"
    args: "--model gpt-4o"
    cwd: "~/projects/myapp"
    env:
      OPENAI_API_KEY: "${OPENAI_API_KEY}"
```

Watch mode (auto-commit changes):

```yaml
apps:
  - name: "aider (watch)"
    command: "aider"
    args: "--auto-commits --watch"
    cwd: "~/projects/myapp"
```

Architect mode (planning without editing):

```yaml
apps:
  - name: "aider (architect)"
    command: "aider"
    args: "--architect"
    cwd: "~/projects/myapp"
```

### Codex CLI

OpenAI's Codex-based CLI assistant.

```yaml
apps:
  - name: "codex"
    command: "codex"
    cwd: "~/projects/myapp"
```

With a specific model:

```yaml
apps:
  - name: "codex"
    command: "codex"
    args: "--model o4-mini"
    cwd: "~/projects/myapp"
    env:
      OPENAI_API_KEY: "${OPENAI_API_KEY}"
```

### Gemini CLI

Google's Gemini-powered coding assistant.

```yaml
apps:
  - name: "gemini"
    command: "gemini"
    cwd: "~/projects/myapp"
```

With authentication:

```yaml
apps:
  - name: "gemini"
    command: "gemini"
    cwd: "~/projects/myapp"
    env:
      GOOGLE_API_KEY: "${GOOGLE_API_KEY}"
```

### AI Coding Agent Tips

- Set `cwd` to your project root - AI agents need context from your codebase
- Keep API keys in your shell environment rather than hardcoding them in config
- AI agents work great alongside a file manager tab for context navigation
- Consider having multiple agent tabs for different projects or feature branches
- Most agents have high memory usage - monitor with htop/btop in another tab
- Use `restart_on_exit: false` as agents naturally exit after completing tasks
- For long sessions, the agent may consume significant tokens - be aware of costs
