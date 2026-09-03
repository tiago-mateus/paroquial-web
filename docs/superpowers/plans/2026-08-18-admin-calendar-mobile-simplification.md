# Admin Calendar Mobile Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar a agenda administrativa mobile para consultar, navegar e cadastrar eventos com baixa carga cognitiva.

**Architecture:** Manter o estado de visualização em `AdminCalendarPage` e usar divulgação progressiva dentro do `Agenda`: semana por padrão e mês expandido sob demanda. Preservar o desktop com classes responsivas; reduzir somente o conteúdo e as ações visíveis no mobile.

**Tech Stack:** React 19, TypeScript 5.8, React Router, TanStack Query, Tailwind CSS 4, Vitest e Testing Library.

## Global Constraints
- Mobile-first; desktop deve preservar a estrutura e as ações atuais.
- Não alterar API, modelos de evento ou regras de recorrência.
- Alvos de toque devem ter pelo menos 44 px.
- A URL deve continuar refletindo a data selecionada.
- Não adicionar dependências.
- Atualizar apenas o teste existente; não criar arquivos de teste novos.
- Não criar commits sem autorização explícita do usuário.

---

### Task 1: Calendário progressivo e visualmente leve

**Files:**
- Modify: `src/features/calendar/AdminCalendarPage.test.tsx`
- Modify: `src/features/calendar/admin/components/AdminCalendarNavigator.tsx`
- Modify: `src/features/calendar/components/Agenda.tsx`
- Modify: `src/features/calendar/components/CalendarDateCell.tsx`

**Interfaces:**
- Consumes: `AgendaView = 'week' | 'month'`, `onViewChange(view: AgendaView): void`.
- Produces: controle acessível `Ver mês completo`/`Recolher` via `Agenda`; `AdminCalendarNavigator` sem abas duplicadas.

- [ ] **Step 1: Atualizar o teste existente para expressar o fluxo progressivo**

Substituir o teste `alterna entre semana e mês e abre os filtros no mobile` por:

```tsx
it("expande o mês sob demanda e abre os filtros no mobile", async () => {
  renderPage();

  expect(screen.getByRole("listbox", { name: "Dias da semana" })).toBeInTheDocument();
  const expand = await screen.findByRole("button", { name: "Ver mês completo" });
  expect(expand).toHaveAttribute("aria-expanded", "false");

  fireEvent.click(expand);
  expect(screen.getByRole("button", { name: "Recolher" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getAllByRole("grid", { name: "Calendário mensal" })).toHaveLength(2);

  fireEvent.click(screen.getByRole("button", { name: "Buscar e filtrar eventos" }));
  expect(screen.getByRole("dialog", { name: "Buscar e filtrar eventos" })).toBeInTheDocument();
});
```
- [ ] **Step 2: Executar o teste e confirmar a falha esperada**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx`
Expected: FAIL porque ainda existe o botão `Mês` e `AdminCalendarNavigator` não passa `onViewChange` ao `Agenda`.

- [ ] **Step 3: Remover as abas e delegar a expansão ao Agenda**

Em `AdminCalendarNavigator.tsx`, remover o bloco `Semana | Mês`, remover o import de `classNames` e passar:

```tsx
<Agenda
  events={events}
  selectedDate={selectedDate}
  view={view}
  onSelectDate={onSelectDate}
  onViewChange={onViewChange}
  hideToolbar
  integratedWeekLabels={view === 'week'}
/>
```

Manter a barra com mês, setas e `Hoje`. O componente deve continuar recebendo `view` para definir se as setas mudam semana ou mês.

- [ ] **Step 4: Simplificar o indicador visual das datas**

Em `CalendarDateCell.tsx`, remover o badge numérico e o slot fixo de contagem. Usar um único ponto, sem comunicar quantidade:

```tsx
{eventCount > 0 && !adjacent ? (
  <span
    aria-hidden="true"
    className={classNames(
      'h-1.5 w-1.5 rounded-full',
      selected ? 'bg-orange-300' : 'bg-orange-500',
    )}
  />
) : (
  <span aria-hidden="true" className="h-1.5 w-1.5" />
)}
```

A célula mensal deve usar `min-h-12`, número centralizado e ponto abaixo. Remover fundo de grade forte em `Agenda.tsx`, usando `gap-1 bg-white` em semana e mês. Preservar selecionado escuro, hoje com destaque amber e dias adjacentes em cinza claro.

- [ ] **Step 5: Executar o teste focal**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx`
Expected: PASS, incluindo expansão `Ver mês completo` → `Recolher`.

---

### Task 2: Cabeçalho compacto e ação flutuante

**Files:**
- Modify: `src/features/calendar/AdminCalendarPage.test.tsx`
- Modify: `src/features/calendar/admin/components/AdminCalendarHeader.tsx`
- Modify: `src/features/calendar/AdminCalendarPage.tsx`

**Interfaces:**
- Consumes: `onCreate(): void`, `filtersOpen`, `editor`, `deleteCandidate`.
- Produces: cabeçalho mobile com filtro apenas; CTA flutuante `Novo evento` controlado pela página.

- [ ] **Step 1: Acrescentar asserções ao teste de abertura do formulário**

No primeiro teste, antes do clique, exigir um CTA mobile dedicado e identificável:

```tsx
const mobileCreate = await screen.findByTestId("mobile-create-event");
expect(mobileCreate).toHaveAccessibleName("Novo evento");
fireEvent.click(mobileCreate);
```

O CTA desktop continua dentro de `AdminPageHeader`; o botão flutuante recebe `data-testid="mobile-create-event"` somente para distinguir os dois elementos no ambiente jsdom, onde classes responsivas não alteram a árvore acessível.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx -t "abre o formulário"`
Expected: FAIL enquanto o CTA mobile ainda estiver no cabeçalho, sem o novo botão flutuante na página.

- [ ] **Step 3: Simplificar o cabeçalho mobile**

Em `AdminCalendarHeader.tsx`, remover `Plus` e o botão mobile `Novo evento`. Manter:

```tsx
<header className="sticky top-0 z-40 flex min-h-14 items-center gap-2 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl md:hidden">
  <h1 className="mr-auto text-base font-bold text-slate-950">Agenda</h1>
  <button
    type="button"
    onClick={onOpenFilters}
    aria-label="Buscar e filtrar eventos"
    className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200"
  >
    <SlidersHorizontal size={18} />
  </button>
</header>
```

Preservar o indicador amber quando `isFiltered` for verdadeiro e o cabeçalho desktop completo.
- [ ] **Step 4: Adicionar o botão flutuante em AdminCalendarPage**

Importar `Plus` de `lucide-react`. Depois da área principal e antes dos diálogos, renderizar somente quando não houver overlay aberto:

```tsx
{!editor && !deleteCandidate && !filtersOpen ? (
  <button
    type="button"
    data-testid="mobile-create-event"
    onClick={openCreate}
    aria-label="Novo evento"
    className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-xl active:scale-[0.98] md:hidden"
  >
    <Plus size={18} /> Novo evento
  </button>
) : null}
```

Adicionar `pb-28 md:pb-6` ao contêiner de conteúdo para o CTA não cobrir o último item.

- [ ] **Step 5: Executar os testes focais**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx`
Expected: PASS; abrir o CTA flutuante mostra `Novo evento` e remove o CTA enquanto o diálogo está aberto.

---

### Task 3: Lista de eventos simplificada no mobile

**Files:**
- Modify: `src/features/calendar/AdminCalendarPage.test.tsx`
- Modify: `src/features/calendar/admin/components/AdminEventList.tsx`

**Interfaces:**
- Consumes: `CalendarEvent`, callbacks `onEdit`, `onDuplicate`, `onDelete`.
- Produces: linha mobile com horário, título e local; metadados completos continuam visíveis em `md` ou maior.

- [ ] **Step 1: Atualizar o teste de ações para cobrir a linha tocável**

Antes de usar o botão de três pontos, testar a nova ação da linha:

```tsx
const openRowActions = await screen.findAllByRole("button", {
  name: "Abrir ações de Santa Missa",
});
fireEvent.click(openRowActions[0]);
expect(screen.getByRole("dialog", { name: "Santa Missa" })).toBeInTheDocument();
fireEvent.keyDown(document, { key: "Escape" });
```

Manter o restante do teste existente para confirmar que o menu explícito também abre apenas um painel.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx -t "abre apenas um painel"`
Expected: FAIL porque `Abrir ações de Santa Missa` ainda não existe.

- [ ] **Step 3: Reduzir a linha mobile**

Em `AdminEventList.tsx`:
- manter horário, título e local visíveis;
- aplicar `hidden md:flex` ao bloco com faixa de horário, duração e recorrência;
- manter tipo com `hidden sm:inline` e ações desktop atuais;
- remover a linha vertical e o ponto laranja da timeline mobile;
- reduzir `py-5` para `py-4` e usar `grid-cols-[3.5rem_minmax(0,1fr)_2.75rem]`.

Adicionar uma área tocável sobre o conteúdo, sem cobrir o botão de três pontos:

```tsx
<button
  type="button"
  onClick={() => setActionEvent(event)}
  aria-label={`Abrir ações de ${event.title}`}
  className="absolute inset-y-0 left-0 right-12 z-[1] md:hidden"
/>
```

Dar `relative z-[2]` ao botão `Ações de ...`. O conteúdo textual permanece legível e a linha inteira abre o mesmo bottom-sheet de ações.

- [ ] **Step 4: Alinhar o skeleton ao novo formato**

No `AdminEventListSkeleton`, usar duas linhas compactas no mobile e manter a coluna de ações no desktop:

```tsx
<div className="grid animate-pulse grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-4 py-4 md:grid-cols-[4rem_minmax(0,1fr)_8rem] md:px-5">
```

- [ ] **Step 5: Executar os testes focais**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx`
Expected: PASS para abertura por linha, menu, edição, duplicação e exclusão.

---
### Task 4: Integração e validação final

**Files:**
- Verify: `src/features/calendar/AdminCalendarPage.tsx`
- Verify: `src/features/calendar/components/Agenda.tsx`
- Verify: `src/features/calendar/admin/components/*.tsx`

**Interfaces:**
- Consumes: todos os componentes alterados nas tarefas anteriores.
- Produces: tela mobile integrada sem regressão de build, lint ou fluxo administrativo.

- [ ] **Step 1: Executar a suíte focal completa**

Run: `npm test -- src/features/calendar/AdminCalendarPage.test.tsx`
Expected: todos os testes de `AdminCalendarPage` passam.

- [ ] **Step 2: Executar diagnósticos TypeScript/build**

Run: `npm run build`
Expected: exit code 0; `tsc -b` e `vite build` concluem sem erro.

- [ ] **Step 3: Executar lint nos arquivos afetados**

Run: `npx eslint src/features/calendar/AdminCalendarPage.tsx src/features/calendar/AdminCalendarPage.test.tsx src/features/calendar/components/Agenda.tsx src/features/calendar/components/CalendarDateCell.tsx src/features/calendar/admin/components/AdminCalendarHeader.tsx src/features/calendar/admin/components/AdminCalendarNavigator.tsx src/features/calendar/admin/components/AdminEventList.tsx`
Expected: exit code 0, sem erros.

- [ ] **Step 4: Fazer inspeção responsiva manual**

Executar o servidor manualmente com `npm run dev` e verificar em 360 px, 390 px e 768 px:
- semana é o estado inicial;
- `Ver mês completo` expande e `Recolher` fecha;
- números dos dias permanecem alinhados e sem badges de quantidade;
- a lista mostra só horário, título e local no mobile;
- tocar na linha ou no menu abre o painel de ações;
- CTA flutuante não cobre o último evento e respeita safe area;
- CTA desaparece ao abrir filtros, formulário ou confirmação de exclusão;
- desktop mantém agenda mensal, metadados e ações inline.

- [ ] **Step 5: Registrar resultado sem criar commit automaticamente**

Listar arquivos alterados, comandos executados e resultados. Criar commit somente se o usuário solicitar explicitamente.
