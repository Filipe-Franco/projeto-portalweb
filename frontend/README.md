# Frontend - Portal Web Anjos da Madrugada

Interface web do Portal Web Anjos da Madrugada, construída com React, TypeScript, Vite, React Router, Tailwind CSS e componentes Radix UI/lucide. O frontend cobre três áreas: site público, portal do voluntário e painel administrativo.

## Stack

- React 19
- TypeScript
- Vite 8
- React Router DOM 7
- Tailwind CSS 4 via `@tailwindcss/vite`
- Radix UI para primitivas acessíveis
- lucide-react para ícones
- Fetch API com client compartilhado

## Como Rodar

```bash
cd /workspace/frontend
npm install
cp .env.example .env
npm run dev
```

Por padrão o Vite sobe em `http://localhost:5173`. O backend esperado fica em `VITE_API_BASE_URL`, normalmente `http://localhost:3000/api`.

Build de produção:

```bash
npm run build
npm run preview
```

## Scripts

```bash
npm run dev      # servidor Vite com host 0.0.0.0
npm run build    # typecheck com tsc -b e build Vite
npm run lint     # ESLint
npm run preview  # preview do build
```

## Variáveis De Ambiente

Use `.env.example` como base. Apenas variáveis com prefixo `VITE_` são expostas ao navegador.

```txt
VITE_APP_NAME="Portal Web Anjos da Madrugada"
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PUBLIC_SITE_URL=http://localhost:5173
VITE_ORG_NAME="Anjos da Madrugada"
VITE_CONTACT_EMAIL=contato@anjosdamadrugada.org.br
VITE_CONTACT_PHONE="(51) 9 9656-8102"
VITE_CONTACT_WHATSAPP_URL=https://wa.me/5551996568102
VITE_INSTAGRAM_URL="https://www.instagram.com/..."
```

Configuração principal em `src/shared/config/env.ts`.

## Arquitetura De Pastas

```txt
src/
  app/
    App.tsx              # RouterProvider
    routes.tsx           # mapa de rotas do app
  assets/images/         # imagens locais usadas pela UI
  features/
    public/              # páginas e APIs do site público
    auth/                # sessão, login compartilhado e persistência
    portal/              # portal do voluntário
    admin/               # painel administrativo
    profile/             # APIs/páginas de perfil admin e voluntário
  shared/
    api/                 # client HTTP e ApiError
    config/              # leitura das envs Vite
    components/app/      # componentes de aplicação, cards, headers, badges
    components/ui/       # componentes base/Radix
    layouts/             # layouts público, portal e admin
    lib/                 # utilitários como cn()
    types/               # tipos compartilhados
  styles/                # estilos globais
```

## Rotas Da Aplicação

### Site Público

```txt
/                 Home
/sobre            Sobre
/eventos          Eventos públicos
/doacoes          Doações e pontos de coleta
/voluntario       Seja voluntário
/galeria          Galeria pública
/faq              Perguntas frequentes
/seja-voluntario  Redireciona para /voluntario
/agenda           Redireciona para /eventos
/doar             Redireciona para /doacoes
```

### Portal Do Voluntário

```txt
/login            Redireciona para /portal/login
/portal/login     Login, esqueci senha e redefinição
/portal           Dashboard do voluntário
/portal/eventos   Agenda e presença
/portal/comunicados
/portal/materiais Biblioteca e uploads de materiais/documentos
/portal/uploads   Redireciona para /portal/materiais
/portal/historico Histórico do voluntário
/portal/perfil    Dados, senha e foto do voluntário
```

As rotas internas do portal usam `PortalLayout`, exigem sessão de voluntário e redirecionam para `/portal/login` quando não há token válido no cliente.

### Painel Administrativo

```txt
/login-admin          Redireciona para /admin/login
/admin/login          Login, esqueci senha e redefinição
/admin                Redireciona para /admin/dashboard
/admin/dashboard      Visão geral administrativa
/admin/perfil         Perfil do admin via dropdown
/admin/voluntarios    CRUD e aprovação de voluntários
/admin/eventos        CRUD de eventos e presenças
/admin/comunicados    CRUD de comunicados e leituras
/admin/materiais      Biblioteca de materiais
/admin/uploads        Aba unificada de uploads recebidos
/admin/doacoes        Doações, locais de coleta e resumo financeiro
/admin/galeria        CRUD/upload da galeria pública
/admin/faq            CRUD do FAQ
/admin/conteudo       Conteúdos editáveis do site
/admin/equipe         CRUD da equipe/home/coordenação do portal
/admin/logs           Auditoria administrativa
```

As rotas internas do admin usam `AdminLayout`, exigem sessão de admin e redirecionam para `/admin/login` quando não há token válido no cliente.

## Comunicação Com A API

O client HTTP fica em `src/shared/api/client.ts` e usa `VITE_API_BASE_URL`.

- `apiGet`, `apiPost`, `apiPatch`, `apiDelete` encapsulam `fetch`.
- Erros HTTP viram `ApiError` com `status` e `code`.
- APIs por domínio ficam em `features/*/api`.
- Tokens são adicionados nos clients admin/portal por helpers de sessão.

## Sessão E Login

A persistência fica em `src/features/auth/authSession.ts`.

- Quando o usuário marca “manter acesso lembrado”, o token fica em `localStorage`.
- Sem essa opção, o token fica em `sessionStorage`.
- Admin e voluntário usam papéis/sessões separados.
- Telas de login suportam login, esqueci senha e redefinição por token.

## Uploads E Arquivos

- Galeria pública usa upload admin e exibição por `/uploads/gallery`.
- Uploads de voluntário e materiais privados usam rotas autenticadas de download.
- Fotos de perfil admin/voluntário também usam rotas autenticadas.
- Não apontar diretamente para `/uploads/volunteer`, `/uploads/materials` ou `/uploads/profile` na UI.

## Funcionalidades Principais

Site público:

- Home com conteúdo editável, equipe, ações e chamadas para voluntariado/doação.
- Sobre, eventos, doações, galeria e FAQ consumindo APIs públicas.
- Formulário público de voluntariado com áreas de interesse.

Portal do voluntário:

- Dashboard com atalhos, agenda e coordenação editável pelo admin.
- Eventos com confirmação de presença.
- Comunicados com marcação de leitura.
- Materiais e uploads/documentos privados.
- Perfil com foto, dados e troca de senha.

Admin:

- Dashboard com métricas e pendências.
- CRUDs de voluntários, eventos, comunicados, materiais, doações, galeria, FAQ, conteúdo e equipe.
- Materiais e uploads unificados visualmente por abas.
- Doações com controle financeiro agregado para doações em dinheiro.
- Perfil do admin acessível pelo dropdown.
- Logs de auditoria.

## Padrões De UI

- Layouts separados para público, portal e admin.
- Ícones via `lucide-react`.
- Componentes de app reutilizáveis em `shared/components/app`.
- Componentes base/Radix em `shared/components/ui`.
- Tailwind para composição visual.
- Evitar texto explicativo desnecessário dentro das telas; priorizar fluxo direto e ações claras.

## Checklist Rápido De Validação

```bash
cd /workspace/frontend
npm run build
```

Depois validar manualmente:

- `/` carrega home pública.
- `/admin/login` faz login admin e “manter acesso lembrado”.
- `/portal/login` faz login voluntário e “manter acesso lembrado”.
- `/admin/materiais` e `/admin/uploads` mostram a UI unificada.
- `/admin/doacoes` mostra card financeiro quando houver doação em dinheiro.
- `/admin/perfil` e `/portal/perfil` salvam dados, senha e foto.
- Downloads privados funcionam apenas autenticados.
