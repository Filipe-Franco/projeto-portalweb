import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type MaterialType = 'documento' | 'imagem' | 'video' | 'link' | 'outro';

export type AdminMaterialRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: MaterialType;
  arquivo_url: string | null;
  link_externo: string | null;
  tamanho_bytes: string | null;
  publicado: boolean;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

export type MaterialFilters = {
  tipo?: MaterialType;
  publicado?: boolean;
  q?: string;
  limit: number;
  offset: number;
};

export type MaterialInput = {
  titulo: string;
  descricao: string | null;
  tipo: MaterialType;
  arquivoUrl: string | null;
  linkExterno: string | null;
  tamanhoBytes: number | null;
  publicado: boolean;
  adminId: string;
};

function buildWhere(filters: Pick<MaterialFilters, 'tipo' | 'publicado' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.tipo) {
    where.push('tipo = :tipo');
    replacements.tipo = filters.tipo;
  }

  if (typeof filters.publicado === 'boolean') {
    where.push('publicado = :publicado');
    replacements.publicado = filters.publicado;
  }

  if (filters.q) {
    where.push('(titulo ILIKE :q OR descricao ILIKE :q OR arquivo_url ILIKE :q OR link_externo ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return { whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '', replacements };
}

export async function listMaterials(filters: MaterialFilters): Promise<AdminMaterialRow[]> {
  const { whereClause, replacements } = buildWhere(filters);
  return sequelize.query<AdminMaterialRow>(
    `
      SELECT id, titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes::text, publicado, admin_id, criado_em, atualizado_em
      FROM materiais
      ${whereClause}
      ORDER BY publicado DESC, atualizado_em DESC, criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    { replacements: { ...replacements, limit: filters.limit, offset: filters.offset }, type: QueryTypes.SELECT },
  );
}

export async function countMaterials(filters: Pick<MaterialFilters, 'tipo' | 'publicado' | 'q'>): Promise<number> {
  const { whereClause, replacements } = buildWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM materiais ${whereClause};`,
    { replacements, type: QueryTypes.SELECT },
  );
  return Number(row?.total || 0);
}

export async function findMaterialById(id: string, transaction?: Transaction): Promise<AdminMaterialRow | null> {
  const [row] = await sequelize.query<AdminMaterialRow>(
    `
      SELECT id, titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes::text, publicado, admin_id, criado_em, atualizado_em
      FROM materiais
      WHERE id = :id
      LIMIT 1;
    `,
    { replacements: { id }, type: QueryTypes.SELECT, transaction },
  );
  return row || null;
}

export async function createMaterial(input: MaterialInput, transaction: Transaction): Promise<AdminMaterialRow> {
  const [row] = await sequelize.query<AdminMaterialRow>(
    `
      INSERT INTO materiais (titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes, publicado, admin_id)
      VALUES (:titulo, :descricao, :tipo, :arquivoUrl, :linkExterno, :tamanhoBytes, :publicado, :adminId)
      RETURNING id, titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes::text, publicado, admin_id, criado_em, atualizado_em;
    `,
    { replacements: input, type: QueryTypes.SELECT, transaction },
  );
  if (!row) throw new Error('Falha ao criar material.');
  return row;
}

export async function updateMaterial(id: string, input: MaterialInput, transaction: Transaction): Promise<AdminMaterialRow | null> {
  const [row] = await sequelize.query<AdminMaterialRow>(
    `
      UPDATE materiais
      SET titulo = :titulo,
          descricao = :descricao,
          tipo = :tipo,
          arquivo_url = :arquivoUrl,
          link_externo = :linkExterno,
          tamanho_bytes = :tamanhoBytes,
          publicado = :publicado,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes::text, publicado, admin_id, criado_em, atualizado_em;
    `,
    { replacements: { id, ...input }, type: QueryTypes.SELECT, transaction },
  );
  return row || null;
}

export async function deleteMaterial(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query('DELETE FROM materiais WHERE id = :id;', { replacements: { id }, transaction });
}

export async function createAdminLog(payload: { adminId: string; action: string; entity: string; entityId: string; detail?: Record<string, unknown>; ip?: string | null; userAgent?: string | null }, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `INSERT INTO logs_admin (admin_id, acao, entidade, entidade_id, detalhe, ip, user_agent)
     VALUES (:adminId, :action, :entity, :entityId, :detail, :ip, :userAgent);`,
    { replacements: { adminId: payload.adminId, action: payload.action, entity: payload.entity, entityId: payload.entityId, detail: payload.detail ? JSON.stringify(payload.detail) : null, ip: payload.ip || null, userAgent: payload.userAgent || null }, transaction },
  );
}

export { sequelize };
