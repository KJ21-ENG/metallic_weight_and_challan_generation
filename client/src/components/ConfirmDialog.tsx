import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField,
  Typography 
} from '@mui/material'
import { useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  requireReason?: boolean
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

export function ConfirmDialog({ 
  open, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  requireReason = false,
  onConfirm, 
  onCancel 
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined)
    setReason('')
  }

  const handleCancel = () => {
    onCancel()
    setReason('')
  }

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>{message}</Typography>
        {requireReason && (
          <TextField
            fullWidth
            label="Reason for delete"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for deletion..."
            multiline
            rows={2}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          {cancelText}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={requireReason && !reason.trim()}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
