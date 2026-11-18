# Paroquial Web

Frontend React, TypeScript e Vite do Paroquial, com páginas públicas, administração e assinatura.

## Desenvolvimento

```bash
npm ci
npm run dev
```

A aplicação abre em `http://localhost:5173`. Use `.env.example` como referência para o ambiente local.

## Comandos

| Comando | Função |
| --- | --- |
| `npm run dev` | Iniciar o servidor de desenvolvimento |
| `npm run build` | Verificar TypeScript e gerar a aplicação em `dist/` |
| `npm run preview` | Servir o build localmente |
| `npm run lint` | Verificar o código com ESLint |
| `npm test` | Executar os testes com Vitest |

## Ambiente e APIs

- `VITE_API_URL`: endereço do backend.
- `VITE_ENABLE_MOCKS=true`: usar MSW durante o desenvolvimento. Login, envio de e-mail e pagamento são simulados nesse modo.
- `VITE_GOOGLE_MAPS_API_KEY`: habilitar busca de lugares e endereços no cadastro de igrejas, com Maps JavaScript API e Places API (New). Sem a chave, é possível marcar o mapa ou informar coordenadas.
- `VITE_GEOCODING_URL`: serviço compatível com Nominatim para busca de endereços.
- `VITE_SUBSCRIPTION_URL`: destino opcional de ajuda/demonstração da apresentação comercial.

O repositório contém o frontend; autenticação, e-mails e cobrança reais dependem do backend. Contratos estão em `src/shared/api/`, `src/features/auth/auth.api.ts` e `src/features/subscription/subscription.api.ts`. Os handlers em `src/mocks/` demonstram as respostas esperadas. Segredos de cobrança pertencem ao backend e não devem ser definidos em variáveis `VITE_*`.

## Estrutura

- `src/app/`: inicialização e rotas.
- `src/features/`: funcionalidades e testes.
- `src/shared/`: APIs, componentes, hooks e estilos compartilhados.
- `src/mocks/`: dados e handlers de desenvolvimento/testes.
- `public/`: fontes, mapas e imagens usadas pela aplicação.

A interface usa Tailwind CSS v4, com tokens em `src/shared/styles/index.css`. As licenças da fonte e do estilo do mapa acompanham os recursos em `public/`.

## Primeira versão sem banco de dados

O modo de lançamento é o padrão em desenvolvimento e em produção. O cadastro em /assinar prepara uma solicitação com plano, responsável, contato e dados da paróquia. A pessoa confere a mensagem e conclui o envio no WhatsApp. Não há criação de conta ou cobrança nesse fluxo.

A Vercel é o destino configurado. Use o preset Vite e o comando npm run build. A função em api/launch-session.js valida o login no servidor e usa um cookie de sessão assinado com validade de oito horas. Configure estas variáveis no ambiente de produção da hospedagem, fora do Git.

| Variável | Valor |
| --- | --- |
| PAROQUIAL_ADMIN_EMAIL | E-mail da conta administrativa |
| PAROQUIAL_ADMIN_PASSWORD | Senha exclusiva da conta administrativa |
| PAROQUIAL_SESSION_SECRET | Segredo aleatório com pelo menos 32 caracteres |
| PAROQUIAL_ADMIN_TENANT | sao-jose, ou o slug de demonstração que a conta pode acessar |

Gere o segredo com node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))". Restrinja tentativas repetidas de POST à rota /api/launch-session na hospedagem. Para testar localmente, configure os mesmos nomes em .env.local, use VITE_LAUNCH_MODE=true e abra pelo localhost. O ambiente publicado deve usar HTTPS para o cookie seguro.

A função de login é necessária mesmo sem banco. Uma hospedagem que entrega somente dist/ executa o formulário, mas não autentica o painel. Enquanto faltarem as variáveis do servidor, o painel fica fechado. Os dados do site e do painel são fictícios e carregados por MSW. As alterações no painel existem apenas durante a sessão da página e podem ser perdidas ao recarregar. Não use esses dados para cadastrar informações privadas.

### Ativar o paroquial-api na Vercel

Publique o NestJS no projeto Vercel próprio `paroquial-api`. No backend, configure `DATABASE_URL` com a conexão do pool do Neon e `FRONTEND_SESSION_ORIGIN` com a origem HTTPS do frontend. Use a conexão direta `DATABASE_URL_UNPOOLED` em `paroquial-api/.env` para rodar as migrations e provisionar a paróquia com o mesmo slug de `PAROQUIAL_ADMIN_TENANT`. A API deve responder `200` em `/api/v1/health/ready` e em `/api/v1/tenants/<slug>` antes de ativar o frontend.

No projeto Vercel `paroquial-web`, configure estas variáveis no ambiente do deploy e publique o frontend novamente.

| Variável | Valor |
| --- | --- |
| `VITE_LAUNCH_MODE` | `true` |
| `VITE_PAROQUIAL_API_TENANT` | Slug cadastrado na API e autorizado na sessão |
| `PAROQUIAL_API_ORIGIN` | URL pública do backend, começando com `https://` |

O `vercel.ts` usa o slug para encaminhar as rotas de perfil e canais ao backend. O navegador continua chamando o domínio do frontend e envia o cookie administrativo nesse domínio. A sessão de lançamento e o tema continuam nas funções existentes. Igrejas, destaques, agenda e liturgia ainda usam seus handlers atuais.

No painel, crie um canal e confirme a publicação em uma janela anônima. Em seguida, oculte o canal e confirme que ele aparece somente no painel. Para voltar aos mocks de perfil e canais, remova `VITE_PAROQUIAL_API_TENANT` e publique o frontend novamente.

## Tema e cores da paróquia

Em Site → Tema e cores, selecione uma paleta pronta ou personalize as cores principal, de destaque e de fundo. As outras cores da interface acompanham a paleta, com validação de contraste antes de salvar.

Por padrão, a preferência é salva neste navegador e separada por paróquia. Para disponibilizar a paleta a todos os visitantes, conecte um banco Neon ao projeto da Vercel. A tela oferece **Publicar tema** quando o banco está configurado. A gravação exige a sessão administrativa da paróquia.

1. Crie uma branch de teste no Neon e obtenha as variáveis com `neon env pull --branch <branch-de-teste> --services postgres`. A aplicação usa a conexão com pool de `DATABASE_URL`. Configure essa variável também no ambiente **Preview** da Vercel. Ela fica no servidor e não usa o prefixo `VITE_`.
2. Com a conexão direta da branch de teste em `DATABASE_URL_UNPOOLED`, execute `npm run db:migrate`. O comando cria `public.parish_themes` e pode ser repetido. Teste a publicação em **Site → Tema e cores**, depois confira a página pública em outra sessão do navegador.
3. Quando estiver validado, aplique a mesma migração no banco de produção, configure sua `DATABASE_URL` no ambiente **Production** da Vercel e implante a versão que contém esta integração. A migração deve ser executada antes de expor o banco à aplicação.

Se `BLOB_READ_WRITE_TOKEN` estiver configurada, uma paleta publicada anteriormente no Blob ainda é lida até a primeira publicação no banco. Paletas armazenadas apenas no navegador precisam ser reaplicadas. Agenda, igrejas, destaques e canais continuam na demonstração nesta etapa.
