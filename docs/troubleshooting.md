# Troubleshooting

This guide covers common issues and their solutions when using tuidoscope.

---

## Ctrl+C Behavior

### Issue: Ctrl+C exits the entire app (older versions)

**Symptom:** Pressing `Ctrl+C` in the terminal exits tuidoscope instead of sending SIGINT to the running process.

**Solution:** This was fixed in v0.2.0. Update to the latest version:

```bash
bun install -g tuidoscope@latest
```

### Current Ctrl+C Behavior

In current versions:
- **Terminal Mode:** `Ctrl+C` is passed directly to the PTY and interrupts the running process (expected behavior)
- **Tabs Mode:** `Ctrl+C` displays a hint: "Press Leader+q to quit" - it does **not** exit the app

If you need to quit tuidoscope, use `Leader + q` (default: `Ctrl+A` then `q`).

---

## Terminal Rendering Issues

### Garbled or corrupted display

**Symptoms:**
- Characters appearing in wrong positions
- Colors not displaying correctly
- Terminal UI elements misaligned

**Solutions:**

1. **Check your TERM setting:**
   ```bash
   echo $TERM
   ```
   Tuidoscope works best with `xterm-256color`. If your terminal uses a different TERM, you can override it per-app:
   ```yaml
   apps:
     - name: "Shell"
       command: "bash"
       env:
         TERM: "xterm-256color"
   ```

2. **Resize your terminal:** Some rendering issues resolve after resizing the window.

3. **Restart the app:** Use `Leader + r` to restart the current application.

### TUI apps not displaying correctly

Some TUI applications have specific TERM requirements:

```yaml
apps:
  - name: "htop"
    command: "htop"
    env:
      TERM: "xterm-256color"
      COLORTERM: "truecolor"
```

---

## Theme and Color Issues

### Colors not applying correctly

**Symptom:** Theme colors from config aren't being used.

**Solutions:**

1. **Check YAML syntax:** Ensure hex colors are quoted:
   ```yaml
   theme:
     primary: "#82aaff"    # Correct
     # primary: #82aaff    # May cause issues
   ```

2. **Verify config location:** Tuidoscope loads config from:
   - `./tuidoscope.yaml` (local directory first)
   - `~/.config/tuidoscope/tuidoscope.yaml`

3. **Check for syntax errors:**
   ```bash
   cat ~/.config/tuidoscope/tuidoscope.yaml | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"
   ```

### Terminal doesn't support 24-bit color

If your terminal doesn't support truecolor, colors may appear different. Check support:

```bash
echo $COLORTERM  # Should be "truecolor" or "24bit"
```

Most modern terminals (Alacritty, iTerm2, GNOME Terminal, Konsole, WezTerm, Ghostty) support truecolor.

---

## App Launch Issues

### "Command not found" error

**Symptom:** App shows error: `command not found: <app>`

**Solutions:**

1. **Verify the command exists:**
   ```bash
   which htop
   ```

2. **Use full path if needed:**
   ```yaml
   apps:
     - name: "htop"
       command: "/usr/bin/htop"
   ```

3. **Check PATH in the spawned shell:** Tuidoscope inherits your environment, but some shells may not load `.bashrc`/`.zshrc` in non-interactive mode.

### App starts but immediately exits

**Symptom:** App flashes briefly then disappears.

**Solutions:**

1. **Check the app's exit code:** The app may be exiting due to an error. Try running it directly:
   ```bash
   htop
   ```

2. **Enable restart on exit** to see what happens:
   ```yaml
   apps:
     - name: "MyApp"
       command: "myapp"
       restart_on_exit: true
   ```

3. **Check for missing dependencies:** Some TUI apps require specific libraries or configurations.

---

## Session Persistence Issues

### Session not being restored

**Symptom:** Previously running apps don't restart when reopening tuidoscope.

**Solutions:**

1. **Ensure `persist` is enabled:**
   ```yaml
   session:
     persist: true
   ```

2. **Check state directory permissions:**
   ```bash
   ls -la ~/.local/state/tuidoscope/
   ```

3. **Verify session file exists:**
   ```bash
   cat ~/.local/state/tuidoscope/session.json
   ```

### Session file location

By default, the session is stored at `~/.local/state/tuidoscope/session.json`. You can customize this:

```yaml
session:
  persist: true
  file: "/custom/path/session.json"
```

---

## Keybind Conflicts

### Leader key conflicts with terminal emulator

**Symptom:** Pressing the leader key (e.g., `Ctrl+A`) triggers a terminal emulator action instead of tuidoscope.

**Solutions:**

1. **Change tuidoscope's leader key:**
   ```yaml
   keybinds:
     leader:
       key: "ctrl+b"  # Or alt+space, ctrl+\, etc.
   ```

2. **Disable the conflicting shortcut** in your terminal emulator settings.

### Leader key conflicts with nested tmux/screen

**Symptom:** Can't send leader key to nested tmux session.

**Solution:** Double-tap the leader key. The first press activates leader mode, the second sends the actual key to the terminal.

For example, if both tuidoscope and tmux use `Ctrl+A`:
- `Ctrl+A` `Ctrl+A` → Sends `Ctrl+A` to the nested tmux

### Keys not working in Terminal Mode

**Symptom:** Navigation keys like `j`/`k` don't work.

**Explanation:** In Terminal Mode, all keys (except the leader key) are passed to the terminal application. This is by design.

**Solution:** Press `Leader + a` to switch to Tabs Mode, where navigation keys work directly.

---

## FAQ

### How do I quit tuidoscope?

Press `Leader + q` (default: `Ctrl+A` then `q`).

### How do I add a new tab?

Press `Leader + t` (default: `Ctrl+A` then `t`) to open the Add Tab dialog.

### How do I switch between Terminal and Tabs mode?

Press `Leader + a` (default: `Ctrl+A` then `a`).

### How do I interrupt a running process?

In Terminal Mode, press `Ctrl+C` - it's passed directly to the terminal and sends SIGINT to the running process.

### Can I use tuidoscope inside tmux?

Yes! If both use `Ctrl+A` as the prefix/leader, double-tap `Ctrl+A` to send it to tmux. Or configure different keys for each.

### Where is my config file?

```bash
# Default location:
~/.config/tuidoscope/tuidoscope.yaml

# Or in current directory:
./tuidoscope.yaml
```

### How do I reset to defaults?

Delete or rename your config file:
```bash
mv ~/.config/tuidoscope/tuidoscope.yaml ~/.config/tuidoscope/tuidoscope.yaml.bak
```

Then restart tuidoscope - the onboarding wizard will run again.

---

## Debug Mode

For detailed debugging output, run tuidoscope with the DEBUG environment variable:

```bash
DEBUG=1 tuidoscope
```

This enables verbose logging to help diagnose issues. The logs are written to stderr and can be captured:

```bash
DEBUG=1 tuidoscope 2> debug.log
```

---

## Getting Help

If you encounter an issue not covered here:

1. Check the [GitHub Issues](https://github.com/your-username/tuidoscope/issues)
2. Open a new issue with:
   - Your OS and terminal emulator
   - Steps to reproduce
   - Expected vs actual behavior
   - Debug output if available
