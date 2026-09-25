# Padronização do layout administrativo

## Objetivo

Reformular o admin do Paroquial como uma única experiência operacional, mantendo Poppins, âmbar e tons neutros. Dashboard, Agenda, Site e Paróquia devem compartilhar hierarquia, largura, espaçamento, estados e comportamento responsivo, sem alterar rotas, contratos de API ou a organização funcional já adotada.

O resultado deve permitir que a secretaria reconheça rapidamente onde está, qual é a tarefa principal e como salvar ou criar conteúdo. A mudança preserva navegação direta, histórico, proteção contra perda de alterações, invalidação de consultas e acesso às páginas públicas.

## Escopo

Entram nesta reformulação:

- shell administrativo, sidebar e navegação inferior;
- cabeçalho de página e navegação entre subáreas;
- containers, seções, superfícies, listas e barras de ferramentas;
- formulários, barra de salvamento, dialogs e bottom sheets;
- estados de carregamento, vazio, erro, sucesso e conteúdo longo;
- Dashboard, Agenda, Site, Paróquia, Igrejas e horários de confissão;
- comportamento em mobile, tablet e desktop.

Não entram mudanças no backend, novas rotas, novas funcionalidades editoriais, rebranding, troca de tipografia ou reformulação das páginas públicas. A prévia e os links públicos permanecem meios de conferir o resultado.

## Princípios

1. Cada rota tem um único título de primeiro nível e uma ação principal clara.
2. Elementos com a mesma função usam a mesma estrutura, densidade e posição.
3. Mobile prioriza a tarefa atual; desktop aproveita espaço sem adicionar painéis decorativos.
4. Cards representam agrupamentos; listas operacionais usam divisórias e linhas compactas.
5. Estados e feedback ficam próximos do conteúdo que afetam.
6. A reformulação preserva comportamento antes de alterar aparência.

## Arquitetura de layout

### Shell

`AdminLayout` continua responsável pelas quatro áreas principais: Início, Agenda, Site e Paróquia. No desktop, a sidebar permanece visível e estável. No mobile, a navegação inferior mantém quatro destinos e respeita `safe-area-inset-bottom`.

O conteúdo principal usa fundo `stone-50` em todos os tamanhos. Superfícies de trabalho usam branco. A navegação inferior, ações flutuantes e barras de salvamento devem reservar espaço no fluxo para nunca cobrir o último controle.

### Cabeçalho

`AdminPageHeader` é o único cabeçalho das rotas administrativas. Ele contém:

- contexto curto “Paroquial admin”;
- título da rota;
- descrição no desktop quando ajudar a explicar a tarefa;
- retorno contextual apenas quando existir um destino pai real;
- acesso ao resultado público;
- ação principal no desktop e ações contextuais mobile quando necessárias.

O conteúdo não repete o título da página. Títulos internos descrevem blocos concretos, como “Dados institucionais”, “Ordem dos canais” ou “Programação de hoje”.

### Navegação secundária

`AdminSectionTabs` continua abaixo do cabeçalho e usa rotas reais. Agenda, Site e Paróquia preservam suas subáreas atuais. A faixa pode rolar horizontalmente no mobile sem produzir overflow na página e mantém a aba ativa visível.

### Container

Um componente compartilhado de página fornece largura, margens e espaçamento vertical. O padrão é:

- `max-w-5xl` para dashboard, listas e formulários;
- `max-w-7xl` para Agenda e Igrejas, que precisam de duas colunas ou mapa;
- padding horizontal de 16 px no mobile, 24 px no tablet e 32 px no desktop;
- espaçamento vertical de 16–24 px conforme o viewport.

Exceções são propriedades explícitas do componente, evitando strings divergentes repetidas nas páginas.

## Famílias de tela

### Consulta e gestão

Usada por Destaques, Canais, Igrejas, Agenda e Situação do site. A composição é:

1. cabeçalho compartilhado;
2. container de página;
3. superfície com cabeçalho interno opcional, resumo e ação mobile;
4. lista, grade ou área especializada;
5. estados da consulta dentro da mesma superfície.

Linhas mantêm informação principal à esquerda e ações à direita. No mobile, ações menos frequentes podem ser agrupadas, desde que editar, criar e resolver pendências continuem acessíveis. Reordenação mantém nome acessível e estado desabilitado correto.

### Edição persistente

Usada por Dados e contato, Capa da página e Horários de confissão. A composição é:

1. cabeçalho compartilhado;
2. formulário dentro do container padrão;
3. uma superfície dividida em seções sem repetir o título da rota;
4. `AdminSaveBar` como único rodapé de salvamento;
5. `UnsavedChanges` durante edição válida e não pendente.

`AdminSaveBar` permanece fixa acima da navegação no mobile e integrada à superfície no desktop. Ela cobre limpo, alterado, inválido, enviando, salvo e erro, preservando valores após falha.

### Dashboard

O Dashboard preserva foco no dia e nas próximas tarefas. A ordem será:

1. resumo do dia e nome da paróquia;
2. ações rápidas;
3. pendências;
4. programação de hoje;
5. visão rápida e atalhos secundários.

No desktop, a composição pode usar duas colunas, mantendo pendências e programação como conteúdo principal. Métricas continuam compactas e acionáveis.

### Agenda e Igrejas

Agenda preserva a relação entre navegador temporal, filtros e eventos. Igrejas preserva lista e mapa. Ambas usam o container largo e adotam as mesmas superfícies, títulos internos e estados do restante do admin. Breakpoints especializados continuam permitidos quando a tarefa exige, especialmente na transição entre sidebar e duas colunas.

## Componentes compartilhados

A implementação deve introduzir componentes pequenos e sem regras de negócio:

- `AdminPage`: fundo, altura mínima, cabeçalho e conteúdo;
- `AdminPageContent`: largura e espaçamento, com variantes padrão e larga;
- `AdminSurface`: superfície branca, borda, raio e overflow;
- `AdminSurfaceHeader`: título interno, descrição, resumo e slot de ação;
- `AdminFormSection`: seção de formulário com título, descrição e conteúdo.

Componentes de domínio mantêm consultas e mutações. `AdminFormDialog`, `AdminSaveBar`, `AdminSectionTabs`, `AdminPageHeader` e `UnsavedChanges` são adaptados ao novo sistema em vez de duplicados.

## Linguagem visual

- Poppins permanece como tipografia.
- Slate escuro permanece para texto e ação primária.
- Amber identifica seleção, contexto paroquial e foco.
- Branco e stone formam as superfícies e o fundo.
- Emerald comunica sucesso e red comunica erro ou ação destrutiva.
- Raios ficam entre 12 e 16 px; pills são reservadas para estados compactos.
- Elevação usa borda ou sombra conforme o contexto, sem acumular ambos como decoração.
- Controles interativos têm foco visível, nome acessível e alvo de 44 px sempre que possível.

## Responsividade

Em 360–390 px, conteúdo ocupa a largura útil, ações não provocam corte e controles fixos respeitam navegação e safe area. Em 768 px, o layout considera a sidebar já ativa e evita forçar composições desktop dentro da largura restante. Em 1440 px, páginas usam a largura definida pela família e não ficam artificialmente estreitas.

Dialogs funcionam como bottom sheets no mobile e painéis centralizados no desktop. Conteúdo rola internamente; cabeçalho e ações permanecem acessíveis. Foco inicial, Escape, ciclo de Tab e restauração de foco continuam preservados.

## Estados e dados

Carregamento, vazio e erro ocupam a mesma superfície do conteúdo final para impedir saltos estruturais. Erros de consulta oferecem nova tentativa quando possível. Erros de mutação mantêm o rascunho e permitem reenviar.

A reformulação não muda query keys nem contratos de API. Após mutações, continuam sendo invalidados consumidores públicos e administrativos afetados. `tenantSlug` permanece em rotas e consultas. Atualizações parciais do tenant continuam passando por `updateTenantFields` para evitar apagar campos de outras áreas.

## Acessibilidade

- um `h1` por rota;
- hierarquia de títulos internos consistente;
- navegações com nomes distintos;
- `aria-current` em destinos ativos;
- labels e erros associados aos campos;
- controles somente com ícone têm nome acessível;
- foco não fica encoberto por elementos sticky ou fixos;
- redução de movimento é respeitada;
- nenhum controle interativo é aninhado em outro.

## Migração

A migração ocorre em três incrementos revisáveis:

1. fundações compartilhadas: shell, cabeçalho, abas, containers, superfícies e formulários;
2. Dashboard, Site, Paróquia e horários;
3. Agenda e Igrejas, preservando seus layouts especializados.

Cada incremento mantém a aplicação utilizável e não depende de migração simultânea de todas as rotas.

## Validação

Testes de comportamento cobrem composição do cabeçalho, navegação ativa, variantes de container, salvamento e proteção de alterações. Testes existentes de domínio permanecem válidos.

A validação visual compara as principais famílias em `390x844`, `768x1024` e `1440x1000`, incluindo:

- Dashboard com e sem pendências;
- Agenda com filtros e dialog de evento;
- Destaques e Canais com conteúdo e vazio;
- Capa e Dados com alterações não salvas, erro e sucesso;
- Igrejas com lista, mapa e editor;
- Horários com linhas longas e validação.

Também são verificados console, overflow horizontal, último controle acima das barras fixas, navegação por teclado e restauração de foco. Build, testes e detector mecânico de UI encerram a implementação.

## Critérios de aceite

- todas as rotas administrativas usam o mesmo shell, cabeçalho e ritmo de container;
- títulos de rota não se repetem como título do primeiro bloco;
- superfícies equivalentes têm borda, raio e padding consistentes;
- formulários persistentes usam uma barra de salvamento compartilhada;
- mobile, tablet e desktop não apresentam overflow ou conteúdo encoberto;
- rotas, ações, dados, guards e invalidações existentes continuam funcionando;
- estados de carregamento, vazio, erro, pending e sucesso mantêm a estrutura da tela;
- testes, build e validação visual relevante passam sem regressões materiais.
