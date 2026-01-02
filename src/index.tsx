import { render, extend } from "@opentui/solid"
import { GhosttyTerminalRenderable } from "ghostty-opentui/terminal-buffer"
import { App } from "./app"
import { loadConfig } from "./lib/config"
import { initSessionPath, restoreSession } from "./lib/session"

extend({ "ghostty-terminal": GhosttyTerminalRenderable })

async function main() {
  try {
    // Load configuration
    const config = await loadConfig()

    // Initialize session path
    initSessionPath(config)

    // Restore session if persistence is enabled
    const session = config.session.persist ? await restoreSession() : null

    // Render the app using opentui/solid
    await render(() => <App config={config} session={session} />)

    // Handle process signals for graceful shutdown
    const handleShutdown = () => {
      console.log("\nShutting down tuidoscope...")
      process.exit(0)
    }

    process.on("SIGINT", handleShutdown)
    process.on("SIGTERM", handleShutdown)

  } catch (error) {
    console.error("Failed to start tuidoscope:", error)
    process.exit(1)
  }
}

main()
