import { useEffect, useState } from 'react'
import { api, getOptions } from '../api'
import { Alert, Box, Button, Card, CardContent, Chip, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper, Typography, Radio, RadioGroup, FormControlLabel } from '@mui/material'
import { ConfirmDialog } from '../components/ConfirmDialog'

type Item = { id: number; name: string; weight_kg?: number; role_operator?: boolean; role_helper?: boolean; address?: string | null; gstin?: string | null; mobile?: string | null }

const masterTabs = [
  { key: 'metallics', label: 'Metallic' },
  { key: 'cuts', label: 'Cut' },
  { key: 'employees', label: 'Employees' },
  { key: 'bob_types', label: 'Bob Type' },
  { key: 'box_types', label: 'Box Type' },
  { key: 'customers', label: 'Customers' },
  { key: 'shifts', label: 'Shifts' },
  { key: 'firms', label: 'Firm' },
  { key: 'printer_settings', label: 'Printer Settings' },
]

export function MasterPage() {
  const [type, setType] = useState('metallics')
  const [items, setItems] = useState<Item[]>([])

  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [role, setRole] = useState<'operator' | 'helper' | ''>('')
  const [address, setAddress] = useState('')
  const [gstin, setGstin] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [edit, setEdit] = useState<Item | null>(null)
  
  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  
  // Printer settings state
  const [labelPrinter, setLabelPrinter] = useState('')
  const [challanPrinter, setChallanPrinter] = useState('')
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([])

  const isWeighted = type === 'bob_types' || type === 'box_types'
  const isEmployees = type === 'employees'
  const isCustomers = type === 'customers'
  const isFirms = type === 'firms'
  const isPrinterSettings = type === 'printer_settings'

  useEffect(() => { load(); resetForm() }, [type])

  function resetForm() {
    setName(''); setWeight(''); setRole(''); setAddress(''); setGstin(''); setMobile(''); setEmail('')
    setEditingId(null); setEdit(null)
  }

  async function load() {
    if (isPrinterSettings) {
      loadPrinterSettings()
    } else {
      let data = await getOptions(type)
      // Ensure numeric fields are numbers so UI (toFixed) works immediately
      if (isWeighted && Array.isArray(data)) {
        data = data.map((d: any) => ({ ...d, weight_kg: d.weight_kg != null ? Number(d.weight_kg) : d.weight_kg }))
      }
      setItems(data)
    }
  }

  function loadPrinterSettings() {
    console.log('Loading printer settings...');
    console.log('window.electronAPI available:', !!window.electronAPI);
    console.log('window.electronAPI.getPrinters available:', !!(window.electronAPI && window.electronAPI.getPrinters));
    
    // Get actual available printers using Electron API
    if (window.electronAPI && window.electronAPI.getPrinters) {
      console.log('Calling getPrinters...');
      window.electronAPI.getPrinters().then((printers: any[]) => {
        console.log('Received printers:', printers);
        const printerNames = printers.map(p => p.name);
        console.log('Printer names:', printerNames);
        setAvailablePrinters(printerNames);
      }).catch((err: any) => {
        console.error('Failed to get printers:', err);
        // Fallback to empty list if printer detection fails
        setAvailablePrinters([]);
      });
    } else {
      console.log('Electron API not available, falling back to empty list');
      // Fallback for non-Electron environment
      setAvailablePrinters([]);
    }
    
    // Load saved preferences from localStorage
    const savedLabelPrinter = localStorage.getItem('labelPrinter') || ''
    const savedChallanPrinter = localStorage.getItem('challanPrinter') || ''
    setLabelPrinter(savedLabelPrinter)
    setChallanPrinter(savedChallanPrinter)
  }

  function savePrinterSettings() {
    localStorage.setItem('labelPrinter', labelPrinter)
    localStorage.setItem('challanPrinter', challanPrinter)
    alert('Printer settings saved successfully!')
  }

  async function add() {
    if (!name.trim()) return
    const body: any = { name: name.trim() }
    if (isWeighted) body.weight_kg = Number(weight || 0)
    if (isEmployees) { body.role_operator = role === 'operator'; body.role_helper = role === 'helper' }
    if (isCustomers) { body.address = address || null; body.gstin = gstin || null; body.mobile = mobile || null }
    if (isFirms) {
      if (address) body.address = address
      if (gstin) body.gstin = gstin
      if (mobile) body.mobile = mobile
      if (email) body.email = email
    }
    const res = await api.post(`/master/${type}`, body)
    // Coerce numeric fields returned from the API so UI renderers (e.g. toFixed) work immediately
    const newItem = res.data
    if (isWeighted && newItem && newItem.weight_kg != null) newItem.weight_kg = Number(newItem.weight_kg)
    resetForm()
    setItems([...items, newItem])
  }

  async function startEdit(i: Item) {
    setEditingId(i.id)
    // provide a convenient `role` field for the edit object
    setEdit({ ...i, role: i.role_operator ? 'operator' : (i.role_helper ? 'helper' : '') } as any)
  }

  async function saveEdit(i: Item) {
    if (!edit) return
    const body: any = {}
    if (isWeighted) { body.name = edit.name; body.weight_kg = Number(edit.weight_kg || 0) }
    else if (isEmployees) { body.name = edit.name; const r = (edit as any).role as string | undefined; body.role_operator = r === 'operator'; body.role_helper = r === 'helper' }
    else if (isCustomers) { body.name = edit.name; body.address = edit.address || null; body.gstin = edit.gstin || null; body.mobile = edit.mobile || null }
    else if (isFirms) {
      body.name = edit.name
      if ((edit as any).address) (body as any).address = (edit as any).address
      if ((edit as any).gstin) (body as any).gstin = (edit as any).gstin
      if ((edit as any).mobile) (body as any).mobile = (edit as any).mobile
      if ((edit as any).email) (body as any).email = (edit as any).email
    }
    else { body.name = edit.name }
    const res = await api.put(`/master/${type}/${i.id}`, body)
    const updated = res.data
    if (isWeighted && updated && updated.weight_kg != null) updated.weight_kg = Number(updated.weight_kg)
    setItems(items.map(it => it.id === i.id ? updated : it))
    setEditingId(null); setEdit(null)
  }

  async function remove(id: number) {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete(reason?: string) {
    if (!itemToDelete) return
    
    try {
      await api.delete(`/master/${type}/${itemToDelete}`, { params: { reason: reason || '' } })
      setItems(items.filter(i => i.id !== itemToDelete))
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Failed to delete item:', error)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <Stack spacing={2}>
      <Tabs value={type} onChange={(_, v) => setType(v)}>
        {masterTabs.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

            {/* Printer Settings Tab */}
      {isPrinterSettings && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Printer Configuration</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure your preferred printers for labels and challans. These settings are saved locally on your computer.
            </Typography>
            
            {availablePrinters.length === 0 ? (
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="warning.dark">
                  No printers detected. Please ensure your system has printers installed and accessible.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={loadPrinterSettings}
                  sx={{ mt: 1 }}
                >
                  Refresh Printers
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                {availablePrinters.length} printer(s) detected
              </Typography>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Label Printer</InputLabel>
                  <Select
                    label="Label Printer"
                    value={labelPrinter}
                    onChange={(e) => setLabelPrinter(e.target.value)}
                    disabled={availablePrinters.length === 0}
                  >
                    <MenuItem value="">
                      <em>Select Label Printer</em>
                    </MenuItem>
                    {availablePrinters.map((printer) => (
                      <MenuItem key={printer} value={printer}>
                        {printer}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Challan Printer</InputLabel>
                  <Select
                    label="Challan Printer"
                    value={challanPrinter}
                    onChange={(e) => setChallanPrinter(e.target.value)}
                    disabled={availablePrinters.length === 0}
                  >
                    <MenuItem value="">
                      <em>Select Challan Printer</em>
                    </MenuItem>
                    {availablePrinters.map((printer) => (
                      <MenuItem key={printer} value={printer}>
                        {printer}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={savePrinterSettings} 
                  disabled={(!labelPrinter && !challanPrinter) || availablePrinters.length === 0}
                >
                  Save Printer Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {!isPrinterSettings && (
        <>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}><TextField fullWidth label="Name" value={name} onChange={e => setName(e.target.value)} /></Grid>
                {isWeighted && <Grid item xs={12} sm={2}><TextField fullWidth label="Weight (kg)" type="number" inputProps={{ step: '0.001' }} value={weight} onChange={e => setWeight(e.target.value)} /></Grid>}
                {isEmployees && (
                  <Grid item xs={12} sm={3}>
                    <FormControl component={Box}>
                      <RadioGroup row value={role} onChange={(_, v) => setRole(v as any)}>
                        <FormControlLabel value="operator" control={<Radio />} label="Operator" />
                        <FormControlLabel value="helper" control={<Radio />} label="Helper" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                )}
                {(isCustomers || isFirms) && (
                  <>
                    <Grid item xs={12} sm={4}><TextField fullWidth label="Address" value={address} onChange={e => setAddress(e.target.value)} /></Grid>
                    <Grid item xs={12} sm={2}><TextField fullWidth label="GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} /></Grid>
                    {isCustomers && <Grid item xs={12} sm={2}><TextField fullWidth label="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} /></Grid>}
                    {isFirms && <><Grid item xs={12} sm={2}><TextField fullWidth label="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} /></Grid><Grid item xs={12} sm={2}><TextField fullWidth label="Email" value={email} onChange={e => setEmail(e.target.value)} /></Grid></>}
                  </>
                )}
                <Grid item xs={12} sm={'auto' as any}><Button onClick={add}>+ New</Button></Grid>
              </Grid>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {isWeighted && <TableCell align="right">Weight (kg)</TableCell>}
              {isEmployees && <TableCell>Role</TableCell>}
              {isCustomers && <><TableCell>Address</TableCell><TableCell>GSTIN</TableCell><TableCell>Mobile</TableCell></>}
              {isFirms && <><TableCell>Address</TableCell><TableCell>GSTIN</TableCell><TableCell>Mobile</TableCell><TableCell>Email</TableCell></>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id}>
                <TableCell>
                  {editingId === i.id ? (
                    <TextField size="small" value={edit?.name || ''} onChange={e => setEdit({ ...(edit as Item), name: e.target.value })} />
                  ) : i.name}
                </TableCell>
                {isWeighted && (
                  <TableCell align="right">
                    {editingId === i.id ? (
                      <TextField size="small" type="number" inputProps={{ step: '0.001' }} value={edit?.weight_kg ?? 0} onChange={e => setEdit({ ...(edit as Item), weight_kg: Number(e.target.value) })} />
                    ) : (i.weight_kg?.toFixed?.(3))}
                  </TableCell>
                )}
                {isEmployees && (
                  <TableCell>
                    {editingId === i.id ? (
                      <FormControl component={Box}>
                        <RadioGroup row value={(edit as any)?.role || ''} onChange={(_, v) => setEdit({ ...(edit as Item), role: v } as any)}>
                          <FormControlLabel value="operator" control={<Radio />} label="Operator" />
                          <FormControlLabel value="helper" control={<Radio />} label="Helper" />
                        </RadioGroup>
                      </FormControl>
                    ) : (
                      i.role_operator ? 'Operator' : (i.role_helper ? 'Helper' : '')
                    )}
                  </TableCell>
                )}
                {isCustomers && (
                  <>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={edit?.address || ''} onChange={e => setEdit({ ...(edit as Item), address: e.target.value })} /> : (i.address || '')}</TableCell>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={edit?.gstin || ''} onChange={e => setEdit({ ...(edit as Item), gstin: e.target.value })} /> : (i.gstin || '')}</TableCell>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={edit?.mobile || ''} onChange={e => setEdit({ ...(edit as Item), mobile: e.target.value })} /> : (i.mobile || '')}</TableCell>
                  </>
                )}
                {isFirms && (
                  <>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={(edit as any)?.address || ''} onChange={e => setEdit({ ...(edit as Item), address: e.target.value })} /> : ((i as any).address || '')}</TableCell>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={(edit as any)?.gstin || ''} onChange={e => setEdit({ ...(edit as Item), gstin: (e.target as any).value })} /> : ((i as any).gstin || '')}</TableCell>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={(edit as any)?.mobile || ''} onChange={e => setEdit({ ...(edit as Item), mobile: (e.target as any).value } as any)} /> : ((i as any).mobile || '')}</TableCell>
                    <TableCell>{editingId === i.id ? <TextField size="small" value={(edit as any)?.email || ''} onChange={e => setEdit({ ...(edit as Item), email: (e.target as any).value } as any)} /> : ((i as any).email || '')}</TableCell>
                  </>
                )}
                <TableCell align="right">
                  {editingId === i.id ? (
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" onClick={() => saveEdit(i)}>Save</Button>
                      <Button size="small" variant="outlined" onClick={() => { setEditingId(null); setEdit(null) }}>Cancel</Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" onClick={() => startEdit(i)}>Edit</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => remove(i.id)}>Delete</Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        requireReason={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setItemToDelete(null)
        }}
      />
    </Stack>
  )
}
