import { ArrowRight, Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageHeader, StatusBadge } from '@/shared/components/app';
import { listPortalAnnouncements, markPortalAnnouncementRead, type PortalAnnouncement } from '@/features/portal/api/portalAnnouncementsApi';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
}

export function ComunicadosPortal() {
  const [items, setItems] = useState<PortalAnnouncement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    listPortalAnnouncements()
      .then((response) => { if (isMounted) setItems(response.data); })
      .catch(() => { if (isMounted) setErrorMessage('Não foi possível carregar os comunicados.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const selected = items.find((item) => item.id === selectedId) || null;

  const openAnnouncement = async (item: PortalAnnouncement) => {
    setSelectedId(item.id);
    if (!item.lido_em) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, lido_em: new Date().toISOString() } : entry));
      await markPortalAnnouncementRead(item.id).catch(() => undefined);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Comunicação interna" title="Comunicados" description="Acompanhe avisos oficiais, orientações e atualizações da coordenação." />
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}
      {isLoading ? <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">Carregando comunicados...</div> : null}
      {!isLoading && !selected ? (
        items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <Megaphone className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-3 text-xl font-extrabold text-slate-950">Nenhum comunicado publicado</h2>
            <p className="mt-1 text-sm text-slate-500">Novos comunicados aparecerão aqui quando forem publicados pela administração.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <button key={item.id} onClick={() => void openAnnouncement(item)} className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-cyan-200 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-2 text-center text-sm font-bold text-cyan-800">{formatDate(item.criado_em)}</div>
                  <ArrowRight className="h-5 w-5 text-cyan-700" />
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.fixado ? <StatusBadge tone="warning">Fixado</StatusBadge> : null}
                  {item.lido_em ? <StatusBadge tone="success">Lido</StatusBadge> : <StatusBadge>Novo</StatusBadge>}
                </div>
                <h2 className="text-xl font-extrabold text-slate-950">{item.titulo}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{item.corpo}</p>
              </button>
            ))}
          </div>
        )
      ) : null}
      {selected ? (
        <article className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <button type="button" onClick={() => setSelectedId(null)} className="mb-5 text-sm font-semibold text-cyan-700 hover:text-cyan-800">Voltar para comunicados</button>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge>{selected.lido_em ? 'Lido' : 'Novo'}</StatusBadge>{selected.fixado ? <StatusBadge tone="warning">Fixado</StatusBadge> : null}</div>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950">{selected.titulo}</h2>
            <p className="mt-2 text-sm text-slate-500">Publicado em {formatFullDate(selected.criado_em)}</p>
          </div>
          <div className="p-6">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">{selected.corpo}</p>
          </div>
        </article>
      ) : null}
    </section>
  );
}
