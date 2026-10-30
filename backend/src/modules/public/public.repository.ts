import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../config/database.js';

export type ContentRow = {
  chave: string;
  valor: string;
  tipo: string;
  descricao: string | null;
  atualizado_em: Date;
};

export type TeamMemberRow = {
  id: string;
  nome: string;
  cargo: string | null;
  bio: string | null;
  foto_url: string | null;
  ordem: number;
  exibir_portal?: boolean;
};

export type PublicEventRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: Date;
  data_fim: Date | null;
  local: string | null;
  imagem_url: string | null;
  recorrente: boolean;
  dia_semana: number | null;
  publico: boolean;
  publicado: boolean;
};

export type InterestAreaRow = {
  id: number;
  nome: string;
};

export type CreatedVolunteerRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  status: string;
  criado_em: Date;
};

export type FaqRow = {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  ordem: number;
};

export type DonationRow = {
  id: string;
  tipo: string;
  descricao: string | null;
  quantidade: string | null;
  unidade: string | null;
  data_recebido: Date;
  criado_em: Date;
};

export type DonationLocationRow = {
  id: string;
  nome: string;
  endereco: string;
  horario: string | null;
  tipo: string;
  ativo: boolean;
  exibir_home: boolean;
  ordem_home: number;
};

export type GalleryRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string;
  imagem_thumb: string | null;
  data_acao: Date | null;
  status: string;
};

export async function findContent({ prefix, keys }: { prefix: string; keys: string[] }): Promise<ContentRow[]> {
  const replacements: Record<string, unknown> = {};
  const filters: string[] = [];

  if (prefix) {
    replacements.prefix = `${prefix}%`;
    filters.push('chave ILIKE :prefix');
  }

  if (keys.length) {
    replacements.keys = keys;
    filters.push('chave IN (:keys)');
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  return sequelize.query<ContentRow>(
    `
      SELECT chave, valor, tipo, descricao, atualizado_em
      FROM conteudo
      ${whereClause}
      ORDER BY chave ASC;
    `,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );
}

export async function findActiveTeamMembers(): Promise<TeamMemberRow[]> {
  return sequelize.query<TeamMemberRow>(
    `
      SELECT id, nome, cargo, bio, foto_url, ordem
      FROM equipe
      WHERE ativo = TRUE
      ORDER BY ordem ASC, nome ASC;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
}


export async function findPortalCoordinationMembers(): Promise<TeamMemberRow[]> {
  return sequelize.query<TeamMemberRow>(
    `
      SELECT id, nome, cargo, bio, foto_url, ordem, exibir_portal
      FROM equipe
      WHERE ativo = TRUE
        AND exibir_portal = TRUE
      ORDER BY ordem ASC, nome ASC
      LIMIT 2;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
}

export async function findPublicEvents({ onlyPublic, limit }: { onlyPublic: boolean; limit: number | null }): Promise<PublicEventRow[]> {
  const limitClause = limit ? 'LIMIT :limit' : '';

  return sequelize.query<PublicEventRow>(
    `
      SELECT id, titulo, descricao, tipo, data_inicio, data_fim, local, imagem_url, recorrente, dia_semana, publico, publicado
      FROM eventos
      WHERE publicado = TRUE
        AND (:onlyPublic = FALSE OR publico = TRUE)
      ORDER BY data_inicio ASC
      ${limitClause};
    `,
    {
      replacements: {
        onlyPublic,
        limit,
      },
      type: QueryTypes.SELECT,
    },
  );
}

export async function findActiveInterestAreas(): Promise<InterestAreaRow[]> {
  return sequelize.query<InterestAreaRow>(
    `
      SELECT id, nome
      FROM areas_interesse
      WHERE ativo = TRUE
      ORDER BY nome ASC;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
}

export async function emailExistsInAdminsOrVolunteers(email: string, transaction: Transaction): Promise<boolean> {
  const [row] = await sequelize.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1 FROM voluntarios WHERE LOWER(email) = LOWER(:email)
        UNION
        SELECT 1 FROM admins WHERE LOWER(email) = LOWER(:email)
      ) AS exists;
    `,
    {
      replacements: { email },
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  return Boolean(row?.exists);
}

export async function findInterestAreasByIds(areaIds: number[], transaction: Transaction): Promise<InterestAreaRow[]> {
  if (!areaIds.length) {
    return [];
  }

  return sequelize.query<InterestAreaRow>(
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

export async function createVolunteer(
  volunteer: { nome: string; email: string; telefone: string; mensagem: string | null },
  transaction: Transaction,
): Promise<CreatedVolunteerRow> {
  const [created] = await sequelize.query<CreatedVolunteerRow>(
    `
      INSERT INTO voluntarios (nome, email, telefone, mensagem, status)
      VALUES (:nome, :email, :telefone, :mensagem, 'pendente')
      RETURNING id, nome, email, telefone, status, criado_em;
    `,
    {
      replacements: volunteer,
      type: QueryTypes.SELECT,
      transaction,
    },
  );

  if (!created) {
    throw new Error('Falha ao criar voluntário.');
  }

  return created;
}

export async function attachVolunteerAreas(volunteerId: string, areaIds: number[], transaction: Transaction): Promise<void> {
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

export async function findPublishedFaq(): Promise<FaqRow[]> {
  return sequelize.query<FaqRow>(
    `
      SELECT id, pergunta, resposta, categoria, ordem
      FROM faq
      WHERE publicado = TRUE
      ORDER BY categoria ASC, ordem ASC, criado_em ASC;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
}

export async function findPublicDonations({ limit }: { limit: number | null }): Promise<DonationRow[]> {
  const limitClause = limit ? 'LIMIT :limit' : '';

  return sequelize.query<DonationRow>(
    `
      SELECT id, tipo, descricao, quantidade, unidade, data_recebido, criado_em
      FROM doacoes
      ORDER BY data_recebido DESC, criado_em DESC
      ${limitClause};
    `,
    {
      replacements: { limit },
      type: QueryTypes.SELECT,
    },
  );
}

export async function findActiveDonationLocations(): Promise<DonationLocationRow[]> {
  return sequelize.query<DonationLocationRow>(
    `
      SELECT id, nome, endereco, horario, tipo, ativo, exibir_home, ordem_home
      FROM locais_doacao
      WHERE ativo = TRUE
      ORDER BY nome ASC;
    `,
    {
      type: QueryTypes.SELECT,
    },
  );
}


export async function findHomeDonationLocations({ limit }: { limit: number }): Promise<DonationLocationRow[]> {
  return sequelize.query<DonationLocationRow>(
    `
      SELECT id, nome, endereco, horario, tipo, ativo, exibir_home, ordem_home
      FROM locais_doacao
      WHERE ativo = TRUE
        AND exibir_home = TRUE
      ORDER BY ordem_home ASC, nome ASC
      LIMIT :limit;
    `,
    {
      replacements: { limit },
      type: QueryTypes.SELECT,
    },
  );
}

export async function findGalleryItems({ status, limit }: { status: string; limit: number | null }): Promise<GalleryRow[]> {
  const limitClause = limit ? 'LIMIT :limit' : '';

  return sequelize.query<GalleryRow>(
    `
      SELECT id, titulo, descricao, imagem_url, imagem_thumb, data_acao, status
      FROM galeria
      WHERE status = :status
        AND privacidade_ok = TRUE
      ORDER BY data_acao DESC NULLS LAST, criado_em DESC
      ${limitClause};
    `,
    {
      replacements: { status, limit },
      type: QueryTypes.SELECT,
    },
  );
}
