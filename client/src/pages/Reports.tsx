import { useState } from 'react'
import { api } from '../api'
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

export function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [groupBy, setGroupBy] = useState<'metallic' | 'cut'>('metallic')
  const [rows, setRows] = useState<any[]>([])

  async function run() {
    const res = await api.get('/reports/summary', { params: { from, to, groupBy } })
    setRows(res.data)
  }

  function downloadCSV() {
    const url = `/api/reports/summary.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&groupBy=${groupBy}`
    window.open(url, '_blank')
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Reports</Typography>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}><TextField fullWidth label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="To" type="date" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select label="Group By" value={groupBy} onChange={e => setGroupBy(e.target.value as any)}>
                  <MenuItem value="metallic">Metallic</MenuItem>
                  <MenuItem value="cut">Cut</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={'auto' as any}><Button onClick={run}>Run</Button></Grid>
            <Grid item xs={12} sm={'auto' as any}><Button variant="outlined" onClick={downloadCSV}>Export CSV</Button></Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Group</TableCell>
              <TableCell>BobQty</TableCell>
              <TableCell>Gross</TableCell>
              <TableCell>Tare</TableCell>
              <TableCell>Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.group_name}</TableCell>
                <TableCell>{r.total_bob_qty}</TableCell>
                <TableCell>{Number(r.total_gross).toFixed(3)}</TableCell>
                <TableCell>{Number(r.total_tare).toFixed(3)}</TableCell>
                <TableCell>{Number(r.total_net).toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
