README - Portal Web Anjos da Madrugada
======================================

Este arquivo resume como executar o sistema em ambiente local e como o projeto funciona. Ele consolida as informacoes principais dos READMEs de backend e frontend, com foco em uso local via Docker, VS Code e Dev Container.


1. VISAO GERAL DO SISTEMA
=========================

O Portal Web Anjos da Madrugada e uma aplicacao web dividida em tres experiencias principais:

1. Site publico
   - Home institucional.
   - Paginas Sobre, Eventos, Doacoes, Galeria, FAQ e Seja Voluntario.
   - Cadastro publico de interessados em voluntariado.
   - Conteudos alimentados por APIs publicas e pelo painel administrativo.

2. Portal do voluntario
   - Login proprio para voluntarios aprovados.
   - Dashboard com eventos, comunicados, resumo operacional e coordenacao.
   - Agenda interna com confirmacao de presenca.
   - Comunicados internos com controle de leitura.
   - Materiais privados e uploads/documentos.
   - Perfil com dados, senha e foto.

3. Painel administrativo
   - Login proprio para administradores.
   - Dashboard administrativo.
   - CRUDs de voluntarios, eventos, comunicados, materiais, doacoes, galeria, FAQ, conteudo e equipe.
   - Gestao de uploads recebidos.
   - Controle financeiro basico em doacoes em dinheiro.
   - Perfil do admin.
   - Logs de auditoria.

Estrutura principal:

- Backend: /workspace/backend
- Frontend: /workspace/frontend
- Uploads: /workspace/uploads
- Banco local via Docker: PostgreSQL


2. STACK TECNICA
================

Backend:
- Node.js 20+
- Express
- TypeScript
- PostgreSQL
- Sequelize + Sequelize CLI
- JWT
- bcryptjs
- Nodemailer
- Helmet, CORS e rate limits
- Winston

Frontend:
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI
- lucide-react
- Fetch API com client compartilhado

Infra local:
- Docker
- Docker Compose
- VS Code
- Extensao Dev Containers
- PostgreSQL em container


3. PRE-REQUISITOS LOCAIS
========================

Instale no computador:

1. Docker Desktop ou Docker Engine + Docker Compose.
2. Visual Studio Code.
3. Extensao "Dev Containers" no VS Code.
4. Git, se ainda nao estiver instalado.

Portas usadas localmente:

- Frontend: http://localhost:5173
- Backend/API: http://localhost:3000
- PostgreSQL no host: localhost:5433
- PostgreSQL dentro do container: postgres:5432


4. EXECUCAO LOCAL RECOMENDADA COM VS CODE + DEV CONTAINER
=========================================================

Este e o fluxo recomendado porque o projeto ja possui .devcontainer e docker-compose.yml configurados.

Passo 1 - Abrir o projeto no VS Code
------------------------------------

Abra a pasta raiz do projeto:

/workspace

Ou, no seu computador, abra a pasta onde o repositorio foi clonado.

Passo 2 - Reabrir no container
------------------------------

No VS Code:

1. Pressione Ctrl+Shift+P.
2. Procure por: Dev Containers: Reopen in Container
3. Aguarde o build/subida do ambiente.

O VS Code usara:

- .devcontainer/devcontainer.json
- .devcontainer/Dockerfile
- docker-compose.yml

O docker-compose sobe dois servicos:

- devcontainer: ambiente Node para desenvolvimento.
- postgres: banco PostgreSQL 17.

Passo 3 - Criar arquivos de ambiente
------------------------------------

Dentro do terminal do VS Code ja conectado ao container, rode:

cd /workspace/backend
cp .env.example .env

cd /workspace/frontend
cp .env.example .env

Observacao:
- Nao compartilhe o arquivo backend/.env real.
- Em desenvolvimento, o backend usa DATABASE_URL apontando para postgres:5432 dentro da rede Docker.
- O frontend usa VITE_API_BASE_URL=http://localhost:3000/api.

Passo 4 - Instalar dependencias
-------------------------------

No terminal do container:

cd /workspace/backend

Deleta a pasta node_modules

npm install

cd /workspace/frontend


Deleta a pasta node_modules

npm install

Passo 5 - Preparar o banco de dados
-----------------------------------

Com o Postgres do Docker rodando, execute:

cd /workspace/backend
npm run db:migrate
npm run db:seed

As migrations criam/atualizam as tabelas. Os seeders carregam dados iniciais, incluindo usuarios/dados de teste quando configurados no .env.

Passo 6 - Rodar o backend
-------------------------

Abra um terminal no VS Code:

cd /workspace/backend
npm run dev

A API ficara disponivel em:

http://localhost:3000/api

Teste rapido:

http://localhost:3000/api/health

Resposta esperada:

{
  "status": "ok",
  "service": "portalweb-api"
}

Passo 7 - Rodar o frontend
--------------------------

Abra outro terminal no VS Code:

cd /workspace/frontend
npm run dev

O frontend ficara disponivel em:

http://localhost:5173

Passo 8 - Acessar o sistema
---------------------------

Site publico:

http://localhost:5173

Login do voluntario:

http://localhost:5173/portal/login

Login do admin:

http://localhost:5173/admin/login

As credenciais iniciais dependem do backend/.env e dos seeders. Verifique variaveis como:

INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD
TEST_VOLUNTEER_EMAIL
TEST_VOLUNTEER_PASSWORD

Nao exponha essas credenciais em video, print ou repositorio publico.


5. EXECUCAO LOCAL COM DOCKER COMPOSE SEM REABRIR O VS CODE
==========================================================

Se preferir subir os containers manualmente:

Na raiz do projeto:

docker compose up -d

Depois entre no container de desenvolvimento:

docker compose exec devcontainer bash

Dentro do container, siga os passos:

cd /workspace/backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev

Em outro terminal:

docker compose exec devcontainer bash
cd /workspace/frontend
cp .env.example .env
npm install
npm run dev

Para parar os containers:

docker compose down

Para parar e remover volumes do banco, cuidado, pois isso apaga os dados locais:

docker compose down -v


6. EXECUCAO SEM DEV CONTAINER, USANDO APENAS POSTGRES DO DOCKER
===============================================================

Tambem e possivel rodar backend/frontend diretamente no host e usar somente o banco no Docker.

Suba o Postgres:

docker compose up -d postgres

No backend/.env, use DATABASE_URL apontando para localhost:5433:

DATABASE_URL=postgres://portal_user:portal_pass@localhost:5433/portalweb

Depois rode no host:

cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

Em outro terminal:

cd frontend
npm install
cp .env.example .env
npm run dev

Importante:
- Se o backend estiver dentro do container, use host postgres.
- Se o backend estiver no host, use localhost:5433.


7. VARIAVEIS DE AMBIENTE IMPORTANTES
====================================

Backend - /workspace/backend/.env
---------------------------------

Principais variaveis:

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

Variaveis de seed/desenvolvimento:

INITIAL_ADMIN_NAME
INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD
TEST_VOLUNTEER_NAME
TEST_VOLUNTEER_EMAIL
TEST_VOLUNTEER_PASSWORD
TEST_VOLUNTEER_PHONE

Frontend - /workspace/frontend/.env
-----------------------------------

Principais variaveis:

VITE_APP_NAME="Portal Web Anjos da Madrugada"
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PUBLIC_SITE_URL=http://localhost:5173
VITE_ORG_NAME="Anjos da Madrugada"
VITE_CONTACT_EMAIL=contato@anjosdamadrugada.org.br
VITE_CONTACT_PHONE="(51) 9 9656-8102"
VITE_CONTACT_WHATSAPP_URL=https://wa.me/5551996568102
VITE_INSTAGRAM_URL=...

Observacao:
- Apenas variaveis com prefixo VITE_ ficam disponiveis no codigo do navegador.
- Nao coloque segredos no .env do frontend.


8. COMANDOS PRINCIPAIS
======================

Backend:

cd /workspace/backend
npm run dev              # desenvolvimento com watch
npm run start:dev        # roda TypeScript sem watch
npm run build            # compila TypeScript para dist/
npm start                # roda dist/server.js
npm run db:migrate       # aplica migrations
npm run db:migrate:undo  # desfaz ultima migration
npm run db:seed          # aplica seeders
npm run db:seed:undo     # desfaz seeders

Frontend:

cd /workspace/frontend
npm run dev      # Vite dev server
npm run build    # typecheck + build de producao
npm run lint     # ESLint
npm run preview  # preview do build

Docker:

docker compose up -d
docker compose ps
docker compose logs -f postgres
docker compose exec devcontainer bash
docker compose down


9. COMO O BACKEND ESTA ORGANIZADO
=================================

Pasta principal:

/workspace/backend/src

Estrutura resumida:

src/
  app.ts                 entrada do Express, middlewares e routers
  server.ts              bootstrap HTTP
  config/                env, database e logger
  middlewares/           auth, roles, erros e not found
  models/                tipos/modelos compartilhados quando usados
  modules/
    health/              health check
    auth/                login, esqueci senha, reset, ativacao
    public/              endpoints publicos do site
    profile/             perfil admin e voluntario
    email/               fila SMTP e processamento
    uploads/             utilitarios de upload
    admin/               modulos administrativos
    portal/              modulos autenticados do voluntario
  utils/                 AppError, asyncHandler e helpers

Padrao dos modulos:

routes.ts       define endpoints Express
controller.ts   recebe request e monta response
service.ts      regras de negocio e validacao
repository.ts   SQL/Sequelize e persistencia

Exemplo:

src/modules/admin/donations/
  donations.routes.ts
  donations.controller.ts
  donations.service.ts
  donations.repository.ts


10. COMO O FRONTEND ESTA ORGANIZADO
===================================

Pasta principal:

/workspace/frontend/src

Estrutura resumida:

src/
  app/
    App.tsx              RouterProvider
    routes.tsx           mapa de rotas
  assets/images/         imagens locais
  features/
    public/              paginas e APIs do site publico
    auth/                sessao e login compartilhado
    portal/              portal do voluntario
    admin/               painel administrativo
    profile/             perfil admin e voluntario
  shared/
    api/                 client HTTP e ApiError
    config/              leitura das envs Vite
    components/app/      componentes de aplicacao
    components/ui/       componentes base/Radix
    layouts/             layouts publico, portal e admin
    lib/                 utilitarios
    types/               tipos compartilhados
  styles/                estilos globais

Rotas principais:

Site publico:
- /
- /sobre
- /eventos
- /doacoes
- /voluntario
- /galeria
- /faq

Portal do voluntario:
- /portal/login
- /portal
- /portal/eventos
- /portal/comunicados
- /portal/materiais
- /portal/historico
- /portal/perfil

Admin:
- /admin/login
- /admin/dashboard
- /admin/perfil
- /admin/voluntarios
- /admin/eventos
- /admin/comunicados
- /admin/materiais
- /admin/uploads
- /admin/doacoes
- /admin/galeria
- /admin/faq
- /admin/conteudo
- /admin/equipe
- /admin/logs


11. AUTENTICACAO E SESSAO
=========================

O sistema possui dois papeis principais:

- admin
- volunteer

Fluxos suportados:

- Login admin.
- Login voluntario.
- Esqueci senha.
- Redefinicao de senha.
- Ativacao de conta de voluntario.

No frontend:

- Se marcar "manter acesso lembrado", o token fica em localStorage.
- Se nao marcar, o token fica em sessionStorage.
- Admin e voluntario possuem sessoes separadas.

No backend:

- O token JWT e enviado no header Authorization: Bearer <token>.
- requireAuth valida o token.
- requireRole('admin') protege rotas admin.
- requireRole('volunteer') protege rotas do portal.


12. UPLOADS E SEGURANCA DE ARQUIVOS
===================================

Regra mais importante:

Somente /uploads/gallery e publico.

Pastas privadas:

- /uploads/volunteer
- /uploads/materials
- /uploads/profile

Essas pastas nao devem ser servidas por express.static. O download deve passar por rota autenticada.

Exemplos:

- Galeria publica: imagens aprovadas aparecem no site.
- Materiais do portal: privados, baixados com JWT.
- Uploads de voluntario: privados, analisados pelo admin.
- Fotos de perfil: privadas, acessadas por endpoint autenticado.

Hardening aplicado:

- Helmet ativo.
- x-powered-by desabilitado.
- CORS limitado por CORS_ORIGIN.
- JSON global limitado a 1mb.
- Rotas de upload com limite especifico.
- Rate limits em autenticacao, candidatura publica, uploads e perfil.
- Validacao de tipo/assinatura em uploads.


13. E-MAILS
===========

O backend possui envio real de e-mails com Nodemailer.

O fluxo usa uma fila no banco, baseada em notificacoes_email.

Usos principais:

- Recuperacao de senha.
- Ativacao/convite de voluntario.
- Notificacoes futuras.

Configuracao:

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
SMTP_SECURE

Em desenvolvimento, pode ser usado Mailtrap Sandbox.

Existe endpoint administrativo para processar a fila manualmente:

POST /api/admin/email/processar-fila


14. ROTAS PRINCIPAIS DA API
===========================

Health:

GET /api/health

Publicas:

GET  /api/conteudo
GET  /api/equipe
GET  /api/equipe/coordenacao
GET  /api/eventos
GET  /api/areas-interesse
POST /api/voluntarios
GET  /api/faq
GET  /api/doacoes/publico
GET  /api/locais-doacao
GET  /api/galeria

Auth:

POST /api/admin/auth/login
POST /api/admin/auth/esqueci-senha
POST /api/admin/auth/redefinir-senha

POST /api/portal/auth/login
POST /api/portal/auth/esqueci-senha
POST /api/portal/auth/redefinir-senha
POST /api/portal/auth/ativar-conta

Admin, exemplos:

GET    /api/admin/dashboard
GET    /api/admin/voluntarios
GET    /api/admin/eventos
GET    /api/admin/comunicados
GET    /api/admin/materiais
GET    /api/admin/uploads
GET    /api/admin/doacoes
GET    /api/admin/doacoes/resumo
GET    /api/admin/galeria
GET    /api/admin/faq
GET    /api/admin/conteudo
GET    /api/admin/equipe
GET    /api/admin/logs
GET    /api/admin/perfil

Portal, exemplos:

GET   /api/portal/eventos
PATCH /api/portal/eventos/:id/presenca
GET   /api/portal/comunicados
PATCH /api/portal/comunicados/:id/lido
GET   /api/portal/materiais
GET   /api/portal/materiais/:id/download
GET   /api/portal/uploads
POST  /api/portal/uploads
GET   /api/portal/perfil
PATCH /api/portal/perfil
POST  /api/portal/perfil/foto


15. BANCO DE DADOS E MIGRATIONS
===============================

As migrations ficam em:

/workspace/backend/migrations

Comandos:

cd /workspace/backend
npm run db:migrate
npm run db:seed

Migrations principais:

- Schema inicial.
- Campos de exibicao na home para locais de doacao.
- Locais base de doacao.
- Foto de perfil do admin.
- Marcacao de equipe para coordenacao no portal.

Seeders:

/workspace/backend/seeders

Usados para dados iniciais como areas de interesse, admin inicial e voluntario de teste, conforme configuracao.


16. CHECKLIST DE VALIDACAO LOCAL
================================

Depois de subir tudo, valide:

1. Backend responde:
   http://localhost:3000/api/health

2. Frontend abre:
   http://localhost:5173

3. Login admin funciona:
   http://localhost:5173/admin/login

4. Login voluntario funciona:
   http://localhost:5173/portal/login

5. Site publico carrega:
   - /
   - /sobre
   - /eventos
   - /doacoes
   - /voluntario
   - /galeria
   - /faq

6. Portal do voluntario carrega:
   - /portal
   - /portal/eventos
   - /portal/comunicados
   - /portal/materiais
   - /portal/perfil

7. Admin carrega:
   - /admin/dashboard
   - /admin/voluntarios
   - /admin/eventos
   - /admin/materiais
   - /admin/uploads
   - /admin/doacoes
   - /admin/equipe

8. Uploads privados nao abrem diretamente por URL publica.

9. Galeria publica carrega imagens de /uploads/gallery.

10. Build passa:

cd /workspace/backend
npm run build

cd /workspace/frontend
npm run build

Observacao:
- O frontend pode mostrar aviso de chunk grande do Vite. Isso e um aviso de otimizacao, nao erro de build.


17. PROBLEMAS COMUNS
====================

Problema: backend nao conecta no banco.

Verifique:
- O container postgres esta rodando?
- Se backend roda no container, DATABASE_URL deve usar postgres:5432.
- Se backend roda no host, DATABASE_URL deve usar localhost:5433.

Problema: frontend nao chama API.

Verifique:
- VITE_API_BASE_URL=http://localhost:3000/api
- Backend esta rodando na porta 3000?
- CORS_ORIGIN no backend esta como http://localhost:5173?

Problema: login nao funciona.

Verifique:
- Migrations e seeders foram rodados?
- Credenciais iniciais no backend/.env.
- JWT_SECRET definido.

Problema: uploads falham.

Verifique:
- UPLOAD_DIR=/workspace/uploads
- Pasta /workspace/uploads existe.
- MAX_UPLOAD_MB adequado.
- Arquivo tem tipo permitido.

Problema: e-mail nao envia.

Verifique:
- Variaveis SMTP.
- Fila notificacoes_email.
- Endpoint de processamento manual.
- Logs do backend.


18. OBSERVACOES PARA PRODUCAO
=============================

Este README foca em ambiente local.

Antes de producao, revisar:

- JWT_SECRET forte e privado.
- DATABASE_URL de producao.
- SMTP real.
- CORS_ORIGIN apontando para dominio final.
- PUBLIC_SITE_URL apontando para dominio final.
- Backup do banco.
- Backup de /uploads.
- HTTPS.
- Politica de logs.
- Estrategia de build/deploy do frontend.
- Estrategia de execucao do backend compilado.
- Monitoramento de fila de e-mails.

Comandos de build:

Backend:

cd /workspace/backend
npm run build
npm start

Frontend:

cd /workspace/frontend
npm run build
npm run preview

Em producao real, normalmente o frontend buildado em dist/ seria servido por um servidor web/CDN, e o backend rodaria como processo Node atras de proxy reverso HTTPS.


19. RESUMO FINAL
================

Para rodar localmente do jeito mais simples:

1. Abrir /workspace no VS Code.
2. Reopen in Container.
3. Criar backend/.env e frontend/.env a partir dos exemplos.
4. Instalar dependencias em backend e frontend.
5. Rodar migrations e seeders.
6. Subir backend com npm run dev.
7. Subir frontend com npm run dev.
8. Acessar http://localhost:5173.

O sistema entrega:

- Site publico editavel.
- Portal do voluntario.
- Painel administrativo completo.
- Autenticacao separada admin/voluntario.
- Uploads publicos e privados com seguranca.
- E-mails via fila SMTP.
- CRUDs administrativos para operacao do projeto.
- Base pronta para validacao funcional e evolucoes futuras.


20. PREPARANDO A PASTA PARA COMPARTILHAR COM TERCEIROS
======================================================

Antes de enviar esta pasta para outra pessoa, revise e limpe dados locais/sensiveis.

Arquivos que NAO devem ser compartilhados:

- backend/.env
- frontend/.env
- backend/logs/*
- uploads/*
- backend/node_modules/
- frontend/node_modules/
- backend/dist/
- frontend/dist/

O projeto deve ser compartilhado com os exemplos:

- backend/.env.example
- frontend/.env.example

Cada pessoa deve criar seus proprios arquivos locais:

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

Depois disso, cada pessoa ajusta:

- DATABASE_URL
- JWT_SECRET
- credenciais SMTP/Mailtrap
- usuarios iniciais de seed, se quiser
- VITE_API_BASE_URL
- URLs publicas locais ou de homologacao

Nunca envie credenciais reais por zip, e-mail, chat ou commit.


21. MAILTRAP / SMTP PARA TERCEIROS
==================================

O fluxo de e-mail do sistema usa SMTP via Nodemailer e fila no banco. Ele e necessario para validar de ponta a ponta fluxos como:

- esqueci senha;
- redefinicao de senha;
- ativacao/convite de voluntario;
- notificacoes futuras.

Nao compartilhe suas credenciais do Mailtrap. Cada pessoa deve criar uma conta propria no Mailtrap e configurar o proprio Sandbox.

Passo a passo para quem receber o projeto:

1. Criar conta em https://mailtrap.io.
2. Acessar Email Testing / Sandbox.
3. Criar ou abrir uma Inbox.
4. Copiar as credenciais SMTP da inbox.
5. Preencher o backend/.env local.

Exemplo de configuracao para Mailtrap Sandbox:

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=usuario_mailtrap_da_pessoa
SMTP_PASS=senha_mailtrap_da_pessoa
SMTP_FROM=Portal Anjos <no-reply@anjosdamadrugada.org.br>
SMTP_SECURE=false

Com isso, o sistema envia e-mails para o sandbox daquela pessoa, sem usar credenciais de outro ambiente.

Se SMTP_HOST, SMTP_USER ou SMTP_PASS ficarem vazios, a aplicacao ainda pode rodar, mas os fluxos que dependem de e-mail real nao serao validados de ponta a ponta. Para uma validacao completa, configure Mailtrap ou outro SMTP.

Depois de configurar SMTP, validar:

1. Subir backend e frontend.
2. Acessar /admin/login ou /portal/login.
3. Usar "Esqueci minha senha".
4. Verificar se o e-mail apareceu na Inbox do Mailtrap.
5. Abrir o link de redefinicao e criar nova senha.


22. LIMPEZA LOCAL RECOMENDADA ANTES DE ZIPAR OU ENVIAR
======================================================

Comandos recomendados na raiz do projeto:

rm -f backend/.env frontend/.env
rm -rf backend/logs/* uploads/* backend/dist frontend/dist
rm -rf backend/node_modules frontend/node_modules
mkdir -p uploads/gallery uploads/materials uploads/volunteer uploads/profile backend/logs

Se estiver usando Dev Container, os diretorios node_modules podem estar montados como volumes do Docker. Nesse caso, talvez o diretorio nao possa ser removido enquanto o container estiver ativo. Alternativas:

1. Fechar o VS Code/Dev Container.
2. Parar os containers:

   docker compose down

3. Se quiser remover tambem volumes locais de dependencias e banco, use com cuidado:

   docker compose down -v

Atencao: docker compose down -v apaga o volume do banco local e os volumes de node_modules.


23. .GITIGNORE DA RAIZ
======================

Este projeto possui um .gitignore na raiz para evitar versionar arquivos sensiveis e gerados, incluindo:

- backend/.env
- frontend/.env
- backend/logs/
- uploads/
- node_modules/
- dist/
- arquivos .log

Mesmo com .gitignore, se voce compactar a pasta manualmente, esses arquivos podem ir junto. Por isso, limpe a pasta antes de gerar um zip.
