import { useEffect, useState } from 'react';
import { Camera, HeartHandshake, MapPin, Search } from 'lucide-react';

import { getGalleryItems, type GalleryItem } from '@/features/public/api/publicApi';

type GalleryCard = {
  id: string;
  title: string;
  place: string;
  image: string;
  tag: string;
};

function mapGalleryItem(item: GalleryItem): GalleryCard {
  return {
    id: item.id,
    title: item.titulo,
    place: item.data_acao
      ? new Date(item.data_acao).toLocaleDateString('pt-BR')
      : 'Anjos da Madrugada',
    image: item.imagem_thumb || item.imagem_url,
    tag: item.descricao || 'Registro aprovado',
  };
}

export function Galeria() {
  const [galleryItems, setGalleryItems] = useState<GalleryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    getGalleryItems()
      .then((response) => {
        if (isMounted) {
          setGalleryItems(response.data.map(mapGalleryItem));
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage('Não foi possível carregar a galeria agora.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 px-4 py-16">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
            Memórias do projeto
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-950">Galeria</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Registros das ações, campanhas e bastidores do Anjos da Madrugada.
          </p>
          {isLoading && (
            <p className="mt-3 text-sm text-slate-500">Carregando galeria...</p>
          )}
          {errorMessage && (
            <p className="mt-3 text-sm font-medium text-rose-600">{errorMessage}</p>
          )}
        </div>

        {!isLoading && galleryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-16 text-center text-slate-500 shadow-sm">
            <Search className="mb-3 h-8 w-8 text-slate-300" />
            Nenhuma imagem aprovada para exibição pública no momento.
          </div>
        ) : null}

        {galleryItems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {galleryItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cyan-800 shadow-sm">
                    {item.tag}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-950">{item.title}</h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin aria-hidden="true" className="h-4 w-4 text-cyan-700" />
                        {item.place}
                      </p>
                    </div>
                    <Camera aria-hidden="true" className="h-5 w-5 text-cyan-700" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <section className="mt-12 rounded-xl border border-cyan-100 bg-cyan-50 p-8 text-center">
          <HeartHandshake aria-hidden="true" className="mx-auto h-10 w-10 text-cyan-700" />
          <h2 className="mt-4 text-3xl font-extrabold text-slate-950 md:text-4xl">Cada registro conta uma história</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            
          </p>
        </section>
      </div>
    </div>
  );
}
