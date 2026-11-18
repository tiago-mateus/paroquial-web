import type { LucideIcon } from 'lucide-react';
import { Church } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type NavigationItem = { label: string; href: string; icon: LucideIcon; end?: boolean; onIntent?: () => void };

/** Native page links, with a quieter mobile treatment for public pages. */
export function BottomNavigation({ items, label, variant = 'default' }: { items: NavigationItem[]; label: string; variant?: 'default' | 'public' }) {
  const isPublic = variant === 'public';
  return (
    <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom,0px)] md:px-6">
      <div className="mx-auto flex min-h-[71px] max-w-6xl items-center justify-center gap-4">
      <span aria-hidden="true" className="mr-auto hidden items-center gap-2 text-lg font-bold tracking-tight text-primary lg:inline-flex"><Church size={23} strokeWidth={1.7} />paroquial.</span>
      <div className="grid w-full max-w-xl grid-cols-4 items-center gap-1 py-1.5 md:gap-2">
        {items.map(({ label: text, href, icon: Icon, end, onIntent }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            onPointerEnter={onIntent}
            onPointerDown={onIntent}
            onFocus={onIntent}
            className={({ isActive }) => `group flex min-h-14 min-w-11 flex-col items-center justify-center rounded-xl text-[13px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none md:min-h-12 md:flex-row ${isPublic
              ? `gap-1 px-1 font-medium leading-[18px] md:gap-2 md:px-3 md:py-0 md:leading-5 ${isActive ? 'text-ink md:bg-primary md:text-white md:font-bold' : 'text-muted hover:text-ink md:hover:bg-selection'}`
              : `gap-1 px-2 ${isActive ? 'bg-selection font-bold text-primary' : 'text-muted hover:bg-canvas hover:text-ink'}`}`}
          >
            {({ isActive }) => <>
              {isPublic ? (
                <span className={`grid h-8 w-16 shrink-0 place-items-center rounded-full transition-colors duration-150 motion-reduce:transition-none md:h-5 md:w-5 md:rounded-none ${isActive ? 'bg-accent text-accent-ink group-active:bg-accent/80 md:bg-transparent md:text-inherit md:group-active:bg-transparent' : 'group-hover:bg-selection/50 group-active:bg-selection md:group-hover:bg-transparent md:group-active:bg-transparent'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.75} aria-hidden="true" className="md:size-5 md:stroke-[1.5]" />
                </span>
              ) : <Icon size={20} strokeWidth={1.5} aria-hidden="true" />}
              <span className={isPublic && isActive ? 'font-bold' : undefined}>{text}</span>
            </>}
          </NavLink>
        ))}
      </div>
      </div>
    </nav>
  );
}
