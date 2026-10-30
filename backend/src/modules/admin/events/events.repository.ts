import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type EventType = 'fixo_semanal' | 'especial' | 'avulso';

export type AdminEventRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: EventType;
  data_inicio: Date;
  data_fim: Date | null;
  local: string | null;
  imagem_url: string | null;
  recorrente: boolean;
  dia_semana: number | null;
  publico: boolean;
  publicado: boolean;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
  confirmados: string;
  presentes: string;
  ausentes: string;
  cancelados: string;
};

export type EventFilters = {
  tipo?: EventType;
  publico?: boolean;
  publicado?: boolean;
  q?: string;
  start?: string;
  end?: string;
  limit: number;
  offset: number;
};

export type EventInput = {
  titulo: string;
  descricao: string | null;
  tipo: EventType;
  dataInicio: string;
  dataFim: string | null;
  local: string | null;
  imagemUrl: string | null;
  recorrente: boolean;
  diaSemana: number | null;
  publico: boolean;
  publicado: boolean;
  adminId: string;
};

function buildWhere(filters: Pick<EventFilters, 'tipo' | 'publico' | 'publicado' | 'q' | 'start' | 'end'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.tipo) {
    where.push('e.tipo = :tipo');
    replacements.tipo = filters.tipo;
  }

  if (typeof filters.publico === 'boolean') {
    where.push('e.publico = :publico');
    replacements.publico = filters.publico;
  }

  if (typeof filters.publicado === 'boolean') {
    where.push('e.publicado = :publicado');
    replacements.publicado = filters.publicado;
  }

  if (filters.q) {
    where.push('(e.titulo ILIKE :q OR e.descricao ILIKE :q OR e.local ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  if (filters.start) {
    where.push('e.data_inicio >= :start');
    replacements.start = filters.start;
  }

  if (filters.end) {
    where.push('e.data_inicio <= :end');
    replacements.end = filters.end;
  }

  return { whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '', replacements };
}

const selectAdminEventsSql = `
  SELECT
    e.id, e.titulo, e.descricao, e.tipo, e.data_inicio, e.data_fim, e.local, e.imagem_url,
    e.recorrente, e.dia_semana, e.publico, e.publicado, e.admin_id, e.criado_em, e.atualizado_em,
    COUNT(ep.id) FILTER (WHERE ep.status = 'confirmado')::text AS confirmados,
    COUNT(ep.id) FILTER (WHERE ep.status = 'presente')::text AS presentes,
    COUNT(ep.id) FILTER (WHERE ep.status = 'ausente')::text AS ausentes,
    COUNT(ep.id) FILTER (WHERE ep.status = 'cancelado')::text AS cancelados
  FROM eventos e
  LEFT JOIN evento_presencas ep ON ep.evento_id = e.id
`;

export async function listEvents(filters: EventFilters): Promise<AdminEventRow[]> {
  const { whereClause, replacements } = buildWhere(filters);

  return sequelize.query<AdminEventRow>(
    `
      ${selectAdminEventsSql}
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.data_inicio ASC, e.criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    { replacements: { ...replacements, limit: filters.limit, offset: filters.offset }, type: QueryTypes.SELECT },
  );
}

export async function countEvents(filters: Pick<EventFilters, 'tipo' | 'publico' | 'publicado' | 'q' | 'start' | 'end'>): Promise<number> {
  const { whereClause, replacements } = buildWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM eventos e ${whereClause};`,
    { replacements, type: QueryTypes.SELECT },
  );

  return Number(row?.total || 0);
}

export async function findEventById(id: string, transaction?: Transaction): Promise<AdminEventRow | null> {
  const [row] = await sequelize.query<AdminEventRow>(
    `
      ${selectAdminEventsSql}
      WHERE e.id = :id
      GROUP BY e.id
      LIMIT 1;
    `,
    { replacements: { id }, type: QueryTypes.SELECT, transaction },
  );

  return row || null;
}

export async function createEvent(input: EventInput, transaction: Transaction): Promise<AdminEventRow> {
  const [row] = await sequelize.query<AdminEventRow>(
    `
      INSERT INTO eventos (titulo, descricao, tipo, data_inicio, data_fim, local, imagem_url, recorrente, dia_semana, publico, publicado, admin_id)
      VALUES (:titulo, :descricao, :tipo, :dataInicio, :dataFim, :local, :imagemUrl, :recorrente, :diaSemana, :publico, :publicado, :adminId)
      RETURNING id, titulo, descricao, tipo, data_inicio, data_fim, local, imagem_url, recorrente, dia_semana, publico, publicado, admin_id, criado_em, atualizado_em,
        '0'::text AS confirmados, '0'::text AS presentes, '0'::text AS ausentes, '0'::text AS cancelados;
    `,
    { replacements: input, type: QueryTypes.SELECT, transaction },
  );

  if (!row) throw new Error('Falha ao criar evento.');
  return row;
}

export async function updateEvent(id: string, input: EventInput, transaction: Transaction): Promise<AdminEventRow | null> {
  const [row] = await sequelize.query<AdminEventRow>(
    `
      UPDATE eventos
      SET titulo = :titulo,
          descricao = :descricao,
          tipo = :tipo,
          data_inicio = :dataInicio,
          data_fim = :dataFim,
          local = :local,
          imagem_url = :imagemUrl,
          recorrente = :recorrente,
          dia_semana = :diaSemana,
          publico = :publico,
          publicado = :publicado,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, titulo, descricao, tipo, data_inicio, data_fim, local, imagem_url, recorrente, dia_semana, publico, publicado, admin_id, criado_em, atualizado_em,
        '0'::text AS confirmados, '0'::text AS presentes, '0'::text AS ausentes, '0'::text AS cancelados;
    `,
    { replacements: { id, ...input }, type: QueryTypes.SELECT, transaction },
  );

  return row || null;
}

export async function deleteEvent(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query('DELETE FROM eventos WHERE id = :id;', { replacements: { id }, transaction });
}

export async function listEventAttendances(eventId: string) {
  return sequelize.query<{ id: string; voluntario_id: string; voluntario_nome: string; voluntario_email: string; status: string; observacao: string | null; atualizado_em: Date }>(
    `
      SELECT ep.id, ep.voluntario_id, v.nome AS voluntario_nome, v.email AS voluntario_email, ep.status, ep.observacao, ep.atualizado_em
      FROM evento_presencas ep
      JOIN voluntarios v ON v.id = ep.voluntario_id
      WHERE ep.evento_id = :eventId
      ORDER BY ep.atualizado_em DESC;
    `,
    { replacements: { eventId }, type: QueryTypes.SELECT },
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
