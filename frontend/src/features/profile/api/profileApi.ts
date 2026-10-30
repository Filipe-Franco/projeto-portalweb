import { ApiError, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';
import { env } from '@/shared/config/env';
import type { AuthRole } from '@/features/auth/authApi';

export type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  role: AuthRole;
};

export type ProfilePayload = {
  nome: string;
  email: string;
  telefone?: string;
};

export type PasswordPayload = {
  senhaAtual: string;
  novaSenha: string;
};

function basePath(role: AuthRole) {
  return role === 'admin' ? '/admin/perfil' : '/portal/perfil';
}

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function getProfile(role: AuthRole) {
  return apiGet<{ data: Profile }>(basePath(role), undefined, { headers: authHeaders() });
}

export function updateProfile(role: AuthRole, payload: ProfilePayload) {
  return apiPatch<{ data: Profile; message: string }>(basePath(role), payload, { headers: authHeaders() });
}

export function changeProfilePassword(role: AuthRole, payload: PasswordPayload) {
  return apiPatch<{ message: string }>(basePath(role) + '/senha', payload, { headers: authHeaders() });
}

export function uploadProfilePhoto(role: AuthRole, payload: { fileName: string; mimeType: string; data: string }) {
  return apiPost<{ data: Profile; message: string }>(basePath(role) + '/foto', payload, { headers: authHeaders() });
}

export async function fetchProfilePhoto(role: AuthRole) {
  const response = await fetch(env.apiBaseUrl + basePath(role) + '/foto', { headers: authHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError('Não foi possível carregar a foto de perfil.', response.status);
  return URL.createObjectURL(await response.blob());
}
