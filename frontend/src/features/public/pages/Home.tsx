import { Link } from "react-router-dom";
import { Calendar, Heart, Users, ArrowRight, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { getContent, getDonationLocations, type ContentMap, type DonationLocation } from "@/features/public/api/publicApi";

const homeDefaults = {
  titulo: "Transformando Vidas nas Madrugadas",
  subtitulo: "Levando esperança, amor e dignidade para quem mais precisa",
  ctaVoluntario: "Seja Voluntário",
  ctaDoacao: "Fazer uma Doação",
};

function contentValue(content: ContentMap, key: string, fallback: string) {
  return content[key]?.valor || fallback;
}

function AnimatedCounter({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {decimals > 0 ? count.toFixed(decimals).replace('.', ',') : Math.floor(count).toLocaleString('pt-BR')}
    </span>
  );
}

export function Home() {
  const [homeDonationLocations, setHomeDonationLocations] = useState<DonationLocation[]>([]);
  const [homeText, setHomeText] = useState(homeDefaults);

  useEffect(() => {
    let isMounted = true;

    getContent({ keys: "home_titulo,home_subtitulo,home_cta_voluntario,home_cta_doacao" })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setHomeText({
          titulo: contentValue(response.data, "home_titulo", homeDefaults.titulo),
          subtitulo: contentValue(response.data, "home_subtitulo", homeDefaults.subtitulo),
          ctaVoluntario: contentValue(response.data, "home_cta_voluntario", homeDefaults.ctaVoluntario),
          ctaDoacao: contentValue(response.data, "home_cta_doacao", homeDefaults.ctaDoacao),
        });
      })
      .catch(() => undefined);

    getDonationLocations({ home: true, limit: 2 })
      .then((response) => {
        if (isMounted) {
          setHomeDonationLocations(response.data);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <section
        className="relative py-40 px-4 bg-gradient-to-br from-[#1e7a9e] via-[#2688ad] to-[#3b94ba]"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1699164524553-c0c67831be06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwdm9sdW50ZWVycyUyMGhlbHBpbmclMjBob21lbGVzcyUyMHBlb3BsZSUyMG5pZ2h0fGVufDF8fHx8MTc3NzA3NTU2NXww&ixlib=rb-4.1.0&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e7a9e]/94 via-[#2688ad]/92 to-[#3b94ba]/90"></div>
        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <h1 className="text-5xl md:text-7xl mb-8 text-white font-bold tracking-tight">
            {homeText.titulo}
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-white/95 font-light leading-relaxed">
            {homeText.subtitulo}
          </p>
          <Link
            to="/voluntario"
            className="inline-flex items-center justify-center bg-white text-[#0f172a] px-10 py-4 rounded-full hover:bg-white/95 transition-all shadow-xl hover:shadow-2xl hover:scale-105 font-semibold text-base tracking-wide"
          >
            {homeText.ctaVoluntario}
          </Link>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link
              to="/sobre"
              className="group bg-white border border-gray-200/60 rounded-2xl p-10 hover:shadow-lg hover:border-[#1e7a9e]/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <Heart size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-400 group-hover:translate-x-1 group-hover:text-[#1e7a9e] transition-all"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mb-3 text-gray-900">Nossa Missão</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Conheça nosso propósito de transformar vidas através do amor e
                do cuidado com o próximo
              </p>
            </Link>

            <Link
              to="/eventos"
              className="group bg-white border border-gray-200/60 rounded-2xl p-10 hover:shadow-lg hover:border-[#1e7a9e]/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <Calendar size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-400 group-hover:translate-x-1 group-hover:text-[#1e7a9e] transition-all"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mb-3 text-gray-900">Agenda Semanal</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Veja nossa programação e participe das próximas ações
              </p>
            </Link>

            <Link
              to="/sobre#atuacao"
              className="group bg-white border border-gray-200/60 rounded-2xl p-10 hover:shadow-lg hover:border-[#1e7a9e]/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <Users size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-400 group-hover:translate-x-1 group-hover:text-[#1e7a9e] transition-all"
                  strokeWidth={2}
                />
              </div>
              <h3 className="mb-3 text-gray-900">Atuação</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Histórias reais de transformação e impacto na comunidade
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-4xl">Nosso Impacto desde 2015</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Juntos, transformamos vidas e espalhamos esperança por nossa comunidade
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#1e7a9e]/10 transition-all">
              <div className="text-5xl md:text-6xl mb-4 font-bold bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] bg-clip-text text-transparent">
                <AnimatedCounter target={41475} />
              </div>
              <h3 className="text-sm text-gray-600 font-medium">Jantas distribuídas</h3>
            </div>

            <div className="bg-white rounded-xl p-8 text-center border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#1e7a9e]/10 transition-all">
              <div className="text-5xl md:text-6xl mb-4 font-bold bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] bg-clip-text text-transparent">
                <AnimatedCounter target={44.80} decimals={2} />
              </div>
              <h3 className="text-sm text-gray-600 font-medium">Alimentos arrecadados (em toneladas)</h3>
            </div>

            <div className="bg-white rounded-xl p-8 text-center border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#1e7a9e]/10 transition-all">
              <div className="text-5xl md:text-6xl mb-4 font-bold bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] bg-clip-text text-transparent">
                <AnimatedCounter target={22080} />
              </div>
              <h3 className="text-sm text-gray-600 font-medium">Cobertores</h3>
            </div>

            <div className="bg-white rounded-xl p-8 text-center border border-gray-200/60 shadow-sm hover:shadow-md hover:border-[#1e7a9e]/10 transition-all">
              <div className="text-5xl md:text-6xl mb-4 font-bold bg-gradient-to-br from-[#1e7a9e] to-[#3b94ba] bg-clip-text text-transparent">
                <AnimatedCounter target={77280} />
              </div>
              <h3 className="text-sm text-gray-600 font-medium">Peças de roupas</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="mb-4 text-3xl font-extrabold md:text-4xl">Locais de Atuação</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Atuamos nas cidades de São Leopoldo e Novo Hamburgo, levando apoio e esperança para quem mais precisa
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-10 border border-gray-200/60">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d55534.89757757194!2d-51.17!3d-29.68!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9519421e8c4e8f8b%3A0x3b5e0c6f3e5e0f8b!2sNovo%20Hamburgo%20e%20S%C3%A3o%20Leopoldo%2C%20RS!5e0!3m2!1spt-BR!2sbr!4v1234567890"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de atuação - São Leopoldo e Novo Hamburgo"
            ></iframe>
          </div>
          {homeDonationLocations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {homeDonationLocations.map((location) => (
                <div key={location.id} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200/60 hover:shadow-md hover:border-[#1e7a9e]/10 transition-all">
                  <h3 className="mb-2 text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-[#1e7a9e]" /> {location.nome}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{location.endereco}</p>
                  {location.horario && (
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{location.horario}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#f0f9ff] via-white to-[#f0f9ff] py-24 px-4 border-t border-gray-100">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="mb-6 text-3xl font-extrabold text-gray-900 md:text-4xl">Faça Parte Dessa Transformação</h2>
          <p className="text-lg mb-12 max-w-2xl mx-auto text-gray-600 leading-relaxed font-light">
            Cada gesto de amor conta. Junte-se a nós e seja a diferença na vida
            de quem precisa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/voluntario"
              className="inline-flex items-center justify-center bg-gradient-to-r from-[#1e7a9e] to-[#3b94ba] !text-white px-10 py-4 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold text-base tracking-wide"
            >
              {homeText.ctaVoluntario}
            </Link>
            <Link
              to="/doacoes"
              className="inline-flex items-center justify-center bg-gradient-to-r from-[#e11d48] to-[#be123c] !text-white px-10 py-4 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold text-base tracking-wide"
            >
              {homeText.ctaDoacao}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}