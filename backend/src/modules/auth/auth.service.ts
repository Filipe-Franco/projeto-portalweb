import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { env, isProduction } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import {
  activateVolunteerAccount,
  enqueuePasswordResetEmail,
  findAdminByEmail,
  findAdminById,
  findVolunteerByInviteToken,
  findUserByResetToken,
  findVolunteerByEmail,
  findVolunteerById,
  registerFailedLogin,
  resetLoginAttempts,
  storeResetToken,
  updatePasswordAndClearResetToken,
  type AdminAuthRow,
  type VolunteerInviteRow,
  type VolunteerAuthRow,
} from './auth.repository.js';
import type {
  ActivateAccountPayload,
  AuthRole,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  TokenPayload,
} from './auth.types.js';

const MAX_LOGIN_ATTEMPTS = 5;
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRES_MINUTES = 60;

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePassword(payload: LoginPayload | ResetPasswordPayload | ActivateAccountPayload): string {
  return String(payload.senha || payload.password || '');
}

function validateLoginPayload(payload: LoginPayload) {
  const email = normalizeEmail(payload.email);
  const password = normalizePassword(payload);

  if (!validateEmail(email)) {
    throw new AppError('Informe um e-mail válido.', 422, 'INVALID_EMAIL');
  }

  if (!password || password.length < 6) {
    throw new AppError('Informe uma senha com pelo menos 6 caracteres.', 422, 'INVALID_PASSWORD');
  }

  return { email, password };
}

function validateNewPassword(password: string) {
  if (!password || password.length < 8) {
    throw new AppError('A nova senha precisa ter pelo menos 8 caracteres.', 422, 'INVALID_PASSWORD');
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError('A nova senha precisa conter letras e números.', 422, 'WEAK_PASSWORD');
  }
}

function isLockedUntilFuture(lockedUntil: Date | null): boolean {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}

function toAuthUser(user: AdminAuthRow | VolunteerAuthRow, role: AuthRole): AuthUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role,
  };
}

function inviteUserToAuthUser(user: VolunteerInviteRow): AuthUser {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: 'voluntario',
  };
}

function signToken(user: AuthUser) {
  const expiresIn = user.role === 'admin' ? env.jwtAdminExpiresIn : env.jwtExpiresIn;
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };

  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    {
      ...options,
      subject: user.id,
    },
  );
}

function tokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createResetToken() {
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  return {
    token,
    hash: tokenHash(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000),
  };
}

async function handleFailedLogin(role: AuthRole, user: AdminAuthRow | VolunteerAuthRow): Promise<void> {
  const nextAttempts = Number(user.tentativas_login || 0) + 1;
  await registerFailedLogin(role, user.id, nextAttempts >= MAX_LOGIN_ATTEMPTS);
}

async function loginWithUser(role: AuthRole, user: AdminAuthRow | VolunteerAuthRow | null, password: string) {
  if (!user) {
    throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
  }

  if (isLockedUntilFuture(user.bloqueado_ate)) {
    throw new AppError('Conta bloqueada temporariamente. Tente novamente em alguns minutos.', 423, 'ACCOUNT_LOCKED');
  }

  if (role === 'admin' && !(user as AdminAuthRow).ativo) {
    throw new AppError('Conta administrativa inativa.', 403, 'ADMIN_INACTIVE');
  }

  if (role === 'voluntario') {
    const volunteer = user as VolunteerAuthRow;

    if (volunteer.status !== 'aprovado') {
      throw new AppError('Seu cadastro ainda não está aprovado para acesso ao portal.', 403, 'VOLUNTEER_NOT_APPROVED');
    }

    if (!volunteer.senha_hash) {
      throw new AppError('Sua conta ainda precisa ser ativada antes do primeiro acesso.', 403, 'VOLUNTEER_NOT_ACTIVATED');
    }
  }

  const passwordMatches = await bcrypt.compare(password, user.senha_hash || '');

  if (!passwordMatches) {
    await handleFailedLogin(role, user);
    throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
  }

  await resetLoginAttempts(role, user.id);

  const authUser = toAuthUser(user, role);

  return {
    token: signToken(authUser),
    user: authUser,
  };
}

export async function loginAdmin(payload: LoginPayload) {
  const { email, password } = validateLoginPayload(payload);
  const admin = await findAdminByEmail(email);
  return loginWithUser('admin', admin, password);
}

export async function loginVolunteer(payload: LoginPayload) {
  const { email, password } = validateLoginPayload(payload);
  const volunteer = await findVolunteerByEmail(email);
  return loginWithUser('voluntario', volunteer, password);
}

export async function verifyAuthToken(token: string): Promise<AuthUser> {
  let decoded: TokenPayload;

  try {
    decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    throw new AppError('Token inválido ou expirado.', 401, 'INVALID_TOKEN');
  }

  if (!decoded.sub || (decoded.role !== 'admin' && decoded.role !== 'voluntario')) {
    throw new AppError('Token inválido.', 401, 'INVALID_TOKEN');
  }

  const user = decoded.role === 'admin'
    ? await findAdminById(decoded.sub)
    : await findVolunteerById(decoded.sub);

  if (!user) {
    throw new AppError('Usuário não encontrado.', 401, 'AUTH_USER_NOT_FOUND');
  }

  if (decoded.role === 'admin' && !user.ativo) {
    throw new AppError('Conta administrativa inativa.', 403, 'ADMIN_INACTIVE');
  }

  if (decoded.role === 'voluntario' && user.status !== 'aprovado') {
    throw new AppError('Voluntário sem permissão de acesso.', 403, 'VOLUNTEER_NOT_APPROVED');
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: decoded.role,
  };
}

async function findResetCandidate(role: AuthRole, email: string) {
  return role === 'admin' ? findAdminByEmail(email) : findVolunteerByEmail(email);
}

export async function requestPasswordReset(role: AuthRole, payload: ForgotPasswordPayload) {
  const email = normalizeEmail(payload.email);

  if (!validateEmail(email)) {
    throw new AppError('Informe um e-mail válido.', 422, 'INVALID_EMAIL');
  }

  const user = await findResetCandidate(role, email);

  if (user) {
    const canReset = role === 'admin'
      ? (user as AdminAuthRow).ativo
      : (user as VolunteerAuthRow).status === 'aprovado';

    if (canReset) {
      const reset = createResetToken();
      await storeResetToken(role, user.id, reset.hash, reset.expiresAt);

      const resetPath = role === 'admin' ? '/admin/login' : '/portal/login';
      const resetUrl = `${env.publicSiteUrl}${resetPath}?resetToken=${reset.token}`;
      const subject = 'Recuperação de senha - Portal Anjos da Madrugada';
      const body = [
        `Olá, ${user.nome}.`,
        '',
        'Recebemos uma solicitação para redefinir sua senha.',
        `Use este link para criar uma nova senha: ${resetUrl}`,
        '',
        `Este link expira em ${RESET_TOKEN_EXPIRES_MINUTES} minutos.`,
      ].join('\\n');

      await enqueuePasswordResetEmail(
        user.email,
        subject,
        body,
        role === 'voluntario' ? user.id : undefined,
      );

      if (!isProduction) {
        console.log(`[auth] reset password link for ${role}: ${resetUrl}`);
      }
    }
  }

  return {
    message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
  };
}

export async function resetPassword(role: AuthRole, payload: ResetPasswordPayload) {
  const token = String(payload.token || '').trim();
  const password = normalizePassword(payload);

  if (!token) {
    throw new AppError('Token de recuperação inválido.', 422, 'INVALID_RESET_TOKEN');
  }

  validateNewPassword(password);

  const user = await findUserByResetToken(role, tokenHash(token));

  if (!user) {
    throw new AppError('Token de recuperação inválido ou expirado.', 401, 'INVALID_RESET_TOKEN');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await updatePasswordAndClearResetToken(role, user.id, passwordHash);

  return {
    message: 'Senha redefinida com sucesso.',
  };
}

export async function activateVolunteer(payload: ActivateAccountPayload) {
  const token = String(payload.token || '').trim();
  const password = normalizePassword(payload);

  if (!token) {
    throw new AppError('Token de ativação inválido.', 422, 'INVALID_INVITE_TOKEN');
  }

  validateNewPassword(password);

  const volunteer = await findVolunteerByInviteToken(tokenHash(token));

  if (!volunteer) {
    throw new AppError('Token de ativação inválido ou expirado.', 401, 'INVALID_INVITE_TOKEN');
  }

  if (volunteer.senha_hash) {
    throw new AppError('Conta já ativada. Faça login ou redefina sua senha.', 409, 'VOLUNTEER_ALREADY_ACTIVATED');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await activateVolunteerAccount(volunteer.id, passwordHash);

  const user = inviteUserToAuthUser(volunteer);

  return {
    token: signToken(user),
    user,
    message: 'Conta ativada com sucesso.',
  };
}
