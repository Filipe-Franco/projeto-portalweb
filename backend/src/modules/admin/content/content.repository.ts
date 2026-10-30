import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type ContentType = 'texto' | 'html' | 'imagem' | 'url' | 'json';

export type AdminContentRow = {
  id: string;
  chave: string;
  valor: string;
  tipo: ContentType;
  descricao: string | null;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

export type ContentFilters = {
  tipo?: ContentType;
  q?: string;
  limit: number;
  offset: number;
};

export type ContentInput = {
  chave: string;
  valor: string;
  tipo: ContentType;
  descricao: string | null;
  adminId: string;
};

function buildWhere(filters: Pick<ContentFilters, 'tipo' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.tipo) {
    where.push('tipo = :tipo');
    replacements.tipo = filters.tipo;
  }

  if (filters.q) {
    where.push('(chave ILIKE :q OR valor ILIKE :q OR descricao ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return {
    whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '',
    replacements,
  };
}

export async function listContent(filters: ContentFilters): Promise<AdminContentRow[]> {
  const { whereClause, replacements } = buildWhere(filters);

  return sequelize.query<AdminContentRow>(
    `
      SELECT id, chave, valor, tipo, descricao, admin_id, criado_em, atualizado_em
      FROM conteudo
      ${whereClause}
      ORDER BY chave ASC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements: { ...replacements, limit: filters.limit, offset: filters.offset },
      type: QueryTypes.SELECT,
    },
  );
}

export async function countContent(filters: Pick<ContentFilters, 'tipo' | 'q'>): Promise<number> {
  const { whereClause, replacements } = buildWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM conteudo
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function findContentByKey(chave: string, transaction?: Transaction): Promise<AdminContentRow | null> {
  const [row] = await sequelize.query<AdminContentRow>(
    `
      SELECT id, chave, valor, tipo, descricao, admin_id, criado_em, atualizado_em
      FROM conteudo
      WHERE chave = :chave
      LIMIT 1;
    `,
    {
      replacements: { chave },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function createContent(input: ContentInput, transaction: Transaction): Promise<AdminContentRow> {
  const [row] = await sequelize.query<AdminContentRow>(
    `
      INSERT INTO conteudo (chave, valor, tipo, descricao, admin_id)
      VALUES (:chave, :valor, :tipo, :descricao, :adminId)
      RETURNING id, chave, valor, tipo, descricao, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: input,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar conteúdo.');
  }

  return row;
}

export async function updateContent(chave: string, input: ContentInput, transaction: Transaction): Promise<AdminContentRow | null> {
  const [row] = await sequelize.query<AdminContentRow>(
    `
      UPDATE conteudo
      SET valor = :valor,
          tipo = :tipo,
          descricao = :descricao,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE chave = :chave
      RETURNING id, chave, valor, tipo, descricao, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: { ...input, chave },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function deleteContent(chave: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM conteudo
      WHERE chave = :chave;
    `,
    {
      replacements: { chave },
      transaction,
    },
  );
}

export async function createAdminLog(
  payload: {
    adminId: string;
    action: string;
    entity: string;
    entityId: string;
    detail?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
  },
  transaction: Transaction,
): Promise<void> {
  await sequelize.query(
    `
      INSERT INTO logs_admin (admin_id, acao, entidade, entidade_id, detalhe, ip, user_agent)
      VALUES (:adminId, :action, :entity, :entityId, :detail, :ip, :userAgent);
    `,
    {
      replacements: {
        adminId: payload.adminId,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        detail: payload.detail ? JSON.stringify(payload.detail) : null,
        ip: payload.ip || null,
        userAgent: payload.userAgent || null,
      },
      transaction,
    },
  );
}

export { sequelize };
