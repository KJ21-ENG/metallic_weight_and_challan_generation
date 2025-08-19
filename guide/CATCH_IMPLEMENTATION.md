# Catch Button Implementation & Scale Integration Guide

This document explains what was added and changed to implement the **Catch** button in the Challan module, how it works both in browser and in the Electron desktop app, how to test it, and how to configure the weight-scale integration.

---

## Summary (what we added)
- A reusable React component `Catch` that sits next to the "Gross Weight" input in the Challan page.
- A serial-backed weight reading service for Electron: `weightScaleService` that auto-detects and reads a connected scale.
- IPC handlers in the Electron main process to control the scale from the renderer: connect, auto-detect, disconnect, capture, and list ports.
- Renderer wiring: the Challan page uses the `Catch` component and accepts values read from the scale (rounded to 3 decimals).

Files added/modified (high level):
- Added: `client/src/components/Catch.tsx` (the Catch button + settings)
- Modified: `client/src/pages/Challan.tsx` (wires Catch to Gross Weight and shows 3-decimal values)
- Added: `metallic_electron_app/backend/services/weightScaleService.js` (serial port scale reader)
- Modified: `metallic_electron_app/main.js` (loads service and exposes IPC handlers)
- Modified: `metallic_electron_app/preload.js` (exposes scale IPC helpers to renderer)

---

## How the Catch flow works

1. User clicks the `Catch` button in the Challan form.
2. `Catch` first attempts to call the Electron IPC `capture-weight` (via `window.electron` exposed by the preload script). If running in Electron and the scale service is connected, it waits for a reading and returns a numeric weight.
3. If `capture-weight` fails (or the app is running in a normal browser), `Catch` falls back to calling `read-weight` (a simpler IPC handler that opens a small manual input modal in main process), then finally to a `window.prompt` asking the user to type the weight.
4. When a numeric weight is received, the `Catch` component rounds it to 3 decimal places and calls the `onCatch` callback, which in the Challan page sets `form.gross_wt`.
5. The Challan UI displays gross weight with three decimals and updates computed tare/net fields accordingly.

Notes:
- The default rounding precision for the `Catch` settings is 3 decimals.
- When scale returns fewer decimals (e.g., "34.97"), the code stores/show it as `34.970`.

---

## IPC channels (renderer ⇄ main)

The following channels are available (exposed via `preload.js` and `window.electron`):

- `capture-weight` — attempt to read a single weight from the connected scale (preferred).
- `read-weight` — fallback handler that opens a small modal input in the main process (manual entry).
- `connect-weight-scale` — request the main process to connect to a serial port (options: `{port, baudRate}`).
- `auto-detect-weight-scale` — request auto-detection and connect attempt.
- `disconnect-weight-scale` — disconnect from the scale.
- `get-available-ports` — list serial ports visible to the system.
- `weight-scale-status` — boolean status of whether the scale service is connected.

These are handled in `metallic_electron_app/main.js` and the serial logic is implemented in `metallic_electron_app/backend/services/weightScaleService.js`.

---

## weightScaleService behavior

- Uses `serialport` to enumerate and open serial devices.
- Default settings (can be changed in code or passed via IPC options):
  - macOS default port hint: `/dev/tty.usbserial-140`
  - Default baud rate: `2400`
- Auto-detection logic tries common USB/serial path patterns and listens for weight-like data (bracketed values like `[12345]` or decimal text like `[9.990]`).
- Parses incoming bytes with heuristics (handles a few common formats) and emits a `weight` event. `captureWeight()` waits for the next emitted weight.

---

## Installation / Dependencies

The Electron side requires `serialport`. Install dependencies from the `metallic_electron_app` folder:

```bash
cd metallic_electron_app
npm install
# if serialport is not installed automatically, install it explicitly:
npm install serialport
```

If you make changes to backend/server/client, install their deps as needed.

---

## Running (development)

- Start server and client as in the repository README. To run Electron in dev with the local client:

```bash
# in project root
cd metallic_electron_app
npm run dev
```

This script expects the client and server dev servers to be running (see `package.json` scripts in `metallic_electron_app`).

---

## How to test the Catch button

1. Ensure the scale is physically connected and that macOS shows it as a serial device. Example list command (macOS/Linux):

```bash
ls -l /dev/tty.* /dev/cu.*
```

Look for `usbserial`/`usbmodem` entries such as `/dev/tty.usbserial-110`.

2. Launch Electron with `npm run dev` (from `metallic_electron_app`) after starting server and client.
3. Open the Challan page and click `Catch` next to the Gross Weight field:
   - If the scale is connected and `weightScaleService` auto-detects it, the app will capture the numeric weight and populate the field (rounded to 3 decimals).
   - If the scale is not available or capture fails, a small modal (manual input) will appear; enter weight and press OK.

4. Verify Gross shows 3 decimals, and Tare/Net update correctly.

---

## Configuration

- To force a particular serial port, pass `{ port: '/dev/tty.usbserial-110', baudRate: 2400 }` to the `connect-weight-scale` IPC call (or modify `weightScaleService.defaultPort`).
- You can also set environment variables used by your packaging/run scripts to provide port hints, but the current implementation prefers the IPC `connect-weight-scale` with explicit options.

---

## Troubleshooting

- If `Catch` opens the manual popup, it means `capture-weight` failed or the service is not connected.
  - Check system serial devices with `ls /dev/tty.*` or `ls /dev/cu.*`.
  - From Electron console (main process stdout), look for logs indicating connection attempts or parsing errors.
  - Ensure `serialport` is installed in `metallic_electron_app`.

- If you see non-numeric or malformed output from the scale, copy a sample raw line (copy from `screen` or `cat <device>`) and share it — the parsing heuristics can be adjusted to match your scale's format.

---

## Reverting / Removing

- To revert the `Catch` changes, remove `client/src/components/Catch.tsx` and the modifications in `client/src/pages/Challan.tsx`.
- To remove serial integration, delete `metallic_electron_app/backend/services/weightScaleService.js` and the IPC handlers in `metallic_electron_app/main.js` and revert `preload.js` changes.

---

## Notes & Next steps

- The current implementation is modelled on a working reference project. If you want to further match exact UI/UX (e.g., auto-poll mode, hold/lock behavior, keyboard shortcuts), we can port those features next.
- If you want the app to run the scale service in a separate child process or add native packaging instructions, I can prepare those steps.


---

End of guide.


