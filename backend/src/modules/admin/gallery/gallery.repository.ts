import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type GalleryStatus = 'pendente' | 'aprovada' | 'rejeitada';

export type AdminGalleryRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string;
  imagem_thumb: string | null;
  data_acao: Date | null;
  status: GalleryStatus;
  privacidade_ok: boolean;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

export type GalleryFilters = {
  status?: GalleryStatus;
  privacidadeOk?: boolean;
  q?: string;
  limit: number;
  offset: number;
};

export type GalleryInput = {
  titulo: string;
  descricao: string | null;
  imagemUrl: string;
  imagemThumb: string | null;
  dataAcao: string | null;
  status: GalleryStatus;
  privacidadeOk: boolean;
  adminId: string;
};

function buildWhere(filters: Pick<GalleryFilters, 'status' | 'privacidadeOk' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.status) {
    where.push('status = :status');
    replacements.status = filters.status;
  }

  if (typeof filters.privacidadeOk === 'boolean') {
    where.push('privacidade_ok = :privacidadeOk');
    replacements.privacidadeOk = filters.privacidadeOk;
  }

  if (filters.q) {
    where.push('(titulo ILIKE :q OR descricao ILIKE :q OR imagem_url ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return {
    whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '',
    replacements,
  };
}

export async function listGallery(filters: GalleryFilters): Promise<AdminGalleryRow[]> {
  const { whereClause, replacements } = buildWhere(filters);

  return sequelize.query<AdminGalleryRow>(
    `
      SELECT id, titulo, descricao, imagem_url, imagem_thumb, data_acao, status,
             privacidade_ok, admin_id, criado_em, atualizado_em
      FROM galeria
      ${whereClause}
      ORDER BY data_acao DESC NULLS LAST, criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements: { ...replacements, limit: filters.limit, offset: filters.offset },
      type: QueryTypes.SELECT,
    },
  );
}

export async function countGallery(filters: Pick<GalleryFilters, 'status' | 'privacidadeOk' | 'q'>): Promise<number> {
  const { whereClause, replacements } = buildWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM galeria
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function findGalleryById(id: string, transaction?: Transaction): Promise<AdminGalleryRow | null> {
  const [row] = await sequelize.query<AdminGalleryRow>(
    `
      SELECT id, titulo, descricao, imagem_url, imagem_thumb, data_acao, status,
             privacidade_ok, admin_id, criado_em, atualizado_em
      FROM galeria
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

export async function createGallery(input: GalleryInput, transaction: Transaction): Promise<AdminGalleryRow> {
  const [row] = await sequelize.query<AdminGalleryRow>(
    `
      INSERT INTO galeria (
        titulo, descricao, imagem_url, imagem_thumb, data_acao, status, privacidade_ok, admin_id
      )
      VALUES (
        :titulo, :descricao, :imagemUrl, :imagemThumb, :dataAcao, :status, :privacidadeOk, :adminId
      )
      RETURNING id, titulo, descricao, imagem_url, imagem_thumb, data_acao, status,
                privacidade_ok, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: input,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar imagem da galeria.');
  }

  return row;
}

export async function updateGallery(id: string, input: GalleryInput, transaction: Transaction): Promise<AdminGalleryRow | null> {
  const [row] = await sequelize.query<AdminGalleryRow>(
    `
      UPDATE galeria
      SET titulo = :titulo,
          descricao = :descricao,
          imagem_url = :imagemUrl,
          imagem_thumb = :imagemThumb,
          data_acao = :dataAcao,
          status = :status,
          privacidade_ok = :privacidadeOk,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, titulo, descricao, imagem_url, imagem_thumb, data_acao, status,
                privacidade_ok, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: { id, ...input },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function deleteGallery(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM galeria
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
