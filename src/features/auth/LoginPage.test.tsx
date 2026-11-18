import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { login, type LoginSession } from './auth.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./auth.api', () => ({ login: vi.fn() }));
const tenant = { id: '1', slug: 'sao-jose', name: 'São José', role: 'admin' };
const session: LoginSession = { user: { id: '1', name: 'Admin', email: 'admin@example.com' }, adminTenants: [tenant] };
function setup(path = '/login') {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={[path]}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/:slug/admin" element={<h1>Painel administrativo</h1>} /><Route path="/assinar" element={<h1>Continuar contratação</h1>} /></Routes></MemoryRouter></QueryClientProvider>);
}
function fill() {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ' admin@example.com ' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'minha-senha' } });
}
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('Login', () => {
  it('retoma a contratação de uma conta ainda sem assinatura ativa', async () => {
    vi.mocked(login).mockResolvedValue({ ...session, adminTenants: [], onboardingRequired: true });
    setup(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Continuar contratação' })).toBeInTheDocument();
  });
  it('valida os campos antes de chamar a API e foca o primeiro erro', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(login).not.toHaveBeenCalled();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveFocus();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');
  });

  it('mostra e oculta a senha sem perder o valor', () => {
    setup(); fill();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Senha')).toHaveValue('minha-senha');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('preserva os valores após falha e permite tentar novamente', async () => {
    vi.mocked(login).mockRejectedValueOnce({ code: 'INVALID_CREDENTIALS' }).mockResolvedValueOnce(session);
    setup(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos');
    expect(screen.getByLabelText('Senha')).toHaveValue('minha-senha');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Painel administrativo' })).toBeInTheDocument();
    expect(login).toHaveBeenLastCalledWith('admin@example.com', 'minha-senha');
  });

  it('evita envio duplicado enquanto aguarda a resposta', async () => {
    let resolve!: (value: LoginSession) => void;
    vi.mocked(login).mockImplementation(() => new Promise(done => { resolve = done; }));
    setup(); fill();
    fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form')!);
    fireEvent.submit(screen.getByRole('button', { name: 'Entrando…' }).closest('form')!);
    expect(login).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
    await act(async () => resolve(session));
  });

  it('oferece somente as paróquias retornadas quando há vários acessos', async () => {
    vi.mocked(login).mockResolvedValue({ ...session, adminTenants: [tenant, { ...tenant, id: '2', slug: 'santa-rita', name: 'Santa Rita' }] });
    setup('/login?tenant=nao-autorizada'); fill(); fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Escolha sua paróquia' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'São José' })).toHaveAttribute('href', '/sao-jose/admin');
    expect(screen.getByRole('link', { name: 'Santa Rita' })).toHaveAttribute('href', '/santa-rita/admin');
  });

  it('explica ausência de vínculo administrativo', async () => {
    vi.mocked(login).mockResolvedValue({ ...session, adminTenants: [] });
    setup(); fill(); fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Acesso sem paróquia' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument());
  });
});
