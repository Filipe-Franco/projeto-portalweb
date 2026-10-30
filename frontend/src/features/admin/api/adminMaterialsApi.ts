import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';
import { env } from '@/shared/config/env';

export type AdminMaterialType = 'documento' | 'imagem' | 'video' | 'link' | 'outro';

export type AdminMaterial = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: AdminMaterialType;
  arquivo_url: string | null;
  link_externo: string | null;
  tamanho_bytes: string | null;
  publicado: boolean;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AdminMaterialPayload = {
  titulo: string;
  descricao: string;
  tipo: AdminMaterialType;
  arquivo_url: string;
  link_externo: string;
  tamanho_bytes: string;
  publicado: boolean;
};

export type AdminListResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ListAdminMaterialsParams = {
  tipo?: AdminMaterialType;
  publicado?: boolean;
  q?: string;
  page?: number;
  limit?: number;
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listAdminMaterials(params: ListAdminMaterialsParams = {}) {
  return apiGet<AdminListResponse<AdminMaterial>>('/admin/materiais', params, { headers: authHeaders() });
}
export function createAdminMaterial(payload: AdminMaterialPayload) {
  return apiPost<{ data: AdminMaterial; message: string }>('/admin/materiais', payload, { headers: authHeaders() });
}
export function updateAdminMaterial(id: string, payload: AdminMaterialPayload) {
  return apiPatch<{ data: AdminMaterial; message: string }>('/admin/materiais/' + id, payload, { headers: authHeaders() });
}
export function deleteAdminMaterial(id: string) {
  return apiDelete<{ message: string }>('/admin/materiais/' + id, { headers: authHeaders() });
}

export type AdminMaterialUploadResult = {
  data: { path: string; fileName: string; mimeType: string; tamanhoBytes: number; tipo: AdminMaterialType };
  message: string;
};

export function uploadAdminMaterialFile(payload: { fileName: string; mimeType: string; data: string }) {
  return apiPost<AdminMaterialUploadResult>('/admin/materiais/upload', payload, { headers: authHeaders() });
}

export async function downloadAdminMaterial(material: AdminMaterial) {
  const response = await fetch(env.apiBaseUrl + '/admin/materiais/' + material.id + '/download', { headers: authHeaders() });
  if (!response.ok) throw new ApiError('Não foi possível baixar o material.', response.status);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = material.arquivo_url?.split('/').pop() || material.titulo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
