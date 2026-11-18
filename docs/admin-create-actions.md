# Ações de criação administrativas

## Inventário e decisões

| Tela/componente | Ação encontrada | Classificação | Tratamento |
| --- | --- | --- | --- |
| Agenda / `AdminCalendarHeader` | Novo evento | Criação principal | Botão no cabeçalho / FAB |
| Igrejas e capelas / `AdminChurchesPage` | Nova igreja | Criação principal | Botão no cabeçalho / FAB |
| Destaques / `AdminHighlightsPage` | Novo destaque | Criação principal | Botão no cabeçalho / FAB |
| Canais oficiais / `AdminChannelsPage` | Novo canal | Criação principal | Botão no cabeçalho / FAB |
| Painel / `AdminDashboardPage` | Novo evento | Criação principal do resumo | Mesmo padrão; mantém o link com `action=new` |
| Painel | Novo destaque | Criação secundária | Link com contorno; há somente uma ação primária |
| Mapa de igrejas | Cadastrar no mapa | Criação contextual pela posição no mapa | Botão secundário; mantém a escolha de coordenadas |
| Lista cronológica / `AdminListView` | Adicionar evento neste dia | Criação contextual na data selecionada | Botão com contorno junto ao dia |
| Horários de confissão / `ConfessionScheduleEditor` | Adicionar | Adição de linha no formulário | Botão contextual preservado |
| Formulário de evento | Adicionar descrição | Expansão de campo interno | Controle contextual preservado |
| Menu de evento | Duplicar | Ação secundária sobre um evento | Menu preservado |
| Estados vazios de agenda, igrejas, destaques, canais e painel | Criar evento, Cadastrar igreja, Criar destaque, Criar canal, Novo evento | Duplicatas da criação principal | Removidas; a ação principal continua disponível |
| Formulários, confirmação e configurações | Salvar, publicar, continuar, cancelar, excluir, visualizar, configurar | Edição, confirmação ou ação secundária | Fluxos existentes preservados |

## Padrão responsivo

- Desktop a partir de `lg` (64 rem / 1024 px): botão verde institucional, ícone `Plus`, texto explícito, altura mínima de 44 px e raio de 12 px. Alinhado à direita do cabeçalho.
- Abaixo de `lg`, incluindo tablet de 768 px: o mesmo elemento se torna um FAB circular de 56 px. A escolha acompanha o breakpoint da navegação administrativa, sem detecção de dispositivo por JavaScript.
- Posição: `bottom: calc(var(--admin-nav-offset) + var(--admin-fab-gap))`; o offset existente considera os 72 px da barra inferior e a safe area. Margem de 16 px, incluindo proteção à safe area lateral.
- `--admin-fab-size`, `--admin-fab-gap` e `--admin-fab-reserve` centralizam dimensões e espaço de rolagem. Nas listas, o final do conteúdo pode ser rolado acima do FAB.
- O mapa mantém sua altura de viewport. Seus controles sobem pelo mesmo token de reserva e o painel de busca tem altura limitada para liberar a área operacional inferior.
- Camada 30, abaixo da navegação (50), dos diálogos (80 ou superior) e dos menus portados (100). O mapa já isola as camadas internas do Leaflet. Notificações permanecem no topo.
- No mobile, o FAB fica oculto durante modais, marcação de igreja no mapa e foco em campos de texto/seleção. Isso evita competição durante tarefas e entrada com teclado virtual; ao encerrar o contexto, o botão volta.

## Implementação

`AdminCreateAction.tsx` oferece `label`, `onClick`, `href`, `buttonRef`, `disabled`, `loading`, `visible` e `mobileHidden`. Usa os tokens e as classes de botões existentes. `AdminPageHeader` adota o componente somente quando a ação declara `kind: 'create'`.

Um único elemento e handler atendem aos dois layouts. Mantêm-se os links, os formulários, as mutações, a restauração de foco e o controle de acesso por `RequireAdmin`. A visibilidade opcional permite reutilizar o componente com permissões específicas sem criar outra versão do botão.

O nome acessível explícito usa `aria-label`; ícones são decorativos. Loading expõe `aria-busy`, indicador e bloqueio da ação; disabled impede a ativação. Há foco visível, estado de toque e respeito à preferência por movimento reduzido.

Arquivos criados:

- `src/features/admin/AdminCreateAction.tsx`
- `src/features/admin/AdminCreateAction.test.tsx`
- Este relatório.

Arquivos adaptados:

- `src/features/admin/AdminPageHeader.tsx`
- `src/features/admin/AdminChurchesPage.tsx`
- `src/features/admin/AdminContentPage.tsx`
- `src/features/admin/AdminDashboardPage.tsx`
- `src/features/admin/dashboard/TodayAgenda.tsx`
- `src/features/calendar/admin/components/AdminCalendarHeader.tsx`
- `src/features/calendar/admin/components/AdminEventList.tsx`
- `src/shared/styles/admin.css`

## Validação

- `npx tsc -b --pretty false`: aprovado.
- `npm run build`: aprovado; permanece o aviso de chunks maiores que 500 kB.
- ESLint dos arquivos TypeScript alterados/criados: aprovado.
- `npm run lint`: bloqueado por import de `Church` não usado em `PublicPageCover.tsx`; também há aviso de Fast Refresh em `SubscriptionShell.tsx`. Esses arquivos não foram alterados nesta entrega.
- Testes de componente: controle único, handler, referência/foco, loading, disabled, link e visibilidade; seis casos aprovados. Os dois testes do cabeçalho também passaram.
- Suíte completa final: **127 testes aprovados e 16 falhas**, em 22 arquivos aprovados e sete com falhas. Permanecem duas exceções de `ResizeObserver` ausente no ambiente de testes do carrossel público.
- Agenda administrativa, fluxo do mapa de igrejas, painel, cabeçalho, componente de criação, lista de eventos e permissões (`RequireAdmin`): testes aprovados na execução completa.
- Arquivos com falhas: `AdminManagementPages`, `AdminOrganization`, `AdminSectionTabs`, `PublicCalendarPage`, `PublicChurchesPage`, `PublicHomePage` e `PublicLinksPage`. Não foram ampliadas as alterações para atualizar expectativas de telas ou infraestrutura de testes fora desta padronização.
- Navegador Chromium com mocks: 25 combinações, cobrindo cinco páginas em 1440, 1280, 768, 390 e 320 px. Verificados geometria, círculo, espaçamento acima da navegação, ausência de overflow horizontal, controle único, área clicável e acesso aos controles do mapa.
- Abertura e fechamento dos quatro formulários existentes aprovados nas cinco larguras. FAB oculto durante os diálogos e entrada em busca. Screenshots de desktop e mobile inspecionadas.
- As cinco falhas de `AdminManagementPages` foram reproduzidas em cópia isolada com cabeçalho e estados vazios anteriores à padronização: confirmação de descarte, campo da capa, alça de destaque, salvar horários e mensagem de publicação. O workspace original não foi revertido para essa comparação.
- As outras quatro falhas administrativas (`AdminOrganization` e `AdminSectionTabs`) também se reproduziram nessa cópia: navegação da paróquia, edição/descarte da capa e seleção da aba de status. As sete falhas restantes pertencem às páginas públicas, cujos componentes não foram alterados nesta entrega.

## Limitações

A validação de navegador usa ambiente de demonstração. Não substitui testes em iOS/Android reais com teclado virtual e safe area físicos; a prevenção durante entrada foi verificada pelo foco no campo. O fundo cartográfico externo não carregou nas capturas; marcadores, controles e fluxos locais foram verificados. Alterações preexistentes do Git foram preservadas.
