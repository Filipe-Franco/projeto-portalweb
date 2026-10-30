import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Accessibility,
  Heart,
  Mail,
  MessageCircleQuestion,
  Menu,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';

import logoAnjos from '@/assets/images/logo_anjos.png';
import { env } from '@/shared/config/env';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/voluntario', label: 'Seja Voluntário' },
  { to: '/eventos', label: 'Agenda' },
  { to: '/galeria', label: 'Galeria' },
  { to: '/faq', label: 'FAQ' },
];

function InstagramIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect width="16" height="16" x="4" y="4" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="7" r="1.15" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.1 19 6 15.7A7.7 7.7 0 1 1 9.3 19L5.1 19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 8.8c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.3 0 .5-.2.7l-.4.5c.6 1 1.4 1.8 2.5 2.3l.5-.5c.2-.2.5-.3.7-.2l1.4.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.5.9-.6.4-1.5.5-2.6.1-2.4-.8-4.6-3-5.4-5.4-.3-.6-.1-1.1.8-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AccessibilityButton() {
  const [highContrast, setHighContrast] = useState(false);

  const toggleContrast = () => {
    const nextValue = !highContrast;
    setHighContrast(nextValue);
    document.documentElement.classList.toggle('high-contrast', nextValue);
  };

  return (
    <button
      type="button"
      onClick={toggleContrast}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-white shadow-lg transition hover:bg-cyan-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      aria-pressed={highContrast}
      aria-label="Ativar alto contraste"
      title="Acessibilidade"
    >
      <Accessibility className="h-7 w-7" aria-hidden="true" />
    </button>
  );
}

export function PublicLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="group flex items-center gap-3">
              <img
                src={logoAnjos}
                alt={env.orgName}
                className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="hidden text-lg font-semibold tracking-tight text-gray-900 sm:block">
                {env.orgName}
              </span>
            </Link>

            <nav className="hidden items-center gap-1.5 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-2 text-sm transition-all ${
                    isActive(item.to)
                      ? 'bg-cyan-700 font-medium !text-white shadow-sm'
                      : '!text-gray-600 hover:bg-cyan-700 hover:!text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLoginMenu(!showLoginMenu)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm !text-gray-600 transition-all hover:bg-cyan-700 hover:!text-white"
                >
                  Login
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      showLoginMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showLoginMenu && (
                  <div className="animate-slide-up absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-2xl">
                    <Link
                      to="/portal/login"
                      onClick={() => setShowLoginMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-700 to-cyan-500 shadow-sm">
                        <span className="text-sm font-bold text-white">V</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Voluntário</div>
                        <div className="text-xs text-gray-500">Acessar portal</div>
                      </div>
                    </Link>
                    <Link
                      to="/admin/login"
                      onClick={() => setShowLoginMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900">
                        <ShieldCheck size={16} className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Administrador</div>
                        <div className="text-xs text-gray-500">Painel admin</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/doacoes"
                className="ml-3 flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2 text-sm font-semibold tracking-wide !text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
                DOAR
              </Link>
            </nav>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 md:hidden"
              aria-label="Abrir menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <nav className="mt-4 flex flex-col gap-3 pb-4 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 transition-all hover:bg-cyan-700 hover:!text-white ${
                    isActive(item.to) ? 'bg-cyan-700 font-bold !text-white' : '!text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-2 border-t border-gray-200 pt-3">
                <p className="mb-2 px-2 text-xs text-gray-500">Área de Login</p>
                <Link
                  to="/portal/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-700 to-cyan-500 text-sm font-bold text-white">
                    V
                  </div>
                  <div>
                    <div className="text-sm font-medium">Voluntário</div>
                    <div className="text-xs text-gray-500">Acessar portal</div>
                  </div>
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900">
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Administrador</div>
                    <div className="text-xs text-gray-500">Painel admin</div>
                  </div>
                </Link>
              </div>

              <Link
                to="/doacoes"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-2 text-center font-semibold !text-white shadow-sm transition-all hover:scale-105 hover:shadow-lg"
              >
                <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
                DOAR
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <AccessibilityButton />

      <footer className="border-t border-gray-800/50 bg-gradient-to-b from-gray-900 to-gray-950 py-14 text-gray-300">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <h3 className="mb-5 text-base font-semibold tracking-tight text-white">
                Contato
              </h3>
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                  {env.contactEmail}
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                  {env.contactPhone}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-5 text-base font-semibold tracking-tight text-white">
                Localização
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Novo Hamburgo / São Leopoldo - RS</p>
                <p className="text-xs text-gray-500">Centro das Cidades</p>
              </div>
            </div>
            <div>
              <h3 className="mb-5 text-base font-semibold tracking-tight text-white">
                Redes Sociais
              </h3>
              <div className="flex gap-3">
                <Link
                  to="/faq"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800/50 text-white transition-all duration-300 hover:scale-110 hover:bg-cyan-700"
                  aria-label="Perguntas frequentes"
                >
                  <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
                </Link>
                <a
                  href={env.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800/50 text-white transition-all duration-300 hover:scale-110 hover:bg-cyan-700"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
                <a
                  href={env.contactWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800/50 text-white transition-all duration-300 hover:scale-110 hover:bg-cyan-700"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-800/50 pt-10 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src={logoAnjos}
                alt={env.orgName}
                className="h-9 w-auto object-contain opacity-70"
              />
              <span className="text-sm font-medium text-gray-500">
                © 2026 {env.orgName}
              </span>
            </div>
            <p className="text-xs text-gray-600">Transformando vidas nas madrugadas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
