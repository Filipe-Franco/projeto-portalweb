import { Clock3, FileUp, UploadCloud } from 'lucide-react';

const uploads = [
  {
    title: 'Comprovante de participação - maio',
    date: '14/05/2026',
    status: 'Em análise',
  },
  {
    title: 'Foto de recibos de doação',
    date: '03/05/2026',
    status: 'Aprovado',
  },
];

export function UploadsPortal() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
          Arquivos do voluntário
        </p>
        <h1 className="mt-2 text-3xl font-bold">Uploads</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Envie arquivos para análise administrativa e acompanhe o status de
          aprovação.
        </p>
      </div>

      <section className="rounded-lg border border-dashed border-cyan-300 bg-cyan-50/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-md bg-white p-3 text-cyan-700 shadow-sm">
              <UploadCloud aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Enviar novo arquivo</h2>
              <p className="mt-1 text-sm text-slate-600">
                Formatos aceitos serão validados pelo backend na integração.
              </p>
            </div>
          </div>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
            type="button"
          >
            <FileUp aria-hidden="true" className="h-4 w-4" />
            Selecionar arquivo
          </button>
        </div>
      </section>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-xl font-bold">Envios recentes</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {uploads.map((upload) => (
            <article
              key={upload.title}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-semibold">{upload.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enviado em {upload.date}
                </p>
              </div>
              <span className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                {upload.status}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
