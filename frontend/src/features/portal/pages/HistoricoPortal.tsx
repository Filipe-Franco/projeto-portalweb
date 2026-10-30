import { CheckCircle2, History } from 'lucide-react';

const historyItems = [
  {
    title: 'Participação confirmada',
    detail: 'Ação Centro Histórico',
    date: '14/05/2026',
  },
  {
    title: 'Upload aprovado',
    detail: 'Foto de recibos de doação',
    date: '04/05/2026',
  },
  {
    title: 'Comunicado lido',
    detail: 'Campanha de cobertores',
    date: '08/05/2026',
  },
];

export function HistoricoPortal() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Registro de atividades
        </p>
        <h1 className="mt-2 text-3xl font-bold">Histórico</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Linha do tempo com participações, leituras e arquivos enviados.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <History aria-hidden="true" className="h-5 w-5 text-cyan-700" />
          <h2 className="text-xl font-bold">Atividades recentes</h2>
        </div>

        <div className="space-y-4">
          {historyItems.map((item) => (
            <article key={`${item.title}-${item.date}`} className="flex gap-4">
              <span className="mt-1 rounded-full bg-emerald-50 p-1 text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {item.date}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
