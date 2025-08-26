import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Slide,
} from '@mui/material';
import React from 'react';

interface FormField {
  value: string | number;
  label: string;
  type?: string;
  name: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disable?: boolean;
  multiline?: boolean;
}

interface AdditionalButton {
  text: string;
  onClick: () => void;
  className?: string;
}

interface FormData {
  title: string;
  fields: FormField[];
  submitText: string;
  additionalButton?: AdditionalButton;
}

interface FormModalProps {
  open: boolean;
  handleClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  formData: FormData;
}

const FormModal: React.FC<FormModalProps> = ({ open, handleClose, onSubmit, formData }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Slide}
      transitionDuration={500}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          padding: '32px',
          borderRadius: '20px',
          backgroundColor: '#fefefe',
          boxShadow: '0px 15px 50px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          transition: 'opacity 0.3s ease-in-out',
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          color: '#a68a64',
          paddingBottom: '20px',
        }}
      >
        {formData.title}
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            marginTop: '16px',
          }}
        >
          {formData.fields.map((field, index) => (
            <TextField
              value={field.value}
              key={index}
              label={field.label}
              type={field.type || 'text'}
              name={field.name}
              fullWidth
              margin="normal"
              required={field.required || false}
              onChange={field.onChange}
              disabled={field.disable || false}
              multiline={field.multiline || false}
              variant="filled"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && field.multiline) {
                  e.stopPropagation();
                }
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#a68a64', // Màu mặc định cho label
                  '&:hover': {
                    color: '#a68a64', // Giữ màu khi hover
                  },
                  '&.Mui-focused': {
                    color: '#a68a64', // Giữ màu khi focus (tránh màu xanh mặc định)
                  },
                },
                '& .MuiFilledInput-root': {
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f1f1f1',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#e9e9e9',
                  },
                },
                '& .MuiFilledInput-underline': {
                  borderBottom: '2px solid #ccc',
                },
              }}
            />
          ))}
          {formData.additionalButton && (
            <Button
              type="button"
              onClick={formData.additionalButton.onClick}
              sx={{
                color: '#a68a64',
                textTransform: 'none',
                fontWeight: 'medium',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  textDecoration: 'underline',
                },
              }}
            >
              {formData.additionalButton.text}
            </Button>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'space-between',
            paddingTop: '24px',
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{
              color: '#a68a64',
              borderColor: '#a68a64',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: '#a68a64',
              color: 'white',
              '&:hover': {
                backgroundColor: '#a68a64',
              },
            }}
          >
            {formData.submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormModal;