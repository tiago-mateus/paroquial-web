# Requirements Document

## Introduction

Esta especificação define a simplificação mobile-first da agenda administrativa. A mudança reduz a densidade visual no mobile, preserva a experiência desktop e mantém os contratos técnicos e comportamentais existentes.

## Glossary

- **Agenda_Administrativa**: Tela React usada por administradores para consultar, navegar e gerenciar eventos.
- **Interface_Mobile**: Apresentação da Agenda_Administrativa em larguras inferiores ao breakpoint `md` existente.
- **Interface_Desktop**: Apresentação da Agenda_Administrativa no breakpoint `md` ou superior.
- **Calendario_Progressivo**: Calendário que inicia na semana e expande o mês no mesmo espaço sob demanda.
- **Data_Selecionada**: Data ativa usada pelo calendário, pela URL e pela lista de eventos.
- **Indicador_de_Evento**: Ponto visual discreto que informa a existência de pelo menos um evento sem exibir quantidade.
- **CTA_Flutuante**: Botão mobile `Novo evento` fixado acima da safe area.
- **Overlay**: Bottom-sheet, formulário, diálogo ou confirmação exibido sobre a página.
- **Lista_de_Eventos**: Relação de eventos correspondente à Data_Selecionada.
- **Painel_de_Acoes**: Bottom-sheet com detalhes e ações de um evento.
- **Teste_Existente**: Arquivo `src/features/calendar/AdminCalendarPage.test.tsx`.
- **Implementacao**: Alterações de código planejadas para cumprir esta especificação.
- **Processo_de_Entrega**: Atividades de validação e registro das alterações desta especificação.

## Requirements

### Requirement 1: Estrutura responsiva mobile-first

**User Story:** Como administrador com pouca familiaridade digital, quero uma agenda mobile previsível e compacta, para consultar e gerenciar eventos com baixa carga cognitiva.

#### Acceptance Criteria

1. WHILE a Agenda_Administrativa estiver na Interface_Mobile, THE Agenda_Administrativa SHALL apresentar o conteúdo na ordem: cabeçalho compacto, navegação de período, Calendario_Progressivo, resumo da Data_Selecionada, Lista_de_Eventos e CTA_Flutuante.
2. WHILE a Agenda_Administrativa estiver na Interface_Desktop, THE Agenda_Administrativa SHALL preservar a estrutura, os metadados e as ações existentes.
3. WHILE a Agenda_Administrativa estiver na Interface_Mobile, THE Agenda_Administrativa SHALL fornecer alvos interativos com dimensão mínima de 44 por 44 pixels.
4. THE Agenda_Administrativa SHALL preservar os rótulos acessíveis e a navegação por teclado existentes.

### Requirement 2: Calendário progressivo

**User Story:** Como administrador, quero começar por uma semana simples e expandir o mês sob demanda, para navegar sem controles duplicados.

#### Acceptance Criteria

1. WHEN a Agenda_Administrativa iniciar na Interface_Mobile, THE Calendario_Progressivo SHALL exibir sete datas na visão semanal.
2. WHEN o administrador acionar `Ver mês completo`, THE Calendario_Progressivo SHALL expandir a visão mensal no mesmo espaço e apresentar o controle `Recolher`.
3. WHEN o administrador acionar `Recolher`, THE Calendario_Progressivo SHALL retornar à visão semanal e apresentar o controle `Ver mês completo`.
4. WHILE a visão semanal ou mensal estiver visível, THE Calendario_Progressivo SHALL apresentar em cada data somente o número do dia e o Indicador_de_Evento quando aplicável.
5. WHILE a visão semanal ou mensal estiver visível, THE Calendario_Progressivo SHALL diferenciar visualmente a Data_Selecionada, a data atual e datas adjacentes com níveis distintos de destaque.
6. WHILE a Agenda_Administrativa estiver na Interface_Mobile, THE Calendario_Progressivo SHALL omitir o seletor duplicado `Semana | Mês`.

### Requirement 3: Navegação e seleção de data

**User Story:** Como administrador, quero navegar entre períodos e selecionar datas sem sair da página, para consultar eventos continuamente.

#### Acceptance Criteria

1. WHILE a visão semanal estiver ativa, WHEN o administrador acionar anterior ou próximo, THE Calendario_Progressivo SHALL navegar por uma semana.
2. WHILE a visão mensal estiver ativa, WHEN o administrador acionar anterior ou próximo, THE Calendario_Progressivo SHALL navegar por um mês.
3. WHILE a visão semanal ou mensal estiver ativa, WHEN o administrador executar swipe horizontal, THE Calendario_Progressivo SHALL navegar pelo período correspondente à visão ativa.
4. WHEN o administrador selecionar uma data, THE Agenda_Administrativa SHALL atualizar a Data_Selecionada na URL.
5. WHEN a Data_Selecionada mudar, THE Lista_de_Eventos SHALL atualizar o conteúdo sem iniciar uma navegação de página.
6. WHEN a data atual não corresponder à Data_Selecionada, THE Calendario_Progressivo SHALL disponibilizar a ação `Hoje`.

### Requirement 4: Cabeçalho, filtros e criação mobile

**User Story:** Como administrador, quero ações principais claras no mobile, para filtrar e criar eventos sem competir com o conteúdo.

#### Acceptance Criteria

1. WHILE a Agenda_Administrativa estiver na Interface_Mobile, THE Agenda_Administrativa SHALL apresentar um cabeçalho compacto com o título `Agenda` e um único botão `Buscar e filtrar eventos`.
2. WHEN o administrador acionar `Buscar e filtrar eventos`, THE Agenda_Administrativa SHALL abrir o Overlay de busca e filtros existente.
3. WHILE houver filtros ativos, THE Agenda_Administrativa SHALL apresentar um indicador visual no botão `Buscar e filtrar eventos`.
4. WHILE nenhum Overlay estiver aberto na Interface_Mobile, THE Agenda_Administrativa SHALL apresentar o CTA_Flutuante com ícone, texto e nome acessível `Novo evento`.
5. WHILE um formulário, filtro ou confirmação de exclusão estiver aberto, THE Agenda_Administrativa SHALL ocultar o CTA_Flutuante.
6. WHILE o CTA_Flutuante estiver visível, THE Agenda_Administrativa SHALL posicionar o CTA_Flutuante acima da safe area sem cobrir o último item da Lista_de_Eventos.
7. WHEN o administrador acionar o CTA_Flutuante, THE Agenda_Administrativa SHALL abrir o formulário de criação existente.

### Requirement 5: Lista mobile simplificada

**User Story:** Como administrador, quero ver apenas os dados essenciais de cada evento no mobile, para identificar compromissos rapidamente.

#### Acceptance Criteria

1. WHILE a Lista_de_Eventos estiver na Interface_Mobile, THE Lista_de_Eventos SHALL apresentar para cada evento somente horário, título e local.
2. WHILE a Lista_de_Eventos estiver na Interface_Desktop, THE Lista_de_Eventos SHALL preservar duração, recorrência, tipo, metadados e ações existentes.
3. WHEN o administrador tocar na área de conteúdo de um evento na Interface_Mobile, THE Lista_de_Eventos SHALL abrir o Painel_de_Acoes correspondente ao evento.
4. WHEN o administrador acionar o menu explícito de um evento, THE Lista_de_Eventos SHALL abrir uma única instância do Painel_de_Acoes correspondente ao evento.
5. WHILE o Painel_de_Acoes estiver aberto, THE Lista_de_Eventos SHALL manter o menu explícito separado da área tocável da linha.
6. WHILE a consulta de eventos estiver carregando, THE Lista_de_Eventos SHALL apresentar um esqueleto compacto alinhado ao formato mobile.
7. WHEN a consulta de eventos concluir com sucesso e retornar zero eventos, THE Lista_de_Eventos SHALL apresentar o estado vazio existente com texto curto.
8. IF a consulta de eventos concluir com falha, THEN THE Lista_de_Eventos SHALL substituir o esqueleto pelo estado de erro existente com texto curto.

### Requirement 6: Preservação dos fluxos administrativos

**User Story:** Como administrador, quero manter as ações existentes de eventos, para que a simplificação visual não reduza capacidades.

#### Acceptance Criteria

1. WHEN o administrador editar um evento, THE Agenda_Administrativa SHALL preservar o fluxo de edição existente.
2. WHEN o administrador duplicar um evento, THE Agenda_Administrativa SHALL preservar o fluxo de duplicação existente.
3. WHEN o administrador excluir um evento, THE Agenda_Administrativa SHALL preservar o fluxo de confirmação e exclusão existente.
4. WHEN o administrador criar um evento, THE Agenda_Administrativa SHALL preservar o fluxo de criação existente.

### Requirement 7: Compatibilidade técnica

**User Story:** Como mantenedor, quero limitar a mudança à apresentação responsiva, para evitar regressões nos contratos de domínio.

#### Acceptance Criteria

1. THE Implementacao SHALL preservar as APIs de eventos existentes.
2. THE Implementacao SHALL preservar os modelos de evento existentes.
3. THE Implementacao SHALL preservar as regras de recorrência existentes.
4. THE Implementacao SHALL usar somente as dependências já declaradas pelo projeto.
5. THE Implementacao SHALL limitar alterações de testes ao Teste_Existente.

### Requirement 8: Validação e entrega

**User Story:** Como mantenedor, quero validação focal e responsiva da mudança, para confirmar o comportamento mobile sem regressão desktop.

#### Acceptance Criteria

1. WHEN a etapa funcional for concluída, THE Processo_de_Entrega SHALL executar o Teste_Existente em modo de execução única.
2. WHEN todas as etapas funcionais forem concluídas, THE Processo_de_Entrega SHALL executar o build TypeScript e Vite disponível.
3. WHEN todas as etapas funcionais forem concluídas, THE Processo_de_Entrega SHALL executar ESLint nos arquivos afetados independentemente do resultado do build.
4. WHEN todas as validações automatizadas forem concluídas, THE Processo_de_Entrega SHALL inspecionar a Interface_Mobile nas larguras de 360, 390 e 768 pixels.
5. WHILE a inspeção responsiva estiver em andamento, THE Processo_de_Entrega SHALL verificar calendário progressivo, seleção de data, filtros, criação, edição, ações de eventos, safe area e preservação da Interface_Desktop, registrando cada resultado e continuando após uma falha individual.
6. THE Processo_de_Entrega SHALL manter o histórico Git sem novos commits até autorização explícita do usuário.