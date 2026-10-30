import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Eye, FileUp, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';

import { deleteAdminUpload, downloadAdminUpload, listAdminUploads, updateAdminUploadStatus, type AdminUpload, type UploadStatus, type UploadType } from '@/features/admin/api/adminUploadsApi';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

const statusOptions: Array<{ value: UploadStatus | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos ativos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'rejeitado', label: 'Rejeitados' },
  { value: 'excluido', label: 'Excluídos' },
];
const typeOptions: Array<{ value: UploadType | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'documento', label: 'Documento' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'termo', label: 'Termo' },
  { value: 'outro', label: 'Outro' },
];
const statusLabel: Record<UploadStatus, string> = { pendente: 'Pendente', aprovado: 'Aprovado', rejeitado: 'Rejeitado', excluido: 'Excluído' };
const typeLabel: Record<UploadType, string> = { documento: 'Documento', imagem: 'Imagem', comprovante: 'Comprovante', termo: 'Termo', outro: 'Outro' };

function formatDate(value: string) { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function formatSize(value: string | number | null) {
  const bytes = Number(value || 0);
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}

type UploadsAdminProps = {
  embedded?: boolean;
};

export function UploadsAdmin({ embedded = false }: UploadsAdminProps) {
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [status, setStatus] = useState<UploadStatus | 'todos'>('todos');
  const [tipo, setTipo] = useState<UploadType | 'todos'>('todos');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AdminUpload | null>(null);
  const [review, setReview] = useState<{ upload: AdminUpload; status: UploadStatus } | null>(null);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadUploads = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await listAdminUploads({ status, tipo, q: query, page, limit: 10 });
      setUploads(response.data);
      setTotalPages(response.meta.totalPages);
    } catch {
      setError('Não foi possível carregar os uploads.');
    } finally {
      setIsLoading(false);
    }
  }, [page, query, status, tipo]);

  useEffect(() => { void loadUploads(); }, [loadUploads]);
  useEffect(() => { setPage(1); }, [query, status, tipo]);

  const metrics = useMemo(() => ({
    pendentes: uploads.filter((item) => item.status === 'pendente').length,
    aprovados: uploads.filter((item) => item.status === 'aprovado').length,
    rejeitados: uploads.filter((item) => item.status === 'rejeitado').length,
  }), [uploads]);

  const saveReview = async () => {
    if (!review) return;
    if ((review.status === 'rejeitado' || review.status === 'excluido') && reason.trim().length < 5) {
      setError('Informe um motivo com pelo menos 5 caracteres.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      if (review.status === 'excluido') await deleteAdminUpload(review.upload.id, reason.trim());
      else await updateAdminUploadStatus(review.upload.id, review.status, reason.trim());
      setReview(null);
      setReason('');
      await loadUploads();
    } catch {
      setError('Não foi possível atualizar o upload.');
    } finally {
      setIsSaving(false);
    }
  };

  const openReview = (upload: AdminUpload, nextStatus: UploadStatus) => {
    setReview({ upload, status: nextStatus });
    setReason('');
    setError('');
  };

  return (
    <section className="space-y-6">
      {!embedded ? <PageHeader eyebrow="Aprovação de arquivos" title="Gestão de Uploads" description="Analise arquivos enviados por voluntários antes de liberar, rejeitar ou remover o registro." actions={<button type="button" onClick={() => void loadUploads()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button>} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pendentes nesta página" value={String(metrics.pendentes)} icon={AlertTriangle} tone="amber" />
        <MetricCard label="Aprovados nesta página" value={String(metrics.aprovados)} icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Rejeitados nesta página" value={String(metrics.rejeitados)} icon={XCircle} tone="rose" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-xl font-bold text-slate-950">Arquivos recebidos</h2><p className="mt-1 text-sm text-slate-500">Downloads passam por rota autenticada; a pasta de voluntários não fica pública.</p></div>
            <ToolbarSearch placeholder="Buscar upload" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select value={status} onChange={(event) => setStatus(event.target.value as UploadStatus | 'todos')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <select value={tipo} onChange={(event) => setTipo(event.target.value as UploadType | 'todos')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <button type="button" onClick={() => { setStatus('todos'); setTipo('todos'); setQuery(''); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button>
          </div>
        </div>

        {error && <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
        {isLoading ? <div className="px-5 py-12 text-center text-sm text-slate-500">Carregando uploads...</div> : null}
        {!isLoading && uploads.length === 0 ? <div className="flex flex-col items-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum upload encontrado.</div> : null}
        {!isLoading && uploads.length > 0 ? <div className="divide-y divide-slate-100">{uploads.map((upload) => (
          <article key={upload.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"><FileUp className="h-5 w-5" /></span><div><h3 className="font-semibold text-slate-950">{upload.titulo}</h3><p className="mt-1 text-sm text-slate-500">{upload.voluntario_nome || 'Voluntário'} · {formatDate(upload.criado_em)} · {typeLabel[upload.tipo]} · {formatSize(upload.tamanho_bytes)}</p>{upload.descricao && <p className="mt-2 max-w-2xl text-sm text-slate-600">{upload.descricao}</p>}<div className="mt-3 flex flex-wrap gap-2"><StatusBadge>{statusLabel[upload.status]}</StatusBadge>{upload.arquivo_nome && <StatusBadge>{upload.arquivo_nome}</StatusBadge>}</div></div></div>
            <div className="flex flex-wrap gap-2 lg:justify-end"><button type="button" onClick={() => setSelected(upload)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />Ver</button><button type="button" onClick={() => void downloadAdminUpload(upload)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" />Baixar</button>{upload.status !== 'aprovado' && <button type="button" onClick={() => openReview(upload, 'aprovado')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" />Aprovar</button>}{upload.status !== 'rejeitado' && <button type="button" onClick={() => openReview(upload, 'rejeitado')} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"><XCircle className="h-4 w-4" />Rejeitar</button>}<button type="button" onClick={() => openReview(upload, 'excluido')} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Excluir</button></div>
          </article>
        ))}</div> : null}
        {!isLoading && totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-600"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-50">Anterior</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-50">Próxima</button></div></div> : null}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="bg-white sm:max-w-lg"><DialogHeader><DialogTitle>{selected?.titulo}</DialogTitle><DialogDescription>{selected?.voluntario_nome} · {selected?.voluntario_email}</DialogDescription></DialogHeader>{selected && <div className="space-y-3 text-sm text-slate-600"><p><strong>Status:</strong> {statusLabel[selected.status]}</p><p><strong>Arquivo:</strong> {selected.arquivo_nome || '-'}</p><p><strong>MIME:</strong> {selected.mime_type || '-'}</p><p><strong>Tamanho:</strong> {formatSize(selected.tamanho_bytes)}</p>{selected.descricao && <p>{selected.descricao}</p>}{selected.motivo_rejeicao && <p><strong>Motivo da rejeição:</strong> {selected.motivo_rejeicao}</p>}</div>}<DialogFooter><button type="button" onClick={() => selected && void downloadAdminUpload(selected)} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">Baixar</button></DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(review)} onOpenChange={(open) => !open && setReview(null)}><DialogContent className="bg-white sm:max-w-lg"><DialogHeader><DialogTitle>{review?.status === 'aprovado' ? 'Aprovar upload' : review?.status === 'rejeitado' ? 'Rejeitar upload' : 'Excluir upload'}</DialogTitle><DialogDescription>{review?.upload.titulo}</DialogDescription></DialogHeader>{review?.status !== 'aprovado' && <label className="block"><span className="text-sm font-semibold text-slate-700">Motivo</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>}<DialogFooter><button type="button" onClick={() => setReview(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button><button type="button" disabled={isSaving} onClick={() => void saveReview()} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Confirmar</button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}
