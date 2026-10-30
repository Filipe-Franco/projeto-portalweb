import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Calendar, CalendarCheck2, Clock, Megaphone, MapPin, Phone, Pin, User, UsersRound } from "lucide-react";

import { getPortalCoordinationMembers, type TeamMember } from "@/features/public/api/publicApi";
import { listPortalEvents, type PortalEvent } from "@/features/portal/api/portalEventsApi";
import { listPortalAnnouncements, type PortalAnnouncement } from "@/features/portal/api/portalAnnouncementsApi";

function eventDate(event: PortalEvent) {
  return new Date(event.data_inicio);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function responseLabel(event: PortalEvent) {
  if (event.minha_presenca === "confirmado") return "Presença confirmada";
  if (event.minha_presenca === "ausente") return "Talvez participe";
  if (event.minha_presenca === "cancelado") return "Não poderei ir";
  return "Aguardando confirmação";
}

export function DashboardPortal() {
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [announcements, setAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [coordenacoes, setCoordenacoes] = useState<TeamMember[]>([]);
  const [isCoordenacaoLoading, setIsCoordenacaoLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsEventsLoading(true);
    setEventsError("");

    listPortalEvents()
      .then((response) => {
        if (!active) return;
        setEvents(response.data);
      })
      .catch(() => {
        if (!active) return;
        setEvents([]);
        setEventsError("Não foi possível carregar os eventos do portal.");
      })
      .finally(() => {
        if (active) setIsEventsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsAnnouncementsLoading(true);
    setAnnouncementsError("");

    listPortalAnnouncements()
      .then((response) => {
        if (!active) return;
        setAnnouncements(response.data);
      })
      .catch(() => {
        if (!active) return;
        setAnnouncements([]);
        setAnnouncementsError("Não foi possível carregar os comunicados.");
      })
      .finally(() => {
        if (active) setIsAnnouncementsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsCoordenacaoLoading(true);
    getPortalCoordinationMembers()
      .then((response) => {
        if (active) setCoordenacoes(response.data);
      })
      .catch(() => {
        if (active) setCoordenacoes([]);
      })
      .finally(() => {
        if (active) setIsCoordenacaoLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => eventDate(event).getTime() >= today.getTime())
      .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
  }, [events]);

  const featuredEvent = upcomingEvents[0] ?? events[0] ?? null;
  const importantEvents = upcomingEvents.filter((event) => event.id !== featuredEvent?.id).slice(0, 3);
  const confirmedCount = events.filter((event) => event.minha_presenca === "confirmado").length;
  const unreadAnnouncements = announcements.filter((item) => !item.lido_em);
  const fixedAnnouncements = announcements.filter((item) => item.fixado);
  const dashboardAnnouncements = [...fixedAnnouncements, ...unreadAnnouncements.filter((item) => !item.fixado), ...announcements.filter((item) => item.lido_em && !item.fixado)].slice(0, 3);

  const infosDoacoes = [
    "Doações de alimentos não perecíveis são sempre bem-vindas",
    "Roupas de inverno estão em alta demanda nesta época",
    "Produtos de higiene pessoal são essenciais",
    "Cobertores e agasalhos podem ser entregues nos pontos de coleta",
    "Entre em contato para agendar entrega de itens volumosos",
    "Todas as doações são registradas e prestamos conta mensalmente",
    "Aceitamos doações financeiras via PIX",
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-[#EBF5FB] to-[#D6EAF8] border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="text-center mb-4">
              <h2 className="text-gray-900 mb-2">Mensagem Motivacional</h2>
            </div>
            <div className="bg-white/50 rounded-lg p-6">
              <p className="text-gray-700 text-center leading-relaxed">
                Obrigado por fazer parte desta família! Cada gesto seu transforma vidas
                e espalha amor. Continue sendo essa luz que ilumina as noites mais escuras
                de quem precisa. Juntos somos mais fortes! 💙
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link to="/portal/eventos" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-gray-500">Próxima ação</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <strong className="truncate text-lg text-gray-950">{featuredEvent ? formatDate(eventDate(featuredEvent)).toUpperCase() : "-"}</strong>
                <span className="rounded-lg bg-[#EBF5FB] p-2 text-[#2E86AB]">
                  <CalendarCheck2 size={22} />
                </span>
              </div>
            </Link>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Suas confirmações</p>
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-3xl text-gray-950">{confirmedCount}</strong>
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                  <UsersRound size={22} />
                </span>
              </div>
            </div>
            <Link to="/portal/comunicados" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-gray-500">Comunicados novos</p>
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-3xl text-gray-950">{unreadAnnouncements.length}</strong>
                <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
                  <Bell size={22} />
                </span>
              </div>
            </Link>
            <Link to="/portal/comunicados" className="rounded-xl border border-[#B8DDF2] bg-gradient-to-br from-[#EBF5FB] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium text-gray-500">Avisos fixados</p>
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-3xl text-[#1F6F95]">{fixedAnnouncements.length}</strong>
                <Pin size={22} className="text-[#2E86AB]" />
              </div>
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#2E86AB]">Próxima ação</p>
                <h2 className="mt-1 text-2xl font-extrabold text-gray-950">Eventos em destaque</h2>
              </div>
              <Link to="/portal/eventos" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E86AB] hover:text-[#1F6F95]">
                Ver agenda <ArrowRight size={16} />
              </Link>
            </div>

            {isEventsLoading ? (
              <div className="p-6">
                <div className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">Carregando eventos...</div>
              </div>
            ) : null}

            {!isEventsLoading && eventsError ? (
              <div className="p-6">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{eventsError}</div>
              </div>
            ) : null}

            {!isEventsLoading && !eventsError && featuredEvent ? (
              <Link to={`/portal/eventos?date=${dateKey(eventDate(featuredEvent))}`} className="block p-6 transition hover:bg-[#F7FBFE]">
                <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
                  <div className="flex min-w-[116px] flex-row items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#2E86AB] to-[#5DADE2] px-5 py-4 text-white md:flex-col md:gap-1">
                    <span className="text-3xl font-extrabold leading-none">{String(eventDate(featuredEvent).getDate()).padStart(2, "0")}</span>
                    <span className="text-sm font-bold uppercase">{eventDate(featuredEvent).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EBF5FB] px-3 py-1 text-xs font-semibold text-[#1F6F95]">{featuredEvent.publico ? "Evento público" : "Evento interno"}</span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{responseLabel(featuredEvent)}</span>
                    </div>
                    <h3 className="mt-3 text-2xl font-extrabold text-gray-950">{featuredEvent.titulo}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{featuredEvent.descricao || "Mais detalhes serão divulgados pela coordenação."}</p>
                    <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <span className="flex items-center gap-2"><Clock size={16} className="text-[#2E86AB]" />{formatFullDate(eventDate(featuredEvent))} às {formatTime(eventDate(featuredEvent))}</span>
                      <span className="flex items-center gap-2"><MapPin size={16} className="text-[#2E86AB]" />{featuredEvent.local || "Local em definição"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            {!isEventsLoading && !eventsError && !featuredEvent ? (
              <div className="p-6">
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <CalendarCheck2 className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-3 text-sm font-medium text-gray-600">Nenhum evento divulgado no momento.</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#2E86AB]">Comunicação interna</p>
                <h2 className="text-2xl font-extrabold text-gray-950">Comunicados da coordenação</h2>
              </div>
              <Link to="/portal/comunicados" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E86AB] hover:text-[#1F6F95]">
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>
            <div className="space-y-3">
              {isAnnouncementsLoading ? (
                <div className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">Carregando comunicados...</div>
              ) : null}
              {!isAnnouncementsLoading && announcementsError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{announcementsError}</div>
              ) : null}
              {!isAnnouncementsLoading && !announcementsError && dashboardAnnouncements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">Nenhum comunicado publicado no momento.</div>
              ) : null}
              {!isAnnouncementsLoading && !announcementsError && dashboardAnnouncements.map((item) => (
                <Link key={item.id} to="/portal/comunicados" className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[#8CC9EA] hover:bg-[#F7FBFE] hover:shadow-md">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2E86AB] transition group-hover:bg-[#2E86AB] group-hover:text-white">
                    <Megaphone size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.fixado ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Fixado</span> : null}
                      {!item.lido_em ? <span className="rounded-full bg-[#EBF5FB] px-2 py-0.5 text-xs font-semibold text-[#1F6F95]">Novo</span> : null}
                    </div>
                    <h3 className="mt-2 truncate font-semibold text-gray-950">{item.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600">{item.corpo}</p>
                  </div>
                  <ArrowRight size={18} className="mt-1 shrink-0 text-gray-300 transition group-hover:text-[#2E86AB]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#2E86AB]">Agenda do voluntário</p>
                <h2 className="text-2xl font-extrabold text-gray-950">Eventos importantes divulgados</h2>
              </div>
              <span className="text-sm font-medium text-gray-500">{upcomingEvents.length} próximo(s)</span>
            </div>
            <div className="space-y-3">
              {isEventsLoading ? (
                <div className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">Carregando agenda...</div>
              ) : null}
              {!isEventsLoading && !eventsError && importantEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                  {featuredEvent ? "Nenhum outro evento importante divulgado no momento." : "Nenhum evento importante divulgado no momento."}
                </div>
              ) : null}
              {!isEventsLoading && importantEvents.map((evento) => {
                const date = eventDate(evento);
                return (
                  <Link
                    key={evento.id}
                    to={`/portal/eventos?date=${dateKey(date)}`}
                    className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-[#8CC9EA] hover:bg-[#F7FBFE] hover:shadow-md"
                  >
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[#EBF5FB] text-[#1F6F95] transition group-hover:bg-[#2E86AB] group-hover:text-white">
                      <span className="text-xl font-extrabold">{String(date.getDate()).padStart(2, "0")}</span>
                      <span className="text-[0.65rem] font-bold uppercase">{formatDate(date).split(" ").pop()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-950">{evento.titulo}</h3>
                        {evento.minha_presenca ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{responseLabel(evento)}</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{evento.descricao || evento.local || "Detalhes disponíveis na agenda."}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={14} />{formatTime(date)}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} />{evento.local || "Local em definição"}</span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="mt-1 shrink-0 text-gray-300 transition group-hover:text-[#2E86AB]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-center mb-4 text-gray-900 font-medium">Calendário</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-[#EBF5FB] to-[#D6EAF8] rounded-xl p-6">
                <Calendar size={64} className="text-[#2E86AB]" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-600">
                  {dia}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const eventDate = day === 28 ? '2026-05-28' : day === 30 ? '2026-05-30' : null;
                const content = (
                  <span
                    className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                      eventDate
                        ? 'bg-gradient-to-br from-[#5DADE2] to-[#85C1E9] text-white font-medium shadow-sm'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </span>
                );

                return eventDate ? (
                  <Link key={day} to={`/portal/eventos?date=${eventDate}`} aria-label={`Ver eventos do dia ${day}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={day}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-4 font-medium text-gray-900">Coordenação</h3>
            <div className="space-y-3">
              {isCoordenacaoLoading ? (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Carregando coordenação...</div>
              ) : null}
              {!isCoordenacaoLoading && coordenacoes.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Nenhum membro ativo cadastrado.</div>
              ) : null}
              {!isCoordenacaoLoading && coordenacoes.map((coord) => (
                <div key={coord.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {coord.foto_url ? (
                      <img src={coord.foto_url} alt={coord.nome} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2E86AB]">
                        <User size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{coord.nome}</p>
                      <p className="truncate text-xs text-gray-600">{coord.cargo || "Coordenação"}</p>
                    </div>
                  </div>
                  {coord.bio ? (
                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
                      <Phone size={14} className="mt-0.5 shrink-0 text-[#2E86AB]" />
                      <span className="line-clamp-2">{coord.bio}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#EBF5FB] to-[#D6EAF8] border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-3 font-medium text-gray-900">Info sobre Doações</h3>
            <div className="bg-white/70 rounded-lg p-4">
              <ul className="space-y-2">
                {infosDoacoes.map((info, index) => (
                  <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-[#2E86AB] font-bold">•</span>
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
