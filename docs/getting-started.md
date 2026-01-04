# Getting Started

## Introduction

**tuidoscope** is a centralized TUI (Text User Interface) management application designed to organize and run multiple TUI applications within embedded terminal windows. Built with [OpenTUI](https://github.com/opentui/opentui) and SolidJS, it provides a unified interface for your favorite terminal tools, allowing you to switch between them quickly and manage them as a single workspace.

By leveraging Ghostty's high-performance terminal emulator, tuidoscope offers a smooth and responsive experience for running everything from simple shells to complex graphical TUIs like `btop` or `lazygit`.

## Use Cases

Tuidoscope is particularly useful for:

- **System Monitoring:** Keep multiple monitoring tools like `htop`, `btop`, `glances`, or `bandwhich` running in separate tabs for quick access.
- **Git Workflow Management:** Manage multiple repositories simultaneously using `lazygit`, `tig`, or `gitui` without cluttering your main terminal.
- **AI-Assisted Development:** Keep AI coding agents like `claude`, `opencode`, or `aider` active in dedicated tabs, ready to assist with your project.
- **File Management:** Organize different file managers like `yazi`, `ranger`, or `lf` for different projects or tasks.
- **Infrastructure Management:** Run `k9s` or `lazydocker` in a centralized dashboard to monitor your containers and clusters.
- **Consolidated Workspace:** Instead of managing multiple terminal tabs or tmux panes manually, tuidoscope provides a structured environment with session persistence, remembering your active apps between restarts.

## Installation

### Prerequisites

- **Bun**: Tuidoscope is built on the [Bun](https://bun.sh/) runtime. You must have Bun installed on your system.
- **Terminal**: A terminal that supports TUI applications (xterm-256color recommended).

### Quick Start (No Install)

You can run tuidoscope immediately using `bunx` without installing it globally:

```bash
bunx tuidoscope
```

### Global Installation

To install tuidoscope globally on your system:

```bash
bun install -g tuidoscope
```

Once installed, you can launch it from any directory:

```bash
tuidoscope
```

## First Run

When you launch tuidoscope for the first time, it detects the absence of a configuration file and automatically starts the **Onboarding Wizard**. This interactive setup helps you configure your workspace in just a few steps.

### Onboarding Wizard Flow

The wizard consists of four main steps:

1.  **Welcome**: A brief introduction to tuidoscope.
2.  **Select Apps**: Choose from a curated list of common TUI application presets (e.g., `htop`, `btop`, `lazygit`, `yazi`). Tuidoscope will check if these tools are installed on your system and grey out any that are missing.
3.  **Custom Apps**: Add your own specific applications by providing a name, command, and optional arguments.
4.  **Review**: A final summary of the applications you've selected. Confirming this step will generate your initial `tuidoscope.yaml` file.

You can also choose to **Skip** the wizard at any point. This will create a basic configuration with no pre-configured apps, allowing you to add them manually later using `Ctrl+T` (New Tab) or by editing the configuration file directly.

Once the wizard is complete, tuidoscope will save your settings to `~/.config/tuidoscope/tuidoscope.yaml` (or your system's equivalent XDG config directory) and launch into the main interface.
