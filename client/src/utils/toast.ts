import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => sonnerToast.success(message, { closeButton: true }),
  error: (message: string) => sonnerToast.error(message, { closeButton: true }),
  info: (message: string) => sonnerToast(message, { closeButton: true }),
  loading: (message: string) => sonnerToast.loading(message, { closeButton: true }),
}
