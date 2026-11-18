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

Quando o backend estiver pronto, defina VITE_LAUNCH_MODE=false e aponte VITE_API_URL para o backend para retomar o fluxo original.

## Tema e cores da paróquia

Em Site → Tema e cores, selecione uma paleta pronta ou personalize as cores principal, de destaque e de fundo. As outras cores da interface acompanham a paleta, com validação de contraste antes de salvar.

Por padrão, a preferência é salva neste navegador e separada por paróquia. Para disponibilizar a paleta a todos os visitantes, conecte um armazenamento Vercel Blob privado ao projeto de produção e disponibilize BLOB_READ_WRITE_TOKEN no servidor. Essa variável não usa o prefixo VITE_. A tela passará a oferecer Publicar tema. A gravação exige a sessão administrativa da paróquia.
