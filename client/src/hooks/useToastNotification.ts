import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
}

export function useToastNotification() {
  const showToast = (
    message: string, 
    type: ToastType = 'info', 
    options?: ToastOptions
  ) => {
    const { duration = 5000, action, description } = options || {};
    
    switch (type) {
      case 'success':
        toast.success(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
          description,
        });
        break;
      case 'error':
        toast.error(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
          description,
        });
        break;
      case 'warning':
        toast.warning(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
          description,
        });
        break;
      default:
        toast(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick,
          } : undefined,
          description,
        });
    }
  };

  return {
    showToast,
    success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
    info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
    warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
  };
}