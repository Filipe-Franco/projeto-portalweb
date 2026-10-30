import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

import { getFaq, type FaqItem } from "@/features/public/api/publicApi";
import { env } from "@/shared/config/env";

const categoryLabels: Record<string, string> = {
  voluntariado: "Voluntariado",
  doacoes: "Doações",
  sobre_projeto: "Sobre o projeto",
};

const preferredCategoryOrder = ["voluntariado", "doacoes", "sobre_projeto"];

function groupFaq(items: FaqItem[]) {
  return items.reduce<Record<string, FaqItem[]>>((acc, item) => {
    const category = item.categoria || "sobre_projeto";
    acc[category] = [...(acc[category] || []), item];
    return acc;
  }, {});
}

function sortCategories(categories: string[]) {
  return [...categories].sort((first, second) => {
    const firstIndex = preferredCategoryOrder.indexOf(first);
    const secondIndex = preferredCategoryOrder.indexOf(second);

    if (firstIndex >= 0 && secondIndex >= 0) {
      return firstIndex - secondIndex;
    }

    if (firstIndex >= 0) {
      return -1;
    }

    if (secondIndex >= 0) {
      return 1;
    }

    return first.localeCompare(second, "pt-BR");
  });
}

function labelForCategory(category: string) {
  return categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

export function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [faqByCategory, setFaqByCategory] = useState<Record<string, FaqItem[]>>({});
  const [activeCategory, setActiveCategory] = useState("");
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getFaq()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const grouped = groupFaq(response.data);
        const categories = sortCategories(Object.keys(grouped));

        setFaqByCategory(grouped);
        setActiveCategory(categories[0] || "");
        setHasLoadError(false);
      })
      .catch(() => {
        if (isMounted) {
          setHasLoadError(true);
          setFaqByCategory({});
          setActiveCategory("");
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

  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const categories = useMemo(() => sortCategories(Object.keys(faqByCategory)), [faqByCategory]);
  const filteredQuestions = useMemo(
    () =>
      (faqByCategory[activeCategory] || []).filter(
        (item) =>
          item.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.resposta.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [activeCategory, faqByCategory, searchTerm]
  );
  const hasPublishedFaq = categories.length > 0;

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-3xl font-extrabold text-gray-900 md:text-4xl">DÚVIDAS FREQUENTES</h1>
          <p className="text-lg text-gray-600">
            Encontre aqui respostas para perguntas mais comuns sobre
            voluntariado, doações e nosso trabalho
          </p>
          {isLoading && (
            <p className="mt-3 text-sm text-gray-500">Carregando perguntas...</p>
          )}
          {hasLoadError && (
            <p className="mt-3 text-sm text-red-600">
              Não foi possível carregar as perguntas frequentes agora.
            </p>
          )}
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar dúvidas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#89CFF0]"
            />
          </div>
        </div>

        {hasPublishedFaq && (
          <div className="flex gap-4 mb-8 flex-wrap justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={
                  "px-6 py-2 rounded-full border-2 transition-all " +
                  (activeCategory === category
                    ? "bg-[#89CFF0] border-[#89CFF0] text-black"
                    : "bg-white border-gray-300 text-gray-700 hover:border-[#89CFF0]")
                }
              >
                {labelForCategory(category)}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? null : !hasLoadError && !hasPublishedFaq ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma pergunta publicada no momento.</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma pergunta encontrada com esses termos.</p>
            </div>
          ) : (
            filteredQuestions.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(item.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="pr-4 text-base font-bold text-gray-900">{item.pergunta}</span>
                  {openQuestions.includes(item.id) ? (
                    <ChevronUp size={24} className="flex-shrink-0 text-[#89CFF0]" />
                  ) : (
                    <ChevronDown size={24} className="flex-shrink-0 text-[#89CFF0]" />
                  )}
                </button>
                {openQuestions.includes(item.id) && (
                  <div className="px-6 py-4 bg-[#E0F4FF] border-t-2 border-gray-200">
                    <p className="text-gray-700">{item.resposta}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-12 bg-white border-2 border-[#89CFF0] rounded-lg p-8 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-gray-900 md:text-4xl">Ainda tem dúvidas?</h2>
          <p className="text-gray-600 mb-6">
            Fique à vontade para entrar em contato conosco através do WhatsApp
            ou e-mail!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={env.contactWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-6 py-3 rounded-full hover:bg-[#20BA5A] transition-colors"
            >
              Falar no WhatsApp
            </a>
            <a
              href={"mailto:" + env.contactEmail}
              className="bg-[#89CFF0] text-black px-6 py-3 rounded-full hover:bg-[#6FBEE0] transition-colors"
            >
              Enviar E-mail
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
