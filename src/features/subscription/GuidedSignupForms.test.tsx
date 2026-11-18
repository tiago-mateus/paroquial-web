import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountForm, ParishForm } from "./GuidedSignupForms";
import { registerAccount, updateRegistration, type Onboarding } from "./subscription.api";
import { accountDraftKey, readAccountDraft, saveAccountDraft } from "./signupDraft";

beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });
vi.mock("./subscription.api", async (original) => ({
  ...await original<typeof import("./subscription.api")>(),
  getLegal: vi.fn().mockResolvedValue({ title: "Termos", version: "test-v1", content: "Termos de teste" }),
  registerAccount: vi.fn().mockResolvedValue({}),
  updateRegistration: vi.fn().mockResolvedValue({}),
}));
function account(action = vi.fn().mockImplementation(async (callback: () => Promise<unknown>) => { await callback(); return false; })) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountForm planId="premium" action={action} pending={false} /></MemoryRouter></QueryClientProvider>);
  return action;
}
const data: Onboarding = { status: "parish", user: { name: "Maria", email: "maria@example.test", emailVerified: true }, registration: { id: "test", planId: "basic", parish: null, price: { amount: 2790, currency: "BRL", interval: "month", version: "v1" } } };
const fillParish = () => {
  fireEvent.change(screen.getByLabelText("Nome da paróquia"), { target: { value: "Santo Antônio" } });
  fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Fortaleza" } });
  fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "CE" } });
};

describe("Cadastro compacto", () => {
  it("mostra os dados juntos, valida por campo e exige aceite antes de cadastrar", async () => {
    const action = account();
    const submit = screen.getByRole("button", { name: "Criar conta" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByLabelText("Seu nome")).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "Maria" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-descartavel" } });
    fireEvent.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("Aceite os termos");
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(submit);
    await waitFor(() => expect(registerAccount).toHaveBeenCalledWith({ name: "Maria", email: "maria@example.test", password: "senha-descartavel", planId: "premium", acceptedTerms: true, termsVersion: "test-v1" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@example.test");
  });

  it("mantém a senha fora do rascunho e permite mostrar ou ocultar", () => {
    account();
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-descartavel" } });
    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    expect(sessionStorage.getItem(accountDraftKey)).not.toContain("senha-descartavel");
  });

  it("envia os dados da paróquia juntos com o endereço sugerido", async () => {
    const action = vi.fn().mockImplementation(async (callback: () => Promise<unknown>) => { await callback(); return true; });
    const onSaved = vi.fn();
    render(<ParishForm data={data} pending={false} action={action} onSaved={onSaved} />);
    fillParish();
    expect(screen.queryByLabelText("Link da página")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revisar contratação" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(updateRegistration).toHaveBeenCalledWith({ parish: { name: "Santo Antônio", city: "Fortaleza", state: "CE", slug: "santo-antonio" } });
  });

  it("preserva o link personalizado ao mudar o nome e mantém os dados após falha", async () => {
    const action = vi.fn().mockResolvedValue(false);
    render(<ParishForm data={data} pending={false} action={action} onSaved={vi.fn()} />);
    fillParish();
    fireEvent.click(screen.getByRole("button", { name: "Editar link" }));
    fireEvent.change(screen.getByLabelText("Link da página"), { target: { value: "comunidade-local" } });
    fireEvent.change(screen.getByLabelText("Nome da paróquia"), { target: { value: "São José" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar contratação" }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(screen.getByLabelText("Link da página")).toHaveValue("comunidade-local");
    expect(screen.getByLabelText("Cidade")).toHaveValue("Fortaleza");
  });

  it("edita um campo do resumo sem alterar os demais dados", async () => {
    const parish = { name: "São José", city: "Fortaleza", state: "CE", slug: "sao-jose-local" };
    const onSaved = vi.fn();
    const action = vi.fn().mockImplementation(async (callback: () => Promise<unknown>) => { await callback(); return true; });
    render(<ParishForm data={{ ...data, registration: { ...data.registration!, parish } }} editField="slug" pending={false} action={action} onSaved={onSaved} />);
    expect(screen.getByLabelText("Link da página")).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Link da página"), { target: { value: "outro-link" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alteração" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(updateRegistration).toHaveBeenCalledWith({ parish: { ...parish, slug: "outro-link" } });
  });

  it("edita cidade e estado juntos preservando a paróquia e o link", async () => {
    const parish = { name: "São José", city: "Fortaleza", state: "CE", slug: "sao-jose-local" };
    const onSaved = vi.fn();
    const action = vi.fn().mockImplementation(async (callback: () => Promise<unknown>) => { await callback(); return true; });
    render(<ParishForm data={{ ...data, registration: { ...data.registration!, parish } }} editField="location" pending={false} action={action} onSaved={onSaved} />);
    expect(screen.getByLabelText("Cidade")).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Recife" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "PE" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alteração" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(updateRegistration).toHaveBeenCalledWith({ parish: { ...parish, city: "Recife", state: "PE" } });
  });

  it("recupera rascunhos antigos, exigindo senha e aceite novamente", () => {
    saveAccountDraft({ name: "Maria", email: "maria@example.test", step: 3 });
    account();
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByText(/preencha sua senha novamente/)).toHaveAttribute("role", "status");
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@example.test");
    expect(readAccountDraft()).toMatchObject({ name: "Maria", email: "maria@example.test" });
  });

  it("persiste apenas os dados permitidos e ignora rascunho vencido ou inválido", () => {
    const extra = { name: "Maria", email: "maria@example.test", step: 2, password: "segredo-descartavel", acceptedTerms: true };
    saveAccountDraft(extra);
    expect(sessionStorage.getItem(accountDraftKey)).not.toContain("segredo-descartavel");
    expect(sessionStorage.getItem(accountDraftKey)).not.toContain("acceptedTerms");
    sessionStorage.setItem(accountDraftKey, JSON.stringify({ expiresAt: Date.now() - 1000, value: extra }));
    expect(readAccountDraft()).toBeNull();
    sessionStorage.setItem(accountDraftKey, "JSON inválido");
    expect(readAccountDraft()).toBeNull();
  });
});
