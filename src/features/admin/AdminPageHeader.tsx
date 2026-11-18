import { ArrowLeft, ExternalLink, type LucideIcon } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AdminCreateAction, type AdminCreateActionProps } from './AdminCreateAction';
import { AdminSectionTabs } from './AdminSectionTabs';

/** Ação do cabeçalho: botão (`onClick`) ou link de navegação (`href`). */
export type AdminHeaderAction = AdminCreateActionProps & { icon: LucideIcon; active?: boolean; kind?: 'create' };
type AdminPageHeaderProps = {
  title: string; description?: string; descriptionClassName?: string; publicHref?: string; publicLabel?: string;
  primaryAction?: AdminHeaderAction; mobileActions?: AdminHeaderAction[];
  /** Ação de apoio ao lado da principal (contorno). Quando existe, as duas ficam agrupadas e, no celular, ocupam a linha toda. */
  secondaryAction?: AdminHeaderAction;
  showBack?: boolean; quietSecondaryActions?: boolean;
  compactActions?: boolean;
  density?: 'default' | 'compact';
};
const parentLabels: Record<string,string> = {site:'Site público',paroquia:'Paróquia',calendario:'Agenda'};
const controlClassName = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-[15px] font-semibold transition-colors motion-reduce:transition-none';

/** O cabeçalho padrão é o compacto (título de 28 px). `density="default"` é a variante ampla, para páginas de abertura. */
export function AdminPageHeader({title,description,descriptionClassName,publicHref,publicLabel='Ver site público',primaryAction,secondaryAction,mobileActions=[],showBack=false,compactActions=false,density='compact'}: AdminPageHeaderProps) {
  const createAction = primaryAction?.kind === 'create' ? primaryAction : undefined;
  const {tenantSlug=''} = useParams();
  const {pathname} = useLocation();
  const base = `/${tenantSlug}/admin`;
  const segments = pathname.slice(base.length).split('/').filter(Boolean);
  const parent = segments.length>1 ? segments[0] : undefined;
  return <>
    <header data-admin-page-header className={`mx-auto max-w-316 px-4 text-ink md:px-6 xl:px-8 ${density === 'compact' ? 'pt-[calc(1rem+env(safe-area-inset-top,0px))] md:pt-6' : 'pt-[calc(1.5rem+env(safe-area-inset-top,0px))] md:pt-10'}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {showBack && parent && parentLabels[parent] ? <Link to={`${base}/${parent}`} aria-label={`Voltar para ${parentLabels[parent]}`} className={`${controlClassName} px-0 text-muted hover:bg-selection/50`}><ArrowLeft size={20} aria-hidden="true" /></Link> : null}
        <div className="min-w-0 flex-1"><h1 className={`m-0 break-words font-display font-medium leading-tight tracking-[-0.025em] ${density === 'compact' ? 'text-2xl md:text-[1.75rem]' : 'text-[2rem] md:text-[2.75rem]'}`}>{title}</h1>{description ? <p className={`mb-0 max-w-2xl text-sm text-muted ${descriptionClassName ?? ""} ${density === 'compact' ? 'mt-1 leading-5' : 'mt-2 leading-6 sm:text-base'}`}>{description}</p> : null}</div>
        <Link to={publicHref ?? `/${tenantSlug}`} aria-label={publicLabel} title={publicLabel} className={`${controlClassName} px-2 text-muted hover:text-primary`}><ExternalLink size={18} aria-hidden="true" /><span className="hidden lg:inline">{publicLabel}</span></Link>
        {(primaryAction && !createAction) || secondaryAction ? <div className={`flex gap-2 ${secondaryAction ? 'w-full sm:w-auto' : compactActions ? 'w-auto' : 'w-full sm:w-auto'}`}>
          {secondaryAction ? <HeaderActionControl action={secondaryAction} className={`${controlClassName} flex-1 border border-control-border bg-surface text-primary hover:bg-selection sm:flex-none`} /> : null}
          {primaryAction && !createAction ? <HeaderActionControl action={primaryAction} className={`${controlClassName} bg-primary text-white hover:bg-primary-hover ${secondaryAction ? 'flex-1 sm:flex-none' : 'shrink-0'}`} /> : null}
        </div> : null}
        {createAction ? <AdminCreateAction {...createAction} /> : null}
        {mobileActions.map(({label,icon:Icon,onClick,active}) => <button key={label} type="button" onClick={onClick} aria-label={label} className={`${controlClassName} md:hidden ${active ? 'bg-selection text-primary' : 'text-muted hover:bg-selection'}`}><Icon size={18} aria-hidden="true" />{label==='Buscar e filtrar eventos'?'Filtros':label}</button>)}
      </div>
    </header>
    <AdminSectionTabs compact={density === 'compact'} />
  </>;
}

function HeaderActionControl({ action, className }: { action: AdminHeaderAction; className: string }) {
  const content = <><action.icon size={18} aria-hidden="true" />{action.label}</>;
  return action.href
    ? <Link to={action.href} className={className}>{content}</Link>
    : <button ref={action.buttonRef} type="button" onClick={action.onClick} className={className}>{content}</button>;
}
