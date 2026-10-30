# Backend - Portal Web Anjos da Madrugada

API do Portal Web Anjos da Madrugada, construída com Node.js, Express, TypeScript, Sequelize e PostgreSQL. Ela atende o site público, o painel administrativo e o portal do voluntário.

## Stack

- Node.js 20+
- Express 4
- TypeScript em ES Modules
- PostgreSQL
- Sequelize + Sequelize CLI
- JWT para autenticação
- bcryptjs para senhas
- Nodemailer para SMTP/fila de e-mails
- Helmet, CORS e rate limits para hardening
- Winston para logs

## Como Rodar

```bash
cd /workspace/backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

A API sobe por padrão em `http://localhost:3000` e todas as rotas ficam sob `/api`, exceto arquivos públicos da galeria em `/uploads/gallery`.

Para build de produção:

```bash
npm run build
npm start
```

## Scripts

```bash
npm run dev              # desenvolvimento com watch via tsx
npm run start:dev        # roda TypeScript sem watch
npm run build            # compila para dist/
npm start                # roda dist/server.js
npm run db:migrate       # aplica migrations
npm run db:migrate:undo  # desfaz a última migration
npm run db:seed          # aplica seeders
npm run db:seed:undo     # desfaz seeders
```

## Variáveis De Ambiente

Use `.env.example` como base. Principais variáveis:

```txt
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://portal_user:portal_pass@postgres:5432/portalweb
CORS_ORIGIN=http://localhost:5173
PUBLIC_SITE_URL=http://localhost:5173
JWT_SECRET=change_me
JWT_EXPIRES_IN=8h
JWT_ADMIN_EXPIRES_IN=8h
UPLOAD_DIR=/workspace/uploads
MAX_UPLOAD_MB=10
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SECURE=false
EMAIL_QUEUE_INTERVAL_MS=60000
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_MAX_ATTEMPTS=3
EMAIL_QUEUE_SEND_DELAY_MS=1500
```

Em produção, `JWT_SECRET`, `DATABASE_URL`, SMTP e URLs públicas precisam ser reais e privados. O backend valida variáveis críticas quando `NODE_ENV=production`.

## Banco De Dados

As migrations ficam em `migrations/` e os seeders em `seeders/`.

Migrations atuais:

- `20260531000100-initial-schema.cjs`: schema inicial.
- `20260608000100-add-home-fields-to-donation-locations.cjs`: campos de exibição na home para locais de doação.
- `20260610000100-ensure-base-donation-locations.cjs`: locais base de doação.
- `20260614000100-add-admin-photo-url.cjs`: foto de perfil do admin.
- `20260614000200-add-team-portal-coordination.cjs`: marcação de equipe para coordenação no portal.

## Arquitetura De Pastas

```txt
src/
  app.ts                 # cria app Express, middlewares e routers
  server.ts              # bootstrap HTTP
  config/                # env, database, logger
  middlewares/           # auth, roles, errors, not found
  models/                # tipos/modelos compartilhados quando usados
  modules/
    health/              # health check
    auth/                # login, esqueci senha, reset, ativação
    public/              # endpoints públicos do site
    profile/             # perfil admin e voluntário
    email/               # fila SMTP e processamento
    uploads/             # utilitários de upload
    admin/               # módulos do painel administrativo
    portal/              # módulos autenticados do voluntário
  utils/                 # AppError, asyncHandler, helpers
```

Padrão mais comum dos módulos:

```txt
*.routes.ts       # rotas Express
*.controller.ts   # entrada HTTP e respostas
*.service.ts      # regras de negócio e validação
*.repository.ts   # SQL/Sequelize e persistência
```

## Segurança E Uploads

- `helmet` ativo e `x-powered-by` desabilitado.
- `cors` limitado por `CORS_ORIGIN`.
- Body JSON global limitado a `1mb`.
- Rotas de upload usam limite maior baseado em `MAX_UPLOAD_MB`.
- Rate limit em autenticação, candidatura pública, uploads e perfil.
- `/uploads/gallery` é a única pasta pública via `express.static`.
- `/uploads/volunteer`, `/uploads/materials` e `/uploads/profile` são privados e baixam apenas por rotas autenticadas.
- Uploads de galeria/material/perfil passam por validação de assinatura/tipo e gravação controlada.
- Materiais e arquivos privados devem permanecer fora de `express.static`.

## Autenticação E Sessão

Há dois papéis principais:

- `admin`: painel administrativo.
- `volunteer`: portal do voluntário.

Fluxos disponíveis:

- Login admin e voluntário.
- Esqueci senha e redefinição por token.
- Ativação de conta do voluntário.
- JWT enviado no header `Authorization: Bearer <token>`.

## E-mails

O envio real usa Nodemailer e a tabela/fila `notificacoes_email`.

- A fila pode ser processada automaticamente pelo worker.
- Também há endpoint administrativo para processar manualmente.
- Em desenvolvimento, o projeto foi validado com Mailtrap Sandbox.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` e `SMTP_SECURE`.

## Rotas Principais

### Health

```http
GET /api/health
```

### Públicas

```http
GET  /api/conteudo
GET  /api/conteudo?prefix=sobre_
GET  /api/conteudo?keys=pix_chave,pix_nome_recebedor
GET  /api/equipe
GET  /api/equipe/coordenacao
GET  /api/eventos
GET  /api/areas-interesse
POST /api/voluntarios
GET  /api/faq
GET  /api/doacoes/publico
GET  /api/locais-doacao
GET  /api/galeria
```

### Auth

```http
POST /api/admin/auth/login
POST /api/admin/auth/esqueci-senha
POST /api/admin/auth/redefinir-senha

POST /api/portal/auth/login
POST /api/portal/auth/esqueci-senha
POST /api/portal/auth/redefinir-senha
POST /api/portal/auth/ativar-conta
```

### Admin

Todas exigem usuário autenticado com papel `admin`.

```http
GET    /api/admin/dashboard

GET    /api/admin/voluntarios
POST   /api/admin/voluntarios
GET    /api/admin/voluntarios/:id
PATCH  /api/admin/voluntarios/:id
PATCH  /api/admin/voluntarios/:id/aprovar
PATCH  /api/admin/voluntarios/:id/rejeitar
PATCH  /api/admin/voluntarios/:id/suspender
PATCH  /api/admin/voluntarios/:id/reativar
DELETE /api/admin/voluntarios/:id

GET    /api/admin/equipe
POST   /api/admin/equipe
GET    /api/admin/equipe/:id
PATCH  /api/admin/equipe/:id
DELETE /api/admin/equipe/:id

GET    /api/admin/conteudo
POST   /api/admin/conteudo
GET    /api/admin/conteudo/:chave
PATCH  /api/admin/conteudo/:chave
DELETE /api/admin/conteudo/:chave

GET    /api/admin/faq
POST   /api/admin/faq
GET    /api/admin/faq/:id
PATCH  /api/admin/faq/:id
DELETE /api/admin/faq/:id

GET    /api/admin/doacoes
GET    /api/admin/doacoes/resumo
POST   /api/admin/doacoes
GET    /api/admin/doacoes/:id
PATCH  /api/admin/doacoes/:id
DELETE /api/admin/doacoes/:id

GET    /api/admin/locais-doacao
POST   /api/admin/locais-doacao
GET    /api/admin/locais-doacao/:id
PATCH  /api/admin/locais-doacao/:id
DELETE /api/admin/locais-doacao/:id

GET    /api/admin/galeria
POST   /api/admin/galeria/upload
POST   /api/admin/galeria
GET    /api/admin/galeria/:id
PATCH  /api/admin/galeria/:id
DELETE /api/admin/galeria/:id

GET    /api/admin/eventos
POST   /api/admin/eventos
GET    /api/admin/eventos/:id
PATCH  /api/admin/eventos/:id
DELETE /api/admin/eventos/:id
GET    /api/admin/eventos/:id/presencas

GET    /api/admin/comunicados
POST   /api/admin/comunicados
GET    /api/admin/comunicados/:id
PATCH  /api/admin/comunicados/:id
DELETE /api/admin/comunicados/:id
GET    /api/admin/comunicados/:id/leituras

GET    /api/admin/materiais
POST   /api/admin/materiais
POST   /api/admin/materiais/upload
GET    /api/admin/materiais/:id
GET    /api/admin/materiais/:id/download
PATCH  /api/admin/materiais/:id
DELETE /api/admin/materiais/:id

GET    /api/admin/uploads
GET    /api/admin/uploads/:id
PATCH  /api/admin/uploads/:id/status
GET    /api/admin/uploads/:id/download
DELETE /api/admin/uploads/:id

GET    /api/admin/perfil
PATCH  /api/admin/perfil
PATCH  /api/admin/perfil/senha
POST   /api/admin/perfil/foto
GET    /api/admin/perfil/foto

GET    /api/admin/logs
POST   /api/admin/email/processar-fila
```

### Portal Do Voluntário

Todas exigem usuário autenticado com papel `volunteer`.

```http
GET   /api/portal/eventos
PATCH /api/portal/eventos/:id/presenca

GET   /api/portal/comunicados
PATCH /api/portal/comunicados/:id/lido

GET   /api/portal/materiais
GET   /api/portal/materiais/:id/download

GET   /api/portal/uploads
POST  /api/portal/uploads
GET   /api/portal/uploads/:id/download

GET   /api/portal/perfil
PATCH /api/portal/perfil
PATCH /api/portal/perfil/senha
POST  /api/portal/perfil/foto
GET   /api/portal/perfil/foto
```

## Convenções De Resposta

A maioria das listagens retorna:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 1
  }
}
```

Erros usam `AppError` e o middleware central de erro, normalmente no formato:

```json
{
  "error": {
    "message": "Mensagem amigável.",
    "code": "ERROR_CODE"
  }
}
```

## Checklist Rápido De Validação

```bash
cd /workspace/backend
npm run build
npm run db:migrate
```

Depois validar:

- `GET /api/health` retorna `status: ok`.
- Login admin em `/api/admin/auth/login`.
- Login voluntário em `/api/portal/auth/login`.
- Upload público somente em `/uploads/gallery`.
- Downloads privados exigindo JWT.
- Envio de e-mail no sandbox/SMTP configurado.
