# Pangool Installation — Staff Guide

This document explains how the Pangool oracle installation works and how to keep it running. You do not need to be a programmer to follow this guide.

---

## How It Works

The installation has two devices connected by a single Ethernet cable:

```
┌─────────────────────────────────────────────────────────┐
│  Inside the sculpture                                   │
│                                                         │
│   ┌───────────┐   Ethernet cable   ┌──────────────┐    │
│   │   iPad    │ ←────────────────→ │   Mac Mini   │    │
│   │ (screen)  │                    │  (computer)  │    │
│   └───────────┘                    └──────┬───────┘    │
│                                           │            │
│                                    3.5mm audio cable   │
│                                           │            │
│                                    ┌──────┴───────┐    │
│                                    │   Speaker    │    │
│                                    └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**The Mac Mini is the brain.** It holds all the software, generates the divinations, and produces the spoken audio. It runs a small web server that the iPad connects to.

**The iPad is just a screen.** It runs Safari (the web browser) pointed at the Mac Mini. When a visitor taps the screen, the iPad sends that tap to the Mac Mini. The Mac Mini generates a response and sends the text back for the iPad to display. The iPad never does any "thinking" — it just shows what the Mac Mini tells it to.

**The speaker is wired to the Mac Mini.** Audio comes out of the Mac Mini's headphone jack, through a cable, into the speaker hidden in the sculpture. The iPad does not produce any sound.

**There is no internet.** The two devices talk directly to each other over the Ethernet cable using private addresses (like a tiny two-person network). Nothing goes online. The AI model runs entirely on the Mac Mini.

---

## What the Visitor Experiences

1. **Home screen** — A pulsing "Ask the Pangool" button on a dark screen
2. **Theme selection** — Six themes to choose from: work, love, health, fortune, growth, being
3. **Listening** — The iPad can optionally listen to a spoken question (or the visitor taps "skip")
4. **Thinking** — The screen shows "The ancestors are thinking..." while the Mac Mini generates a divination
5. **Answer** — The divination text appears letter by letter on screen. Simultaneously, the speaker in the sculpture speaks the same words aloud
6. **End** — A "Thank You" screen with visual effects. After 15 seconds, it automatically returns to the home screen for the next visitor

If no one interacts for 5 minutes, the app resets itself to the home screen.

---

## Daily Operations

### The installation is designed to run itself. Under normal conditions, you do not need to do anything.

The Mac Mini:
- **Starts all services automatically** when it boots (no need to open apps or type commands)
- **Reboots itself every night at 3:00 AM** to stay fresh (this happens during closed hours)
- **Auto-restarts after a power outage** — once power returns, the Mac Mini boots up and everything starts again
- **Never sleeps** — sleep, screen saver, and auto-updates are all disabled

The iPad:
- Is **locked into the Pangool app** via Guided Access (visitors cannot exit to the home screen)
- **Automatically reconnects** if the Mac Mini restarts — it shows a "the pangool is resting..." message and polls until the server comes back
- Should stay **plugged in at all times**

---

## Troubleshooting

### The iPad shows "the pangool is resting..."

This means the iPad cannot reach the Mac Mini. Check in this order:

1. **Is the Mac Mini powered on?** Check that the power light is on. If not, press the power button.
2. **Is the Ethernet cable plugged in on both ends?** The cable goes from the iPad's USB-C adapter to the Mac Mini's Ethernet port. Push both ends in firmly.
3. **Wait 2 minutes.** The Mac Mini may be rebooting (it does this every night at 3 AM). The iPad will reconnect automatically once the server is back.

If it's still down after a few minutes, restart the Mac Mini (unplug power, wait 10 seconds, plug back in). Everything starts automatically on boot.

### The iPad screen is frozen or unresponsive

1. **Triple-click the Top Button** on the iPad (the physical button on the top edge)
2. Enter the Guided Access passcode: `________` *(fill in your chosen passcode)*
3. Tap **End** to exit Guided Access
4. Close Safari (swipe up from the bottom, swipe Safari away)
5. Reopen Safari — it should automatically load the Pangool app
6. If it doesn't, type `http://10.0.0.1:8000` in the address bar
7. **Triple-click the Top Button** again → select Guided Access → tap Start to re-lock

### No audio from the speaker

Audio comes from the **Mac Mini**, not the iPad. Check:

1. Is the audio cable (3.5mm) firmly plugged into the Mac Mini's headphone jack?
2. Is the other end plugged into the speaker?
3. Is the speaker powered on?
4. On the Mac Mini, check that the volume is not muted: click the speaker icon in the menu bar (top-right of screen) and make sure the volume slider is up and "Output" is set to headphones/line out

### The divination text appears but no audio plays

The text-to-speech system may have an issue. This does not affect the visitor experience visually — they still see the full divination. The audio will likely resume on the next visitor interaction. If it persists across multiple visitors, restart the Mac Mini.

### iPad is not charging

- Check that the USB-C cable is connected to both the iPad and a power source
- If using a USB-C hub (Ethernet + charging in one adapter), make sure the hub's power input is connected
- The iPad may show "Charging On Hold" at 80% — this is a normal battery health feature and is fine for long-term use
- Try a different power adapter if available (20W minimum)

---

## Cables & Connections Summary

| Cable | From | To | What it does |
|---|---|---|---|
| Ethernet cable | iPad (via USB-C adapter) | Mac Mini Ethernet port | Connects the screen to the computer |
| USB-C power cable | Wall outlet | iPad (or USB-C hub) | Keeps the iPad charged |
| 3.5mm audio cable | Mac Mini headphone jack | Speaker | Carries the oracle's voice |
| Power cable | Wall outlet | Mac Mini | Powers the computer |
| Power cable | Wall outlet | Speaker | Powers the speaker (if not USB-powered) |

**Important:** If any cable is disconnected and reconnected, give the system 1–2 minutes to recover. The iPad will reconnect automatically.

---

## If You Need to Restart Everything From Scratch

If things are seriously broken and you need a full reset:

1. **Unplug the Mac Mini** from power. Wait 10 seconds. Plug it back in.
2. **Wait 2–3 minutes** for it to boot and start all services.
3. On the iPad, the "the pangool is resting..." message should disappear and the home screen should appear.
4. If the iPad is not in Guided Access mode, re-lock it (see "iPad screen is frozen" above).

That's it. The Mac Mini is configured to start everything automatically on boot.

---

## Emergency Contact

If the installation is down and you cannot resolve it with the steps above:

- **Name:** `________________________`
- **Phone:** `________________________`
- **Email:** `________________________`

---

## Technical Details (for IT staff only)

- Mac Mini IP: `10.0.0.1`
- iPad IP: `10.0.0.2`
- Web server: `http://10.0.0.1:8000`
- Health check: `http://10.0.0.1:8000/api/health` (should return `{"status":"ok"}`)
- Services managed by launchd (auto-start, auto-restart on crash):
  - `com.pangool.backend` — the web server
  - `com.pangool.ollama` — the AI model server
  - `com.pangool.nightly-reboot` — 3 AM daily reboot
- Logs are at: `/path/to/pangool/logs/` on the Mac Mini
- Guided Access passcode: `________` *(record securely)*
- To manually check services: open Terminal on the Mac Mini and run `launchctl list | grep pangool`
