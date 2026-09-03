# Simplificação mobile da agenda administrativa

## Objetivo
Reduzir a carga visual da agenda administrativa sem prejudicar as três tarefas principais: consultar eventos, navegar entre datas e cadastrar eventos. O público inclui usuários com pouca familiaridade digital; clareza e previsibilidade têm prioridade sobre densidade de informação.

## Escopo
A mudança será mobile-first. O desktop mantém sua estrutura atual, recebendo apenas ajustes compartilhados que forem necessários para consistência. Não haverá alteração de API, modelos de evento ou regras de recorrência.

## Estrutura mobile
1. Cabeçalho compacto com título `Agenda` e acesso a busca/filtros.
2. Navegação mensal com anterior, mês/ano, ação `Hoje` quando aplicável e próximo.
3. Faixa semanal visível por padrão, com sete datas e indicação discreta de evento.
4. Controle único `Ver mês completo` expande o calendário no mesmo espaço; `Recolher` retorna à semana.
5. Linha compacta com data selecionada e total de eventos.
6. Lista de eventos.
7. Botão flutuante `Novo evento`, respeitando safe area e sem cobrir conteúdo.

## Calendário
- A tela inicia sempre na visão semanal.
- A visão mensal é progressiva, não uma segunda camada de abas.
- O controle atual `Semana | Mês` será removido no mobile.
- Na semana e no mês, cada data exibe somente o número e um indicador discreto quando houver eventos.
- Quantidades, badges e linhas fortes serão removidos do grid.
- O dia selecionado terá contraste forte; hoje terá destaque secundário.
- Swipe horizontal continuará disponível para mudar semana ou mês.

## Lista de eventos
- Cada item mostra somente horário, título e local.
- Duração, recorrência, tipo e demais metadados deixam de aparecer na listagem mobile.
- Tocar no item abre as ações/detalhes; o menu continua acessível.
- Estados vazio, carregando e erro permanecem, com textos curtos.

## Ações e filtros
- `Novo evento` sai do cabeçalho mobile e vira botão flutuante com ícone e texto.
- Busca e filtros permanecem em bottom-sheet, acionados por um único botão no cabeçalho.
- O botão flutuante não aparece enquanto formulários ou diálogos estiverem abertos.

## Acessibilidade e comportamento
- Alvos de toque terão pelo menos 44 px.
- Navegação por teclado e rótulos acessíveis existentes serão preservados.
- A URL continuará refletindo a data selecionada.
- Mudanças de data continuarão atualizando a lista sem uma navegação de página.

## Componentes afetados
- `AdminCalendarPage.tsx`: composição da tela e botão flutuante.
- `AdminCalendarHeader.tsx`: simplificação do cabeçalho mobile.
- `AdminCalendarNavigator.tsx`: remoção das abas e uso do expansor.
- `Agenda.tsx`: visão progressiva e grid visualmente leve.
- `CalendarDateCell.tsx`: indicador simples de eventos.
- `AdminEventList.tsx`: conteúdo reduzido no mobile, preservando desktop.

## Validação
Executar diagnóstico TypeScript, build/typecheck disponível e inspeção responsiva em larguras pequenas. Confirmar navegação semanal/mensal, seleção de data, filtros, criação, edição e ausência de sobreposição do botão flutuante.