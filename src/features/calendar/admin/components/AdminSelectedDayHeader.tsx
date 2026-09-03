import { CalendarDays } from 'lucide-react';
import { formatSelectedDate } from '../../calendar.utils';

export function AdminSelectedDayHeader({ date, eventCount }: { date: Date; eventCount: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-5 md:px-5 md:py-4">
      <div className="min-w-0">
        <h2 id="admin-selected-date-title" className="m-0 line-clamp-2 text-lg font-bold leading-tight tracking-[-0.025em] text-slate-950 min-[390px]:whitespace-nowrap md:text-lg">{formatSelectedDate(date)}</h2>
      </div>
      <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-900"><CalendarDays size={15} />{eventCount} {eventCount === 1 ? 'evento' : 'eventos'}</span>
    </div>
  );
}
