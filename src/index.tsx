import { render, extend } from "@opentui/solid"
import { App } from "./app"
import { loadConfig } from "./lib/config"
import { initSessionPath, restoreSession } from "./lib/session"
import { debugLog } from "./lib/debug"

async function main() {
  try {
    debugLog("[init] main() started")
    
    // Dynamic import to catch module resolution errors
    debugLog("[init] Importing ghostty-opentui/terminal-buffer...")
    let GhosttyTerminalRenderable: any
    try {
      const module = await import("ghostty-opentui/terminal-buffer")
      GhosttyTerminalRenderable = module.GhosttyTerminalRenderable
      debugLog("[init] ghostty-opentui/terminal-buffer imported successfully")
    } catch (importError) {
      debugLog(`[init] ERROR importing ghostty-opentui: ${importError}`)
      console.error("Failed to import ghostty-opentui/terminal-buffer:", importError)
      process.exit(1)
    }
    
    // Register the ghostty-terminal component
    debugLog("[init] Calling extend() to register ghostty-terminal...")
    extend({ "ghostty-terminal": GhosttyTerminalRenderable })
    debugLog("[init] extend() completed")
    
    // Load configuration
    const { config, configFileFound } = await loadConfig()
    debugLog(`[init] Config loaded (configFileFound: ${configFileFound})`)

    // Initialize session path
    initSessionPath(config)

    // Restore session if persistence is enabled
    const session = config.session.persist ? await restoreSession() : null
    debugLog("[init] Session restored (or skipped)")

    // Render the app using opentui/solid
    debugLog("[init] Calling render()...")
    try {
      await render(() => <App config={config} session={session} />)
      debugLog("[init] render() completed")
    } catch (renderError) {
      debugLog(`[init] ERROR in render(): ${renderError}`)
      debugLog(`[init] Stack: ${renderError instanceof Error ? renderError.stack : 'no stack'}`)
      throw renderError
    }

    // Handle process signals for graceful shutdown
    const handleShutdown = () => {
      debugLog("[init] Shutdown signal received")
      process.exit(0)
    }

    process.on("SIGINT", handleShutdown)
    process.on("SIGTERM", handleShutdown)

  } catch (error) {
    debugLog(`[init] FATAL ERROR: ${error}`)
    debugLog(`[init] Stack: ${error instanceof Error ? error.stack : 'no stack'}`)
    console.error("Failed to start tuidoscope:", error)
    process.exit(1)
  }
}

main()
