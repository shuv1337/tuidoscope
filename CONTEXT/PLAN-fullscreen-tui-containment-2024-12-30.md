# Plan: Fullscreen TUI App Containment in Embedded Terminal

**Created:** 2024-12-30  
**Status:** Planning  
**Priority:** High

## Problem Statement

Fullscreen TUI applications like lazygit, htop, and vim take over the **entire terminal** when launched inside tuidiscope's embedded terminal panel, instead of being contained within the designated terminal pane. When this happens:

1. The navigation sidebar becomes inaccessible
2. There is no way to escape back to the tuidiscope app
3. Users must kill the terminal entirely to recover

### Root Cause Analysis

The issue stems from how TUI apps interact with the terminal:

1. **Alternate Screen Buffer**: Fullscreen TUI apps use ANSI escape sequences like `\e[?1049h` (or `?47h`, `?1047h`) to switch to the terminal's "alternate screen buffer" - a secondary display area that covers the entire terminal
2. **Direct PTY Passthrough**: Currently, PTY output is stored in a raw buffer and passed to `ghostty-terminal` component, but the escape sequences that control the outer terminal (like alternate screen, window title, cursor visibility) leak through to the parent terminal
3. **Terminal State Leakage**: The escape sequences intended for the embedded terminal are being interpreted by the outer terminal (the one running tuidiscope), causing it to enter fullscreen mode

### Technical Background

The key escape sequences involved:

| Sequence | Description |
|----------|-------------|
| `ESC[?1049h` | Enter alternate screen buffer (xterm new code) |
| `ESC[?1049l` | Leave alternate screen buffer |
| `ESC[?47h` | Enter alternate screen (old xterm code) |
| `ESC[?1047h` | Alternate screen (new xterm code) |
| `ESC[?25l` | Hide cursor |
| `ESC[?25h` | Show cursor |

## Proposed Solution

### Architecture Overview

```
+------------------+     +-------------------+     +------------------+
|  PTY Process     | --> |  Virtual Terminal | --> |  Rendered Output |
|  (lazygit, etc)  |     |  (Ghostty VT)     |     |  (JSON -> TUI)   |
+------------------+     +-------------------+     +------------------+
        |                        |                         |
   Raw ANSI bytes         VT Emulator               Contained display
   with escape codes      interprets ALL            in terminal pane
                          sequences internally
```

The solution leverages **ghostty-opentui's PersistentTerminal** class, which:
- Implements a full virtual terminal emulator
- Interprets ALL escape sequences (including alternate screen buffer)
- Maintains internal terminal state (screen buffer, cursor, modes)
- Outputs rendered content as JSON for display

### Key Changes

1. **Replace raw buffer accumulation with PersistentTerminal state management**
2. **Use `feed()` method for streaming PTY output to virtual terminal**
3. **Render from virtual terminal state instead of raw ANSI buffer**
4. **Virtual terminal contains all escape sequences - they never reach parent terminal**

## Implementation Plan

### Phase 1: Core Architecture Refactor

#### 1.1 Update RunningApp Type to Use PersistentTerminal

**File:** `src/types/index.ts`

- [ ] Add `PersistentTerminal` import from ghostty-opentui
- [ ] Replace `buffer: string` with `terminal: PersistentTerminal | null` in RunningApp interface
- [ ] Add optional `inAlternateScreen: boolean` state tracking (for UI indicators)

```typescript
// Current
export interface RunningApp {
  entry: AppEntry
  pty: PtyProcess
  status: AppStatus
  buffer: string  // Raw ANSI string - PROBLEM: leaks escape codes
}

// Proposed
export interface RunningApp {
  entry: AppEntry
  pty: PtyProcess
  status: AppStatus
  terminal: PersistentTerminal | null  // Virtual terminal - contains all escape codes
  inAlternateScreen?: boolean  // Optional: track if app is fullscreen
}
```

#### 1.2 Refactor App Store to Manage PersistentTerminal

**File:** `src/stores/tabs.ts`

- [ ] Remove `appendToBuffer()` function
- [ ] Add `feedTerminal(id: string, data: string)` function
- [ ] Add `getTerminalJson(id: string)` function for rendering
- [ ] Add `resetTerminal(id: string)` function
- [ ] Ensure proper cleanup of PersistentTerminal in `removeRunningApp()`

#### 1.3 Update App Startup to Create PersistentTerminal

**File:** `src/app.tsx`

- [ ] Import `PersistentTerminal`, `hasPersistentTerminalSupport` from ghostty-opentui
- [ ] In `startApp()`: Create PersistentTerminal with correct cols/rows dimensions
- [ ] Replace PTY `onData` callback to use `terminal.feed(data)` instead of buffer append
- [ ] Update `stopApp()` to properly destroy PersistentTerminal
- [ ] Handle resize events to resize both PTY and PersistentTerminal

### Phase 2: Terminal Pane Rendering Updates

#### 2.1 Update TerminalPane Component

**File:** `src/components/TerminalPane.tsx`

- [ ] Change from `ansi={app().buffer}` to rendering from PersistentTerminal state
- [ ] Use `terminal.getJson()` to get rendered state
- [ ] Use `terminalDataToStyledText()` for conversion to displayable format
- [ ] Or: Refactor to use ghostty-terminal with `persistent={true}` and feed data through ref

**Option A: Direct PersistentTerminal Rendering**
```tsx
// Get terminal state and render
const terminalData = app().terminal?.getJson({ limit: contentHeight() }) 
const styledText = terminalDataToStyledText(terminalData)
// Render styledText using text component
```

**Option B: Use ghostty-terminal in persistent mode with ref** (Recommended)
```tsx
// Pass terminal ref and feed data through it
<ghostty-terminal
  ref={terminalRef}
  persistent={true}
  cols={contentWidth()}
  rows={contentHeight()}
  showCursor
/>
// In PTY onData: terminalRef.feed(data)
```

#### 2.2 Handle Terminal Resize Properly

**File:** `src/app.tsx`

- [ ] When terminal dimensions change, resize both:
  - `ptyProcess.resize(cols, rows)` - already done
  - `persistentTerminal.resize(cols, rows)` - needs to be added
- [ ] Ensure dimension sync between PTY and virtual terminal

### Phase 3: Input Handling Improvements

#### 3.1 Ensure Proper Key Passthrough

**File:** `src/app.tsx`

- [ ] Verify keyboard input reaches PTY correctly (already working)
- [ ] Test special key sequences (Ctrl+C, Ctrl+Z, arrow keys, function keys)
- [ ] Ensure escape key behavior is correct (may need special handling)

#### 3.2 Add Escape Hatch Keybind (Safety Feature)

**File:** `src/lib/keybinds.ts` and `src/types/index.ts`

- [ ] Add a "force exit to tabs" keybind (e.g., `Ctrl+Shift+Escape` or double-tap Escape)
- [ ] This keybind should always work, even when terminal has focus
- [ ] Allows users to recover if something goes wrong

### Phase 4: Testing and Validation

#### 4.1 Manual Testing Checklist

- [ ] **lazygit**: Launch, navigate, stage files, commit, exit cleanly
- [ ] **htop**: Launch, scroll process list, exit with 'q'
- [ ] **vim/nvim**: Open file, edit, save, quit with :q
- [ ] **less/more**: Page through file, exit
- [ ] **tmux**: Create panes, switch windows, detach
- [ ] **fzf**: Fuzzy search, select item
- [ ] **Ctrl+C**: Interrupt running command
- [ ] **Tab completion**: Shell tab completion works
- [ ] **Arrow keys**: Navigation in TUI apps
- [ ] **Function keys**: F1-F12 in apps that use them
- [ ] **Mouse**: If mouse support is desired (optional)

#### 4.2 Edge Case Testing

- [ ] Rapid output (e.g., `yes` command) - verify performance
- [ ] Very long lines - verify wrapping behavior
- [ ] Unicode/emoji content - verify rendering
- [ ] Colors (16, 256, truecolor) - verify color support
- [ ] Resize during fullscreen app - verify resize handling
- [ ] Multiple apps running simultaneously
- [ ] Quick app start/stop cycles

#### 4.3 Automated Tests

**File:** `src/__tests__/terminal-containment.test.ts` (new file)

- [ ] Test that alternate screen sequences don't leak to parent
- [ ] Test PersistentTerminal state management
- [ ] Test resize handling
- [ ] Test cleanup on app stop

### Phase 5: Optional Enhancements

#### 5.1 Visual Indicator for Fullscreen Apps

- [ ] Track when app enters alternate screen mode
- [ ] Show indicator in status bar or tab (e.g., "[fullscreen]")
- [ ] Helps users understand app state

#### 5.2 Performance Optimization

- [ ] Use debounced rendering for high-frequency output
- [ ] Consider `limit` parameter to cap rendered lines
- [ ] Profile and optimize hot paths

#### 5.3 Configuration Options

**File:** `config/default.yaml`

- [ ] Add option to configure escape hatch keybind
- [ ] Add option to show/hide fullscreen indicator

## Code References

### Internal Files

| File | Purpose |
|------|---------|
| `src/app.tsx` | Main app logic, PTY management, keyboard handling |
| `src/components/TerminalPane.tsx` | Terminal display component |
| `src/stores/tabs.ts` | Running app state management |
| `src/types/index.ts` | Type definitions including RunningApp |
| `src/lib/pty.ts` | PTY spawning and management |
| `src/lib/keybinds.ts` | Keybind configuration |

### External References

| Resource | URL |
|----------|-----|
| ghostty-opentui (terminal buffer) | https://github.com/remorses/ghostty-opentui |
| ghostty-opentui terminal-buffer.ts | https://github.com/remorses/ghostty-opentui/blob/main/src/terminal-buffer.ts |
| ghostty-opentui README | https://github.com/remorses/ghostty-opentui/blob/main/README.md |
| Ghostty VT Implementation | https://github.com/ghostty-org/ghostty |
| XTerm Control Sequences | https://invisible-island.net/xterm/ctlseqs/ctlseqs.html |
| r3bl-org PTY Mux Example | https://github.com/r3bl-org/r3bl-open-core/blob/main/docs/task_pty_mux_example.md |
| Alternate Screen Buffer Explanation | https://jameshfisher.com/2017/12/04/how-less-works/ |

### Key API Reference

**PersistentTerminal from ghostty-opentui:**

```typescript
import { PersistentTerminal, hasPersistentTerminalSupport } from "ghostty-opentui"

// Check if persistent terminal is supported (not on Windows)
if (hasPersistentTerminalSupport()) {
  const terminal = new PersistentTerminal({
    cols: 80,
    rows: 24,
  })
  
  // Feed PTY output to virtual terminal
  terminal.feed(ptyOutput)
  
  // Get rendered state as JSON
  const data = terminal.getJson({ limit: 100 })
  
  // Resize
  terminal.resize(newCols, newRows)
  
  // Get cursor position
  const [x, y] = terminal.getCursor()
  
  // Get plain text
  const text = terminal.getText()
  
  // Reset terminal state
  terminal.reset()
  
  // Cleanup
  terminal.destroy()
}
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Performance regression | Medium | Medium | Use debouncing, limit rendered lines, profile |
| Windows incompatibility | High | Low | ghostty-opentui has Windows fallback (plain text) |
| Edge cases with specific apps | Medium | Low | Comprehensive testing, escape hatch keybind |
| Memory usage increase | Low | Low | PersistentTerminal manages memory efficiently |

## Success Criteria

1. **Primary**: Fullscreen TUI apps (lazygit, vim, htop) remain contained within terminal pane
2. **Primary**: Navigation sidebar remains accessible at all times
3. **Primary**: Users can switch tabs and use tuidiscope features while TUI apps run
4. **Secondary**: No perceptible performance degradation
5. **Secondary**: All existing functionality continues to work

## Estimated Effort

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Core Architecture | 3-4 hours |
| Phase 2: Rendering Updates | 2-3 hours |
| Phase 3: Input Handling | 1-2 hours |
| Phase 4: Testing | 2-3 hours |
| Phase 5: Enhancements | 2-3 hours (optional) |
| **Total** | **8-12 hours** |

## Implementation Order

1. **Phase 1.1-1.3**: Core architecture (must be done together)
2. **Phase 2.1-2.2**: Rendering updates
3. **Phase 4.1**: Manual testing to verify basic functionality
4. **Phase 3.1-3.2**: Input handling refinements
5. **Phase 4.2-4.3**: Extended testing
6. **Phase 5** (optional): Enhancements based on testing feedback

## Notes

- The ghostty-opentui library already handles all the heavy lifting of VT emulation
- The key insight is that by using a **virtual terminal**, all escape sequences are interpreted within that virtual context and never leak to the parent terminal
- This is the same approach used by terminal multiplexers like tmux and screen
- The `persistent: true` mode is ~6x faster for streaming use cases compared to recreating the terminal each render
