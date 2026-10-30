import { useEffect, useState } from "react";
import { HeartPulse, Utensils, Users, Home as HomeIcon } from "lucide-react";

import {
  getContent,
  getTeamMembers,
  type ContentMap,
  type TeamMember,
} from "@/features/public/api/publicApi";

const emptyContent = "Conteúdo em atualização.";

function contentValue(content: ContentMap, keys: string[]) {
  const match = keys.find((key) => content[key]?.valor);
  return match ? content[match].valor : emptyContent;
}

export function Sobre() {
  const [intro, setIntro] = useState(emptyContent);
  const [mission, setMission] = useState(emptyContent);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    let isMounted = true;

    getContent({ prefix: "sobre_" })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setIntro(
          contentValue(
            response.data,
            ["sobre_intro", "sobre_quem_somos", "sobre_texto"]
          )
        );
        setMission(
          contentValue(
            response.data,
            ["sobre_missao", "sobre_mission", "sobre_proposito"]
          )
        );
      })
      .catch(() => undefined);

    getTeamMembers()
      .then((response) => {
        if (isMounted) {
          setTeamMembers(response.data);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <section className="mb-16">
          <h1 className="mb-8 text-center text-3xl font-extrabold md:text-4xl">QUEM SOMOS?</h1>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <p className="text-lg leading-relaxed mb-4">{intro}</p>
            <p className="text-lg leading-relaxed">{mission}</p>
          </div>
        </section>

        <section id="atuacao">
          <h2 className="mb-8 text-center text-3xl font-extrabold md:text-4xl">ATUAÇÃO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#E0F4FF] p-6 rounded-lg border-2 border-[#89CFF0]">
              <div className="flex items-center gap-3 mb-4">
                <HeartPulse size={32} className="text-[#89CFF0]" />
                <h3>TRATAMENTO</h3>
              </div>
              <p>
                Através do nosso celular SOS, pessoas em situação de rua podem ligar a cobrar
                e solicitar encaminhamentopara tratamento de dependencia quimica. Entramos em contato 
                com entidades parceiras, agendamos o horário e local, e realizamos o transporte
                até o centro de acolhimento, acompanhando cada passo com cuidado e respeito
              </p>
            </div>

            <div className="bg-[#E0F4FF] p-6 rounded-lg border-2 border-[#89CFF0]">
              <div className="flex items-center gap-3 mb-4">
                <HomeIcon size={32} className="text-[#89CFF0]" />
                <h3>ACOLHIDA</h3>
              </div>
              <p>
                Vamos além das necessidades físicas. Criamos vínculos e
                oferecemos um espaço seguro de escuta, conversa e respeito.
                Levamos cobertores, agasalhos e, principalmente, dignidade e
                carinho para todos.
              </p>
            </div>

            <div className="bg-[#E0F4FF] p-6 rounded-lg border-2 border-[#89CFF0]">
              <div className="flex items-center gap-3 mb-4">
                <Utensils size={32} className="text-[#89CFF0]" />
                <h3>REFEIÇÕES</h3>
              </div>
              <p>
                Todas as semanas, distribuímos centenas de refeições em
                diversos pontos da cidade. Contamos com a ajuda de voluntários
                dedicados que preparam, embalam e distribuem alimentos com muito
                amor e cuidado.
              </p>
            </div>

            <div className="bg-[#E0F4FF] p-6 rounded-lg border-2 border-[#89CFF0]">
              <div className="flex items-center gap-3 mb-4">
                <Users size={32} className="text-[#89CFF0]" />
                <h3>ACOMPANHAMENTO</h3>
              </div>
              <p>
                Mantemos o contato regular com as pessoas assistidas, criando
                relacionamentos duradouros. Auxiliamos no acesso a serviços de
                saúde, documentação e oportunidades de reinserção social quando
                necessário.
              </p>
            </div>
          </div>
        </section>

        {teamMembers.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-8 text-center text-3xl font-extrabold md:text-4xl">EQUIPE</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {teamMembers.map((member) => (
                <article key={member.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    {member.foto_url && (
                      <img
                        src={member.foto_url}
                        alt={member.nome}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3>{member.nome}</h3>
                      {member.cargo && <p className="text-sm text-[#1e7a9e]">{member.cargo}</p>}
                      {member.bio && <p className="mt-2 text-sm text-gray-600">{member.bio}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 bg-gradient-to-r from-[#89CFF0] to-[#B0E0E6] p-8 rounded-lg text-center">
          <h2 className="mb-4 text-3xl font-extrabold md:text-4xl">Junte-se a Nós</h2>
          <p className="text-lg mb-6">
            Cada pequeno gesto faz uma grande diferença. Venha fazer parte
            deste movimento de amor!
          </p>
          <a
            href="/voluntario"
            className="inline-block bg-black !text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
          >
            Quero Colaborar
          </a>
        </section>
      </div>
    </div>
  );
}
