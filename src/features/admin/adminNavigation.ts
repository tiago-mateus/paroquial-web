import { CalendarDays, House, PanelsTopLeft, Church } from 'lucide-react';

export const adminNavigation = [
  { label: 'Início', path: '', icon: House, navigationLabel: '', items: [] },
  { label: 'Agenda', path: 'calendario', icon: CalendarDays, navigationLabel: 'Áreas da agenda', items: [
    { label: 'Eventos', path: 'calendario' },
    { label: 'Horários de confissão', path: 'calendario/confissoes' },
  ] },
  { label: 'Site', path: 'site', icon: PanelsTopLeft, navigationLabel: 'Áreas do site público', items: [
    { label: 'Destaques', path: 'site/destaques' },
    { label: 'Canais oficiais', path: 'site/canais' },
    { label: 'Capa da página', path: 'site/pagina-inicial' },
  ] },
  { label: 'Paróquia', path: 'paroquia', icon: Church, navigationLabel: 'Áreas da paróquia', items: [
    { label: 'Dados e contato', path: 'paroquia/dados' },
    { label: 'Igrejas e capelas', path: 'paroquia/igrejas' },
  ] },
];
