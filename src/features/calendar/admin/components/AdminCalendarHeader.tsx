import { Plus } from 'lucide-react';
import type { Ref } from 'react';
import { AdminPageHeader } from '../../../admin/AdminPageHeader';

type AdminCalendarHeaderProps = { publicHref: string; isFiltered?: boolean; onOpenFilters?: () => void; onCreate: () => void; createButtonRef?: Ref<HTMLButtonElement> };
export function AdminCalendarHeader({ publicHref, onCreate, createButtonRef }: AdminCalendarHeaderProps) {
  return <AdminPageHeader title="Agenda" density="compact" compactActions publicHref={publicHref} publicLabel="Ver agenda pública" primaryAction={{ kind: 'create', label: 'Novo evento', icon: Plus, onClick: onCreate, buttonRef: createButtonRef }} />;
}
