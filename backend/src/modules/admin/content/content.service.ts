import { AppError } from '../../../utils/AppError.js';
import {
  countContent,
  createAdminLog,
  createContent,
  deleteContent,
  findContentByKey,
  listContent,
  sequelize,
  updateContent,
  type ContentType,
} from './content.repository.js';

const CONTENT_TYPES: ContentType[] = ['texto', 'html', 'imagem', 'url', 'json'];

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ListContentQuery = {
  tipo?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
};

type ContentPayload = {
  chave?: unknown;
  valor?: unknown;
  tipo?: unknown;
  descricao?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function parseContentType(value: unknown): ContentType | undefined {
  if (!value) {
    return undefined;
  }

  const type = String(value).trim().toLowerCase() as ContentType;

  if (!CONTENT_TYPES.includes(type)) {
    throw new AppError('Tipo de conteúdo inválido.', 422, 'INVALID_CONTENT_TYPE');
  }

  return type;
}

function normalizeDescription(value: unknown): string | null {
  const description = String(value || '').trim();

  if (!description) {
    return null;
  }

  if (description.length > 300) {
    throw new AppError('A descrição deve ter no máximo 300 caracteres.', 422, 'INVALID_DESCRIPTION');
  }

  return description;
}

function normalizeContentKey(value: unknown): string {
  const key = String(value || '').trim();

  if (!/^[a-z0-9_.-]{2,100}$/.test(key)) {
    throw new AppError(
      'A chave deve ter 2 a 100 caracteres e usar letras minúsculas, números, ponto, hífen ou underline.',
      422,
      'INVALID_CONTENT_KEY',
    );
  }

  return key;
}

function normalizeContentPayload(payload: ContentPayload, adminId: string, existingKey?: string) {
  const chave = existingKey || normalizeContentKey(payload.chave);
  const valor = String(payload.valor ?? '');

  if (!valor.trim()) {
    throw new AppError('Informe o valor do conteúdo.', 422, 'INVALID_CONTENT_VALUE');
  }

  if (valor.length > 20000) {
    throw new AppError('O valor deve ter no máximo 20000 caracteres.', 422, 'INVALID_CONTENT_VALUE');
  }

  const tipo = parseContentType(payload.tipo) || 'texto';

  if (tipo === 'json') {
    try {
      JSON.parse(valor);
    } catch {
      throw new AppError('Conteúdo JSON inválido.', 422, 'INVALID_JSON_CONTENT');
    }
  }

  if (tipo === 'url') {
    try {
      new URL(valor);
    } catch {
      throw new AppError('Informe uma URL válida.', 422, 'INVALID_URL_CONTENT');
    }
  }

  return {
    chave,
    valor,
    tipo,
    descricao: normalizeDescription(payload.descricao),
    adminId,
  };
}

export async function listAdminContent(query: ListContentQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 50, 100);
  const filters = {
    tipo: parseContentType(query.tipo),
    q: normalizeSearch(query.q),
  };
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listContent({ ...filters, limit, offset }),
    countContent(filters),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminContent(chave: string) {
  const item = await findContentByKey(normalizeContentKey(chave));

  if (!item) {
    throw new AppError('Conteúdo não encontrado.', 404, 'CONTENT_NOT_FOUND');
  }

  return item;
}

export async function createAdminContent(payload: ContentPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeContentPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    if (await findContentByKey(input.chave, transaction)) {
      throw new AppError('Já existe conteúdo com esta chave.', 409, 'CONTENT_KEY_EXISTS');
    }

    const created = await createContent(input, transaction);

    await createAdminLog(
      {
        adminId,
        action: 'conteudo.criar',
        entity: 'conteudo',
        entityId: created.id,
        detail: { chave: created.chave, tipo: created.tipo },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return { data: created, message: 'Conteúdo criado.' };
  });
}

export async function updateAdminContent(chaveParam: string, payload: ContentPayload, adminId: string, meta: RequestMeta) {
  const chave = normalizeContentKey(chaveParam);
  const input = normalizeContentPayload(payload, adminId, chave);

  return sequelize.transaction(async (transaction) => {
    const current = await findContentByKey(chave, transaction);

    if (!current) {
      throw new AppError('Conteúdo não encontrado.', 404, 'CONTENT_NOT_FOUND');
    }

    const updated = await updateContent(chave, input, transaction);

    if (!updated) {
      throw new AppError('Conteúdo não encontrado.', 404, 'CONTENT_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'conteudo.editar',
        entity: 'conteudo',
        entityId: updated.id,
        detail: { chave, previousTipo: current.tipo, tipo: updated.tipo },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return { data: updated, message: 'Conteúdo atualizado.' };
  });
}

export async function deleteAdminContent(chaveParam: string, adminId: string, meta: RequestMeta) {
  const chave = normalizeContentKey(chaveParam);

  return sequelize.transaction(async (transaction) => {
    const current = await findContentByKey(chave, transaction);

    if (!current) {
      throw new AppError('Conteúdo não encontrado.', 404, 'CONTENT_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'conteudo.excluir',
        entity: 'conteudo',
        entityId: current.id,
        detail: { chave: current.chave, tipo: current.tipo },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    await deleteContent(chave, transaction);

    return { message: 'Conteúdo excluído.' };
  });
}
