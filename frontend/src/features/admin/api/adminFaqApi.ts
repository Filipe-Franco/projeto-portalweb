import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminFaqCategory = 'voluntariado' | 'doacoes' | 'sobre_projeto';

export type AdminFaqItem = {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: AdminFaqCategory;
  ordem: number;
  publicado: boolean;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AdminFaqListResponse = {
  data: AdminFaqItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminFaqPayload = {
  pergunta: string;
  resposta: string;
  categoria: AdminFaqCategory;
  ordem: number;
  publicado: boolean;
};

export type ListAdminFaqParams = {
  categoria?: AdminFaqCategory;
  publicado?: boolean;
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

export function listAdminFaq(params: ListAdminFaqParams = {}) {
  return apiGet<AdminFaqListResponse>('/admin/faq', params, {
    headers: authHeaders(),
  });
}

export function createAdminFaq(payload: AdminFaqPayload) {
  return apiPost<{ data: AdminFaqItem; message: string }>('/admin/faq', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminFaq(id: string, payload: AdminFaqPayload) {
  return apiPatch<{ data: AdminFaqItem; message: string }>('/admin/faq/' + id, payload, {
    headers: authHeaders(),
  });
}

export function deleteAdminFaq(id: string) {
  return apiDelete<{ message: string }>('/admin/faq/' + id, {
    headers: authHeaders(),
  });
}
