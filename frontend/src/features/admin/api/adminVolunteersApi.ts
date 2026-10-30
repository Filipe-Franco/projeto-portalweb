import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminVolunteerStatus = 'pendente' | 'aprovado' | 'inativo' | 'suspenso' | 'rejeitado';

export type AdminVolunteerArea = {
  id: number;
  nome: string;
};

export type AdminVolunteer = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  mensagem: string | null;
  status: AdminVolunteerStatus;
  tem_senha: boolean;
  ultimo_login: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  rejeitado_por: string | null;
  rejeitado_em: string | null;
  motivo_rejeicao: string | null;
  criado_em: string;
  atualizado_em: string;
  areas: AdminVolunteerArea[];
};

export type AdminVolunteersListResponse = {
  data: AdminVolunteer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type VolunteerActionResponse = {
  volunteer: AdminVolunteer | null;
  message: string;
};

export type ListAdminVolunteersParams = {
  status?: AdminVolunteerStatus;
  q?: string;
  page?: number;
  limit?: number;
};

export type AdminVolunteerPayload = {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  mensagem: string;
  comoSoube?: string;
  areas_interesse: number[];
  status?: 'pendente' | 'aprovado';
};

function authHeaders() {
  const token = getAuthToken();

  if (!token) {
    throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  }

  return {
    Authorization: 'Bearer ' + token,
  };
}

export function listAdminVolunteers(params: ListAdminVolunteersParams = {}) {
  return apiGet<AdminVolunteersListResponse>('/admin/voluntarios', params, {
    headers: authHeaders(),
  });
}

export function approveAdminVolunteer(id: string) {
  return apiPatch<VolunteerActionResponse>('/admin/voluntarios/' + id + '/aprovar', {}, {
    headers: authHeaders(),
  });
}

export function rejectAdminVolunteer(id: string, motivo: string) {
  return apiPatch<VolunteerActionResponse>('/admin/voluntarios/' + id + '/rejeitar', { motivo }, {
    headers: authHeaders(),
  });
}

export function suspendAdminVolunteer(id: string, motivo: string) {
  return apiPatch<VolunteerActionResponse>('/admin/voluntarios/' + id + '/suspender', { motivo }, {
    headers: authHeaders(),
  });
}


export function reactivateAdminVolunteer(id: string) {
  return apiPatch<VolunteerActionResponse>('/admin/voluntarios/' + id + '/reativar', {}, {
    headers: authHeaders(),
  });
}

export function deleteAdminVolunteer(id: string) {
  return apiDelete<{ message: string }>('/admin/voluntarios/' + id, {
    headers: authHeaders(),
  });
}


export function createAdminVolunteer(payload: AdminVolunteerPayload) {
  return apiPost<VolunteerActionResponse>('/admin/voluntarios', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminVolunteer(id: string, payload: AdminVolunteerPayload) {
  return apiPatch<VolunteerActionResponse>('/admin/voluntarios/' + id, payload, {
    headers: authHeaders(),
  });
}
