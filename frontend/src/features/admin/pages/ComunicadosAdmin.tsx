import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Edit3, Eye, Megaphone, Pin, Plus, RefreshCw, Search, Trash2, UsersRound } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncementReadings,
  listAdminAnnouncements,
  updateAdminAnnouncement,
  type AdminAnnouncement,
  type AdminAnnouncementPayload,
  type AdminAnnouncementReading,
} from '@/features/admin/api/adminAnnouncementsApi';

type BooleanFilter = 'todos' | 'true' | 'false';
type FormState = { titulo: string; corpo: string; fixado: boolean; publicado: boolean };

const PAGE_SIZE = 10;
const emptyForm: FormState = { titulo: '', corpo: '', fixado: false, publicado: true };

function apiErrorMessage(error: unknown) { return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.'; }
function formatDate(value: string) { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function toForm(item: AdminAnnouncement): FormState { return { titulo: item.titulo, corpo: item.corpo, fixado: item.fixado, publicado: item.publicado }; }
function toPayload(form: FormState): AdminAnnouncementPayload { return { titulo: form.titulo.trim(), corpo: form.corpo.trim(), fixado: form.fixado, publicado: form.publicado }; }

export function ComunicadosAdmin() {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [query, setQuery] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<BooleanFilter>('todos');
  const [pinnedFilter, setPinnedFilter] = useState<BooleanFilter>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState<AdminAnnouncement | null>(null);
  const [readingItem, setReadingItem] = useState<AdminAnnouncement | null>(null);
  const [readings, setReadings] = useState<AdminAnnouncementReading[]>([]);
  const [editingItem, setEditingItem] = useState<AdminAnnouncement | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AdminAnnouncement | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true); setErrorMessage('');
    try {
      const response = await listAdminAnnouncements({ q: query.trim() || undefined, publicado: publicationFilter === 'todos' ? undefined : publicationFilter === 'true', fixado: pinnedFilter === 'todos' ? undefined : pinnedFilter === 'true', page: currentPage, limit: PAGE_SIZE });
      setItems(response.data); setTotalPages(Math.max(1, response.meta.totalPages || 1));
    } catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsLoading(false); }
  }, [currentPage, pinnedFilter, publicationFilter, query]);

  useEffect(() => { setCurrentPage(1); }, [pinnedFilter, publicationFilter, query]);
  useEffect(() => { const timeout = window.setTimeout(() => void loadItems(), 250); return () => window.clearTimeout(timeout); }, [loadItems]);

  const metrics = useMemo(() => ({ published: items.filter((item) => item.publicado).length, pinned: items.filter((item) => item.fixado).length, readings: items.reduce((total, item) => total + Number(item.leituras || 0), 0), drafts: items.filter((item) => !item.publicado).length }), [items]);

  const openEditor = (item?: AdminAnnouncement) => { setEditingItem(item || null); setFormState(item ? toForm(item) : emptyForm); setIsEditorOpen(true); setSuccessMessage(''); setErrorMessage(''); };
  const closeEditor = () => { setIsEditorOpen(false); setEditingItem(null); setFormState(emptyForm); };
  const resetFilters = () => { setQuery(''); setPublicationFilter('todos'); setPinnedFilter('todos'); setCurrentPage(1); };

  const submitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsActionLoading(true); setSuccessMessage(''); setErrorMessage('');
    try { const response = editingItem ? await updateAdminAnnouncement(editingItem.id, toPayload(formState)) : await createAdminAnnouncement(toPayload(formState)); setSuccessMessage(response.message); closeEditor(); await loadItems(); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsActionLoading(false); }
  };

  const runDelete = async () => {
    if (!deleteItem) return;
    setIsActionLoading(true); setSuccessMessage(''); setErrorMessage('');
    try { const response = await deleteAdminAnnouncement(deleteItem.id); setSuccessMessage(response.message); setDeleteItem(null); await loadItems(); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsActionLoading(false); }
  };

  const openReadings = async (item: AdminAnnouncement) => {
    setReadingItem(item); setReadings([]);
    try { const response = await listAdminAnnouncementReadings(item.id); setReadings(response.data); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
  };

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Comunicação interna" title="Comunicados" description="Crie, publique e acompanhe comunicados exibidos no portal dos voluntários." actions={<button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Novo comunicado</button>} />
      <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Publicados" value={metrics.published} icon={Megaphone} /><MetricCard label="Fixados" value={metrics.pinned} icon={Pin} tone="amber" /><MetricCard label="Leituras" value={metrics.readings} icon={UsersRound} tone="emerald" /><MetricCard label="Rascunhos" value={metrics.drafts} icon={Edit3} tone="slate" /></div>
      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-bold text-slate-950">Lista de comunicados</h2><p className="mt-1 text-sm text-slate-500">Somente comunicados publicados aparecem no portal do voluntário.</p></div><div className="flex gap-2"><ToolbarSearch placeholder="Buscar comunicado" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={() => void loadItems()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-3"><select value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value as BooleanFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="todos">Todos</option><option value="true">Publicado</option><option value="false">Rascunho</option></select><select value={pinnedFilter} onChange={(event) => setPinnedFilter(event.target.value as BooleanFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="todos">Todos</option><option value="true">Fixado</option><option value="false">Normal</option></select><button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button></div></div>{isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando comunicados...</div> : null}{!isLoading && items.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Comunicado</th><th className="px-5 py-3">Atualizado</th><th className="px-5 py-3">Fixado</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Leituras</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-950">{item.titulo}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{item.corpo}</p></td><td className="px-5 py-4 text-slate-600">{formatDate(item.atualizado_em)}</td><td className="px-5 py-4"><StatusBadge tone={item.fixado ? 'warning' : 'neutral'}>{item.fixado ? 'Fixado' : 'Normal'}</StatusBadge></td><td className="px-5 py-4"><StatusBadge>{item.publicado ? 'Publicado' : 'Rascunho'}</StatusBadge></td><td className="px-5 py-4"><button type="button" onClick={() => void openReadings(item)} className="font-semibold text-cyan-700 hover:underline">{item.leituras}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedItem(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Visualizar"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openEditor(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteItem(item)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : null}{!isLoading && items.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum comunicado encontrado.</div> : null}{!isLoading && totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-600"><span>Página {currentPage} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Anterior</button><button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Próxima</button></div></div> : null}</div>
      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">{selectedItem ? <><DialogHeader><DialogTitle>{selectedItem.titulo}</DialogTitle><DialogDescription>{selectedItem.fixado ? 'Fixado' : 'Normal'} · {formatDate(selectedItem.criado_em)}</DialogDescription></DialogHeader><p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{selectedItem.corpo}</p></> : null}</DialogContent></Dialog>
      <Dialog open={Boolean(readingItem)} onOpenChange={(open) => !open && setReadingItem(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl"><DialogHeader><DialogTitle>Leituras do comunicado</DialogTitle><DialogDescription>{readingItem?.titulo}</DialogDescription></DialogHeader>{readings.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Nenhuma leitura registrada.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-3">Voluntário</th><th className="py-3">Data de leitura</th></tr></thead><tbody className="divide-y divide-slate-100">{readings.map((reading) => <tr key={`${reading.voluntario_id}-${reading.lido_em}`}><td className="py-3"><p className="font-medium text-slate-900">{reading.voluntario_nome}</p><p className="text-xs text-slate-500">{reading.voluntario_email}</p></td><td className="py-3 text-slate-600">{formatDate(reading.lido_em)}</td></tr>)}</tbody></table></div>}</DialogContent></Dialog>
      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl"><DialogHeader><DialogTitle>{editingItem ? 'Editar comunicado' : 'Novo comunicado'}</DialogTitle><DialogDescription>Defina o conteúdo e se ele será publicado no portal.</DialogDescription></DialogHeader><form onSubmit={submitItem} className="space-y-4"><label className="space-y-2 text-sm font-medium text-slate-700">Título<input required value={formState.titulo} onChange={(event) => setFormState((current) => ({ ...current, titulo: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Conteúdo<textarea required value={formState.corpo} onChange={(event) => setFormState((current) => ({ ...current, corpo: event.target.value }))} rows={7} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><div className="flex flex-wrap gap-4 text-sm text-slate-700"><label className="flex items-center gap-2"><input type="checkbox" checked={formState.fixado} onChange={(event) => setFormState((current) => ({ ...current, fixado: event.target.checked }))} /> Fixar comunicado</label><label className="flex items-center gap-2"><input type="checkbox" checked={formState.publicado} onChange={(event) => setFormState((current) => ({ ...current, publicado: event.target.checked }))} /> Publicar no portal</label></div><DialogFooter><button type="button" disabled={isActionLoading} onClick={closeEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /> Excluir comunicado</DialogTitle><DialogDescription>Esta ação remove o comunicado da central dos voluntários.</DialogDescription></DialogHeader><p className="text-sm text-slate-700">Excluir definitivamente {deleteItem?.titulo}?</p><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}
