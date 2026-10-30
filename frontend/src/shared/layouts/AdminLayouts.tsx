import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  GalleryHorizontalEnd,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  ScrollText,
  UsersRound,
} from 'lucide-react';

import logoAnjos from '@/assets/images/logo_anjos.png';
import { env } from '@/shared/config/env';
import { UserDropdown } from '@/shared/components/app/UserDropdown';
import { clearAuthSession, getAuthUser, hasRole, onAuthSessionChanged } from '@/features/auth/authSession';

const adminItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/voluntarios', icon: UsersRound, label: 'Voluntários' },
  { path: '/admin/eventos', icon: CalendarDays, label: 'Eventos' },
  { path: '/admin/comunicados', icon: Megaphone, label: 'Comunicados' },
  { path: '/admin/materiais', icon: FileText, label: 'Materiais e uploads', aliases: ['/admin/uploads'] },
  { path: '/admin/doacoes', icon: HeartHandshake, label: 'Doações' },
  { path: '/admin/galeria', icon: GalleryHorizontalEnd, label: 'Galeria' },
  { path: '/admin/faq', icon: HelpCircle, label: 'FAQ' },
  { path: '/admin/conteudo', icon: ListChecks, label: 'Conteúdo' },
  { path: '/admin/equipe', icon: UsersRound, label: 'Equipe' },
  { path: '/admin/logs', icon: ScrollText, label: 'Logs' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(getAuthUser());

  useEffect(() => onAuthSessionChanged(() => setAuthUser(getAuthUser())), []);

  if (!hasRole('admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-6 lg:py-6">
          <Link to="/admin/dashboard" className="flex items-center gap-3 lg:block">
            <img
              src={logoAnjos}
              alt={env.orgName}
              className="h-12 w-auto object-contain lg:mx-auto lg:h-16"
            />
            <div className="lg:mt-4 lg:text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                Painel
              </p>
              <h1 className="text-lg font-bold">Admin</h1>
            </div>
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 text-sm lg:flex-col lg:gap-1">
          {adminItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) || item.aliases?.some((alias) => location.pathname.startsWith(alias));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex min-w-fit items-center gap-3 rounded-lg px-3 py-2 font-medium transition ${
                  isActive
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden px-4 pb-6 lg:block">
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            <LogOut size={16} />
            Encerrar sessão
          </button>
        </div>
      </aside>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Painel administrativo</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">Menu principal</h2>
            </div>
            <UserDropdown
              name={authUser?.nome || 'Admin'}
              roleLabel="Administrador"
              profileTo="/admin/perfil"
              settingsTo="/admin/perfil"
              helpTo="/admin/faq"
              tone="admin"
            />
          </header>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
