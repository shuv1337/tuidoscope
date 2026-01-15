import { render, extend } from "@opentui/solid"
import { App } from "./app"
import { loadConfig } from "./lib/config"
import { debugLog } from "./lib/debug"
import { connectSessionClient, shutdownSessionServer } from "./lib/session-client"
import { startSessionServer } from "./lib/session-server"

async function main() {
  try {
    debugLog("[init] main() started")

    const args = new Set(process.argv.slice(2))
    if (args.has("--shutdown")) {
      debugLog("[init] Shutdown requested")
      const didShutdown = await shutdownSessionServer()
      if (!didShutdown) {
        console.error("No running tuidoscope session server found.")
        process.exit(1)
      }
      return
    }
    if (args.has("--server")) {
      debugLog("[init] Starting session server")
      await startSessionServer()
      return
    }
    
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
    const { config } = await loadConfig()
    debugLog("[init] Config loaded")

    const sessionClient = await connectSessionClient()

    // Render the app using opentui/solid
    debugLog("[init] Calling render()...")
    try {
      await render(() => <App config={config} sessionClient={sessionClient} />)
      debugLog("[init] render() completed")
    } catch (renderError) {
      debugLog(`[init] ERROR in render(): ${renderError}`)
      debugLog(`[init] Stack: ${renderError instanceof Error ? renderError.stack : 'no stack'}`)
      throw renderError
    }

    // Handle process signals for graceful shutdown
    const handleShutdown = () => {
      debugLog("[init] Shutdown signal received")
      sessionClient.disconnect()
      process.exit(0)
    }

    // SIGINT (Ctrl+C) is handled in the keyboard event handler to allow
    // passthrough to the active PTY. SIGTERM is kept for external termination.
    process.on("SIGTERM", handleShutdown)

  } catch (error) {
    debugLog(`[init] FATAL ERROR: ${error}`)
    debugLog(`[init] Stack: ${error instanceof Error ? error.stack : 'no stack'}`)
    console.error("Failed to start tuidoscope:", error)
    process.exit(1)
  }
}

main()
