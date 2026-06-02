# Claude Reels (experimental, macOS only)

The inverse of the arcade. Instead of a game that plays while Claude works,
**Instagram Reels play in your browser while Claude is working and freeze the
instant Claude stops** — snapping focus back to your terminal. No prompt
running = no reels. It turns the wait into the only time you're allowed to doom-
scroll, and cuts you off the moment there's work to look at.

## How it works

- `UserPromptSubmit` → opens `instagram.com/reels` on the first prompt, brings
  the browser forward, and plays the in-view reel.
- `Stop` (Claude finished) → pauses the reel and activates your terminal.
- A per-session **daemon** enforces the lock: while idle it re-pauses the reel
  every ~1.2s, so even if you flip to the tab and hit play it freezes again. In
  `strict` mode it also bounces focus back to the terminal if you open the reels
  tab while idle.

Pause/play is done by injecting JS into the reel's `<video>` element via
AppleScript, so it works whether or not the browser is focused. It's the same
play/paused state-file model as the arcade, in its own runtime dir, gated behind
a marker file so the arcade stays the default.

## Setup

1. Enable it: `/reels on` (or `bash reels/toggle.sh on`).
2. Let the browser take JS from AppleScript (one-time):
   - **Chrome / Brave / Edge:** View → Developer → **Allow JavaScript from Apple
     Events**, then restart the browser.
   - **Safari:** Settings → Advanced → **Show features for web developers**, then
     Develop → **Allow JavaScript from Apple Events**.
3. On the first prompt, macOS asks the terminal for permission to control the
   browser and System Events — click **OK** (one-time per app).
4. Be logged into Instagram in that browser.

`/reels status` reports whether the JS bridge is live. `/reels off` disables it
and restores the arcade.

## Config (`~/.claude-arcade/config.json`, `reels` key)

| field   | default                              | meaning |
|---------|--------------------------------------|---------|
| browser | `chrome`                             | `chrome`, `brave`, `edge`, or `safari` |
| url     | `https://www.instagram.com/reels/`   | tab opened on first prompt |
| lock    | `soft`                               | `soft` freezes the reel while idle; `strict` also yanks focus off the tab |
| pollMs  | `1200`                               | how often the idle lock re-checks |

## Known limitations

- **macOS only** (AppleScript). No-op elsewhere.
- **Sound:** browsers block programmatic play-with-sound without a user gesture.
  Muted autoplay starts fine; you may need one manual unmute click per session.
  Pausing always works.
- Chromium forks share Chrome's automation dictionary, so `brave`/`edge` work.
  **Arc** does not expose the same dictionary and is unsupported.
- One reels session per browser at a time — multiple concurrent Claude sessions
  share the one browser and will both drive the same tab.
