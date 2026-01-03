export interface AppPreset {
  id: string
  name: string
  command: string
  description: string
  icon: string
}

export const APP_PRESETS: AppPreset[] = [
  {
    id: "shell",
    name: "Shell",
    command: process.env.SHELL || "/bin/bash",
    description: "Your default shell",
    icon: "$",
  },
  {
    id: "htop",
    name: "htop",
    command: "htop",
    description: "Interactive process viewer",
    icon: "H",
  },
  {
    id: "btop",
    name: "btop",
    command: "btop",
    description: "Resource monitor",
    icon: "B",
  },
  {
    id: "lazygit",
    name: "lazygit",
    command: "lazygit",
    description: "Git TUI client",
    icon: "G",
  },
  {
    id: "yazi",
    name: "yazi",
    command: "yazi",
    description: "Terminal file manager",
    icon: "Y",
  },
  {
    id: "nvim",
    name: "Neovim",
    command: "nvim",
    description: "Text editor",
    icon: "N",
  },
  {
    id: "ranger",
    name: "ranger",
    command: "ranger",
    description: "Console file manager",
    icon: "R",
  },
  {
    id: "ncdu",
    name: "ncdu",
    command: "ncdu",
    description: "Disk usage analyzer",
    icon: "D",
  },
]
