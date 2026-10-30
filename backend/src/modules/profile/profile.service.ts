import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import type { AuthRole } from '../auth/auth.types.js';
import {
  createAdminProfileLog,
  emailExistsForOtherProfile,
  findProfileById,
  sequelize,
  updateProfile,
  updateProfilePassword,
  updateProfilePhoto,
  type ProfileRow,
} from './profile.repository.js';

type RequestMeta = { ip?: string | null; userAgent?: string | null };
type ProfilePayload = { nome?: unknown; email?: unknown; telefone?: unknown };
type PasswordPayload = { senhaAtual?: unknown; currentPassword?: unknown; novaSenha?: unknown; newPassword?: unknown };
type PhotoPayload = { fileName?: unknown; mimeType?: unknown; data?: unknown };

const PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublicProfile(row: ProfileRow) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    foto_url: row.foto_url,
    role: row.role,
  };
}

function normalizeProfilePayload(payload: ProfilePayload, role: AuthRole) {
  const nome = String(payload.nome || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const telefone = role === 'voluntario' ? String(payload.telefone || '').trim() : null;

  if (!nome || nome.length < 3 || nome.length > 120) {
    throw new AppError('Informe um nome com 3 a 120 caracteres.', 422, 'INVALID_PROFILE_NAME');
  }
  if (!validateEmail(email)) {
    throw new AppError('Informe um e-mail válido.', 422, 'INVALID_PROFILE_EMAIL');
  }
  if (telefone && telefone.length > 30) {
    throw new AppError('Telefone deve ter no máximo 30 caracteres.', 422, 'INVALID_PROFILE_PHONE');
  }

  return { nome, email, telefone };
}

function validateNewPassword(password: string) {
  if (!password || password.length < 8) {
    throw new AppError('A nova senha precisa ter pelo menos 8 caracteres.', 422, 'INVALID_PASSWORD');
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError('A nova senha precisa conter letras e números.', 422, 'WEAK_PASSWORD');
  }
}

function hasValidPhotoSignature(buffer: Buffer, extension: string) {
  if (extension === 'jpg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === 'webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function normalizePhotoPayload(payload: PhotoPayload) {
  const mimeType = String(payload.mimeType || '').trim().toLowerCase();
  const extension = PHOTO_TYPES[mimeType];
  const data = String(payload.data || '').trim();

  if (!extension) {
    throw new AppError('Envie uma foto JPG, PNG ou WEBP.', 422, 'INVALID_PROFILE_PHOTO_TYPE');
  }
  if (!data) {
    throw new AppError('Foto não informada.', 422, 'INVALID_PROFILE_PHOTO');
  }

  const base64 = data.includes(',') ? data.split(',').pop() || '' : data;
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) {
    throw new AppError('Conteúdo da foto inválido.', 422, 'INVALID_PROFILE_PHOTO');
  }

  const buffer = Buffer.from(base64, 'base64');
  const maxBytes = Math.min(env.maxUploadMb * 1024 * 1024, 2 * 1024 * 1024);
  if (!buffer.length) {
    throw new AppError('Foto inválida.', 422, 'INVALID_PROFILE_PHOTO');
  }
  if (buffer.length > maxBytes) {
    throw new AppError('A foto deve ter no máximo 2MB.', 413, 'PROFILE_PHOTO_TOO_LARGE');
  }
  if (!hasValidPhotoSignature(buffer, extension)) {
    throw new AppError('Assinatura da foto não confere com o formato informado.', 422, 'PROFILE_PHOTO_SIGNATURE_MISMATCH');
  }

  return { buffer, extension, mimeType };
}

function profilePhotoFolder(role: AuthRole) {
  return path.resolve(env.uploadDir, 'profile', role);
}

function profilePhotoUrl(role: AuthRole, fileName: string) {
  return '/uploads/profile/' + role + '/' + fileName;
}

function resolveProfilePhotoPath(role: AuthRole, fotoUrl: string) {
  const fileName = path.basename(String(fotoUrl || ''));
  if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(fileName)) {
    throw new AppError('Foto não encontrada.', 404, 'PROFILE_PHOTO_NOT_FOUND');
  }
  const folder = profilePhotoFolder(role);
  const filePath = path.resolve(folder, fileName);
  if (!filePath.startsWith(folder + path.sep)) {
    throw new AppError('Foto não encontrada.', 404, 'PROFILE_PHOTO_NOT_FOUND');
  }
  return { filePath, fileName };
}

async function removeOldPhoto(role: AuthRole, fotoUrl: string | null) {
  if (!fotoUrl || !fotoUrl.startsWith('/uploads/profile/' + role + '/')) return;
  try {
    const { filePath } = resolveProfilePhotoPath(role, fotoUrl);
    await fs.unlink(filePath).catch(() => undefined);
  } catch {
    // ignore malformed legacy values
  }
}

export async function getProfile(role: AuthRole, id: string) {
  const profile = await findProfileById(role, id);
  if (!profile) throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
  return { data: toPublicProfile(profile) };
}

export async function updateCurrentProfile(role: AuthRole, id: string, payload: ProfilePayload, meta: RequestMeta) {
  const input = normalizeProfilePayload(payload, role);
  return sequelize.transaction(async (transaction) => {
    const current = await findProfileById(role, id, transaction);
    if (!current) throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
    const emailExists = await emailExistsForOtherProfile(role, input.email, id, transaction);
    if (emailExists) throw new AppError('Já existe uma conta com este e-mail.', 409, 'PROFILE_EMAIL_EXISTS');
    const updated = await updateProfile(role, id, input, transaction);
    if (role === 'admin') {
      await createAdminProfileLog({ adminId: id, action: 'perfil.editar', detail: { previousEmail: current.email, email: input.email }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    }
    return { data: toPublicProfile(updated as ProfileRow), message: 'Perfil atualizado.' };
  });
}

export async function changeCurrentPassword(role: AuthRole, id: string, payload: PasswordPayload, meta: RequestMeta) {
  const currentPassword = String(payload.senhaAtual || payload.currentPassword || '');
  const newPassword = String(payload.novaSenha || payload.newPassword || '');
  if (!currentPassword) throw new AppError('Informe a senha atual.', 422, 'CURRENT_PASSWORD_REQUIRED');
  validateNewPassword(newPassword);

  return sequelize.transaction(async (transaction) => {
    const current = await findProfileById(role, id, transaction);
    if (!current) throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
    const matches = await bcrypt.compare(currentPassword, current.senha_hash || '');
    if (!matches) throw new AppError('Senha atual inválida.', 401, 'INVALID_CURRENT_PASSWORD');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await updateProfilePassword(role, id, passwordHash, transaction);
    if (role === 'admin') {
      await createAdminProfileLog({ adminId: id, action: 'perfil.senha', detail: {}, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    }
    return { message: 'Senha alterada.' };
  });
}

export async function uploadCurrentProfilePhoto(role: AuthRole, id: string, payload: PhotoPayload, meta: RequestMeta) {
  const upload = normalizePhotoPayload(payload);
  const folder = profilePhotoFolder(role);
  const fileName = crypto.randomUUID() + '.' + upload.extension;
  const filePath = path.join(folder, fileName);

  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(filePath, upload.buffer, { mode: 0o600 });

  try {
    return await sequelize.transaction(async (transaction) => {
      const current = await findProfileById(role, id, transaction);
      if (!current) throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
      const photoUrl = profilePhotoUrl(role, fileName);
      const updated = await updateProfilePhoto(role, id, photoUrl, transaction);
      await removeOldPhoto(role, current.foto_url);
      if (role === 'admin') {
        await createAdminProfileLog({ adminId: id, action: 'perfil.foto', detail: {}, ip: meta.ip, userAgent: meta.userAgent }, transaction);
      }
      return { data: toPublicProfile(updated as ProfileRow), message: 'Foto atualizada.' };
    });
  } catch (error) {
    await fs.unlink(filePath).catch(() => undefined);
    throw error;
  }
}

export async function getCurrentProfilePhoto(role: AuthRole, id: string) {
  const current = await findProfileById(role, id);
  if (!current?.foto_url) throw new AppError('Foto não encontrada.', 404, 'PROFILE_PHOTO_NOT_FOUND');
  const resolved = resolveProfilePhotoPath(role, current.foto_url);
  await fs.access(resolved.filePath).catch(() => {
    throw new AppError('Foto não encontrada no servidor.', 404, 'PROFILE_PHOTO_NOT_FOUND');
  });
  return resolved;
}
