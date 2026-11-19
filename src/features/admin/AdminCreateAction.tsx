import { LoaderCircle, Plus } from 'lucide-react';
import type { Ref } from 'react';
import { Link } from 'react-router-dom';
import { buttonClasses } from '../../shared/styles/controls';

export type AdminCreateActionProps = {
  label: string;
  accessibleLabel?: string;
  onClick?: () => void;
  href?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  visible?: boolean;
  /** Keep the desktop action available while a mobile map task is active. */
  mobileHidden?: boolean;
};

/** One control and one handler: inline on desktop, floating below lg. */
export function AdminCreateAction({ label, accessibleLabel = label, onClick, href, buttonRef, disabled = false, loading = false, visible = true, mobileHidden = false }: AdminCreateActionProps) {
  if (!visible) return null;
  const unavailable = disabled || loading;
  const className = `admin-create-action ${buttonClasses.primary.md} shrink-0 focus-visible:outline-2 focus-visible:outline-focus active:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60`;
  const content = <>
    {loading ? <LoaderCircle size={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Plus size={20} aria-hidden="true" />}
    <span className="admin-create-label">{label}</span>
    {loading ? <span className="sr-only">Carregando</span> : null}
  </>;
  const shared = { className, 'aria-label': accessibleLabel, 'aria-busy': loading, 'data-mobile-hidden': mobileHidden || undefined };
  return href
    ? <Link {...shared} to={href} aria-disabled={unavailable || undefined} tabIndex={unavailable ? -1 : undefined} onClick={event => { if (unavailable) event.preventDefault(); else onClick?.(); }}>{content}</Link>
    : <button {...shared} ref={buttonRef} type="button" disabled={unavailable} onClick={onClick}>{content}</button>;
}
