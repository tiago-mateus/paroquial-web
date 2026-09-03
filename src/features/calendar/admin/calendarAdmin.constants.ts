import type { EventType } from '../../../shared/api/events';

export const eventTypeLabels: Record<EventType, string> = {
  missa: 'Missa',
  novena: 'Novena',
  reuniao: 'Reunião',
  encontro: 'Encontro',
  adoracao: 'Adoração',
  movimento: 'Movimento',
  outro: 'Evento',
};

export const eventTypeOptions = Object.entries(eventTypeLabels) as Array<[EventType, string]>;
