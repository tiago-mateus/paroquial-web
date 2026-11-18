import { AlertCircle, CheckCircle2, ChevronDown, LoaderCircle, MapPin } from "lucide-react";
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { hasValidChurchCoordinates, type PublicChurch, type UpsertChurchRequest } from "../../shared/api/churches";
import { normalizeChurchSearch } from "../churches/churches.utils";
import { ChurchLocationPicker, type ChurchLocation } from "./ChurchLocationPicker";
import { fieldClassName, labelClassName } from "./AdminFormStyles";
import { churchRegistrationError } from "./churchRegistration.utils";

export type ChurchRegistrationStep = "location" | "details";
export type ChurchAddressStatus = "idle" | "loading" | "ready" | "unavailable";

type Props = {
  step: ChurchRegistrationStep;
  onStepChange: (step: ChurchRegistrationStep) => void;
  form: UpsertChurchRequest;
  setForm: Dispatch<SetStateAction<UpsertChurchRequest>>;
  center: ChurchLocation;
  searchNear?: ChurchLocation;
  churches: PublicChurch[];
  nameRef: RefObject<HTMLInputElement | null>;
  addressStatus: ChurchAddressStatus;
  onLocationChange: (location: ChurchLocation) => void;
};

export function ChurchRegistrationForm({ step, onStepChange, form, setForm, center, searchNear, churches, nameRef, addressStatus, onLocationChange }: Props) {
  const locationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step === "details") nameRef.current?.focus();
    else locationRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }, [nameRef, step]);
  const duplicate = form.nome.trim() ? churches.find((church) => normalizeChurchSearch(church.nome) === normalizeChurchSearch(form.nome.trim())) : undefined;
  const imageError = form.urlImg.trim() && churchRegistrationError({ ...form, nome: form.nome.trim() || "Igreja" });
  const locationValid = hasValidChurchCoordinates(form);
  const addressUnavailable = addressStatus === "unavailable" && !form.endereco.trim();

  if (step === "location") return <div ref={locationRef} className="grid gap-4">
    <ChurchLocationPicker location={{ latitude: form.latitude, longitude: form.longitude }} center={center} searchNear={searchNear} address={form.endereco} onLocationChange={onLocationChange} onAddressChange={(endereco) => setForm((current) => ({ ...current, endereco }))} />
    <ChurchCoordinates form={form} setForm={setForm} />
  </div>;

  return <div className="grid gap-5">
    <div className={`flex items-start gap-3 rounded-xl p-3.5 ${locationValid ? "bg-selection/60" : "bg-accent/20"}`}>
      {locationValid ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> : <MapPin size={20} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />}
      <div className="min-w-0 flex-1"><p className={`m-0 text-sm font-bold ${locationValid ? "text-primary" : "text-accent-ink"}`}>{locationValid ? "Localização definida" : "Revise a localização"}</p><p className="mb-0 mt-1 break-words text-sm leading-5 text-muted">{locationValid ? form.endereco.trim() || "Ponto marcado no mapa. Complete os dados abaixo." : "As coordenadas precisam indicar um ponto válido no mapa."}</p></div>
      <button type="button" onClick={() => onStepChange("location")} aria-label="Alterar localização" className="-my-1 min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus">Alterar</button>
    </div>
    <div><label className={labelClassName}>Nome<input ref={nameRef} required value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} autoComplete="organization" placeholder="Ex.: Capela Nossa Senhora de Fátima" aria-describedby={duplicate ? "church-duplicate-name" : "church-name-hint"} className={fieldClassName} /></label><p id="church-name-hint" className="mb-0 mt-1.5 text-sm leading-5 text-muted">Use o nome pelo qual a comunidade conhece este local.</p></div>
    {duplicate ? <p id="church-duplicate-name" role="status" className="m-0 flex items-start gap-2 rounded-xl bg-accent/20 p-3 text-sm leading-5 text-accent-ink"><AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span>Já existe um local chamado “{duplicate.nome}”. Confira se é a mesma igreja antes de cadastrar.</span></p> : null}
    <fieldset className="m-0 min-w-0 border-0 p-0"><legend className="mb-2 text-sm font-semibold text-ink">Tipo de local</legend><div className="grid grid-cols-3 gap-2">
      {[{ value: "matriz", label: "Matriz" }, { value: "capela", label: "Capela" }, { value: "comunidade", label: "Comunidade" }].map(({ value, label }) => <label key={value} className="relative min-w-0 cursor-pointer"><input type="radio" name="church-type" value={value} checked={form.tipo === value} onChange={() => setForm((current) => ({ ...current, tipo: value }))} className="peer sr-only" /><span className="flex min-h-12 items-center justify-center rounded-lg border border-line px-1 py-2 text-[13px] font-semibold text-muted transition-colors peer-checked:border-primary peer-checked:bg-selection peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus motion-reduce:transition-none">{label}</span></label>)}
    </div></fieldset>
    <div><label className={labelClassName}>Endereço exibido no site<input value={form.endereco} onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))} autoComplete="street-address" placeholder="Rua, número, bairro e cidade" className={fieldClassName} /></label><p role={addressStatus === "loading" || addressUnavailable ? "status" : undefined} className="mb-0 mt-1.5 flex items-start gap-1.5 text-sm leading-5 text-muted">{addressStatus === "loading" ? <LoaderCircle size={15} className="mt-0.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{addressStatus === "loading" ? "Buscando o endereço deste ponto… Você também pode preenchê-lo." : addressUnavailable ? "Não foi possível sugerir um endereço. Você pode preenchê-lo agora ou depois." : "Opcional. Confira o número e o bairro para ajudar quem vai até a igreja."}</p></div>
    <details className="border-t border-line pt-2 text-sm text-muted"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-ink">Foto e contato <span className="font-normal text-muted">(opcional)</span></summary><div className="grid gap-4 pb-2 sm:grid-cols-2">
      <label className={labelClassName}>Telefone<input type="tel" inputMode="tel" autoComplete="tel" value={form.telefone ?? ""} onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value || null }))} className={fieldClassName} /></label>
      <div><label className={labelClassName}>URL da imagem<input type="url" value={form.urlImg} onChange={(event) => setForm((current) => ({ ...current, urlImg: event.target.value }))} placeholder="https://..." aria-invalid={Boolean(imageError)} aria-describedby="church-image-hint" className={fieldClassName} /></label><p id="church-image-hint" className={`mb-0 mt-1.5 text-sm leading-5 ${imageError ? "text-danger" : "text-muted"}`}>{imageError || "Use um link público direto para a foto da igreja."}</p></div>
    </div></details>
    <ChurchCoordinates form={form} setForm={setForm} />
  </div>;
}

function ChurchCoordinates({ form, setForm }: Pick<Props, "form" | "setForm">) {
  return <details className="group border-t border-line pt-2 text-sm text-muted"><summary className="flex min-h-11 cursor-pointer items-center gap-2 py-3 font-medium"><MapPin size={15} aria-hidden="true" /><span className="min-w-0 flex-1">Informar coordenadas manualmente</span><ChevronDown size={16} aria-hidden="true" className="shrink-0 group-open:rotate-180" /></summary><div className="grid gap-3 pb-2 sm:grid-cols-2"><label className={labelClassName}>Latitude<input type="number" min="-90" max="90" step="any" value={form.latitude || ""} onChange={(event) => setForm((current) => ({ ...current, latitude: Number(event.target.value) }))} className={fieldClassName} /></label><label className={labelClassName}>Longitude<input type="number" min="-180" max="180" step="any" value={form.longitude || ""} onChange={(event) => setForm((current) => ({ ...current, longitude: Number(event.target.value) }))} className={fieldClassName} /></label></div></details>;
}
