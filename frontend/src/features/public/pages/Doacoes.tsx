import { Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import dioceseImg from "@/assets/images/image-19.png";
import doacaoImg from "@/assets/images/doacao.png";
import { env } from "@/shared/config/env";
import {
  getContent,
  getDonationLocations,
  type DonationLocation,
} from "@/features/public/api/publicApi";

export function Doacoes() {
  const [pixCopiado, setPixCopiado] = useState(false);
  const [chavePix, setChavePix] = useState("");
  const [pixRecebedor, setPixRecebedor] = useState("Dados bancários em atualização");
  const [locations, setLocations] = useState<DonationLocation[]>([]);

  useEffect(() => {
    let isMounted = true;

    getContent({ keys: "pix_chave,pix_nome_recebedor" })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        if (response.data.pix_chave?.valor) {
          setChavePix(response.data.pix_chave.valor);
        }

        if (response.data.pix_nome_recebedor?.valor) {
          setPixRecebedor(response.data.pix_nome_recebedor.valor);
        }
      })
      .catch(() => undefined);

    getDonationLocations()
      .then((response) => {
        if (isMounted) {
          setLocations(response.data);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const copiarPix = () => {
    if (!chavePix) {
      return;
    }

    navigator.clipboard.writeText(chavePix);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2000);
  };

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="mb-6 text-2xl font-extrabold">Sua Doação Transforma Vidas</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            Cada contribuição nos ajuda a levar esperança, alimento e dignidade
            para quem mais precisa. Doe e faça parte dessa corrente do bem!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          <div className="bg-white border border-gray-200/60 rounded-xl p-10 shadow-sm hover:shadow-md transition-all">
            <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900 md:text-4xl">Doação de Itens</h2>

            <div className="mb-6">
              <img
                src={doacaoImg}
                alt="Itens aceitos para doação: roupas, alimentos, higiene"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2">Aceitamos:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Roupas em bom estado (adulto e infantil)</li>
                  <li>Calçados</li>
                  <li>Cobertores e agasalhos</li>
                  <li>Produtos de higiene pessoal</li>
                  <li>Alimentos não perecíveis</li>
                </ul>
              </div>

              <div className="bg-[#E0F4FF] p-5 rounded-xl border-2 border-[#89CFF0]">
                <p className="text-sm mb-4 font-semibold text-gray-800 tracking-tight">
                  Para agendar sua doação:
                </p>
                <p className="text-sm mb-2 flex items-center gap-2 text-gray-700">
                  <span className="text-[#1e7a9e]">📞</span> WhatsApp: {env.contactPhone}
                </p>
                <p className="text-sm mb-4 flex items-center gap-2 text-gray-700">
                  <span className="text-[#1e7a9e]">📧</span> Email: {env.contactEmail}
                </p>

                <div className="border-t border-gray-200/60 pt-4 mt-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3 tracking-tight">
                    Locais Fixos de Doação:
                  </p>
                  <div className="space-y-2">
                    {locations.length === 0 ? (
                      <p className="text-xs text-gray-600">Nenhum local fixo ativo no momento.</p>
                    ) : (
                      locations.map((location) => (
                        <div key={location.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <span className="text-[#1e7a9e]">📍</span> {location.nome}
                          </p>
                          <p className="text-xs text-gray-600 ml-6">{location.endereco}</p>
                          {location.horario && (
                            <p className="text-xs text-gray-500 ml-6">{location.horario}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200/60 rounded-xl p-10 shadow-sm hover:shadow-md transition-all">
            <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-900 md:text-4xl">Doação de Valores</h2>

            <div className="mb-6">
              <div className="flex justify-center mb-6 bg-gray-50 p-5 rounded-xl">
                <img
                  src={dioceseImg}
                  alt="Diocese de Novo Hamburgo"
                  className="w-32 h-32 object-contain"
                />
              </div>
              <div className="bg-[#E0F4FF] p-6 rounded-xl text-center border-2 border-[#89CFF0]">
                <h3 className="mb-5 text-gray-900 tracking-tight">Chave PIX:</h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200/60 mb-5 shadow-sm">
                  <p className="break-all font-mono text-sm text-gray-700">{chavePix || "Chave PIX em atualização"}</p>
                </div>
                <button
                  onClick={copiarPix}
                  disabled={!chavePix}
                  className="bg-gradient-to-r from-[#1e7a9e] to-[#3b94ba] text-white px-7 py-3 rounded-full hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto font-semibold text-sm hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pixCopiado ? (
                    <>
                      <Check size={20} />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      Copiar Chave PIX
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/60 p-5 rounded-xl">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 tracking-tight">Dados bancários:</h3>
              <div className="text-sm space-y-2 text-gray-700">
                <p>
                  <strong className="font-semibold">Banco:</strong> {pixRecebedor}
                </p>
                <p>
                  <strong className="font-semibold">CNPJ:</strong> 80.831.665/0001-07
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200/60 p-5 rounded-xl mt-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                <strong className="font-semibold">ℹ️ Informação importante:</strong><br/>
                As doações em dinheiro são realizadas para uma conta bancária em parceria com a Diocese de Novo Hamburgo. Todos os valores recebidos são geridos por essa instituição, garantindo transparência e destinação adequada dos recursos para nossas ações sociais.
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Todo valor arrecadado é investido diretamente nas ações em prol
              das pessoas em situação de rua.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#89CFF0] to-[#B0E0E6] p-12 rounded-xl text-center shadow-sm">
          <h2 className="mb-6 text-3xl font-extrabold text-gray-900 md:text-4xl">Outras Formas de Ajudar</h2>
          <p className="text-base mb-10 text-gray-600 leading-relaxed max-w-2xl mx-auto font-light">
            Além de doações, você pode contribuir sendo voluntário em nossas
            ações ou divulgando nosso trabalho nas redes sociais!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/voluntario"
              className="inline-flex items-center justify-center bg-gray-900 !text-white px-10 py-4 rounded-full hover:bg-gray-800 hover:shadow-lg transition-all duration-300 font-semibold text-sm hover:scale-105 tracking-wide"
            >
              Seja Voluntário
            </Link>
            <a
              href={env.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-gray-900 px-10 py-4 rounded-full hover:bg-gray-50 hover:shadow-lg transition-all duration-300 border border-gray-200/60 font-semibold text-sm hover:scale-105 tracking-wide"
            >
              Siga no Instagram
            </a>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-gray-600">
          <p className="font-light">
            🙏 Muito obrigado por fazer parte dessa transformação! Juntos somos
            mais fortes!
          </p>
        </div>
      </div>
    </div>
  );
}
