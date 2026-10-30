import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, FileUp, GalleryHorizontalEnd, HeartHandshake, RefreshCw, ScrollText, UsersRound } from 'lucide-react';

import { getAdminDashboard, type AdminDashboardData } from '@/features/admin/api/adminDashboardApi';
import { MetricCard, PageHeader, StatusBadge } from '@/shared/components/app';

const shortcuts = [
  { label: 'Aprovar voluntários', description: 'Cadastros públicos aguardando análise', to: '/admin/voluntarios', icon: UsersRound },
  { label: 'Revisar uploads', description: 'Documentos enviados por voluntários', to: '/admin/uploads', icon: FileUp },
  { label: 'Cadastrar evento', description: 'Agenda pública e interna', to: '/admin/eventos', icon: CalendarDays },
  { label: 'Ver logs', description: 'Auditoria e detalhes técnicos', to: '/admin/logs', icon: ScrollText },
];

const emptyData: AdminDashboardData = {
  metrics: { voluntariosPendentes: 0, voluntariosTotal: 0, eventosMes: 0, doacoesMes: 0, doacoesDinheiroMes: 0, imagensPendentes: 0, uploadsPendentes: 0, comunicadosRascunho: 0 },
  pendingVolunteers: [],
  nextEvents: [],
  operationalPendings: [],
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DashboardAdmin() {
  const [dashboard, setDashboard] = useState<AdminDashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getAdminDashboard();
      setDashboard(response.data);
    } catch {
      setError('Não foi possível carregar as métricas do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadDashboard(); }, []);

  const { metrics } = dashboard;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Visão geral" title="Dashboard administrativo" description="Acompanhe pendências e navegue rapidamente para as áreas de gestão do portal." actions={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button><Link to="/admin/logs" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ScrollText className="h-4 w-4" />Ver auditoria</Link></div>} />

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      {isLoading && <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-sm">Carregando dashboard...</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Link to="/admin/voluntarios" className="block transition hover:-translate-y-0.5"><MetricCard label="Voluntários pendentes" value={metrics.voluntariosPendentes} icon={AlertTriangle} tone="amber" /></Link>
        <Link to="/admin/voluntarios" className="block transition hover:-translate-y-0.5"><MetricCard label="Total voluntários" value={metrics.voluntariosTotal} icon={UsersRound} /></Link>
        <Link to="/admin/eventos" className="block transition hover:-translate-y-0.5"><MetricCard label="Eventos este mês" value={metrics.eventosMes} icon={CalendarDays} tone="emerald" /></Link>
        <Link to="/admin/doacoes" className="block transition hover:-translate-y-0.5"><MetricCard label="Doações no mês" value={metrics.doacoesDinheiroMes > 0 ? formatCurrency(metrics.doacoesDinheiroMes) : metrics.doacoesMes} detail={metrics.doacoesDinheiroMes > 0 ? metrics.doacoesMes + ' registro(s)' : undefined} icon={HeartHandshake} tone="rose" /></Link>
        <Link to="/admin/galeria" className="block transition hover:-translate-y-0.5"><MetricCard label="Imagens pendentes" value={metrics.imagensPendentes} icon={GalleryHorizontalEnd} tone="slate" /></Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-slate-950">Voluntários aguardando aprovação</h2><p className="mt-1 text-sm text-slate-500">Atalhos para concluir o fluxo de convite.</p></div><Link to="/admin/voluntarios" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800">Ver todos<ArrowRight className="h-4 w-4" /></Link></div>
          {dashboard.pendingVolunteers.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhum voluntário pendente.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Nome</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Telefone</th><th className="px-5 py-3">Cadastro</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{dashboard.pendingVolunteers.map((volunteer) => <tr key={volunteer.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold text-slate-950">{volunteer.nome}</td><td className="px-5 py-4 text-slate-600">{volunteer.email}</td><td className="px-5 py-4 text-slate-600">{volunteer.telefone || '-'}</td><td className="px-5 py-4 text-slate-600">{formatDate(volunteer.criado_em)}</td><td className="px-5 py-4"><StatusBadge>Pendente</StatusBadge></td><td className="px-5 py-4 text-right"><Link to="/admin/voluntarios" className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Analisar</Link></td></tr>)}</tbody></table></div>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold text-slate-950">Acesso rápido</h2><p className="mt-1 text-sm text-slate-500">Principais tarefas do admin.</p></div><div className="divide-y divide-slate-100">{shortcuts.map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50"><div className="flex items-center gap-3"><span className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><item.icon className="h-5 w-5" /></span><div><p className="font-semibold text-slate-950">{item.label}</p><p className="mt-1 text-sm text-slate-500">{item.description}</p></div></div><ArrowRight className="h-4 w-4 text-slate-400" /></Link>)}</div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">Próximos eventos</h2><Link to="/admin/eventos" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">Ver agenda</Link></div><div className="space-y-3">{dashboard.nextEvents.length === 0 ? <p className="text-sm text-slate-500">Nenhum evento futuro cadastrado.</p> : dashboard.nextEvents.map((event) => <Link key={event.id} to="/admin/eventos" className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><CalendarDays className="h-5 w-5" /></span><div><p className="font-semibold text-slate-950">{event.titulo}</p><p className="mt-1 text-sm text-slate-500">{formatDateTime(event.data_inicio)}</p><p className="text-sm text-slate-500">{event.local || 'Local não informado'}</p></div></Link>)}</div></div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-950">Pendências operacionais</h2><Link to="/admin/uploads" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">Ver uploads</Link></div><div className="space-y-3">{dashboard.operationalPendings.map((item) => <Link key={item.key} to={item.href} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50"><span className="font-medium text-slate-800">{item.label}</span><StatusBadge>{item.status}</StatusBadge></Link>)}</div></div>
      </div>
    </section>
  );
}
