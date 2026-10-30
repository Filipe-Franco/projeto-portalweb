import { useState } from 'react';
import { Bell, CheckCheck, Clock3, FileCheck2, Megaphone, MessageSquare } from 'lucide-react';

const initialNotifications = [
  {
    id: 1,
    title: 'Novo comunicado disponível',
    description: 'A coordenação publicou um comunicado sobre a próxima ação de sábado.',
    date: 'Há 1 hora',
    type: 'Comunicado',
    read: false,
    icon: Megaphone,
  },
  {
    id: 2,
    title: 'Próximo evento: distribuição de alimentos',
    description: 'Confirme sua presença e revise as orientações antes do encontro.',
    date: 'Há 3 horas',
    type: 'Evento',
    read: false,
    icon: Clock3,
  },
  {
    id: 3,
    title: 'Upload aprovado pela administração',
    description: 'Seu comprovante de participação foi aprovado e entrou no histórico.',
    date: 'Há 1 dia',
    type: 'Upload',
    read: false,
    icon: FileCheck2,
  },
  {
    id: 4,
    title: 'Atualização no calendário',
    description: 'O horário da próxima ação foi atualizado pela coordenação.',
    date: 'Há 2 dias',
    type: 'Agenda',
    read: true,
    icon: MessageSquare,
  },
];

export function NotificacoesPortal() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllAsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const markOneAsRead = (id: number) => {
    setNotifications((current) => current.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Central de avisos</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950 md:text-4xl">Notificações</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Acompanhe comunicados, atualizações de agenda e retornos sobre arquivos enviados.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          Marcar todas como lidas
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Não lidas</p>
          <p className="mt-2 text-3xl font-extrabold text-cyan-700">{unreadCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Status</p>
          <p className="mt-2 text-lg font-extrabold text-slate-950">
            {unreadCount > 0 ? 'Há avisos pendentes' : 'Tudo lido'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-2xl font-extrabold text-slate-950">Todas as notificações</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <article
                key={notification.id}
                className={`flex flex-col gap-4 px-5 py-5 transition sm:flex-row sm:items-start sm:justify-between ${!notification.read ? 'bg-cyan-50/60' : 'bg-white'}`}
              >
                <div className="flex gap-4">
                  <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${notification.read ? 'bg-slate-100 text-slate-500' : 'bg-cyan-700 text-white'}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-950">{notification.title}</h3>
                      {!notification.read && (
                        <span className="rounded-full bg-cyan-700 px-2 py-0.5 text-xs font-bold text-white">Nova</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{notification.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span>{notification.type}</span>
                      <span>·</span>
                      <span>{notification.date}</span>
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => markOneAsRead(notification.id)}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-cyan-200 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-white"
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    Marcar como lida
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
