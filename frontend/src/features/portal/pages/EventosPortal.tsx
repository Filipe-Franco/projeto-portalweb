import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, HelpCircle, MapPin, MessageSquare, UsersRound, XCircle } from 'lucide-react';

import { PageHeader, StatusBadge } from '@/shared/components/app';
import { listPortalEvents, setPortalEventPresence, type PortalEvent, type PortalPresenceStatus } from '@/features/portal/api/portalEventsApi';

const guidelines = ['Chegue ao ponto de encontro com 15 minutos de antecedência.', 'Confirme presença somente quando tiver segurança de que poderá participar.', 'Avise a coordenação se precisar alterar sua resposta.'];
const responseLabels: Record<PortalPresenceStatus, string> = { confirmado: 'Presença confirmada', ausente: 'Talvez participe', cancelado: 'Não poderei ir' };

function eventDate(event: PortalEvent) { return new Date(event.data_inicio); }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseDateParam(value: string | null, fallback?: Date) { if (!value) return fallback; const [year, month, day] = value.split('-').map(Number); return year && month && day ? new Date(year, month - 1, day) : fallback; }
function formatDate(date: Date) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date); }
function formatLongDate(date: Date) { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date); }
function monthLabel(date: Date) { return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date); }
function formatTime(date: Date) { return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date); }
function getCalendarDays(month: Date) { const firstDay = new Date(month.getFullYear(), month.getMonth(), 1); const start = new Date(firstDay); start.setDate(firstDay.getDate() - firstDay.getDay()); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CalendarDays }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p></div><div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><Icon className="h-6 w-6" /></div></div></div>;
}

export function EventosPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const fallbackDate = events[0] ? eventDate(events[0]) : new Date();
  const initialDate = parseDateParam(searchParams.get('date'), fallbackDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(initialDate ?? fallbackDate);

  useEffect(() => {
    let isMounted = true;
    listPortalEvents()
      .then((response) => {
        if (!isMounted) return;
        setEvents(response.data);
        const firstDate = response.data[0] ? eventDate(response.data[0]) : new Date();
        if (!searchParams.get('date')) setSelectedDate(firstDate);
        setVisibleMonth(parseDateParam(searchParams.get('date'), firstDate) ?? firstDate);
      })
      .catch(() => { if (isMounted) setErrorMessage('Não foi possível carregar os eventos.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const selectedEvents = useMemo(() => selectedDate ? events.filter((event) => sameDay(eventDate(event), selectedDate)) : events, [events, selectedDate]);
  const eventsByDate = useMemo(() => events.reduce<Record<string, PortalEvent[]>>((acc, event) => { const key = dateKey(eventDate(event)); acc[key] = [...(acc[key] ?? []), event]; return acc; }, {}), [events]);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const confirmedCount = events.filter((event) => event.minha_presenca === 'confirmado').length;
  const nextEvent = events[0];

  const selectDate = (date: Date) => { setSelectedDate(date); setSearchParams({ date: dateKey(date) }); };
  const showAllEvents = () => { setSelectedDate(undefined); setSearchParams({}); };
  const changeMonth = (direction: -1 | 1) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  const handleResponse = async (eventId: string, status: PortalPresenceStatus) => {
    setEvents((current) => current.map((event) => event.id === eventId ? { ...event, minha_presenca: status } : event));
    await setPortalEventPresence(eventId, status).catch(() => setErrorMessage('Não foi possível atualizar sua presença.'));
  };

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Agenda interna" title="Eventos do Voluntário" description="Veja ações cadastradas pela administração e confirme sua presença nos eventos publicados." />
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}
      <div className="grid gap-4 md:grid-cols-3"><SummaryCard label="Próxima ação" value={nextEvent ? `${formatDate(eventDate(nextEvent))} às ${formatTime(eventDate(nextEvent))}` : '-'} icon={CalendarDays} /><SummaryCard label="Eventos abertos" value={`${events.length}`} icon={UsersRound} /><SummaryCard label="Suas confirmações" value={`${confirmedCount}`} icon={CheckCircle2} /></div>
      {isLoading ? <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">Carregando eventos...</div> : null}
      {!isLoading ? <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Calendário integrado</p><h2 className="mt-1 text-2xl font-extrabold capitalize text-slate-950">{monthLabel(visibleMonth)}</h2></div><div className="flex items-center gap-2"><button type="button" onClick={() => changeMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => changeMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={showAllEvents} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Ver todos</button></div></div><div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-slate-500">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-2">{calendarDays.map((day) => { const key = dateKey(day); const dayEvents = eventsByDate[key] ?? []; const isCurrentMonth = day.getMonth() === visibleMonth.getMonth(); const isSelected = selectedDate ? sameDay(day, selectedDate) : false; return <button key={key} type="button" onClick={() => selectDate(day)} className={`min-h-24 rounded-xl border p-2 text-left transition hover:border-cyan-300 hover:bg-cyan-50/60 ${isSelected ? 'border-cyan-700 bg-cyan-50 shadow-sm ring-2 ring-cyan-100' : 'border-slate-200 bg-white'} ${!isCurrentMonth ? 'opacity-45' : ''}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${isSelected ? 'bg-cyan-700 text-white' : 'text-slate-700'}`}>{day.getDate()}</span><div className="mt-2 space-y-1">{dayEvents.slice(0, 2).map((event) => <span key={event.id} className="block truncate rounded-md bg-cyan-700 px-2 py-1 text-[0.68rem] font-semibold text-white">{formatTime(eventDate(event))} · {event.titulo}</span>)}{dayEvents.length > 2 && <span className="block text-[0.68rem] font-semibold text-cyan-700">+{dayEvents.length - 2} evento(s)</span>}</div></button>; })}</div></section> : null}
      {!isLoading ? <div className="grid gap-6 xl:grid-cols-[1fr_22rem]"><section className="space-y-4"><div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Eventos</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">{selectedDate ? formatLongDate(selectedDate) : 'Todos os eventos'}</h2></div><StatusBadge tone="info">{`${selectedEvents.length} encontrado(s)`}</StatusBadge></div>{selectedEvents.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm"><CalendarCheck2 className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 text-xl font-extrabold text-slate-950">Nenhum evento neste dia</h3><p className="mt-1 text-sm text-slate-500">Escolha um dia marcado no calendário ou veja todos os eventos.</p></div> : selectedEvents.map((event) => { const date = eventDate(event); const response = event.minha_presenca; return <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md"><div className="flex gap-4"><div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-cyan-50 text-cyan-800"><span className="text-2xl font-extrabold">{String(date.getDate()).padStart(2, '0')}</span><span className="text-[0.65rem] font-bold uppercase">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-extrabold text-slate-950">{event.titulo}</h3><StatusBadge>{event.publico ? 'Público' : 'Interno'}</StatusBadge>{response && <StatusBadge tone={response === 'confirmado' ? 'success' : response === 'ausente' ? 'warning' : 'danger'}>{responseLabels[response]}</StatusBadge>}</div><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{event.descricao || 'Mais detalhes serão divulgados em breve.'}</p><div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2"><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-cyan-700" />{formatDate(date)} às {formatTime(date)}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-700" />{event.local || 'Local em definição'}</span><span className="flex items-center gap-2 md:col-span-2"><UsersRound className="h-4 w-4 text-cyan-700" />{event.confirmados || 0} confirmação(ões)</span></div></div></div><div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap"><button type="button" onClick={() => void handleResponse(event.id, 'confirmado')} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${response === 'confirmado' ? 'bg-emerald-600 !text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><CheckCircle2 className="h-4 w-4" />Confirmar presença</button><button type="button" onClick={() => void handleResponse(event.id, 'ausente')} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${response === 'ausente' ? 'bg-amber-500 !text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}><MessageSquare className="h-4 w-4" />Talvez</button><button type="button" onClick={() => void handleResponse(event.id, 'cancelado')} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${response === 'cancelado' ? 'bg-rose-600 !text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}><XCircle className="h-4 w-4" />Não poderei ir</button></div></article>; })}</section><aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24 xl:self-start"><h2 className="text-xl font-extrabold text-slate-950">Orientações</h2><div className="mt-5 space-y-4">{guidelines.map((guideline) => <p key={guideline} className="flex gap-3 text-sm text-slate-600"><HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />{guideline}</p>)}</div></aside></div> : null}
    </section>
  );
}
