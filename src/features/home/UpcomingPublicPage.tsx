import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export function UpcomingPublicPage({ section }: { section: string }) {
  const { tenantSlug = "" } = useParams();

  return (
    <main className="grid min-h-dvh place-items-center bg-stone-50 px-5 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 text-center shadow-[0_24px_70px_rgb(41_37_36/0.08)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-800">
          <Sparkles size={21} />
        </span>
        <p className="mb-2 mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Em preparação</p>
        <h1 className="m-0 text-3xl font-bold text-slate-950">{section}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          Esta área será a próxima experiência pública a receber o novo visual do Paroquial.
        </p>
        <Link
          to={`/${tenantSlug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
      </section>
    </main>
  );
}
