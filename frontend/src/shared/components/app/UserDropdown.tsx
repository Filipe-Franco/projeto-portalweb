import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  UserCircle,
} from 'lucide-react';

type UserDropdownProps = {
  name: string;
  roleLabel: string;
  profileTo?: string;
  settingsTo?: string;
  helpTo?: string;
  logoutTo?: string;
  tone?: 'portal' | 'admin';
};

export function UserDropdown({
  name,
  roleLabel,
  profileTo,
  settingsTo,
  helpTo = '/faq',
  logoutTo = '/',
  tone = 'portal',
}: UserDropdownProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const avatarClass = tone === 'admin'
    ? 'bg-slate-900 text-white'
    : 'bg-gradient-to-br from-cyan-700 to-cyan-500 text-white';

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    navigate(logoutTo);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shadow-sm ${avatarClass}`}>
          {initials || <User className="h-5 w-5" aria-hidden="true" />}
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-bold text-slate-900">{name}</span>
          <span className="block text-xs font-medium text-slate-500">{roleLabel}</span>
        </span>
        <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition sm:block ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" role="menu">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold ${avatarClass}`}>
                {initials || <User className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-950">{name}</p>
                <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            {profileTo && (
              <DropdownLink to={profileTo} icon={UserCircle} onClick={() => setOpen(false)}>
                Meu perfil
              </DropdownLink>
            )}
            {settingsTo && (
              <DropdownLink to={settingsTo} icon={Settings} onClick={() => setOpen(false)}>
                Configurações
              </DropdownLink>
            )}
            <DropdownLink to={helpTo} icon={HelpCircle} onClick={() => setOpen(false)}>
              Ajuda e FAQ
            </DropdownLink>
            {tone === 'admin' && (
              <div className="mx-2 my-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Sessão administrativa
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type DropdownLinkProps = {
  to: string;
  icon: typeof UserCircle;
  children: string;
  onClick: () => void;
};

function DropdownLink({ to, icon: Icon, children, onClick }: DropdownLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-cyan-700"
      role="menuitem"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
