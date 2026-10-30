import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type FaqCategory = 'voluntariado' | 'doacoes' | 'sobre_projeto';

export type AdminFaqRow = {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: FaqCategory;
  ordem: number;
  publicado: boolean;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

export type FaqListFilters = {
  categoria?: FaqCategory;
  publicado?: boolean;
  q?: string;
  limit: number;
  offset: number;
};

export type FaqInput = {
  pergunta: string;
  resposta: string;
  categoria: FaqCategory;
  ordem: number;
  publicado: boolean;
  adminId: string;
};

export async function listFaq(filters: FaqListFilters): Promise<AdminFaqRow[]> {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {
    limit: filters.limit,
    offset: filters.offset,
  };

  if (filters.categoria) {
    where.push('categoria = :categoria');
    replacements.categoria = filters.categoria;
  }

  if (typeof filters.publicado === 'boolean') {
    where.push('publicado = :publicado');
    replacements.publicado = filters.publicado;
  }

  if (filters.q) {
    where.push('(pergunta ILIKE :q OR resposta ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  return sequelize.query<AdminFaqRow>(
    `
      SELECT id, pergunta, resposta, categoria, ordem, publicado, admin_id, criado_em, atualizado_em
      FROM faq
      ${whereClause}
      ORDER BY ordem ASC, criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );
}

export async function countFaq(filters: Pick<FaqListFilters, 'categoria' | 'publicado' | 'q'>): Promise<number> {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.categoria) {
    where.push('categoria = :categoria');
    replacements.categoria = filters.categoria;
  }

  if (typeof filters.publicado === 'boolean') {
    where.push('publicado = :publicado');
    replacements.publicado = filters.publicado;
  }

  if (filters.q) {
    where.push('(pergunta ILIKE :q OR resposta ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM faq
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function findFaqById(id: string, transaction?: Transaction): Promise<AdminFaqRow | null> {
  const [row] = await sequelize.query<AdminFaqRow>(
    `
      SELECT id, pergunta, resposta, categoria, ordem, publicado, admin_id, criado_em, atualizado_em
      FROM faq
      WHERE id = :id
      LIMIT 1;
    `,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function createFaq(input: FaqInput, transaction: Transaction): Promise<AdminFaqRow> {
  const [row] = await sequelize.query<AdminFaqRow>(
    `
      INSERT INTO faq (pergunta, resposta, categoria, ordem, publicado, admin_id)
      VALUES (:pergunta, :resposta, :categoria, :ordem, :publicado, :adminId)
      RETURNING id, pergunta, resposta, categoria, ordem, publicado, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: input,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar pergunta frequente.');
  }

  return row;
}

export async function updateFaq(id: string, input: FaqInput, transaction: Transaction): Promise<AdminFaqRow | null> {
  const [row] = await sequelize.query<AdminFaqRow>(
    `
      UPDATE faq
      SET pergunta = :pergunta,
          resposta = :resposta,
          categoria = :categoria,
          ordem = :ordem,
          publicado = :publicado,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, pergunta, resposta, categoria, ordem, publicado, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: { id, ...input },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function deleteFaq(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM faq
      WHERE id = :id;
    `,
    {
      replacements: { id },
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
