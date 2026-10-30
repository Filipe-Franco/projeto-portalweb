import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type AdminTeamRow = {
  id: string;
  nome: string;
  cargo: string | null;
  bio: string | null;
  foto_url: string | null;
  ordem: number;
  ativo: boolean;
  exibir_portal: boolean;
  admin_id: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

export type TeamFilters = {
  ativo?: boolean;
  q?: string;
  limit: number;
  offset: number;
};

export type TeamInput = {
  nome: string;
  cargo: string | null;
  bio: string | null;
  fotoUrl: string | null;
  ordem: number;
  ativo: boolean;
  exibirPortal: boolean;
  adminId: string;
};

function buildWhere(filters: Pick<TeamFilters, 'ativo' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (typeof filters.ativo === 'boolean') {
    where.push('ativo = :ativo');
    replacements.ativo = filters.ativo;
  }

  if (filters.q) {
    where.push('(nome ILIKE :q OR cargo ILIKE :q OR bio ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return {
    whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '',
    replacements,
  };
}

export async function listTeam(filters: TeamFilters): Promise<AdminTeamRow[]> {
  const { whereClause, replacements } = buildWhere(filters);

  return sequelize.query<AdminTeamRow>(
    `
      SELECT id, nome, cargo, bio, foto_url, ordem, ativo, exibir_portal, admin_id, criado_em, atualizado_em
      FROM equipe
      ${whereClause}
      ORDER BY ativo DESC, ordem ASC, nome ASC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements: { ...replacements, limit: filters.limit, offset: filters.offset },
      type: QueryTypes.SELECT,
    },
  );
}

export async function countTeam(filters: Pick<TeamFilters, 'ativo' | 'q'>): Promise<number> {
  const { whereClause, replacements } = buildWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM equipe
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function findTeamById(id: string, transaction?: Transaction): Promise<AdminTeamRow | null> {
  const [row] = await sequelize.query<AdminTeamRow>(
    `
      SELECT id, nome, cargo, bio, foto_url, ordem, ativo, exibir_portal, admin_id, criado_em, atualizado_em
      FROM equipe
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


export async function countPortalCoordinationMembers(excludeId?: string, transaction?: Transaction): Promise<number> {
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM equipe
      WHERE ativo = TRUE
        AND exibir_portal = TRUE
        AND (:excludeId::uuid IS NULL OR id <> :excludeId::uuid);
    `,
    {
      replacements: { excludeId: excludeId || null },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return Number(row?.total || 0);
}

export async function createTeam(input: TeamInput, transaction: Transaction): Promise<AdminTeamRow> {
  const [row] = await sequelize.query<AdminTeamRow>(
    `
      INSERT INTO equipe (nome, cargo, bio, foto_url, ordem, ativo, exibir_portal, admin_id)
      VALUES (:nome, :cargo, :bio, :fotoUrl, :ordem, :ativo, :exibirPortal, :adminId)
      RETURNING id, nome, cargo, bio, foto_url, ordem, ativo, exibir_portal, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: input,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar membro da equipe.');
  }

  return row;
}

export async function updateTeam(id: string, input: TeamInput, transaction: Transaction): Promise<AdminTeamRow | null> {
  const [row] = await sequelize.query<AdminTeamRow>(
    `
      UPDATE equipe
      SET nome = :nome,
          cargo = :cargo,
          bio = :bio,
          foto_url = :fotoUrl,
          ordem = :ordem,
          ativo = :ativo,
          exibir_portal = :exibirPortal,
          admin_id = :adminId,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, nome, cargo, bio, foto_url, ordem, ativo, exibir_portal, admin_id, criado_em, atualizado_em;
    `,
    {
      replacements: { id, ...input },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function deleteTeam(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM equipe
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
