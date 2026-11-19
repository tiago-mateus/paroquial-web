import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Church, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { login, type LoginSession } from './auth.api';
import { useQueryClient } from '@tanstack/react-query';
import { launchMode, localAdminAccess } from '../../shared/launchMode';
import { buttonClasses } from '../../shared/styles/controls';

export function LoginPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<{ email?: string; password?: string }>({});
  const [session, setSession] = useState<LoginSession>();
  const inFlight = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const chooserRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Entrar — Paroquial';
    return () => { document.title = previous; };
  }, []);
  useLayoutEffect(() => { if (session) chooserRef.current?.focus(); }, [session]);

  if (localAdminAccess) {
    const tenant = params.get('tenant') ?? '';
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenant) ? tenant : 'sao-jose';
    return <Navigate to={`/${slug}/admin`} replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const invalid: typeof fields = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) invalid.email = 'Informe um e-mail válido.';
    if (!password) invalid.password = 'Informe sua senha.';
    setFields(invalid);
    setError('');
    if (invalid.email || invalid.password) {
      (invalid.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    inFlight.current = true;
    setPending(true);
    try {
      const result = await login(email.trim(), password);
      setPassword('');
      client.setQueryData(['session'], result);
      await client.invalidateQueries({ queryKey: ['onboarding'] });
      if (result.onboardingRequired || (!launchMode && params.get('continuar') === 'assinatura')) {
        navigate('/assinar', { replace: true });
        return;
      }
      const requestedTenant = result.adminTenants.find(tenant => tenant.slug === params.get('tenant'));
      const tenant = requestedTenant || (result.adminTenants.length === 1 ? result.adminTenants[0] : undefined);
      if (tenant) navigate(`/${tenant.slug}/admin`, { replace: true });
      else setSession(result);
    } catch (failure) {
      const code = failure && typeof failure === 'object' && 'code' in failure ? String(failure.code).toLowerCase() : '';
      setError(/unauthorized|invalid_credentials|authentication_failed/.test(code)
        ? 'E-mail ou senha incorretos. Confira os dados e tente novamente.'
        : 'Não foi possível entrar agora. Tente novamente em instantes.');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <div className="admin-theme flex min-h-dvh flex-col bg-canvas text-ink">
    <header className="mx-auto w-full max-w-6xl px-4 md:px-6 flex min-h-20 items-center justify-between gap-3"><Link className="inline-flex min-h-11 shrink-0 items-center gap-2 font-display text-3xl font-medium tracking-tight text-primary" to="/" aria-label="Paroquial, página inicial"><Church size={27} aria-hidden="true" />paroquial<span>.</span></Link><Link className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-primary hover:underline underline-offset-4 max-sm:text-[13px]" to="/"><ArrowLeft size={17} aria-hidden="true" />Voltar ao site</Link></header>
    <main className="mx-auto my-6 grid w-full max-w-md flex-1 items-start gap-0 px-4 py-0 md:my-8 md:max-w-5xl md:grid-cols-2 md:items-center md:gap-10 md:px-6 xl:gap-16">
      <aside className="hidden self-stretch rounded-2xl bg-primary px-9 py-12 text-white md:flex md:min-h-[36rem] md:flex-col md:justify-center [&_h2]:mb-6 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-5xl [&_h2]:font-medium [&_h2]:leading-tight [&_h2]:tracking-tight [&_p]:m-0 [&_p]:max-w-[33ch] [&_p]:text-base [&_p]:leading-7 [&_p]:text-white/85"><Church size={42} strokeWidth={1.25} className="text-accent" aria-hidden="true" /><h2>Cuidar dos detalhes.<br /><span className="text-accent">Aproximar pessoas.</span></h2><p>Um espaço para manter a programação e as informações da sua paróquia, onde você estiver.</p><div className="mt-12 border-t border-white/25 pt-6 text-base leading-7 text-white/85">A comunidade encontra.<br />A secretaria organiza.</div></aside>
      <section className="min-w-0 py-6 [&_h1]:m-0 [&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-medium [&_h1]:leading-tight" aria-labelledby={session ? 'choose-parish' : 'login-title'}>
        {session ? <>
          <h1 id="choose-parish" ref={chooserRef} tabIndex={-1}>{session.adminTenants.length ? 'Escolha sua paróquia' : 'Acesso sem paróquia'}</h1>
          <p className="mb-8 mt-0 text-base leading-7 text-muted">{session.adminTenants.length ? 'Selecione o espaço que você deseja administrar.' : 'Sua conta não tem uma paróquia administrativa vinculada. Solicite acesso ao responsável pela sua paróquia.'}</p>
          <div className="mb-6 grid divide-y divide-line overflow-hidden rounded-xl border border-line bg-white [&_a]:flex [&_a]:min-h-16 [&_a]:items-center [&_a]:gap-3 [&_a]:p-4 [&_a:hover]:bg-selection [&_span]:min-w-0 [&_span]:flex-1 [&_span]:font-semibold [&_span]:leading-6 [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0 [&_svg]:text-primary">{session.adminTenants.map(tenant => <Link key={tenant.id} to={`/${tenant.slug}/admin`} replace><Church size={21} aria-hidden="true" /><span>{tenant.name}</span><ArrowRight size={18} aria-hidden="true" /></Link>)}</div>
          <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline underline-offset-4" to="/">Voltar à página inicial</Link>
        </> : <>
          <h1 id="login-title">Bem-vindo de volta.</h1><p className="mb-8 mt-0 text-base leading-7 text-muted">Entre para cuidar da sua paróquia.</p>
          <form onSubmit={submit} noValidate aria-busy={pending}>
            <div className="mb-6 [&>label]:mb-2 [&>label]:block [&>label]:text-sm [&>label]:font-semibold [&_input]:block [&_input]:min-h-12 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-xl [&_input]:border [&_input]:border-control-border [&_input]:bg-surface [&_input]:px-4 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-ink [&_input]:placeholder:text-muted [&_input[aria-invalid=true]]:border-[var(--admin-danger)] [&_input:disabled]:bg-canvas"><label htmlFor="login-email">E-mail</label><input ref={emailRef} id="login-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} required disabled={pending} value={email} onChange={event => { setEmail(event.target.value); setFields(previous => ({ ...previous, email: undefined })); }} placeholder="seu@email.com" aria-invalid={!!fields.email} aria-describedby={fields.email ? 'login-email-error' : undefined} />{fields.email && <p id="login-email-error" className="mb-0 mt-2 text-sm leading-6 text-[var(--admin-danger)]">{fields.email}</p>}</div>
            <div className="mb-6 [&>label]:mb-2 [&>label]:block [&>label]:text-sm [&>label]:font-semibold [&_input]:block [&_input]:min-h-12 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-xl [&_input]:border [&_input]:border-control-border [&_input]:bg-surface [&_input]:px-4 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-ink [&_input]:placeholder:text-muted [&_input[aria-invalid=true]]:border-[var(--admin-danger)] [&_input:disabled]:bg-canvas"><label htmlFor="login-password">Senha</label><div className="relative [&_input]:pr-14 [&_button]:absolute [&_button]:right-1 [&_button]:top-1 [&_button]:grid [&_button]:size-11 [&_button]:place-items-center [&_button]:rounded-md [&_button]:text-muted [&_button:hover]:bg-selection"><input ref={passwordRef} id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={pending} value={password} onChange={event => { setPassword(event.target.value); setFields(previous => ({ ...previous, password: undefined })); }} aria-invalid={!!fields.password} aria-describedby={fields.password ? 'login-password-error' : undefined} /><button type="button" disabled={pending} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} aria-controls="login-password" onClick={() => { setShowPassword(value => !value); passwordRef.current?.focus(); }}>{showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button></div>{fields.password && <p id="login-password-error" className="mb-0 mt-2 text-sm leading-6 text-[var(--admin-danger)]">{fields.password}</p>}</div>
            {error && <p className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger" role="alert">{error}</p>}
            <button className={`${buttonClasses.primary.lg} w-full gap-3 disabled:cursor-not-allowed disabled:opacity-65`} type="submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" size={20} aria-hidden="true" />Entrando…</> : <>Entrar<ArrowRight size={19} aria-hidden="true" /></>}</button>
            <span className="sr-only" role="status">{pending ? 'Verificando seu acesso.' : ''}</span>
          </form>
          <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm font-semibold text-primary">{!launchMode ? <Link to="/recuperar-senha" className="inline-flex min-h-11 items-center">Esqueci minha senha</Link> : null}<Link to="/assinar" className="inline-flex min-h-11 items-center">{launchMode ? "Solicitar assinatura" : "Criar conta e assinar"}</Link></div>
        </>}
      </section>
    </main>
    <footer className="px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-center text-sm leading-6 text-muted">Paroquial · Informação que aproxima a comunidade.</footer>
  </div>;
}
