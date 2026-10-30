import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from '@/shared/layouts/PublicLayouts';
import { PortalLayout } from '@/shared/layouts/PortalLayouts';
import { AdminLayout } from '@/shared/layouts/AdminLayouts';

import { Home } from '@/features/public/pages/Home';
import { Sobre } from '@/features/public/pages/Sobre';
import { Eventos } from '@/features/public/pages/Eventos';
import { Doacoes } from '@/features/public/pages/Doacoes';
import { SejaVoluntario } from '@/features/public/pages/SejaVoluntario';
import { Galeria } from '@/features/public/pages/Galeria';
import { FAQ } from '@/features/public/pages/FAQ';

import { LoginPortal } from '@/features/portal/pages/LoginPortal';
import { DashboardPortal } from '@/features/portal/pages/DashboardPortal';
import { EventosPortal } from '@/features/portal/pages/EventosPortal';
import { ComunicadosPortal } from '@/features/portal/pages/ComunicadosPortal';
import { MateriaisPortal } from '@/features/portal/pages/MateriaisPortal';
import { HistoricoPortal } from '@/features/portal/pages/HistoricoPortal';
import { PerfilPortal } from '@/features/portal/pages/PerfilPortal';

import { LoginAdmin } from '@/features/admin/pages/LoginAdmin';
import { DashboardAdmin } from '@/features/admin/pages/DashboardAdmin';
import { VoluntariosAdmin } from '@/features/admin/pages/VoluntariosAdmin';
import { EventosAdmin } from '@/features/admin/pages/EventosAdmin';
import { ComunicadosAdmin } from '@/features/admin/pages/ComunicadosAdmin';
import { MateriaisAdmin } from '@/features/admin/pages/MateriaisAdmin';
import { DoacoesAdmin } from '@/features/admin/pages/DoacoesAdmin';
import { GaleriaAdmin } from '@/features/admin/pages/GaleriaAdmin';
import { FAQAdmin } from '@/features/admin/pages/FAQAdmin';
import { ConteudoAdmin } from '@/features/admin/pages/ConteudoAdmin';
import { EquipeAdmin } from '@/features/admin/pages/EquipeAdmin';
import { LogsAdmin } from '@/features/admin/pages/LogsAdmin';
import { PerfilAdmin } from '@/features/admin/pages/PerfilAdmin';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'sobre',
        element: <Sobre />,
      },
      {
        path: 'eventos',
        element: <Eventos />,
      },
      {
        path: 'doacoes',
        element: <Doacoes />,
      },
      {
        path: 'voluntario',
        element: <SejaVoluntario />,
      },
      {
        path: 'galeria',
        element: <Galeria />,
      },
      {
        path: 'faq',
        element: <FAQ />,
      },
      {
        path: 'seja-voluntario',
        element: <Navigate to="/voluntario" replace />,
      },
      {
        path: 'agenda',
        element: <Navigate to="/eventos" replace />,
      },
      {
        path: 'doar',
        element: <Navigate to="/doacoes" replace />,
      },
    ],
  },
  {
    path: '/login',
    element: <Navigate to="/portal/login" replace />,
  },
  {
    path: '/portal/login',
    element: <LoginPortal />,
  },
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [
      {
        index: true,
        element: <DashboardPortal />,
      },
      {
        path: 'eventos',
        element: <EventosPortal />,
      },
      {
        path: 'comunicados',
        element: <ComunicadosPortal />,
      },
      {
        path: 'materiais',
        element: <MateriaisPortal />,
      },
      {
        path: 'uploads',
        element: <Navigate to="/portal/materiais" replace />,
      },
      {
        path: 'historico',
        element: <HistoricoPortal />,
      },
      {
        path: 'perfil',
        element: <PerfilPortal />,
      },
    ],
  },
  {
    path: '/login-admin',
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: '/admin/login',
    element: <LoginAdmin />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardAdmin />,
      },
      {
        path: 'perfil',
        element: <PerfilAdmin />,
      },
      {
        path: 'voluntarios',
        element: <VoluntariosAdmin />,
      },
      {
        path: 'eventos',
        element: <EventosAdmin />,
      },
      {
        path: 'comunicados',
        element: <ComunicadosAdmin />,
      },
      {
        path: 'materiais',
        element: <MateriaisAdmin />,
      },
      {
        path: 'uploads',
        element: <MateriaisAdmin />,
      },
      {
        path: 'doacoes',
        element: <DoacoesAdmin />,
      },
      {
        path: 'galeria',
        element: <GaleriaAdmin />,
      },
      {
        path: 'faq',
        element: <FAQAdmin />,
      },
      {
        path: 'conteudo',
        element: <ConteudoAdmin />,
      },
      {
        path: 'equipe',
        element: <EquipeAdmin />,
      },
      {
        path: 'logs',
        element: <LogsAdmin />,
      },
    ],
  },
]);