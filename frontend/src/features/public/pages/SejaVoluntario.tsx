import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { ApiError } from "@/shared/api/client";
import {
  createVolunteerApplication,
  getInterestAreas,
  type InterestArea,
} from "@/features/public/api/publicApi";

const fallbackInterestAreas: InterestArea[] = [
  { id: 1, nome: "Acolhimento nas ruas" },
  { id: 2, nome: "Preparação de alimentos" },
  { id: 3, nome: "Distribuição de refeições" },
  { id: 4, nome: "Triagem de doações" },
  { id: 5, nome: "Logística e transporte" },
  { id: 6, nome: "Comunicação e redes sociais" },
  { id: 7, nome: "Captação de doações" },
  { id: 8, nome: "Organização de eventos" },
  { id: 9, nome: "Apoio administrativo" },
  { id: 10, nome: "Fotografia e registros" },
];

export function SejaVoluntario() {
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cidade: "",
    telefone: "",
    email: "",
    confirmarEmail: "",
    intencao: "",
    comoSoube: "",
  });
  const [areas, setAreas] = useState<InterestArea[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    getInterestAreas()
      .then((response) => {
        if (isMounted) {
          setAreas(Array.isArray(response.data) && response.data.length ? response.data : fallbackInterestAreas);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAreas(fallbackInterestAreas);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAreas(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setFormData({
      nomeCompleto: "",
      cidade: "",
      telefone: "",
      email: "",
      confirmarEmail: "",
      intencao: "",
      comoSoube: "",
    });
    setSelectedAreas([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await createVolunteerApplication({
        ...formData,
        areas_interesse: selectedAreas,
      });

      setFeedback({
        type: "success",
        message: response.message,
      });
      resetForm();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "Não foi possível enviar seu cadastro agora. Tente novamente em instantes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAreaSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const areaId = Number(e.target.value);

    if (!areaId) {
      return;
    }

    setSelectedAreas((current) =>
      current.includes(areaId) ? current : [...current, areaId]
    );
    e.target.value = "";
  };

  const handleAreaRemove = (areaId: number) => {
    setSelectedAreas((current) => current.filter((selectedId) => selectedId !== areaId));
  };

  const selectedAreaItems = areas.filter((area) => selectedAreas.includes(area.id));

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-4xl">SEJA UM VOLUNTÁRIO</h1>
          <p className="text-lg text-gray-600">
          
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-gray-900 md:text-4xl">Como Colaborar</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nomeCompleto"
                  className="block mb-2 text-sm"
                >
                  Nome Completo (obrigatório)
                </label>
                <input
                  type="text"
                  id="nomeCompleto"
                  name="nomeCompleto"
                  required
                  value={formData.nomeCompleto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
                />
              </div>

              <div>
                <label htmlFor="cidade" className="block mb-2 text-sm">
                  Cidade (obrigatório)
                </label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  required
                  value={formData.cidade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="telefone" className="block mb-2 text-sm">
                  Telefone (obrigatório)
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  required
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm">
                  E-mail (obrigatório)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmarEmail" className="block mb-2 text-sm">
                Confirme seu e-mail (obrigatório)
              </label>
              <input
                type="email"
                id="confirmarEmail"
                name="confirmarEmail"
                required
                value={formData.confirmarEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
              />
            </div>

            <div>
              <label htmlFor="intencao" className="block mb-2 text-sm">
                Detalhe sua intenção (obrigatório)
              </label>
              <textarea
                id="intencao"
                name="intencao"
                required
                rows={4}
                value={formData.intencao}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0] resize-none"
              />
            </div>

            <div>
              <label htmlFor="comoSoube" className="block mb-2 text-sm">
                Como ficou sabendo do projeto? (obrigatório)
              </label>
              <input
                type="text"
                id="comoSoube"
                name="comoSoube"
                required
                value={formData.comoSoube}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-[#f0f8ff] focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ex.: Instagram, indicação de amigo, etc.
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="block text-sm">Áreas de interesse</legend>
              {isLoadingAreas ? (
                <p className="text-sm text-gray-500">Carregando áreas...</p>
              ) : areas.length > 0 ? (
                <>
                  <select
                    defaultValue=""
                    onChange={handleAreaSelect}
                    className="w-full rounded-lg border border-gray-300 bg-[#f0f8ff] px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
                  >
                    <option value="" disabled>
                      Selecione uma área de interesse
                    </option>
                    {areas
                      .filter((area) => !selectedAreas.includes(area.id))
                      .map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nome}
                        </option>
                      ))}
                  </select>

                  {selectedAreaItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAreaItems.map((area) => (
                        <span
                          key={area.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[#89CFF0] bg-[#E0F4FF] px-3 py-1 text-sm text-gray-700"
                        >
                          {area.nome}
                          <button
                            type="button"
                            onClick={() => handleAreaRemove(area.id)}
                            className="rounded-full px-1 text-gray-500 transition hover:bg-white hover:text-gray-900"
                            aria-label={`Remover ${area.nome}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhuma área cadastrada no momento.
                </p>
              )}
            </fieldset>

            <div className="bg-[#FFF9E6] border border-[#FFD700] p-4 rounded-lg">
              <p className="text-sm">
                <strong>ATENÇÃO:</strong>
                <br />
                Clique no botão abaixo apenas se quiser se voluntariar de
                verdade!
                <br />
                Jamais compartilhe informações pessoais ou sensíveis que possam
                comprometer sua segurança.
                <br />
                Todas as informações coletadas são de uso exclusivo do
                movimento e serão mantidas em sigilo.
              </p>
            </div>

            {feedback && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#2E86AB] to-[#4A9EC4] text-white px-12 py-3.5 rounded-full hover:shadow-xl hover:scale-105 transition-all font-semibold disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
