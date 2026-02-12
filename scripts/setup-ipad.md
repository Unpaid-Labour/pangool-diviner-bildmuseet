# iPad Setup Guide — Pangool Museum Installation

## Prerequisites
- iPad with USB-C port (iPad Pro or iPad Air)
- USB-C to Ethernet adapter (with pass-through charging recommended)
- Ethernet cable connected to Mac Mini
- USB-C power adapter

## Step 1: Network Configuration

1. Connect the USB-C to Ethernet adapter to the iPad
2. Connect the Ethernet cable from the adapter to the Mac Mini
3. Go to **Settings → Ethernet**
4. Tap **Configure IP** → **Manual**
   - IP Address: `10.0.0.2`
   - Subnet Mask: `255.255.255.0`
   - Router: (leave blank)
5. Verify connectivity: open Safari, navigate to `http://10.0.0.1:8000/api/health`

## Step 2: Disable Unwanted Features

### Wi-Fi & Bluetooth
- **Settings → Wi-Fi** → Turn OFF
- **Settings → Bluetooth** → Turn OFF

### Notifications
- **Settings → Notifications** → Turn off for ALL apps

### Auto-Lock & Display
- **Settings → Display & Brightness → Auto-Lock** → **Never**
- **Settings → Display & Brightness → Brightness** → Set to desired level

### Software Updates
- **Settings → General → Software Update → Automatic Updates** → Turn OFF all options

### Screen Time (if active)
- **Settings → Screen Time** → Turn OFF

## Step 3: Safari Configuration

1. Open Safari
2. Navigate to `http://10.0.0.1:8000`
3. Wait for the Pangool app to load fully
4. Optionally add to Home Screen:
   - Tap Share button → "Add to Home Screen" → "Add"

## Step 4: Guided Access (Kiosk Mode)

### Enable Guided Access
1. **Settings → Accessibility → Guided Access** → Turn ON
2. Set a **passcode** (for staff exit only — remember this!)
3. Enable **Display Auto-Lock** → Never (within Guided Access settings)

### Activate Guided Access
1. Open the Pangool app in Safari (or from Home Screen)
2. **Triple-click the Top Button** (or Home button on older iPads)
3. Select **Guided Access**
4. Tap **Options** in the bottom-left:
   - **Touch**: ON (allow touch interaction)
   - **Motion**: OFF (disable device rotation)
   - **Keyboards**: OFF (disable keyboard popup)
   - **Time Limit**: OFF
5. Tap **Start** in the top-right

### Exit Guided Access (staff only)
- **Triple-click the Top Button** → Enter passcode → **End**

## Step 5: Power Management

- Keep the iPad plugged in at all times via the USB-C power adapter
- If using a USB-C hub with Ethernet + charging, a single cable handles both
- The iPad may show "charging on hold" at 80% — this is normal and fine for long-term use

## Troubleshooting

### App shows "the pangool is resting..."
- The backend is unreachable. Check:
  1. Ethernet cable is firmly connected
  2. Mac Mini is powered on
  3. Backend service is running: `curl http://10.0.0.1:8000/api/health`

### Screen is frozen
- Exit Guided Access (triple-click → passcode → End)
- Close Safari and reopen
- Navigate back to `http://10.0.0.1:8000`
- Re-enable Guided Access

### iPad won't charge
- Check the USB-C adapter and cable
- Try a different power adapter (minimum 20W recommended)

### Audio not playing
- Audio plays from the Mac Mini speaker, NOT the iPad
- Check the Mac Mini's audio output settings and cable connections
