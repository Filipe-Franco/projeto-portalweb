import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminContentType = 'texto' | 'html' | 'imagem' | 'url' | 'json';

export type AdminContentItem = {
  id: string;
  chave: string;
  valor: string;
  tipo: AdminContentType;
  descricao: string | null;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AdminContentListResponse = {
  data: AdminContentItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminContentPayload = {
  chave: string;
  valor: string;
  tipo: AdminContentType;
  descricao: string;
};

export type ListAdminContentParams = {
  tipo?: AdminContentType;
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

export function listAdminContent(params: ListAdminContentParams = {}) {
  return apiGet<AdminContentListResponse>('/admin/conteudo', params, {
    headers: authHeaders(),
  });
}

export function createAdminContent(payload: AdminContentPayload) {
  return apiPost<{ data: AdminContentItem; message: string }>('/admin/conteudo', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminContent(chave: string, payload: AdminContentPayload) {
  return apiPatch<{ data: AdminContentItem; message: string }>('/admin/conteudo/' + encodeURIComponent(chave), payload, {
    headers: authHeaders(),
  });
}

export function deleteAdminContent(chave: string) {
  return apiDelete<{ message: string }>('/admin/conteudo/' + encodeURIComponent(chave), {
    headers: authHeaders(),
  });
}
