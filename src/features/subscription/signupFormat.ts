import { ufOptions } from "./subscription.api";

export const stateNames: Record<string, string> = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
export const sortedStates = [...ufOptions].sort((a, b) => stateNames[a].localeCompare(stateNames[b], "pt-BR"));
export const stateLabel = (uf: string) => stateNames[uf] ? `${stateNames[uf]} (${uf})` : uf;
/** Public page address shown to the person, using the host they are on. */
export const publicPageUrl = (slug: string) => `${window.location.host}/${slug}`;
