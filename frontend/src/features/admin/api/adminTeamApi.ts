import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminTeamMember = {
  id: string;
  nome: string;
  cargo: string | null;
  bio: string | null;
  foto_url: string | null;
  ordem: number;
  ativo: boolean;
  exibir_portal: boolean;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AdminTeamListResponse = {
  data: AdminTeamMember[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminTeamPayload = {
  nome: string;
  cargo: string;
  bio: string;
  foto_url: string;
  ordem: number;
  ativo: boolean;
  exibir_portal: boolean;
};

export type ListAdminTeamParams = {
  ativo?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

function authHeaders() {
  const token = getAuthToken();

  if (!token) {
    throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  }

  return { Authorization: 'Bearer ' + token };
}

export function listAdminTeam(params: ListAdminTeamParams = {}) {
  return apiGet<AdminTeamListResponse>('/admin/equipe', params, {
    headers: authHeaders(),
  });
}

export function createAdminTeamMember(payload: AdminTeamPayload) {
  return apiPost<{ data: AdminTeamMember; message: string }>('/admin/equipe', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminTeamMember(id: string, payload: AdminTeamPayload) {
  return apiPatch<{ data: AdminTeamMember; message: string }>('/admin/equipe/' + id, payload, {
    headers: authHeaders(),
  });
}

export function deleteAdminTeamMember(id: string) {
  return apiDelete<{ message: string }>('/admin/equipe/' + id, {
    headers: authHeaders(),
  });
}
