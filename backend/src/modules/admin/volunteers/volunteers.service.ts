import type { Transaction } from 'sequelize';
import crypto from 'node:crypto';

import { env, isProduction } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import {
  approveVolunteer,
  countVolunteers,
  createAdminLog,
  createAdminVolunteer,
  deleteVolunteer,
  emailExistsForVolunteerAdmin,
  enqueueVolunteerEmail,
  findActiveInterestAreasByIds,
  findVolunteerById,
  listVolunteers,
  reactivateVolunteer,
  rejectVolunteer,
  replaceVolunteerAreas,
  sequelize,
  suspendVolunteer,
  updateAdminVolunteer,
  type VolunteerStatus,
} from './volunteers.repository.js';

const INVITE_TOKEN_BYTES = 32;
const INVITE_TOKEN_EXPIRES_DAYS = 7;
const VOLUNTEER_STATUSES: VolunteerStatus[] = ['pendente', 'aprovado', 'inativo', 'suspenso', 'rejeitado'];

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ListVolunteersQuery = {
  status?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
};

type ModerationPayload = {
  motivo?: unknown;
  reason?: unknown;
};

type VolunteerEditPayload = {
  nome?: unknown;
  nomeCompleto?: unknown;
  email?: unknown;
  telefone?: unknown;
  cidade?: unknown;
  mensagem?: unknown;
  observacao?: unknown;
  intencao?: unknown;
  comoSoube?: unknown;
  como_soube?: unknown;
  areas_interesse?: unknown;
  areasInteresse?: unknown;
  areaIds?: unknown;
  status?: unknown;
};

type NormalizedVolunteerInput = {
  nome: string;
  email: string;
  telefone: string | null;
  mensagem: string | null;
  status: VolunteerStatus;
  areasInteresse: number[];
};

function tokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createInviteToken() {
  const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString('hex');
  return {
    token,
    hash: tokenHash(token),
    expiresAt: new Date(Date.now() + INVITE_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
  };
}

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function parseStatus(value: unknown): VolunteerStatus | undefined {
  if (!value) {
    return undefined;
  }

  const status = String(value).trim().toLowerCase() as VolunteerStatus;

  if (!VOLUNTEER_STATUSES.includes(status)) {
    throw new AppError('Status de voluntário inválido.', 422, 'INVALID_VOLUNTEER_STATUS');
  }

  return status;
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAreaIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(Number))].filter((id) => Number.isInteger(id) && id > 0 && id <= 32767);
}

function buildVolunteerMessage(payload: VolunteerEditPayload): string | null {
  const message = String(payload.mensagem || payload.observacao || payload.intencao || '').trim();
  const cidade = String(payload.cidade || '').trim();
  const comoSoube = String(payload.comoSoube || payload.como_soube || '').trim();

  const parts = [
    message,
    cidade ? `Cidade: ${cidade}` : '',
    comoSoube ? `Como soube: ${comoSoube}` : '',
  ].filter(Boolean);

  return parts.join('\n').slice(0, 500) || null;
}

function normalizeVolunteerInput(payload: VolunteerEditPayload, options: { allowStatus: boolean }): NormalizedVolunteerInput {
  const nome = String(payload.nome || payload.nomeCompleto || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const telefone = String(payload.telefone || '').trim() || null;
  const status = options.allowStatus ? parseStatus(payload.status) || 'pendente' : 'pendente';
  const areasInteresse = normalizeAreaIds(payload.areas_interesse || payload.areasInteresse || payload.areaIds);

  if (!nome || nome.length < 3) {
    throw new AppError('Informe um nome com pelo menos 3 caracteres.', 422, 'INVALID_NAME');
  }

  if (!validateEmail(email)) {
    throw new AppError('Informe um e-mail válido.', 422, 'INVALID_EMAIL');
  }

  if (telefone && telefone.length > 30) {
    throw new AppError('O telefone deve ter no máximo 30 caracteres.', 422, 'INVALID_PHONE');
  }

  return {
    nome,
    email,
    telefone,
    mensagem: buildVolunteerMessage(payload),
    status,
    areasInteresse,
  };
}

function normalizeReason(payload: ModerationPayload): string | null {
  const reason = String(payload.motivo || payload.reason || '').trim();

  if (reason.length > 500) {
    throw new AppError('O motivo deve ter no máximo 500 caracteres.', 422, 'INVALID_REASON');
  }

  return reason || null;
}

function buildActivationUrl(inviteToken: string) {
  return `${env.publicSiteUrl}/portal/login?activationToken=${inviteToken}`;
}

export async function listAdminVolunteers(query: ListVolunteersQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const status = parseStatus(query.status);
  const q = normalizeSearch(query.q);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listVolunteers({ status, q, limit, offset }),
    countVolunteers({ status, q }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminVolunteer(id: string) {
  const volunteer = await findVolunteerById(id);

  if (!volunteer) {
    throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
  }

  return volunteer;
}

async function validateVolunteerAreas(areaIds: number[], transaction: Transaction) {
  const validAreas = await findActiveInterestAreasByIds(areaIds, transaction);

  if (validAreas.length !== areaIds.length) {
    throw new AppError('Uma ou mais áreas de interesse são inválidas.', 422, 'INVALID_INTEREST_AREAS');
  }
}

export async function createManualAdminVolunteer(payload: VolunteerEditPayload, adminId: string, meta: RequestMeta) {
  const volunteer = normalizeVolunteerInput(payload, { allowStatus: true });

  if (volunteer.status !== 'pendente' && volunteer.status !== 'aprovado') {
    throw new AppError('Cadastros manuais devem iniciar como pendente ou aprovado.', 422, 'INVALID_VOLUNTEER_STATUS');
  }

  return sequelize.transaction(async (transaction) => {
    if (await emailExistsForVolunteerAdmin(volunteer.email, transaction)) {
      throw new AppError('Já existe uma conta ou cadastro com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
    }

    await validateVolunteerAreas(volunteer.areasInteresse, transaction);

    const invite = volunteer.status === 'aprovado' ? createInviteToken() : null;
    const created = await createAdminVolunteer(
      {
        nome: volunteer.nome,
        email: volunteer.email,
        telefone: volunteer.telefone,
        mensagem: volunteer.mensagem,
        status: volunteer.status,
        aprovadoPor: volunteer.status === 'aprovado' ? adminId : null,
        inviteTokenHash: invite?.hash || null,
        inviteTokenExpiresAt: invite?.expiresAt || null,
      },
      transaction,
    );

    await replaceVolunteerAreas(created.id, volunteer.areasInteresse, transaction);

    if (invite) {
      const activationUrl = buildActivationUrl(invite.token);
      const subject = 'Ative sua conta - Portal Anjos da Madrugada';
      const body = [
        `Olá, ${created.nome}.`,
        '',
        'Seu cadastro como voluntário foi criado pela administração.',
        `Use este link para ativar sua conta e criar sua senha: ${activationUrl}`,
        '',
        `Este link expira em ${INVITE_TOKEN_EXPIRES_DAYS} dias.`,
      ].join('\n');

      await enqueueVolunteerEmail(created.id, created.email, subject, body, transaction);

      if (!isProduction) {
        console.log(`[admin] manual volunteer activation link for ${created.email}: ${activationUrl}`);
      }
    }

    await createAdminLog(
      {
        adminId,
        action: 'voluntario.criar',
        entity: 'voluntarios',
        entityId: created.id,
        detail: {
          status: volunteer.status,
          generatedInvite: Boolean(invite),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      volunteer: await findVolunteerById(created.id, transaction),
      message: invite
        ? 'Voluntário cadastrado e convite criado na fila de e-mail.'
        : 'Voluntário cadastrado como pendente.',
    };
  });
}

export async function updateManualAdminVolunteer(id: string, payload: VolunteerEditPayload, adminId: string, meta: RequestMeta) {
  const volunteer = normalizeVolunteerInput(payload, { allowStatus: false });

  return sequelize.transaction(async (transaction) => {
    const current = await findVolunteerById(id, transaction);

    if (!current) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    if (await emailExistsForVolunteerAdmin(volunteer.email, transaction, id)) {
      throw new AppError('Já existe uma conta ou cadastro com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
    }

    await validateVolunteerAreas(volunteer.areasInteresse, transaction);

    const updated = await updateAdminVolunteer(
      id,
      {
        nome: volunteer.nome,
        email: volunteer.email,
        telefone: volunteer.telefone,
        mensagem: volunteer.mensagem,
      },
      transaction,
    );

    if (!updated) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    await replaceVolunteerAreas(id, volunteer.areasInteresse, transaction);
    await createAdminLog(
      {
        adminId,
        action: 'voluntario.editar',
        entity: 'voluntarios',
        entityId: id,
        detail: {
          previousEmail: current.email,
          status: current.status,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      volunteer: await findVolunteerById(id, transaction),
      message: 'Voluntário atualizado.',
    };
  });
}

export async function approveAdminVolunteer(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findVolunteerById(id, transaction);

    if (!current) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    if (current.status === 'aprovado' && current.tem_senha) {
      throw new AppError('Voluntário já está aprovado e ativado.', 409, 'VOLUNTEER_ALREADY_ACTIVE');
    }

    const invite = createInviteToken();
    const approved = await approveVolunteer(id, adminId, invite.hash, invite.expiresAt, transaction);

    if (!approved) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    const activationUrl = buildActivationUrl(invite.token);
    const subject = 'Ative sua conta - Portal Anjos da Madrugada';
    const body = [
      `Olá, ${approved.nome}.`,
      '',
      'Seu cadastro como voluntário foi aprovado.',
      `Use este link para ativar sua conta e criar sua senha: ${activationUrl}`,
      '',
      `Este link expira em ${INVITE_TOKEN_EXPIRES_DAYS} dias.`,
    ].join('\n');

    await enqueueVolunteerEmail(approved.id, approved.email, subject, body, transaction);
    await createAdminLog(
      {
        adminId,
        action: 'voluntario.aprovar',
        entity: 'voluntarios',
        entityId: approved.id,
        detail: {
          previousStatus: current.status,
          inviteExpiresAt: invite.expiresAt.toISOString(),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    if (!isProduction) {
      console.log(`[admin] volunteer activation link for ${approved.email}: ${activationUrl}`);
    }

    return {
      volunteer: await findVolunteerById(id, transaction),
      message: 'Voluntário aprovado. Convite de ativação criado na fila de e-mail.',
    };
  });
}

export async function rejectAdminVolunteer(id: string, adminId: string, payload: ModerationPayload, meta: RequestMeta) {
  const reason = normalizeReason(payload);

  return sequelize.transaction(async (transaction) => {
    const current = await findVolunteerById(id, transaction);

    if (!current) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    if (current.status === 'aprovado' && current.tem_senha) {
      throw new AppError('Voluntário já ativado não pode ser rejeitado. Use suspensão.', 409, 'VOLUNTEER_ALREADY_ACTIVE');
    }

    const rejected = await rejectVolunteer(id, adminId, reason, transaction);

    if (!rejected) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'voluntario.rejeitar',
        entity: 'voluntarios',
        entityId: rejected.id,
        detail: {
          previousStatus: current.status,
          reason,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      volunteer: await findVolunteerById(id, transaction),
      message: 'Voluntário rejeitado.',
    };
  });
}

export async function suspendAdminVolunteer(id: string, adminId: string, payload: ModerationPayload, meta: RequestMeta) {
  const reason = normalizeReason(payload);

  return sequelize.transaction(async (transaction) => {
    const current = await findVolunteerById(id, transaction);

    if (!current) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    if (current.status === 'suspenso') {
      throw new AppError('Voluntário já está suspenso.', 409, 'VOLUNTEER_ALREADY_SUSPENDED');
    }

    const suspended = await suspendVolunteer(id, transaction);

    if (!suspended) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'voluntario.suspender',
        entity: 'voluntarios',
        entityId: suspended.id,
        detail: {
          previousStatus: current.status,
          reason,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      volunteer: await findVolunteerById(id, transaction),
      message: 'Voluntário suspenso.',
    };
  });
}


export async function reactivateAdminVolunteer(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findVolunteerById(id, transaction);

    if (!current) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    if (current.status === 'aprovado') {
      throw new AppError('Voluntário já está aprovado.', 409, 'VOLUNTEER_ALREADY_APPROVED');
    }

    const invite = current.tem_senha ? null : createInviteToken();
    const reactivated = await reactivateVolunteer(
      id,
      invite?.hash || null,
      invite?.expiresAt || null,
      transaction,
    );

    if (!reactivated) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    let activationUrl: string | null = null;

    if (invite) {
      activationUrl = buildActivationUrl(invite.token);
      const subject = 'Reative sua conta - Portal Anjos da Madrugada';
      const body = [
        `Olá, ${reactivated.nome}.`,
        '',
        'Seu cadastro foi reativado pela administração.',
        `Use este link para ativar sua conta e criar sua senha: ${activationUrl}`,
        '',
        `Este link expira em ${INVITE_TOKEN_EXPIRES_DAYS} dias.`,
      ].join('\n');

      await enqueueVolunteerEmail(reactivated.id, reactivated.email, subject, body, transaction);

      if (!isProduction) {
        console.log(`[admin] volunteer reactivation link for ${reactivated.email}: ${activationUrl}`);
      }
    }

    await createAdminLog(
      {
        adminId,
        action: 'voluntario.reativar',
        entity: 'voluntarios',
        entityId: reactivated.id,
        detail: {
          previousStatus: current.status,
          generatedInvite: Boolean(invite),
          inviteExpiresAt: invite?.expiresAt.toISOString() || null,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return {
      volunteer: await findVolunteerById(id, transaction),
      message: invite
        ? 'Voluntário reativado. Novo convite de ativação criado na fila de e-mail.'
        : 'Voluntário reativado.',
    };
  });
}

export async function deleteAdminVolunteer(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findVolunteerById(id, transaction);

    if (!current) {
      throw new AppError('Voluntário não encontrado.', 404, 'VOLUNTEER_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'voluntario.excluir',
        entity: 'voluntarios',
        entityId: current.id,
        detail: {
          status: current.status,
          email: current.email,
          nome: current.nome,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    await deleteVolunteer(id, transaction);

    return {
      message: 'Voluntário excluído definitivamente.',
    };
  });
}
