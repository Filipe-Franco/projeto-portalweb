import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type AdminAnnouncementRow = {
  id: string;
  titulo: string;
  corpo: string;
  fixado: boolean;
  publicado: boolean;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
  leituras: string;
};

export type AnnouncementFilters = {
  fixado?: boolean;
  publicado?: boolean;
  q?: string;
  limit: number;
  offset: number;
};

export type AnnouncementInput = {
  titulo: string;
  corpo: string;
  fixado: boolean;
  publicado: boolean;
  adminId: string;
};

function buildWhere(filters: Pick<AnnouncementFilters, 'fixado' | 'publicado' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (typeof filters.fixado === 'boolean') {
    where.push('c.fixado = :fixado');
    replacements.fixado = filters.fixado;
  }

  if (typeof filters.publicado === 'boolean') {
    where.push('c.publicado = :publicado');
    replacements.publicado = filters.publicado;
  }

  if (filters.q) {
    where.push('(c.titulo ILIKE :q OR c.corpo ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return { whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '', replacements };
}

const selectSql = `
  SELECT c.id, c.titulo, c.corpo, c.fixado, c.publicado, c.admin_id, c.criado_em, c.atualizado_em,
    COUNT(cl.voluntario_id)::text AS leituras
  FROM comunicados c
  LEFT JOIN comunicado_leituras cl ON cl.comunicado_id = c.id
`;

export async function listAnnouncements(filters: AnnouncementFilters): Promise<AdminAnnouncementRow[]> {
  const { whereClause, replacements } = buildWhere(filters);
  return sequelize.query<AdminAnnouncementRow>(
    `
      ${selectSql}
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.fixado DESC, c.criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    { replacements: { ...replacements, limit: filters.limit, offset: filters.offset }, type: QueryTypes.SELECT },
  );
}

export async function countAnnouncements(filters: Pick<AnnouncementFilters, 'fixado' | 'publicado' | 'q'>): Promise<number> {
  const { whereClause, replacements } = buildWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(`SELECT COUNT(*) AS total FROM comunicados c ${whereClause};`, { replacements, type: QueryTypes.SELECT });
  return Number(row?.total || 0);
}

export async function findAnnouncementById(id: string, transaction?: Transaction): Promise<AdminAnnouncementRow | null> {
  const [row] = await sequelize.query<AdminAnnouncementRow>(
    `
      ${selectSql}
      WHERE c.id = :id
      GROUP BY c.id
      LIMIT 1;
    `,
    { replacements: { id }, type: QueryTypes.SELECT, transaction },
  );
  return row || null;
}

export async function createAnnouncement(input: AnnouncementInput, transaction: Transaction): Promise<AdminAnnouncementRow> {
  const [row] = await sequelize.query<AdminAnnouncementRow>(
    `
      INSERT INTO comunicados (titulo, corpo, fixado, publicado, admin_id)
      VALUES (:titulo, :corpo, :fixado, :publicado, :adminId)
      RETURNING id, titulo, corpo, fixado, publicado, admin_id, criado_em, atualizado_em, '0'::text AS leituras;
    `,
    { replacements: input, type: QueryTypes.SELECT, transaction },
  );
  if (!row) throw new Error('Falha ao criar comunicado.');
  return row;
}

export async function updateAnnouncement(id: string, input: AnnouncementInput, transaction: Transaction): Promise<AdminAnnouncementRow | null> {
  const [row] = await sequelize.query<AdminAnnouncementRow>(
    `
      UPDATE comunicados
      SET titulo = :titulo,
          corpo = :corpo,
          fixado = :fixado,
          publicado = :publicado,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, titulo, corpo, fixado, publicado, admin_id, criado_em, atualizado_em, '0'::text AS leituras;
    `,
    { replacements: { id, ...input }, type: QueryTypes.SELECT, transaction },
  );
  return row || null;
}

export async function deleteAnnouncement(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query('DELETE FROM comunicados WHERE id = :id;', { replacements: { id }, transaction });
}

export async function listAnnouncementReadings(id: string) {
  return sequelize.query<{ voluntario_id: string; voluntario_nome: string; voluntario_email: string; lido_em: Date }>(
    `
      SELECT cl.voluntario_id, v.nome AS voluntario_nome, v.email AS voluntario_email, cl.lido_em
      FROM comunicado_leituras cl
      JOIN voluntarios v ON v.id = cl.voluntario_id
      WHERE cl.comunicado_id = :id
      ORDER BY cl.lido_em DESC;
    `,
    { replacements: { id }, type: QueryTypes.SELECT },
  );
}

export async function createAdminLog(payload: { adminId: string; action: string; entity: string; entityId: string; detail?: Record<string, unknown>; ip?: string | null; userAgent?: string | null }, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `INSERT INTO logs_admin (admin_id, acao, entidade, entidade_id, detalhe, ip, user_agent)
     VALUES (:adminId, :action, :entity, :entityId, :detail, :ip, :userAgent);`,
    { replacements: { adminId: payload.adminId, action: payload.action, entity: payload.entity, entityId: payload.entityId, detail: payload.detail ? JSON.stringify(payload.detail) : null, ip: payload.ip || null, userAgent: payload.userAgent || null }, transaction },
  );
}

export { sequelize };
