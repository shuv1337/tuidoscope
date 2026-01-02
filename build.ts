import solidPlugin from "@opentui/solid/bun-plugin"
import { type BunPlugin } from "bun"

// Force solid-js to use client version instead of server version
const solidClientPlugin: BunPlugin = {
  name: "solid-client-redirect",
  setup(build) {
    // Redirect solid-js server imports to client versions
    build.onResolve({ filter: /^solid-js$/ }, (args) => {
      return { path: require.resolve("solid-js/dist/solid.js") }
    })
    build.onResolve({ filter: /^solid-js\/store$/ }, (args) => {
      return { path: require.resolve("solid-js/store/dist/store.js") }
    })
  },
}

const result = await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  target: "bun",
  // Keep native/FFI modules external, bundle solid-js (client version) and @opentui/solid
  external: [
    "node-pty",
    "yoga-layout",
    "@opentui/core",
    "@opentui/core-linux-x64",
    "@opentui/core-darwin-arm64",
    "@opentui/core-darwin-x64",
    "@opentui/core-win32-x64",
    "ghostty-opentui",
  ],
  plugins: [solidClientPlugin, solidPlugin],
})

if (!result.success) {
  console.error("Build failed:")
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log("Build successful!")
