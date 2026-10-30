import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bug, Eye, RefreshCw, ScrollText, ShieldCheck } from 'lucide-react';

import { listAdminLogs, type AdminLog, type AdminLogsResponse } from '@/features/admin/api/adminLogsApi';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

const emptyResponse: AdminLogsResponse = {
  data: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
  metrics: { hoje: 0, total: 0, avisos: 0, recentes: 0 },
  filters: { entities: [], users: [] },
};

function severityTone(severity: string) {
  if (severity === 'Erro') return 'danger' as const;
  if (severity === 'Aviso') return 'warning' as const;
  return 'info' as const;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

function formatJson(value: unknown) {
  if (!value) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function friendlyEntity(entity: string | null) {
  if (!entity) return 'Sistema';
  const map: Record<string, string> = {
    voluntarios: 'Voluntários',
    eventos: 'Eventos',
    comunicados: 'Comunicados',
    doacoes: 'Doações',
    locais_doacao: 'Locais de doação',
    galeria: 'Galeria',
    faq: 'FAQ',
    conteudo: 'Conteúdo',
    equipe: 'Equipe',
    materiais: 'Materiais',
    uploads_voluntarios: 'Uploads',
  };
  return map[entity] || entity;
}

export function LogsAdmin() {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<AdminLogsResponse>(emptyResponse);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await listAdminLogs({ q: query, entidade: selectedEntity, adminId: selectedUser, startDate, endDate, page, limit: 20 });
      setResponse(result);
    } catch {
      setError('Não foi possível carregar os logs.');
    } finally {
      setIsLoading(false);
    }
  }, [endDate, page, query, selectedEntity, selectedUser, startDate]);

  useEffect(() => { void loadLogs(); }, [loadLogs]);
  useEffect(() => { setPage(1); }, [query, selectedEntity, selectedUser, startDate, endDate]);

  const resetFilters = () => {
    setQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedEntity('');
    setSelectedUser('');
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Auditoria" title="Logs do sistema" description="Acompanhe ações administrativas registradas no banco e detalhes úteis para investigação." actions={<button type="button" onClick={() => void loadLogs()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button>} />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Registros hoje" value={response.metrics.hoje} icon={ScrollText} />
        <MetricCard label="Ações registradas" value={response.metrics.total} icon={ShieldCheck} tone="emerald" />
        <MetricCard label="Avisos" value={response.metrics.avisos} icon={AlertTriangle} tone="amber" />
        <MetricCard label="Últimas 24h" value={response.metrics.recentes} icon={Bug} tone="slate" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-bold text-slate-950">Histórico de atividades</h2><p className="mt-1 text-sm text-slate-500">Os registros vêm de `logs_admin`; erros técnicos do backend são gravados pelo Winston em arquivos de log.</p></div><ToolbarSearch placeholder="Buscar nos logs" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="mt-5 grid gap-3 md:grid-cols-5"><label className="space-y-2 text-sm font-medium text-slate-700">Início<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Fim<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Módulo<select value={selectedEntity} onChange={(event) => setSelectedEntity(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="">Todos</option>{response.filters.entities.map((entity) => <option key={entity} value={entity}>{friendlyEntity(entity)}</option>)}</select></label><label className="space-y-2 text-sm font-medium text-slate-700">Usuário<select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="">Todos</option>{response.filters.users.map((user) => <option key={user.id} value={user.id}>{user.nome}</option>)}</select></label><button type="button" onClick={resetFilters} className="self-end rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button></div>
        </div>

        {error && <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {isLoading ? <div className="px-5 py-12 text-center text-sm text-slate-500">Carregando logs...</div> : null}
        {!isLoading && response.data.length === 0 ? <div className="px-5 py-12 text-center text-sm text-slate-500">Nenhum log encontrado.</div> : null}

        {!isLoading && response.data.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Data/Hora</th><th className="px-5 py-3">Usuário</th><th className="px-5 py-3">Ação</th><th className="px-5 py-3">Módulo</th><th className="px-5 py-3">Severidade</th><th className="px-5 py-3">IP</th><th className="px-5 py-3 text-right">Detalhes</th></tr></thead><tbody className="divide-y divide-slate-100">{response.data.map((log) => <tr key={log.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-medium text-slate-900">{formatDate(log.criado_em)}</td><td className="px-5 py-4 text-slate-600">{log.admin_nome || 'Sistema'}</td><td className="px-5 py-4 text-slate-900"><p className="font-medium">{log.acao}</p><p className="mt-1 text-xs text-slate-500">{log.entidade_id || '-'}</p></td><td className="px-5 py-4 text-slate-600">{friendlyEntity(log.entidade)}</td><td className="px-5 py-4"><StatusBadge tone={severityTone(log.severidade)}>{log.severidade}</StatusBadge></td><td className="px-5 py-4 font-mono text-xs text-slate-600">{log.ip || '-'}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedLog(log)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />Ver log</button></td></tr>)}</tbody></table></div> : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><div>Mostrando página {response.meta.page} de {response.meta.totalPages} · {response.meta.total} registro(s)</div><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Anterior</button><button type="button" disabled={page >= response.meta.totalPages} onClick={() => setPage((current) => Math.min(response.meta.totalPages, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Próxima</button></div></div>
      </div>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}><DialogContent className="max-h-[88vh] overflow-y-auto border-slate-200 bg-white text-slate-950 sm:max-w-3xl">{selectedLog ? <><DialogHeader><DialogTitle>Detalhe do log</DialogTitle><DialogDescription>#{selectedLog.id} · {formatDate(selectedLog.criado_em)} · {selectedLog.admin_nome || 'Sistema'}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Ação:</span> {selectedLog.acao}</p><p><span className="text-slate-500">Módulo:</span> {friendlyEntity(selectedLog.entidade)}</p><p><span className="text-slate-500">Entidade ID:</span> {selectedLog.entidade_id || '-'}</p><p><span className="text-slate-500">IP:</span> {selectedLog.ip || '-'}</p><p><span className="text-slate-500">Admin:</span> {selectedLog.admin_email || '-'}</p><p><span className="text-slate-500">Severidade:</span> {selectedLog.severidade}</p></div><div><h3 className="text-sm font-semibold text-slate-950">Detalhe JSON</h3><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100"><code>{formatJson(selectedLog.detalhe)}</code></pre></div><div><h3 className="text-sm font-semibold text-slate-950">User agent</h3><p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{selectedLog.user_agent || '-'}</p></div></> : null}</DialogContent></Dialog>
    </section>
  );
}
