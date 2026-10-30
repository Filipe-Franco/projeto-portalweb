import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Files,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import logoAnjos from '@/assets/images/logo_anjos.png';
import { env } from '@/shared/config/env';
import { UserDropdown } from '@/shared/components/app/UserDropdown';
import { clearAuthSession, getAuthUser, hasRole, onAuthSessionChanged } from '@/features/auth/authSession';
import { listPortalAnnouncements, type PortalAnnouncement } from '@/features/portal/api/portalAnnouncementsApi';

function formatAnnouncementDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}


const menuItems = [
  { path: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/portal/eventos', icon: CalendarDays, label: 'Eventos' },
  { path: '/portal/comunicados', icon: MessageSquare, label: 'Comunicados' },
  { path: '/portal/materiais', icon: Files, label: 'Materiais e uploads' },
  { path: '/portal/historico', icon: History, label: 'Histórico' },
  { path: '/portal/perfil', icon: UserIcon, label: 'Perfil' },
];

export function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(getAuthUser());
  const [showComunicadosMenu, setShowComunicadosMenu] = useState(false);
  const [comunicadosPreview, setComunicadosPreview] = useState<PortalAnnouncement[]>([]);
  const unreadComunicadosCount = comunicadosPreview.filter((item) => !item.lido_em).length;

  const loadComunicadosPreview = useCallback(async () => {
    if (!hasRole('voluntario')) {
      return;
    }

    const response = await listPortalAnnouncements();
    setComunicadosPreview(response.data.slice(0, 5));
  }, []);

  useEffect(() => {
    void loadComunicadosPreview().catch(() => undefined);
  }, [loadComunicadosPreview, location.pathname]);

  useEffect(() => onAuthSessionChanged(() => setAuthUser(getAuthUser())), []);

  if (!hasRole('voluntario')) {
    return <Navigate to="/portal/login" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate('/portal/login');
  };

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <aside className="border-b border-gray-200 bg-white shadow-sm lg:fixed lg:left-0 lg:top-0 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="border-b-2 border-gray-200 p-4 lg:p-6">
            <Link to="/" className="flex items-center justify-center">
              <img
                src={logoAnjos}
                alt={env.orgName}
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>

          <nav className="flex gap-2 overflow-x-auto p-4 lg:block">
            <div className="flex gap-2 lg:mb-6 lg:block">
              <h2 className="hidden px-2 text-sm font-extrabold uppercase tracking-wide text-slate-900 lg:mb-4 lg:block">
                Menu principal
              </h2>
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mb-1 flex min-w-fit items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive(item.path, item.end)
                      ? 'bg-gradient-to-r from-cyan-700 to-cyan-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="hidden border-t border-gray-200 pt-4 lg:mt-4 lg:block">
              <Link
                to="/faq"
                className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-gray-700 transition-all hover:bg-gray-100"
              >
                <HelpCircle size={20} />
                <span className="text-sm">Alguma dúvida?</span>
              </Link>
              <a
                href={`mailto:${env.contactEmail}?subject=Contato%20Portal%20do%20Volunt%C3%A1rio`}
                className="mb-2 block w-full rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-500 px-4 py-3 text-center text-sm font-semibold !text-white transition-all hover:shadow-lg"
              >
                Fale conosco
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 transition-all hover:bg-red-50"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Sair da conta</span>
              </button>
            </div>
          </nav>
        </aside>

        <div className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                  Portal do Voluntário
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowComunicadosMenu((value) => !value)}
                    className="relative rounded-full p-2 text-slate-700 transition-colors hover:bg-gray-100 hover:text-cyan-700"
                    aria-label="Abrir comunicados recentes"
                    aria-expanded={showComunicadosMenu}
                  >
                    {unreadComunicadosCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadComunicadosCount}
                      </span>
                    )}
                    <MessageSquare size={22} />
                  </button>

                  {showComunicadosMenu && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-950">Comunicados recentes</h3>
                          <p className="text-xs text-slate-500">{unreadComunicadosCount} não lidos</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowComunicadosMenu(false)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Fechar comunicados recentes"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {comunicadosPreview.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-slate-500">Nenhum comunicado publicado.</div>
                        ) : comunicadosPreview.map((comunicado) => (
                          <Link
                            key={comunicado.id}
                            to="/portal/comunicados"
                            onClick={() => setShowComunicadosMenu(false)}
                            className={`flex gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${!comunicado.lido_em ? 'bg-cyan-50/70' : 'bg-white'}`}
                          >
                            <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${!comunicado.lido_em ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Bell className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900">{comunicado.titulo}</span>
                              <span className="mt-1 block text-xs text-slate-500">{formatAnnouncementDate(comunicado.criado_em)}</span>
                            </span>
                            {!comunicado.lido_em && <span className="mt-3 h-2 w-2 flex-none rounded-full bg-cyan-600" />}
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 p-3">
                        <Link
                          to="/portal/comunicados"
                          onClick={() => setShowComunicadosMenu(false)}
                          className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold !text-white transition hover:bg-cyan-800"
                        >
                          Ver todos os comunicados
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <UserDropdown
                  name={authUser?.nome || 'Voluntário'}
                  roleLabel="Voluntário aprovado"
                  profileTo="/portal/perfil"
                  settingsTo="/portal/perfil"
                  tone="portal"
                />
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
