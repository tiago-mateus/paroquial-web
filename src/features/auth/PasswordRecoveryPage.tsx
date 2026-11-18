import { useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Church, KeyRound } from "lucide-react";
import { apiFetch } from "../../shared/api/http";
import { Failure, fieldClass, FormField, primaryClass, secondaryClass } from "../subscription/SubscriptionShell";
import { DemoResetButton } from "../subscription/DemoResetButton";

export function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
  const [params] = useSearchParams();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const inFlight = useRef(false);
  const demo = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (reset && value.length < 10) { setError("Use pelo menos 10 caracteres na nova senha."); return; }
    inFlight.current = true; setPending(true); setError("");
    try {
      await apiFetch(`/api/v1/auth/password/${reset ? "reset" : "forgot"}`, { method: "POST", body: JSON.stringify(reset ? { token: params.get("token"), password: value } : { email: value.trim() }) });
      setValue(""); setDone(true);
    } catch { setError(reset ? "Não foi possível redefinir a senha. O link pode ter expirado. Solicite um novo link de recuperação." : "Não foi possível solicitar a recuperação agora. Tente novamente."); }
    finally { inFlight.current = false; setPending(false); }
  }
  return <div className="admin-theme flex min-h-dvh flex-col bg-canvas text-ink">
    <header className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-6">
      <Link to="/" aria-label="Paroquial, página inicial" className="inline-flex min-h-11 items-center gap-2 font-display text-3xl font-medium tracking-tight text-primary"><Church size={27} aria-hidden="true" />paroquial.</Link>
      <Link to="/login?continuar=assinatura" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">Já tenho uma conta</Link>
    </header>
    {demo ? <details className="mx-auto w-full max-w-lg px-5 text-sm leading-6 text-muted sm:px-6"><summary className="min-h-11 w-fit cursor-pointer py-2.5">Demonstração · sem cobrança</summary><p className="mb-0 mt-0">Não há envio de e-mails nem cobranças reais. Use dados fictícios.</p><DemoResetButton /></details> : null}
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-5 py-10 sm:px-6 sm:py-16"><section className="w-full pb-8">
      <Link to="/#planos" className={`${secondaryClass} mb-8 px-0`}><ArrowLeft size={17} aria-hidden="true" />Ver planos</Link>
      <KeyRound size={32} strokeWidth={1.5} className="mb-7 text-primary" aria-hidden="true" />
      <h1 className="m-0 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">{reset ? "Crie uma nova senha" : "Recupere seu acesso"}</h1><p className="mb-7 mt-4 text-base leading-7 text-muted" role={done ? "status" : undefined}>{done ? reset ? "Senha atualizada. Entre novamente para continuar." : "Se existir uma conta com este e-mail, você receberá as instruções de recuperação." : reset ? "Escolha uma senha com pelo menos 10 caracteres." : "Informe o e-mail usado no cadastro. Enviaremos um link para criar outra senha."}</p><Failure message={error} />
    {!done ? reset && !params.get("token") ? <Link to="/recuperar-senha" className={primaryClass}>Solicitar link de recuperação</Link> : <form onSubmit={submit} aria-busy={pending} className="mt-6"><FormField id="recovery-value" label={reset ? "Nova senha" : "E-mail"}><input id="recovery-value" className={`${fieldClass} border-control-border`} type={reset ? "password" : "email"} autoComplete={reset ? "new-password" : "email"} required minLength={reset ? 10 : undefined} disabled={pending} value={value} onChange={(event) => setValue(event.target.value)} /></FormField><button type="submit" className={`${primaryClass} w-full`} disabled={pending}>{pending ? "Enviando…" : reset ? "Salvar nova senha" : "Enviar link de recuperação"}</button></form> : null}
    {done && !reset && demo ? <Link to="/redefinir-senha?token=demo-reset" className={`${secondaryClass} mt-3 block w-fit`}>Abrir recuperação de demonstração (sem envio de e-mail)</Link> : null}
    {error && reset ? <Link to="/recuperar-senha" className={`${secondaryClass} mt-3 block w-fit`}>Solicitar novo link</Link> : null}
    <Link to="/login?continuar=assinatura" className={`${secondaryClass} mt-4 block w-fit`}>Voltar para entrar</Link>
  </section></main><footer className="px-5 py-6 text-center text-sm leading-6 text-muted">Paroquial · Informação que aproxima a comunidade.</footer></div>;
}
