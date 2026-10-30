import { AppError } from '../../../utils/AppError.js';
import {
  countFaq,
  createAdminLog,
  createFaq,
  deleteFaq,
  findFaqById,
  listFaq,
  sequelize,
  updateFaq,
  type FaqCategory,
} from './faq.repository.js';

const FAQ_CATEGORIES: FaqCategory[] = ['voluntariado', 'doacoes', 'sobre_projeto'];

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ListFaqQuery = {
  categoria?: unknown;
  publicado?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
};

type FaqPayload = {
  pergunta?: unknown;
  resposta?: unknown;
  categoria?: unknown;
  ordem?: unknown;
  publicado?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function parseFaqCategory(value: unknown): FaqCategory | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase() as FaqCategory;

  if (!FAQ_CATEGORIES.includes(normalized)) {
    throw new AppError('Categoria de FAQ inválida.', 422, 'INVALID_FAQ_CATEGORY');
  }

  return normalized;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'sim', 'publicado'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'nao', 'não', 'rascunho'].includes(normalized)) {
    return false;
  }

  throw new AppError('Filtro publicado inválido.', 422, 'INVALID_PUBLISHED_FILTER');
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function normalizeFaqPayload(payload: FaqPayload) {
  const pergunta = String(payload.pergunta || '').trim();
  const resposta = String(payload.resposta || '').trim();
  const categoria = parseFaqCategory(payload.categoria) || 'sobre_projeto';
  const ordem = Number(payload.ordem ?? 0);
  const publicado = typeof payload.publicado === 'boolean' ? payload.publicado : parseBoolean(payload.publicado) ?? true;

  if (!pergunta || pergunta.length < 5) {
    throw new AppError('Informe uma pergunta com pelo menos 5 caracteres.', 422, 'INVALID_QUESTION');
  }

  if (pergunta.length > 1000) {
    throw new AppError('A pergunta deve ter no máximo 1000 caracteres.', 422, 'INVALID_QUESTION');
  }

  if (!resposta || resposta.length < 5) {
    throw new AppError('Informe uma resposta com pelo menos 5 caracteres.', 422, 'INVALID_ANSWER');
  }

  if (resposta.length > 5000) {
    throw new AppError('A resposta deve ter no máximo 5000 caracteres.', 422, 'INVALID_ANSWER');
  }

  if (!Number.isInteger(ordem) || ordem < 0 || ordem > 32767) {
    throw new AppError('A ordem deve ser um inteiro entre 0 e 32767.', 422, 'INVALID_ORDER');
  }

  return {
    pergunta,
    resposta,
    categoria,
    ordem,
    publicado,
  };
}

export async function listAdminFaq(query: ListFaqQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const categoria = parseFaqCategory(query.categoria);
  const publicado = parseBoolean(query.publicado);
  const q = normalizeSearch(query.q);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listFaq({ categoria, publicado, q, limit, offset }),
    countFaq({ categoria, publicado, q }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminFaq(id: string) {
  const faq = await findFaqById(id);

  if (!faq) {
    throw new AppError('Pergunta frequente não encontrada.', 404, 'FAQ_NOT_FOUND');
  }

  return faq;
}

export async function createAdminFaq(payload: FaqPayload, adminId: string, meta: RequestMeta) {
  const faq = normalizeFaqPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const created = await createFaq({ ...faq, adminId }, transaction);

    await createAdminLog(
      {
        adminId,
        action: 'faq.criar',
        entity: 'faq',
        entityId: created.id,
        detail: { categoria: created.categoria, publicado: created.publicado },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      data: created,
      message: 'Pergunta frequente criada.',
    };
  });
}

export async function updateAdminFaq(id: string, payload: FaqPayload, adminId: string, meta: RequestMeta) {
  const faq = normalizeFaqPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const current = await findFaqById(id, transaction);

    if (!current) {
      throw new AppError('Pergunta frequente não encontrada.', 404, 'FAQ_NOT_FOUND');
    }

    const updated = await updateFaq(id, { ...faq, adminId }, transaction);

    if (!updated) {
      throw new AppError('Pergunta frequente não encontrada.', 404, 'FAQ_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'faq.editar',
        entity: 'faq',
        entityId: updated.id,
        detail: {
          previousCategoria: current.categoria,
          previousPublicado: current.publicado,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      data: updated,
      message: 'Pergunta frequente atualizada.',
    };
  });
}

export async function deleteAdminFaq(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findFaqById(id, transaction);

    if (!current) {
      throw new AppError('Pergunta frequente não encontrada.', 404, 'FAQ_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'faq.excluir',
        entity: 'faq',
        entityId: current.id,
        detail: { pergunta: current.pergunta, categoria: current.categoria },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    await deleteFaq(id, transaction);

    return {
      message: 'Pergunta frequente excluída.',
    };
  });
}
