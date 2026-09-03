import { Building2, CalendarClock, ChevronRight, Settings2, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export { AdminDashboardPage } from "./AdminDashboardPage";
export { AdminChurchesPage } from "./AdminChurchesPage";
export { AdminChannelsPage, AdminHighlightsPage, AdminHomePage } from "./AdminContentPage";
export { AdminParishPage } from "./AdminParishPage";
export { AdminSchedulesPage } from "./AdminSchedulesPage";
export { AdminSettingsPage } from "./AdminSettingsPage";

export function AdminMorePage() {
  const { tenantSlug = "" } = useParams();
  const items = [
    { label: "Igrejas e capelas", description: "Locais e informações de atendimento", path: "igrejas", icon: Building2 },
    { label: "Informações da paróquia", description: "Identidade e contatos institucionais", path: "paroquia", icon: ShieldCheck },
    { label: "Horários fixos", description: "Missas, confissões e atendimentos", path: "horarios", icon: CalendarClock },
    { label: "Configurações", description: "Preferências e recursos do sistema", path: "configuracoes", icon: Settings2 },
  ] as const;

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-stone-50 px-4 py-5 text-slate-950 md:mx-auto md:max-w-7xl md:px-8 md:py-7">
      <p className="m-0 text-sm leading-6 text-slate-500">Outras áreas de administração da paróquia.</p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        {items.map(({ label, description, path, icon: Icon }, index) => (
          <Link key={path} to={`/${tenantSlug}/admin/${path}`} className={`flex min-h-[4.75rem] items-center gap-3 px-4 py-3 transition active:bg-slate-50 ${index ? "border-t border-slate-100" : ""}`}>
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-amber-50 text-amber-800"><Icon size={18} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{label}</strong><small className="mt-0.5 block truncate text-xs text-slate-500">{description}</small></span>
            <ChevronRight className="flex-none text-slate-300" size={17} />
          </Link>
        ))}
      </div>
    </section>
  );
}
