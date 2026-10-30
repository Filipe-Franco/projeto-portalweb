import { QueryTypes, type Transaction } from 'sequelize';

import { sequelize } from '../../config/database.js';
import type { AuthRole } from '../auth/auth.types.js';

export type ProfileRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  senha_hash: string;
  role: AuthRole;
};

export type ProfileUpdateInput = {
  nome: string;
  email: string;
  telefone?: string | null;
};

function tableForRole(role: AuthRole) {
  return role === 'admin' ? 'admins' : 'voluntarios';
}

function selectForRole(role: AuthRole) {
  return role === 'admin'
    ? `SELECT id::text, nome, email, NULL::text AS telefone, foto_url, senha_hash, 'admin'::text AS role
         FROM admins
        WHERE id = :id AND ativo = TRUE
        LIMIT 1;`
    : `SELECT id::text, nome, email, telefone, foto_url, senha_hash, 'voluntario'::text AS role
         FROM voluntarios
        WHERE id = :id AND status = 'aprovado'
        LIMIT 1;`;
}

export async function findProfileById(role: AuthRole, id: string, transaction?: Transaction): Promise<ProfileRow | null> {
  const [row] = await sequelize.query<ProfileRow>(selectForRole(role), {
    replacements: { id },
    type: QueryTypes.SELECT,
    transaction,
  });
  return row || null;
}

export async function emailExistsForOtherProfile(role: AuthRole, email: string, id: string, transaction?: Transaction): Promise<boolean> {
  const [row] = await sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM admins WHERE LOWER(email) = LOWER(:email) AND (:role <> 'admin' OR id <> :id::uuid)
       UNION
       SELECT 1 FROM voluntarios WHERE LOWER(email) = LOWER(:email) AND (:role <> 'voluntario' OR id <> :id::uuid)
     ) AS exists;`,
    { replacements: { role, email, id }, type: QueryTypes.SELECT, transaction },
  );
  return Boolean(row?.exists);
}

export async function updateProfile(role: AuthRole, id: string, input: ProfileUpdateInput, transaction?: Transaction): Promise<ProfileRow | null> {
  if (role === 'admin') {
    await sequelize.query(
      `UPDATE admins
          SET nome = :nome,
              email = LOWER(:email),
              atualizado_em = NOW()
        WHERE id = :id;`,
      { replacements: { id, nome: input.nome, email: input.email }, transaction },
    );
  } else {
    await sequelize.query(
      `UPDATE voluntarios
          SET nome = :nome,
              email = LOWER(:email),
              telefone = :telefone,
              atualizado_em = NOW()
        WHERE id = :id;`,
      { replacements: { id, nome: input.nome, email: input.email, telefone: input.telefone || null }, transaction },
    );
  }
  return findProfileById(role, id, transaction);
}

export async function updateProfilePassword(role: AuthRole, id: string, passwordHash: string, transaction?: Transaction): Promise<void> {
  const table = tableForRole(role);
  await sequelize.query(
    `UPDATE ${table}
        SET senha_hash = :passwordHash,
            reset_token = NULL,
            reset_token_exp = NULL,
            tentativas_login = 0,
            bloqueado_ate = NULL,
            atualizado_em = NOW()
      WHERE id = :id;`,
    { replacements: { id, passwordHash }, transaction },
  );
}

export async function updateProfilePhoto(role: AuthRole, id: string, photoUrl: string | null, transaction?: Transaction): Promise<ProfileRow | null> {
  const table = tableForRole(role);
  await sequelize.query(
    `UPDATE ${table}
        SET foto_url = :photoUrl,
            atualizado_em = NOW()
      WHERE id = :id;`,
    { replacements: { id, photoUrl }, transaction },
  );
  return findProfileById(role, id, transaction);
}

export async function createAdminProfileLog(input: {
  adminId: string;
  action: string;
  detail?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}, transaction?: Transaction) {
  await sequelize.query(
    `INSERT INTO logs_admin (admin_id, acao, entidade, entidade_id, detalhe, ip, user_agent)
     VALUES (:adminId, :action, 'admins', :adminId, :detail, :ip, :userAgent);`,
    {
      replacements: {
        adminId: input.adminId,
        action: input.action,
        detail: JSON.stringify(input.detail || {}),
        ip: input.ip || null,
        userAgent: input.userAgent || null,
      },
      transaction,
    },
  );
}

export { sequelize };
