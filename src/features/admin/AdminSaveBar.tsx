import { CheckCircle2, CircleAlert, LoaderCircle, Save } from "lucide-react";
import { buttonClasses } from "../../shared/styles/controls";

export function AdminSaveBar({ dirty, pending, invalid, saved, error, label = "Salvar alterações" }: { dirty: boolean; pending: boolean; invalid?: boolean; saved: boolean; error?: Error | null; label?: string }) {
  if (!dirty && !pending && !error) return <p role="status" className={`m-0 flex items-center gap-2 pt-4 text-sm ${saved ? "text-success" : "text-muted"}`}><CheckCircle2 size={16} aria-hidden="true" />{saved ? "Alterações publicadas" : "Tudo salvo"}</p>;
  const message = pending ? "Salvando alterações…" : error ? "Não foi possível salvar. Suas alterações foram mantidas. Tente novamente." : invalid ? "Revise os campos indicados" : "Alterações não salvas";
  return <div className="admin-save-bar fixed right-0 left-[var(--admin-sidebar-width)] z-30 mx-auto max-w-316 border-t border-line bg-surface px-4 py-3 md:px-6 xl:px-8">
    <div className="flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-3">
      <span role={error ? "alert" : "status"} className={`flex min-w-0 flex-1 items-start gap-2 text-sm leading-5 ${error || invalid ? "text-danger" : "text-muted"}`}>{error || invalid ? <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> : null}{message}</span>
      <button type="submit" disabled={pending || invalid || !dirty} className={`${buttonClasses.primary.md} disabled:bg-line disabled:text-muted max-[400px]:w-full`}>{pending ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}{pending ? "Salvando..." : label}</button>
    </div>
  </div>;
}
