import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type DonationType = 'alimento' | 'roupa' | 'dinheiro' | 'outros';

export type AdminDonationRow = {
  id: string;
  tipo: DonationType;
  descricao: string | null;
  quantidade: string | null;
  unidade: string | null;
  doador_nome: string | null;
  data_recebido: Date;
  admin_id: string | null;
  criado_em: Date;
};

export type AdminDonationLocationRow = {
  id: string;
  nome: string;
  endereco: string;
  horario: string | null;
  tipo: DonationType;
  ativo: boolean;
  exibir_home: boolean;
  ordem_home: number;
  criado_em: Date;
  atualizado_em: Date;
};

export type AdminDonationSummaryRow = {
  month_donations: string;
  food_amount: string | null;
  money_amount: string | null;
  money_count: string;
  active_locations: string;
  home_locations: string;
};

export type DonationListFilters = {
  tipo?: DonationType;
  q?: string;
  limit: number;
  offset: number;
};

export type DonationLocationListFilters = {
  tipo?: DonationType;
  ativo?: boolean;
  q?: string;
  limit: number;
  offset: number;
};

export type DonationInput = {
  tipo: DonationType;
  descricao: string | null;
  quantidade: number | null;
  unidade: string | null;
  doadorNome: string | null;
  dataRecebido: string;
  adminId: string;
};

export type DonationLocationInput = {
  nome: string;
  endereco: string;
  horario: string | null;
  tipo: DonationType;
  ativo: boolean;
  exibirHome: boolean;
  ordemHome: number;
};

function donationWhere(filters: Pick<DonationListFilters, 'tipo' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.tipo) {
    where.push('tipo = :tipo');
    replacements.tipo = filters.tipo;
  }

  if (filters.q) {
    where.push('(descricao ILIKE :q OR doador_nome ILIKE :q OR unidade ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return {
    whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '',
    replacements,
  };
}

function locationWhere(filters: Pick<DonationLocationListFilters, 'tipo' | 'ativo' | 'q'>) {
  const where: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (filters.tipo) {
    where.push('tipo = :tipo');
    replacements.tipo = filters.tipo;
  }

  if (typeof filters.ativo === 'boolean') {
    where.push('ativo = :ativo');
    replacements.ativo = filters.ativo;
  }

  if (filters.q) {
    where.push('(nome ILIKE :q OR endereco ILIKE :q OR horario ILIKE :q)');
    replacements.q = '%' + filters.q + '%';
  }

  return {
    whereClause: where.length ? 'WHERE ' + where.join(' AND ') : '',
    replacements,
  };
}

export async function listDonations(filters: DonationListFilters): Promise<AdminDonationRow[]> {
  const { whereClause, replacements } = donationWhere(filters);

  return sequelize.query<AdminDonationRow>(
    `
      SELECT id, tipo, descricao, quantidade::text, unidade, doador_nome, data_recebido, admin_id, criado_em
      FROM doacoes
      ${whereClause}
      ORDER BY data_recebido DESC, criado_em DESC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements: { ...replacements, limit: filters.limit, offset: filters.offset },
      type: QueryTypes.SELECT,
    },
  );
}

export async function countDonations(filters: Pick<DonationListFilters, 'tipo' | 'q'>): Promise<number> {
  const { whereClause, replacements } = donationWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM doacoes
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function getDonationSummary(): Promise<AdminDonationSummaryRow> {
  const [row] = await sequelize.query<AdminDonationSummaryRow>(
    `
      SELECT
        COUNT(*) FILTER (WHERE date_trunc('month', data_recebido) = date_trunc('month', CURRENT_DATE)) AS month_donations,
        COALESCE(SUM(quantidade) FILTER (WHERE tipo = 'alimento'), 0)::text AS food_amount,
        COALESCE(SUM(quantidade) FILTER (WHERE tipo = 'dinheiro'), 0)::text AS money_amount,
        COUNT(*) FILTER (WHERE tipo = 'dinheiro') AS money_count,
        (SELECT COUNT(*) FROM locais_doacao WHERE ativo = true) AS active_locations,
        (SELECT COUNT(*) FROM locais_doacao WHERE ativo = true AND exibir_home = true) AS home_locations
      FROM doacoes;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );

  return row || {
    month_donations: '0',
    food_amount: '0',
    money_amount: '0',
    money_count: '0',
    active_locations: '0',
    home_locations: '0',
  };
}

export async function findDonationById(id: string, transaction?: Transaction): Promise<AdminDonationRow | null> {
  const [row] = await sequelize.query<AdminDonationRow>(
    `
      SELECT id, tipo, descricao, quantidade::text, unidade, doador_nome, data_recebido, admin_id, criado_em
      FROM doacoes
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

export async function createDonation(input: DonationInput, transaction: Transaction): Promise<AdminDonationRow> {
  const [row] = await sequelize.query<AdminDonationRow>(
    `
      INSERT INTO doacoes (tipo, descricao, quantidade, unidade, doador_nome, data_recebido, admin_id)
      VALUES (:tipo, :descricao, :quantidade, :unidade, :doadorNome, :dataRecebido, :adminId)
      RETURNING id, tipo, descricao, quantidade::text, unidade, doador_nome, data_recebido, admin_id, criado_em;
    `,
    {
      replacements: input,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar doação.');
  }

  return row;
}

export async function updateDonation(id: string, input: DonationInput, transaction: Transaction): Promise<AdminDonationRow | null> {
  const [row] = await sequelize.query<AdminDonationRow>(
    `
      UPDATE doacoes
      SET tipo = :tipo,
          descricao = :descricao,
          quantidade = :quantidade,
          unidade = :unidade,
          doador_nome = :doadorNome,
          data_recebido = :dataRecebido,
          admin_id = :adminId
      WHERE id = :id
      RETURNING id, tipo, descricao, quantidade::text, unidade, doador_nome, data_recebido, admin_id, criado_em;
    `,
    {
      replacements: { id, ...input },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function deleteDonation(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM doacoes
      WHERE id = :id;
    `,
    {
      replacements: { id },
      transaction,
    },
  );
}

export async function listDonationLocations(filters: DonationLocationListFilters): Promise<AdminDonationLocationRow[]> {
  const { whereClause, replacements } = locationWhere(filters);

  return sequelize.query<AdminDonationLocationRow>(
    `
      SELECT id, nome, endereco, horario, tipo, ativo, exibir_home, ordem_home, criado_em, atualizado_em
      FROM locais_doacao
      ${whereClause}
      ORDER BY ativo DESC, exibir_home DESC, ordem_home ASC, nome ASC
      LIMIT :limit
      OFFSET :offset;
    `,
    {
      replacements: { ...replacements, limit: filters.limit, offset: filters.offset },
      type: QueryTypes.SELECT,
    },
  );
}

export async function countDonationLocations(filters: Pick<DonationLocationListFilters, 'tipo' | 'ativo' | 'q'>): Promise<number> {
  const { whereClause, replacements } = locationWhere(filters);
  const [row] = await sequelize.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM locais_doacao
      ${whereClause};
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.total || 0);
}

export async function findDonationLocationById(id: string, transaction?: Transaction): Promise<AdminDonationLocationRow | null> {
  const [row] = await sequelize.query<AdminDonationLocationRow>(
    `
      SELECT id, nome, endereco, horario, tipo, ativo, exibir_home, ordem_home, criado_em, atualizado_em
      FROM locais_doacao
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

export async function createDonationLocation(input: DonationLocationInput, transaction: Transaction): Promise<AdminDonationLocationRow> {
  const [row] = await sequelize.query<AdminDonationLocationRow>(
    `
      INSERT INTO locais_doacao (nome, endereco, horario, tipo, ativo, exibir_home, ordem_home)
      VALUES (:nome, :endereco, :horario, :tipo, :ativo, :exibirHome, :ordemHome)
      RETURNING id, nome, endereco, horario, tipo, ativo, exibir_home, ordem_home, criado_em, atualizado_em;
    `,
    {
      replacements: input,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!row) {
    throw new Error('Falha ao criar local de doação.');
  }

  return row;
}

export async function updateDonationLocation(id: string, input: DonationLocationInput, transaction: Transaction): Promise<AdminDonationLocationRow | null> {
  const [row] = await sequelize.query<AdminDonationLocationRow>(
    `
      UPDATE locais_doacao
      SET nome = :nome,
          endereco = :endereco,
          horario = :horario,
          tipo = :tipo,
          ativo = :ativo,
          exibir_home = :exibirHome,
          ordem_home = :ordemHome,
          atualizado_em = NOW()
      WHERE id = :id
      RETURNING id, nome, endereco, horario, tipo, ativo, exibir_home, ordem_home, criado_em, atualizado_em;
    `,
    {
      replacements: { id, ...input },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return row || null;
}

export async function deleteDonationLocation(id: string, transaction: Transaction): Promise<void> {
  await sequelize.query(
    `
      DELETE FROM locais_doacao
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
