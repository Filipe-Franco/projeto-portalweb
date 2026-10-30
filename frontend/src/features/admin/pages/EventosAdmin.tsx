import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Edit3, Eye, MapPin, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  createAdminEvent,
  deleteAdminEvent,
  listAdminEventAttendances,
  listAdminEvents,
  updateAdminEvent,
  type AdminEvent,
  type AdminEventAttendance,
  type AdminEventPayload,
  type AdminEventType,
} from '@/features/admin/api/adminEventsApi';

type TypeFilter = AdminEventType | 'todos';
type BooleanFilter = 'todos' | 'true' | 'false';

type EventFormState = {
  titulo: string;
  descricao: string;
  tipo: AdminEventType;
  data_inicio: string;
  data_fim: string;
  local: string;
  imagem_url: string;
  recorrente: boolean;
  dia_semana: string;
  publico: boolean;
  publicado: boolean;
};

const PAGE_SIZE = 10;
const emptyForm: EventFormState = {
  titulo: '', descricao: '', tipo: 'avulso', data_inicio: '', data_fim: '', local: '', imagem_url: '', recorrente: false, dia_semana: '', publico: true, publicado: true,
};

const typeOptions: Array<{ label: string; value: TypeFilter }> = [
  { label: 'Todos', value: 'todos' }, { label: 'Avulso', value: 'avulso' }, { label: 'Especial', value: 'especial' }, { label: 'Fixo semanal', value: 'fixo_semanal' },
];

function apiErrorMessage(error: unknown) { return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.'; }
function typeLabel(type: AdminEventType) { return typeOptions.find((item) => item.value === type)?.label || type; }
function formatDateTime(value: string) { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function toInputDateTime(value: string | null) { return value ? String(value).slice(0, 16) : ''; }
function eventToForm(event: AdminEvent): EventFormState {
  return { titulo: event.titulo, descricao: event.descricao || '', tipo: event.tipo, data_inicio: toInputDateTime(event.data_inicio), data_fim: toInputDateTime(event.data_fim), local: event.local || '', imagem_url: event.imagem_url || '', recorrente: event.recorrente, dia_semana: event.dia_semana === null ? '' : String(event.dia_semana), publico: event.publico, publicado: event.publicado };
}
function formToPayload(form: EventFormState): AdminEventPayload {
  return { titulo: form.titulo.trim(), descricao: form.descricao.trim(), tipo: form.tipo, data_inicio: form.data_inicio, data_fim: form.data_fim, local: form.local.trim(), imagem_url: form.imagem_url.trim(), recorrente: form.recorrente, dia_semana: form.recorrente ? Number(form.dia_semana || 0) : null, publico: form.publico, publicado: form.publicado };
}

export function EventosAdmin() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [publicFilter, setPublicFilter] = useState<BooleanFilter>('todos');
  const [publishedFilter, setPublishedFilter] = useState<BooleanFilter>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteEventItem, setDeleteEventItem] = useState<AdminEvent | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<AdminEvent | null>(null);
  const [attendances, setAttendances] = useState<AdminEventAttendance[]>([]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true); setErrorMessage('');
    try {
      const response = await listAdminEvents({ q: query.trim() || undefined, tipo: typeFilter === 'todos' ? undefined : typeFilter, publico: publicFilter === 'todos' ? undefined : publicFilter === 'true', publicado: publishedFilter === 'todos' ? undefined : publishedFilter === 'true', start: startDate || undefined, end: endDate || undefined, page: currentPage, limit: PAGE_SIZE });
      setEvents(response.data); setTotalPages(Math.max(1, response.meta.totalPages || 1));
    } catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsLoading(false); }
  }, [currentPage, endDate, publicFilter, publishedFilter, query, startDate, typeFilter]);

  useEffect(() => { setCurrentPage(1); }, [endDate, publicFilter, publishedFilter, query, startDate, typeFilter]);
  useEffect(() => { const timeout = window.setTimeout(() => void loadEvents(), 250); return () => window.clearTimeout(timeout); }, [loadEvents]);

  const metrics = useMemo(() => ({ published: events.filter((e) => e.publicado).length, publicEvents: events.filter((e) => e.publico && e.publicado).length, confirmations: events.reduce((sum, e) => sum + Number(e.confirmados || 0) + Number(e.presentes || 0), 0), drafts: events.filter((e) => !e.publicado).length }), [events]);

  const openEditor = (event?: AdminEvent) => { setEditingEvent(event || null); setEventForm(event ? eventToForm(event) : emptyForm); setIsEditorOpen(true); setSuccessMessage(''); setErrorMessage(''); };
  const closeEditor = () => { setIsEditorOpen(false); setEditingEvent(null); setEventForm(emptyForm); };
  const resetFilters = () => { setQuery(''); setTypeFilter('todos'); setPublicFilter('todos'); setPublishedFilter('todos'); setStartDate(''); setEndDate(''); setCurrentPage(1); };

  const submitEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsActionLoading(true); setSuccessMessage(''); setErrorMessage('');
    try { const response = editingEvent ? await updateAdminEvent(editingEvent.id, formToPayload(eventForm)) : await createAdminEvent(formToPayload(eventForm)); setSuccessMessage(response.message); closeEditor(); await loadEvents(); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsActionLoading(false); }
  };

  const runDelete = async () => {
    if (!deleteEventItem) return;
    setIsActionLoading(true); setSuccessMessage(''); setErrorMessage('');
    try { const response = await deleteAdminEvent(deleteEventItem.id); setSuccessMessage(response.message); setDeleteEventItem(null); await loadEvents(); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsActionLoading(false); }
  };

  const openAttendances = async (event: AdminEvent) => {
    setAttendanceEvent(event); setAttendances([]);
    try { const response = await listAdminEventAttendances(event.id); setAttendances(response.data); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
  };

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Agenda e ações" title="Eventos" description="Cadastre ações públicas para o site e eventos internos para o portal do voluntário." actions={<button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Novo evento</button>} />
      <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Publicados" value={metrics.published} icon={CalendarDays} /><MetricCard label="No site público" value={metrics.publicEvents} icon={MapPin} tone="emerald" /><MetricCard label="Confirmações" value={metrics.confirmations} icon={CheckCircle2} tone="emerald" /><MetricCard label="Rascunhos" value={metrics.drafts} icon={Edit3} tone="amber" /></div>
      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-bold text-slate-950">Eventos cadastrados</h2><p className="mt-1 text-sm text-slate-500">Público + publicado aparece no site. Publicado aparece no portal do voluntário.</p></div><div className="flex gap-2"><ToolbarSearch placeholder="Buscar evento" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={() => void loadEvents()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-6"><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /><select value={publicFilter} onChange={(event) => setPublicFilter(event.target.value as BooleanFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="todos">Todos</option><option value="true">Site público</option><option value="false">Só portal</option></select><select value={publishedFilter} onChange={(event) => setPublishedFilter(event.target.value as BooleanFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="todos">Todos</option><option value="true">Publicado</option><option value="false">Rascunho</option></select><button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar</button></div></div>{isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando eventos...</div> : null}{!isLoading && events.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Evento</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Data/Hora</th><th className="px-5 py-3">Exibição</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Respostas</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{events.map((event) => <tr key={event.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-950">{event.titulo}</p><p className="mt-1 text-xs text-slate-500">{event.local || '-'}</p></td><td className="px-5 py-4 text-slate-600">{typeLabel(event.tipo)}</td><td className="px-5 py-4 text-slate-600">{formatDateTime(event.data_inicio)}</td><td className="px-5 py-4"><StatusBadge>{event.publico ? 'Site + portal' : 'Só portal'}</StatusBadge></td><td className="px-5 py-4"><StatusBadge>{event.publicado ? 'Publicado' : 'Rascunho'}</StatusBadge></td><td className="px-5 py-4"><button type="button" onClick={() => void openAttendances(event)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Users className="h-4 w-4 text-cyan-700" />{Number(event.confirmados || 0) + Number(event.presentes || 0)} sim · {event.ausentes} talvez · {event.cancelados} não</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedEvent(event)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Visualizar"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openEditor(event)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteEventItem(event)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : null}{!isLoading && events.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum evento encontrado.</div> : null}{!isLoading && totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-600"><span>Página {currentPage} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Anterior</button><button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Próxima</button></div></div> : null}</div>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">{selectedEvent ? <><DialogHeader><DialogTitle>{selectedEvent.titulo}</DialogTitle><DialogDescription>{typeLabel(selectedEvent.tipo)} · {formatDateTime(selectedEvent.data_inicio)}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Local:</span> {selectedEvent.local || '-'}</p><p><span className="text-slate-500">Exibição:</span> {selectedEvent.publico ? 'Site público e portal' : 'Somente portal'}</p><p><span className="text-slate-500">Status:</span> {selectedEvent.publicado ? 'Publicado' : 'Rascunho'}</p><p><span className="text-slate-500">Recorrente:</span> {selectedEvent.recorrente ? 'Sim' : 'Não'}</p></div><p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">{selectedEvent.descricao || 'Sem descrição.'}</p></> : null}</DialogContent></Dialog>
      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl"><DialogHeader><DialogTitle>{editingEvent ? 'Editar evento' : 'Novo evento'}</DialogTitle><DialogDescription>Eventos públicos publicados aparecem no site; eventos publicados aparecem no portal do voluntário.</DialogDescription></DialogHeader><form onSubmit={submitEvent} className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Título<input required value={eventForm.titulo} onChange={(e) => setEventForm((c) => ({ ...c, titulo: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Tipo<select value={eventForm.tipo} onChange={(e) => setEventForm((c) => ({ ...c, tipo: e.target.value as AdminEventType }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="avulso">Avulso</option><option value="especial">Especial</option><option value="fixo_semanal">Fixo semanal</option></select></label><label className="space-y-2 text-sm font-medium text-slate-700">Início<input required type="datetime-local" value={eventForm.data_inicio} onChange={(e) => setEventForm((c) => ({ ...c, data_inicio: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Fim<input type="datetime-local" value={eventForm.data_fim} onChange={(e) => setEventForm((c) => ({ ...c, data_fim: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Local<input value={eventForm.local} onChange={(e) => setEventForm((c) => ({ ...c, local: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Descrição<textarea value={eventForm.descricao} onChange={(e) => setEventForm((c) => ({ ...c, descricao: e.target.value }))} rows={4} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={eventForm.publico} onChange={(e) => setEventForm((c) => ({ ...c, publico: e.target.checked }))} /> Aparece no site público</label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={eventForm.publicado} onChange={(e) => setEventForm((c) => ({ ...c, publicado: e.target.checked }))} /> Publicado</label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={eventForm.recorrente} onChange={(e) => setEventForm((c) => ({ ...c, recorrente: e.target.checked }))} /> Recorrente semanal</label>{eventForm.recorrente ? <label className="space-y-2 text-sm font-medium text-slate-700">Dia da semana<select value={eventForm.dia_semana} onChange={(e) => setEventForm((c) => ({ ...c, dia_semana: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="">Selecione</option><option value="0">Domingo</option><option value="1">Segunda</option><option value="2">Terça</option><option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option></select></label> : null}<DialogFooter className="sm:col-span-2"><button type="button" disabled={isActionLoading} onClick={closeEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(attendanceEvent)} onOpenChange={(open) => !open && setAttendanceEvent(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl"><DialogHeader><DialogTitle>Respostas do evento</DialogTitle><DialogDescription>{attendanceEvent?.titulo}</DialogDescription></DialogHeader>{attendances.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Nenhuma resposta registrada.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-3">Voluntário</th><th className="py-3">Status</th><th className="py-3">Atualizado</th></tr></thead><tbody className="divide-y divide-slate-100">{attendances.map((item) => <tr key={item.id}><td className="py-3"><p className="font-medium text-slate-900">{item.voluntario_nome}</p><p className="text-xs text-slate-500">{item.voluntario_email}</p></td><td className="py-3 text-slate-600">{item.status}</td><td className="py-3 text-slate-600">{formatDateTime(item.atualizado_em)}</td></tr>)}</tbody></table></div>}</DialogContent></Dialog>
      <Dialog open={Boolean(deleteEventItem)} onOpenChange={(open) => !open && setDeleteEventItem(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /> Excluir evento</DialogTitle><DialogDescription>Esta ação remove o evento do admin, site público e portal.</DialogDescription></DialogHeader><p className="text-sm text-slate-700">Excluir definitivamente {deleteEventItem?.titulo}?</p><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteEventItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}
