import { useEffect, useState } from 'react';
import { Box, Typography, Slide } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface ScaleErrorToastProps {
  error: string;
  onDismiss: () => void;
}

export const ScaleErrorToast: React.FC<ScaleErrorToastProps> = ({ error, onDismiss }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (error) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300); // Wait for slide out animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, onDismiss]);

  if (!error) return null;

  return (
    <Slide direction="left" in={show} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          backgroundColor: '#f44336',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: '280px',
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out',
          '@keyframes slideIn': {
            '0%': {
              transform: 'translateX(100%)',
              opacity: 0,
            },
            '100%': {
              transform: 'translateX(0)',
              opacity: 1,
            },
          },
        }}
      >
        <ErrorIcon sx={{ fontSize: 20 }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {error}
        </Typography>
      </Box>
    </Slide>
  );
};

export default ScaleErrorToast;
