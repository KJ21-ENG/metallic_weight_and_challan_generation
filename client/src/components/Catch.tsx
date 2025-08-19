import React, { useState } from 'react'
import { Button, IconButton, Menu, MenuItem, ListItemText, FormControlLabel, Switch, TextField } from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'

export interface CatchProps {
  disabled?: boolean
  onCatch: (weightKg: number) => void
}

const STORAGE_KEY = 'catch_settings_v1'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { enabled: true, precision: 3 }
    return JSON.parse(raw)
  } catch {
    return { enabled: true, precision: 3 }
  }
}

function saveSettings(s: any) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }

export const Catch: React.FC<CatchProps> = ({ disabled, onCatch }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [settings, setSettings] = useState(() => loadSettings())

  const open = Boolean(anchorEl)

  const handleOpenSettings = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleCloseSettings = () => setAnchorEl(null)

  const handleToggleEnabled = (_: React.ChangeEvent<HTMLInputElement>, v: boolean) => {
    const next = { ...settings, enabled: v }
    setSettings(next); saveSettings(next)
  }

  const handlePrecisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = Math.max(0, Math.min(6, Number(e.target.value || 0)))
    const next = { ...settings, precision: p }
    setSettings(next); saveSettings(next)
  }

  const round = (n: number) => {
    const p = Number(settings.precision || 3)
    const m = Math.pow(10, p)
    // ensure numeric rounding to configured precision
    return Math.round((Number.isFinite(n) ? n : 0) * m) / m
  }

  const performCatch = async () => {
    if (!settings.enabled) {
      // fallback to manual prompt
      const val = window.prompt('Enter weight (kg):')
      if (!val) return
      const num = Number(val)
      if (Number.isFinite(num)) onCatch(round(num))
      return
    }

    try {
      // Try Electron captureWeight API first if available
      // Prefer using the typed helpers exposed in preload
      // @ts-ignore
      if ((window as any).electron?.ipcRenderer) {
        try {
          // Try the modern channel first (capture-weight)
          // @ts-ignore
          const res = await (window as any).electron.ipcRenderer.invoke('capture-weight')
          const n = Number(res)
          if (Number.isFinite(n)) { onCatch(round(n)); return }
        } catch (err) {
          console.warn('capture-weight failed, trying read-weight fallback:', err);
        }
      }

      // Older integration: try direct read-weight channel
      // @ts-ignore
      if ((window as any).electron?.ipcRenderer) {
        try {
          // @ts-ignore
          const res2 = await (window as any).electron.ipcRenderer.invoke('read-weight')
          const n2 = Number(res2)
          if (Number.isFinite(n2)) { onCatch(round(n2)); return }
        } catch (err) {
          console.warn('read-weight fallback failed:', err);
        }
      }
    } catch (e) {
      console.warn('Electron weight read path errored:', e);
    }

    // final fallback: manual prompt
    const val = window.prompt('Enter weight (kg):')
    if (!val) return
    const num = Number(val)
    if (Number.isFinite(num)) onCatch(round(num))
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Button size="small" variant="outlined" onClick={performCatch} disabled={disabled}>Catch</Button>
      <IconButton size="small" onClick={handleOpenSettings} aria-label="Catch settings">
        <SettingsIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleCloseSettings}>
        <MenuItem>
          <ListItemText primary="Enable Scale" />
          <FormControlLabel control={<Switch checked={!!settings.enabled} onChange={handleToggleEnabled} />} label="" />
        </MenuItem>
        <MenuItem>
          <ListItemText primary="Precision (decimals)" />
          <TextField size="small" type="number" inputProps={{ min: 0, max: 6 }} value={settings.precision} onChange={handlePrecisionChange} style={{ width: 80 }} />
        </MenuItem>
      </Menu>
    </div>
  )
}

export default Catch



