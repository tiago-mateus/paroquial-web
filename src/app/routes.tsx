import { CalendarDays, Church, Home, Link2 } from 'lucide-react';
import { Outlet, useMatch, useParams } from 'react-router-dom';
import { BottomNavigation } from '../shared/components/BottomNavigation';
import { prepareChurchMap } from '../features/churches/churchMapLoading';

export function PublicLayout() {
  const { tenantSlug = '' } = useParams();
  const base = `/${tenantSlug}`;
  const isHome = Boolean(useMatch('/:tenantSlug'));
  const isCalendar = Boolean(useMatch('/:tenantSlug/calendario'));
  const isChurches = Boolean(useMatch('/:tenantSlug/igrejas'));
  const isLinks = Boolean(useMatch('/:tenantSlug/links'));
  return <div className={`app-shell min-h-dvh bg-canvas pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] text-ink ${isHome || isCalendar || isChurches || isLinks ? 'public-home-theme' : ''}`}>
    <Outlet />
    <BottomNavigation variant="public" label="Navegação principal da paróquia" items={[
      {label:'Início',href:base,icon:Home,end:true},
      {label:'Agenda',href:`${base}/calendario`,icon:CalendarDays},
      {label:'Igrejas',href:`${base}/igrejas`,icon:Church,onIntent:prepareChurchMap},
      {label:'Links',href:`${base}/links`,icon:Link2},
    ]} />
  </div>;
}
