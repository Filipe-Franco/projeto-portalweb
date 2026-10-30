import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../config/database.js';
import type { AuthRole } from './auth.types.js';

export type AdminAuthRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  ativo: boolean;
  tentativas_login: number;
  bloqueado_ate: Date | null;
};

export type VolunteerAuthRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string | null;
  status: string;
  tentativas_login: number;
  bloqueado_ate: Date | null;
};

export type VolunteerInviteRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string | null;
  status: string;
};

export type AuthLookupRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string | null;
  ativo?: boolean;
  status?: string;
};

export async function findAdminByEmail(email: string): Promise<AdminAuthRow | null> {
  const [admin] = await sequelize.query<AdminAuthRow>(
    `
      SELECT id, nome, email, senha_hash, ativo, tentativas_login, bloqueado_ate
      FROM admins
      WHERE LOWER(email) = LOWER(:email)
      LIMIT 1;
    `,
    {
      replacements: { email },
      type: QueryTypes.SELECT,
    },
  );

  return admin || null;
}

export async function findVolunteerByEmail(email: string): Promise<VolunteerAuthRow | null> {
  const [volunteer] = await sequelize.query<VolunteerAuthRow>(
    `
      SELECT id, nome, email, senha_hash, status, tentativas_login, bloqueado_ate
      FROM voluntarios
      WHERE LOWER(email) = LOWER(:email)
      LIMIT 1;
    `,
    {
      replacements: { email },
      type: QueryTypes.SELECT,
    },
  );

  return volunteer || null;
}

export async function findAdminById(id: string): Promise<AuthLookupRow | null> {
  const [admin] = await sequelize.query<AuthLookupRow>(
    `
      SELECT id, nome, email, senha_hash, ativo
      FROM admins
      WHERE id = :id
      LIMIT 1;
    `,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    },
  );

  return admin || null;
}

export async function findVolunteerById(id: string): Promise<AuthLookupRow | null> {
  const [volunteer] = await sequelize.query<AuthLookupRow>(
    `
      SELECT id, nome, email, senha_hash, status
      FROM voluntarios
      WHERE id = :id
      LIMIT 1;
    `,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    },
  );

  return volunteer || null;
}

export async function resetLoginAttempts(role: AuthRole, id: string): Promise<void> {
  const table = role === 'admin' ? 'admins' : 'voluntarios';
  await sequelize.query(
    `
      UPDATE ${table}
      SET tentativas_login = 0,
          bloqueado_ate = NULL,
          ${role === 'voluntario' ? 'ultimo_login = NOW(),' : ''}
          atualizado_em = NOW()
      WHERE id = :id;
    `,
    { replacements: { id } },
  );
}

export async function registerFailedLogin(role: AuthRole, id: string, shouldLock: boolean): Promise<void> {
  const table = role === 'admin' ? 'admins' : 'voluntarios';
  await sequelize.query(
    `
      UPDATE ${table}
      SET tentativas_login = tentativas_login + 1,
          bloqueado_ate = CASE WHEN :shouldLock THEN NOW() + INTERVAL '15 minutes' ELSE bloqueado_ate END,
          atualizado_em = NOW()
      WHERE id = :id;
    `,
    { replacements: { id, shouldLock } },
  );
}

export async function storeResetToken(role: AuthRole, id: string, tokenHash: string, expiresAt: Date): Promise<void> {
  const table = role === 'admin' ? 'admins' : 'voluntarios';
  await sequelize.query(
    `
      UPDATE ${table}
      SET reset_token = :tokenHash,
          reset_token_exp = :expiresAt,
          atualizado_em = NOW()
      WHERE id = :id;
    `,
    { replacements: { id, tokenHash, expiresAt } },
  );
}

export async function findUserByResetToken(role: AuthRole, tokenHash: string): Promise<AuthLookupRow | null> {
  const table = role === 'admin' ? 'admins' : 'voluntarios';
  const extraFilter = role === 'admin' ? 'AND ativo = TRUE' : "AND status = 'aprovado'";
  const [user] = await sequelize.query<AuthLookupRow>(
    `
      SELECT id, nome, email, senha_hash${role === 'admin' ? ', ativo' : ', status'}
      FROM ${table}
      WHERE reset_token = :tokenHash
        AND reset_token_exp > NOW()
        ${extraFilter}
      LIMIT 1;
    `,
    {
      replacements: { tokenHash },
      type: QueryTypes.SELECT,
    },
  );

  return user || null;
}

export async function updatePasswordAndClearResetToken(
  role: AuthRole,
  id: string,
  passwordHash: string,
  transaction?: Transaction,
): Promise<void> {
  const table = role === 'admin' ? 'admins' : 'voluntarios';
  await sequelize.query(
    `
      UPDATE ${table}
      SET senha_hash = :passwordHash,
          reset_token = NULL,
          reset_token_exp = NULL,
          tentativas_login = 0,
          bloqueado_ate = NULL,
          atualizado_em = NOW()
      WHERE id = :id;
    `,
    {
      replacements: { id, passwordHash },
      transaction,
    },
  );
}

export async function findVolunteerByInviteToken(tokenHash: string): Promise<VolunteerInviteRow | null> {
  const [volunteer] = await sequelize.query<VolunteerInviteRow>(
    `
      SELECT id, nome, email, senha_hash, status
      FROM voluntarios
      WHERE convite_token = :tokenHash
        AND convite_token_exp > NOW()
        AND status = 'aprovado'
      LIMIT 1;
    `,
    {
      replacements: { tokenHash },
      type: QueryTypes.SELECT,
    },
  );

  return volunteer || null;
}

export async function activateVolunteerAccount(id: string, passwordHash: string): Promise<void> {
  await sequelize.query(
    `
      UPDATE voluntarios
      SET senha_hash = :passwordHash,
          convite_token = NULL,
          convite_token_exp = NULL,
          reset_token = NULL,
          reset_token_exp = NULL,
          tentativas_login = 0,
          bloqueado_ate = NULL,
          atualizado_em = NOW()
      WHERE id = :id;
    `,
    {
      replacements: { id, passwordHash },
    },
  );
}

export async function enqueuePasswordResetEmail(
  recipient: string,
  subject: string,
  body: string,
  volunteerId?: string,
): Promise<void> {
  await sequelize.query(
    `
      INSERT INTO notificacoes_email (voluntario_id, destinatario, assunto, corpo)
      VALUES (:volunteerId, :recipient, :subject, :body);
    `,
    {
      replacements: {
        volunteerId: volunteerId || null,
        recipient,
        subject,
        body,
      },
    },
  );
}
