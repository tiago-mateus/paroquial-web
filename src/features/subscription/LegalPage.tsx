import { useQuery } from "@tanstack/react-query";
import { getLegal } from "./subscription.api";
import { Failure, primaryClass, SubscriptionShell } from "./SubscriptionShell";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const query = useQuery({ queryKey: ["legal", kind], queryFn: () => getLegal(kind), retry: false });
  return <SubscriptionShell><article className="max-w-3xl">{query.isPending ? <p role="status">Carregando documento…</p> : query.isError ? <><Failure message="Este documento não está disponível agora." /><button className={primaryClass} onClick={() => void query.refetch()}>Tentar novamente</button></> : <><h1 className="text-3xl font-extrabold">{query.data.title}</h1><p className="text-sm text-muted">Versão {query.data.version}</p><div className="whitespace-pre-line text-base leading-8">{query.data.content}</div></>}</article></SubscriptionShell>;
}
