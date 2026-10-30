import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type VolunteerStatus = 'pendente' | 'aprovado' | 'inativo' | 'suspenso' | 'rejeitado';

export type VolunteerAreaRow = {
  id: number;
  nome: string;
};

export type AdminVolunteerRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  mensagem: string | null;
  status: VolunteerStatus;
  tem_senha: boolean;
  ultimo_login: Date | null;
  aprovado_por: string | null;
  aprovado_em: Date | null;
  rejeitado_por: string | null;
  rejeitado_em: Date | null;
  motivo_rejeicao: string | null;
  criado_em: Date;
  atualizado_em: Date;
  areas: VolunteerAreaRow[];
};

export type VolunteerListFilters = {
  status?: VolunteerStatus;
  q?: string;
  limit: number;
  offset: number;
};

type VolunteerQueryRow = Omit<AdminVolunteerRow, 'areas'> & {
  areas: VolunteerAreaRow[] | null;
};

export type AdminVolunteerInput = {
  nome: string;
  email: string;
  telefone: string | null;
  mensagem: string | null;
  status?: VolunteerStatus;
  aprovadoPor?: string | null;
  inviteTokenHash?: string | null;
  inviteTokenExpiresAt?: Date | null;
};

export async function emailExistsForVolunteerAdmin(email: string, transaction: Transaction, ignoreVolunteerId?: string): Promise<boolean> {
  const [row] = await sequelize.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM admins
        WHERE LOWER(email) = LOWER(:email)
        UNION
        SELECT 1
        FROM voluntarios
        WHERE LOWER(email) = LOWER(:email)
          AND (:ignoreVolunteerId::uuid IS NULL OR id <> :ignoreVolunteerId::uuid)
      ) AS exists;
    `,
    {
      replacements: { email, ignoreVolunteerId: ignoreVolunteerId || null },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return Boolean(row?.exists);
}

export async function findActiveInterestAreasByIds(areaIds: number[], transaction: Transaction): Promise<VolunteerAreaRow[]> {
  if (!areaIds.length) {
    return [];
  }

  return sequelize.query<VolunteerAreaRow>(
    `
      SELECT id, nome
      FROM areas_interesse
      WHERE ativo = TRUE
        AND id IN (:areaIds);
    `,
    {
      replacements: { areaIds },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
}

export async function replaceVolunteerAreas(volunteerId: string, areaIds: number[], transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM voluntario_areas
      WHERE voluntario_id = :volunteerId;
    `,
    {
      replacements: { volunteerId },
      transaction,
    },
  );

  if (!areaIds.length) {
    return;
  }

  const replacements: Record<string, unknown> = { volunteerId };
  const values = areaIds.map((areaId, index) => {
    const key = `areaId${index}`;
    replacements[key] = areaId;
    return `(:volunteerId, :${key})`;
  });

  await sequelize.query(
    `
      INSERT INTO voluntario_areas (voluntario_id, area_id)
      VALUES ${values.join(', ')}
      ON CONFLICT (voluntario_id, area_id) DO NOTHING;
    `,
    {
      replacements,
      transaction,
    },
  );
}

export async function createAdminVolunteer(input: AdminVolunteerInput, transaction: Transaction): Promise<AdminVolunteerRow> {
  const [row] = await sequelize.query<VolunteerQueryRow>(
    `
      INSERT INTO voluntarios (
        nome,
        email,
        telefone,
        mensagem,
        status,
        aprovado_por,
        aprovado_em,
        convite_token,
        convite_token_exp
      )
      VALUES (
        :nome,
        :email,
        :telefone,
        :mensagem,
        :status,
        :aprovadoPor,
        CASE WHEN :status = 'aprovado' THEN NOW() ELSE NULL END,
        :inviteTokenHash,
        :inviteTokenExpiresAt
      )
      RETURNING
        id,
        nome,
        email,
        telefone,
        foto_url,
        mensagem,
        status,
        (senha_hash IS NOT NULL) AS tem_senha,
        ultimo_login,
        aprovado_por,
        aprovado_em,
        rejeitado_por,
        rejeitado_em,
        motivo_rejeicao,
        criado_em,
        atualizado_em,
        '[]'::json AS areas;
    `,
    {
      replacements: {
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        mensagem: input.mensagem,
        status: input.status || 'pendente',
        aprovadoPor: input.aprovadoPor || null,
        inviteTokenHash: input.inviteTokenHash || null,
        inviteTokenExpiresAt: input.inviteTokenExpiresAt || null,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar voluntário.');
  }

  return { ...row, areas: [] };
}

export async function updateAdminVolunteer(id: string, input: AdminVolunteerInput, transaction: Transaction): Promise<AdminVolunteerRow | null> {
  const [row] = await sequelize.query<VolunteerQueryRow>(
    `
      UPDATE voluntarios
      SET nome = :nome,
          email = :email,
          telefone = :telefone,
          mensagem = :mensagem,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING
        id,
        nome,
        email,
        telefone,
        foto_url,
        mensagem,
        status,
        (senha_hash IS NOT NULL) AS tem_senha,
        ultimo_login,
        aprovado_por,
        aprovado_em,
        rejeitado_por,
        rejeitado_em,
        motivo_rejeicao,
        criado_em,
        atualizado_em,
        '[]'::json AS areas;
    `,
    {
      replacements: {
        id,
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        mensagem: input.mensagem,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row ? { ...row, areas: [] } : null;
}

export async function listVolunteers(filters: VolunteerListFilters): Promise<AdminVolunteerRow[]> {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {
    limit: filters.limit,
    offset: filters.offset,
  };

  if (filters.status) {
    where.push('v.status = :status');
    replacements.status = filters.status;
  }

  if (filters.q) {
    where.push('(v.nome ILIKE :q OR v.email ILIKE :q OR v.telefone ILIKE :q)');
    replacements.q = `%${filters.q}%`;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await sequelize.query<VolunteerQueryRow>(
    `
      SELECT
        v.id,
        v.nome,
        v.email,
        v.telefone,
        v.foto_url,
        v.mensagem,
        v.status,
        (v.senha_hash IS NOT NULL) AS tem_senha,
        v.ultimo_login,
        v.aprovado_por,
        v.aprovado_em,
        v.rejeitado_por,
        v.rejeitado_em,
        v.motivo_rejeicao,
        v.criado_em,
        v.atualizado_em,
        COALESCE(
          json_agg(
            json_build_object('id', ai.id, 'nome', ai.nome)
            ORDER BY ai.nome
          ) FILTER (WHERE ai.id IS NOT NULL),
          '[]'::json
        ) AS areas
      FROM voluntarios v
      LEFT JOIN voluntario_areas va ON va.voluntario_id = v.id
      LEFT JOIN areas_interesse ai ON ai.id = va.area_id
      ${whereClause}
      GROUP BY v.id
      ORDER BY v.criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return rows.map((row) => ({
    ...row,
    areas: row.areas || [],
  }));
}

export async function countVolunteers(filters: Pick<VolunteerListFilters, 'status' | 'q'>): Promise<number> {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.status) {
    where.push('status = :status');
    replacements.status = filters.status;
  }

  if (filters.q) {
    where.push('(nome ILIKE :q OR email ILIKE :q OR telefone ILIKE :q)');
    replacements.q = `%${filters.q}%`;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM voluntarios
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function findVolunteerById(id: string, transaction?: Transaction): Promise<AdminVolunteerRow | null> {
  const rows = await sequelize.query<VolunteerQueryRow>(
    `
      SELECT
        v.id,
        v.nome,
        v.email,
        v.telefone,
        v.foto_url,
        v.mensagem,
        v.status,
        (v.senha_hash IS NOT NULL) AS tem_senha,
        v.ultimo_login,
        v.aprovado_por,
        v.aprovado_em,
        v.rejeitado_por,
        v.rejeitado_em,
        v.motivo_rejeicao,
        v.criado_em,
        v.atualizado_em,
        COALESCE(
          json_agg(
            json_build_object('id', ai.id, 'nome', ai.nome)
            ORDER BY ai.nome
          ) FILTER (WHERE ai.id IS NOT NULL),
          '[]'::json
        ) AS areas
      FROM voluntarios v
      LEFT JOIN voluntario_areas va ON va.voluntario_id = v.id
      LEFT JOIN areas_interesse ai ON ai.id = va.area_id
      WHERE v.id = :id
      GROUP BY v.id
      LIMIT 1;
    `,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  const volunteer = rows[0];
  return volunteer ? { ...volunteer, areas: volunteer.areas || [] } : null;
}

export async function approveVolunteer(
  id: string,
  adminId: string,
  inviteTokenHash: string,
  inviteTokenExpiresAt: Date,
  transaction: Transaction,
): Promise<AdminVolunteerRow | null> {
  const [row] = await sequelize.query<VolunteerQueryRow>(
    `
      UPDATE voluntarios
      SET status = 'aprovado',
          aprovado_por = :adminId,
          aprovado_em = COALESCE(aprovado_em, NOW()),
          rejeitado_por = NULL,
          rejeitado_em = NULL,
          motivo_rejeicao = NULL,
          convite_token = :inviteTokenHash,
          convite_token_exp = :inviteTokenExpiresAt,
          tentativas_login = 0,
          bloqueado_ate = NULL,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING
        id,
        nome,
        email,
        telefone,
        foto_url,
        mensagem,
        status,
        (senha_hash IS NOT NULL) AS tem_senha,
        ultimo_login,
        aprovado_por,
        aprovado_em,
        rejeitado_por,
        rejeitado_em,
        motivo_rejeicao,
        criado_em,
        atualizado_em,
        '[]'::json AS areas;
    `,
    {
      replacements: {
        id,
        adminId,
        inviteTokenHash,
        inviteTokenExpiresAt,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row ? { ...row, areas: [] } : null;
}

export async function rejectVolunteer(
  id: string,
  adminId: string,
  reason: string | null,
  transaction: Transaction,
): Promise<AdminVolunteerRow | null> {
  const [row] = await sequelize.query<VolunteerQueryRow>(
    `
      UPDATE voluntarios
      SET status = 'rejeitado',
          rejeitado_por = :adminId,
          rejeitado_em = NOW(),
          motivo_rejeicao = :reason,
          convite_token = NULL,
          convite_token_exp = NULL,
          reset_token = NULL,
          reset_token_exp = NULL,
          bloqueado_ate = NULL,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING
        id,
        nome,
        email,
        telefone,
        foto_url,
        mensagem,
        status,
        (senha_hash IS NOT NULL) AS tem_senha,
        ultimo_login,
        aprovado_por,
        aprovado_em,
        rejeitado_por,
        rejeitado_em,
        motivo_rejeicao,
        criado_em,
        atualizado_em,
        '[]'::json AS areas;
    `,
    {
      replacements: {
        id,
        adminId,
        reason,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row ? { ...row, areas: [] } : null;
}

export async function reactivateVolunteer(
  id: string,
  inviteTokenHash: string | null,
  inviteTokenExpiresAt: Date | null,
  transaction: Transaction,
): Promise<AdminVolunteerRow | null> {
  const [row] = await sequelize.query<VolunteerQueryRow>(
    `
      UPDATE voluntarios
      SET status = 'aprovado',
          rejeitado_por = NULL,
          rejeitado_em = NULL,
          motivo_rejeicao = NULL,
          convite_token = :inviteTokenHash,
          convite_token_exp = :inviteTokenExpiresAt,
          reset_token = NULL,
          reset_token_exp = NULL,
          tentativas_login = 0,
          bloqueado_ate = NULL,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING
        id,
        nome,
        email,
        telefone,
        foto_url,
        mensagem,
        status,
        (senha_hash IS NOT NULL) AS tem_senha,
        ultimo_login,
        aprovado_por,
        aprovado_em,
        rejeitado_por,
        rejeitado_em,
        motivo_rejeicao,
        criado_em,
        atualizado_em,
        '[]'::json AS areas;
    `,
    {
      replacements: {
        id,
        inviteTokenHash,
        inviteTokenExpiresAt,
      },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row ? { ...row, areas: [] } : null;
}

export async function suspendVolunteer(
  id: string,
  transaction: Transaction,
): Promise<AdminVolunteerRow | null> {
  const [row] = await sequelize.query<VolunteerQueryRow>(
    `
      UPDATE voluntarios
      SET status = 'suspenso',
          convite_token = NULL,
          convite_token_exp = NULL,
          reset_token = NULL,
          reset_token_exp = NULL,
          bloqueado_ate = NULL,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING
        id,
        nome,
        email,
        telefone,
        foto_url,
        mensagem,
        status,
        (senha_hash IS NOT NULL) AS tem_senha,
        ultimo_login,
        aprovado_por,
        aprovado_em,
        rejeitado_por,
        rejeitado_em,
        motivo_rejeicao,
        criado_em,
        atualizado_em,
        '[]'::json AS areas;
    `,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row ? { ...row, areas: [] } : null;
}

export async function deleteVolunteer(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM voluntarios
      WHERE id = :id;
    `,
    {
      replacements: { id },
      transaction,
    },
  );
}

export async function enqueueVolunteerEmail(
  volunteerId: string,
  recipient: string,
  subject: string,
  body: string,
  transaction: Transaction,
): Promise<void> {
  await sequelize.query(
    `
      INSERT INTO notificacoes_email (voluntario_id, destinatario, assunto, corpo)
      VALUES (:volunteerId, :recipient, :subject, :body);
    `,
    {
      replacements: {
        volunteerId,
        recipient,
        subject,
        body,
      },
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
