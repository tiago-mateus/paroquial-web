import { NavLink, useLocation, useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { adminNavigation } from './adminNavigation';

export function AdminSectionTabs({ compact = false }: { compact?: boolean }) {
  const { tenantSlug = '' } = useParams();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const container = active?.parentElement;
    if (!active || !container) return;
    // Scroll only the tab strip: scrollIntoView can also move the page below its sticky header.
    const left = active.offsetLeft - container.offsetLeft;
    if (left < container.scrollLeft) container.scrollLeft = left;
    else if (left + active.offsetWidth > container.scrollLeft + container.clientWidth) container.scrollLeft = left + active.offsetWidth - container.clientWidth;
  }, [pathname]);
  const base = `/${tenantSlug}/admin`;
  const section = adminNavigation.find(item => item.path === pathname.slice(base.length).split('/').filter(Boolean)[0]);
  if (!section?.items.length) return null;
  return <nav ref={navRef} aria-label={section.navigationLabel} className={`mx-auto max-w-316 px-4 md:px-6 lg:hidden xl:px-8 ${compact ? 'mt-3' : 'mt-5 md:mt-6'}`}>
    <div className={`flex gap-2 overflow-x-auto border-b border-line [scrollbar-width:thin] ${compact ? 'pb-2' : 'pb-3'}`}>
      {section.items.map(({label,path}) => <NavLink key={path} end to={`${base}/${path}`} className={({isActive}) => `flex min-h-11 flex-none items-center rounded-lg px-4 py-2 text-sm transition-colors focus-visible:-outline-offset-2 motion-reduce:transition-none ${isActive ? 'bg-primary font-semibold text-white' : 'text-muted hover:bg-selection hover:text-primary'}`}>{label}</NavLink>)}
    </div>
  </nav>;
}
