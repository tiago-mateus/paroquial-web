import { CheckCircle2, CircleAlert, Info, LoaderCircle, X } from 'lucide-react';
import { Toaster } from 'sonner';

/** Brief confirmations; actionable failures also stay beside their form. */
export function AppToaster() {
  return <Toaster
    className="admin-theme"
    theme="light"
    position="top-right"
    offset={{ top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 24 }}
    mobileOffset={{ top: 'calc(12px + env(safe-area-inset-top, 0px))', left: 16, right: 16 }}
    duration={5000}
    visibleToasts={2}
    closeButton
    containerAriaLabel="Notificações"
    icons={{ success: <CheckCircle2 size={20} className="text-success" />, error: <CircleAlert size={20} className="text-danger" />, info: <Info size={20} />, warning: <CircleAlert size={20} className="text-warning" />, loading: <LoaderCircle size={20} className="animate-spin motion-reduce:animate-none" />, close: <X size={18} /> }}
    toastOptions={{
      closeButtonAriaLabel: 'Fechar notificação',
      unstyled: true,
      classNames: {
        toast: 'relative flex min-h-18 w-full items-center gap-3 rounded-xl bg-surface py-4 pl-4 pr-14 text-ink shadow-lg outline outline-1 outline-line',
        title: 'text-sm font-semibold leading-6',
        description: 'mt-1 text-sm leading-5 text-muted',
        content: 'min-w-0 flex-1 break-words',
        icon: 'shrink-0 text-primary',
        closeButton: '!absolute !left-auto !right-1 !top-1/2 !m-0 !h-11 !w-11 !translate-x-0 !-translate-y-1/2 !rounded-lg !border-0 !bg-transparent !text-muted hover:!bg-selection focus-visible:!outline-2',
      },
    }}
  />;
}
