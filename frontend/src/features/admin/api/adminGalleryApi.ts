import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminGalleryStatus = 'pendente' | 'aprovada' | 'rejeitada';

export type AdminGalleryItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string;
  imagem_thumb: string | null;
  data_acao: string | null;
  status: AdminGalleryStatus;
  privacidade_ok: boolean;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AdminGalleryListResponse = {
  data: AdminGalleryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminGalleryUploadResponse = {
  data: {
    url: string;
    path: string;
  };
  message: string;
};

export type AdminGalleryPayload = {
  titulo: string;
  descricao: string;
  imagem_url: string;
  imagem_thumb: string;
  data_acao: string;
  status: AdminGalleryStatus;
  privacidade_ok: boolean;
};

export type ListAdminGalleryParams = {
  status?: AdminGalleryStatus;
  privacidadeOk?: boolean;
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

export function listAdminGallery(params: ListAdminGalleryParams = {}) {
  return apiGet<AdminGalleryListResponse>('/admin/galeria', params, {
    headers: authHeaders(),
  });
}

export function uploadAdminGalleryImage(payload: { fileName: string; mimeType: string; data: string }) {
  return apiPost<AdminGalleryUploadResponse>('/admin/galeria/upload', payload, {
    headers: authHeaders(),
  });
}

export function createAdminGallery(payload: AdminGalleryPayload) {
  return apiPost<{ data: AdminGalleryItem; message: string }>('/admin/galeria', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminGallery(id: string, payload: AdminGalleryPayload) {
  return apiPatch<{ data: AdminGalleryItem; message: string }>('/admin/galeria/' + id, payload, {
    headers: authHeaders(),
  });
}

export function deleteAdminGallery(id: string) {
  return apiDelete<{ message: string }>('/admin/galeria/' + id, {
    headers: authHeaders(),
  });
}
