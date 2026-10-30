import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

import { getPublicEvents, type PublicEvent } from "@/features/public/api/publicApi";

const fallbackEventos = [
  {
    dia: "24",
    mes: "ABRIL",
    titulo: "Distribuição de alimentos - Centro",
    descricao:
      "Ação de distribuição de marmitas e kits de higiene na região central da cidade.",
  },
  {
    dia: "01",
    mes: "MAIO",
    titulo: "Distribuição de alimentos - Centro",
    descricao:
      "Ação de distribuição de marmitas e kits de higiene na região central da cidade.",
  },
  {
    dia: "08",
    mes: "MAIO",
    titulo: "Distribuição de alimentos - Centro",
    descricao:
      "Ação de distribuição de marmitas e kits de higiene na região central da cidade.",
  },
  {
    dia: "15",
    mes: "MAIO",
    titulo: "Distribuição de alimentos - Centro",
    descricao:
      "Ação de distribuição de marmitas e kits de higiene na região central da cidade.",
  },
  {
    dia: "22",
    mes: "MAIO",
    titulo: "Ação especial - Dia do Abraço",
    descricao:
      "Evento especial com abraços, música ao vivo e distribuição de cobertores e agasalhos.",
  },
  {
    dia: "29",
    mes: "MAIO",
    titulo: "Distribuição de alimentos - Centro",
    descricao:
      "Ação de distribuição de marmitas e kits de higiene na região central da cidade.",
  },
];

type EventoCard = {
  dia: string;
  mes: string;
  titulo: string;
  descricao: string;
  local?: string | null;
};

function formatEventDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return { dia: "--", mes: "DATA" };
  }

  return {
    dia: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    mes: date.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase(),
  };
}

function mapApiEvent(evento: PublicEvent): EventoCard {
  const date = formatEventDate(evento.data_inicio);

  return {
    ...date,
    titulo: evento.titulo,
    descricao: evento.descricao || "Mais detalhes serão divulgados em breve.",
    local: evento.local,
  };
}

export function Eventos() {
  const [eventos, setEventos] = useState<EventoCard[]>(fallbackEventos);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getPublicEvents()
      .then((response) => {
        if (isMounted && response.data.length > 0) {
          setEventos(response.data.map(mapApiEvent));
        }
      })
      .catch(() => undefined)
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
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar size={40} className="text-[#89CFF0]" />
            <h1 className="text-3xl font-extrabold text-gray-900 md:text-4xl">AGENDA SEMANAL</h1>
          </div>
          <p className="text-lg text-gray-600">
            Confira nossa programação e participe das próximas ações
          </p>
          {isLoading && (
            <p className="mt-3 text-sm text-gray-500">Carregando eventos...</p>
          )}
        </div>

        <div className="space-y-6">
          {eventos.map((evento, index) => (
            <div
              key={`${evento.titulo}-${evento.dia}-${index}`}
              className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-6"
            >
              <div className="flex-shrink-0">
                <div className="bg-[#E0F4FF] border-2 border-[#89CFF0] rounded-lg p-4 text-center min-w-[100px]">
                  <div className="text-3xl font-extrabold">{evento.dia}</div>
                  <div className="mt-1 text-sm font-bold">{evento.mes}</div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-2xl font-extrabold text-gray-900">{evento.titulo}</h2>
                <p className="text-gray-600">{evento.descricao}</p>
                {evento.local && (
                  <p className="mt-3 text-sm text-gray-500">Local: {evento.local}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#89CFF0] to-[#B0E0E6] p-8 rounded-lg text-center">
          <h2 className="mb-4 text-3xl font-extrabold md:text-4xl">Quer Participar?</h2>
          <p className="text-lg mb-6">
            Cadastre-se como voluntário e receba informações sobre as próximas
            ações!
          </p>
          <a
            href="/voluntario"
            className="inline-block bg-black !text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
          >
            Cadastre-se Agora
          </a>
        </div>
      </div>
    </div>
  );
}
