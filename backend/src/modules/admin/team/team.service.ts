import { AppError } from '../../../utils/AppError.js';
import {
  countPortalCoordinationMembers,
  countTeam,
  createAdminLog,
  createTeam,
  deleteTeam,
  findTeamById,
  listTeam,
  sequelize,
  updateTeam,
} from './team.repository.js';

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ListTeamQuery = {
  ativo?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
};

type TeamPayload = {
  nome?: unknown;
  cargo?: unknown;
  bio?: unknown;
  foto_url?: unknown;
  fotoUrl?: unknown;
  ordem?: unknown;
  ativo?: unknown;
  status?: unknown;
  exibir_portal?: unknown;
  exibirPortal?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'sim', 'ativo', 'publicado'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'nao', 'não', 'inativo', 'rascunho'].includes(normalized)) {
    return false;
  }

  throw new AppError('Valor booleano inválido.', 422, 'INVALID_BOOLEAN');
}

function normalizeNullableText(value: unknown, max: number, fieldLabel: string): string | null {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (text.length > max) {
    throw new AppError(fieldLabel + ' deve ter no máximo ' + max + ' caracteres.', 422, 'INVALID_TEXT_LENGTH');
  }

  return text;
}

function normalizeTeamPayload(payload: TeamPayload, adminId: string) {
  const nome = String(payload.nome || '').trim();
  const ordem = Number(payload.ordem ?? 0);

  if (!nome || nome.length < 3) {
    throw new AppError('Informe um nome com pelo menos 3 caracteres.', 422, 'INVALID_TEAM_NAME');
  }

  if (nome.length > 120) {
    throw new AppError('O nome deve ter no máximo 120 caracteres.', 422, 'INVALID_TEAM_NAME');
  }

  if (!Number.isInteger(ordem) || ordem < 0 || ordem > 32767) {
    throw new AppError('A ordem deve ser um inteiro entre 0 e 32767.', 422, 'INVALID_ORDER');
  }

  return {
    nome,
    cargo: normalizeNullableText(payload.cargo, 120, 'O cargo'),
    bio: normalizeNullableText(payload.bio, 10000, 'A bio'),
    fotoUrl: normalizeNullableText(payload.foto_url ?? payload.fotoUrl, 5000, 'A foto'),
    ordem,
    ativo: parseBoolean(payload.ativo ?? payload.status) ?? true,
    exibirPortal: parseBoolean(payload.exibir_portal ?? payload.exibirPortal) ?? false,
    adminId,
  };
}

async function assertPortalCoordinationLimit(input: { ativo: boolean; exibirPortal: boolean }, excludeId: string | undefined, transaction: Parameters<typeof countPortalCoordinationMembers>[1]) {
  if (!input.exibirPortal) return;
  if (!input.ativo) {
    throw new AppError('Para aparecer na coordenação do Portal, o membro precisa estar ativo.', 422, 'TEAM_PORTAL_MEMBER_INACTIVE');
  }
  const total = await countPortalCoordinationMembers(excludeId, transaction);
  if (total >= 2) {
    throw new AppError('A coordenação do Portal pode exibir no máximo 2 membros.', 422, 'TEAM_PORTAL_LIMIT_REACHED');
  }
}

export async function listAdminTeam(query: ListTeamQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const filters = {
    ativo: parseBoolean(query.ativo),
    q: normalizeSearch(query.q),
  };
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listTeam({ ...filters, limit, offset }),
    countTeam(filters),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminTeam(id: string) {
  const item = await findTeamById(id);

  if (!item) {
    throw new AppError('Membro da equipe não encontrado.', 404, 'TEAM_MEMBER_NOT_FOUND');
  }

  return item;
}

export async function createAdminTeam(payload: TeamPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeTeamPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    await assertPortalCoordinationLimit(input, undefined, transaction);
    const created = await createTeam(input, transaction);

    await createAdminLog(
      {
        adminId,
        action: 'equipe.criar',
        entity: 'equipe',
        entityId: created.id,
        detail: { nome: created.nome, ativo: created.ativo, exibirPortal: created.exibir_portal },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return { data: created, message: 'Membro da equipe criado.' };
  });
}

export async function updateAdminTeam(id: string, payload: TeamPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeTeamPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    const current = await findTeamById(id, transaction);

    if (!current) {
      throw new AppError('Membro da equipe não encontrado.', 404, 'TEAM_MEMBER_NOT_FOUND');
    }

    await assertPortalCoordinationLimit(input, id, transaction);
    const updated = await updateTeam(id, input, transaction);

    if (!updated) {
      throw new AppError('Membro da equipe não encontrado.', 404, 'TEAM_MEMBER_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'equipe.editar',
        entity: 'equipe',
        entityId: id,
        detail: { previousNome: current.nome, ativo: updated.ativo, exibirPortal: updated.exibir_portal },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return { data: updated, message: 'Membro da equipe atualizado.' };
  });
}

export async function deleteAdminTeam(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findTeamById(id, transaction);

    if (!current) {
      throw new AppError('Membro da equipe não encontrado.', 404, 'TEAM_MEMBER_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'equipe.excluir',
        entity: 'equipe',
        entityId: id,
        detail: { nome: current.nome },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    await deleteTeam(id, transaction);

    return { message: 'Membro da equipe excluído.' };
  });
}
