import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminAnnouncement = {
  id: string;
  titulo: string;
  corpo: string;
  fixado: boolean;
  publicado: boolean;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
  leituras: string;
};

export type AdminAnnouncementPayload = {
  titulo: string;
  corpo: string;
  fixado: boolean;
  publicado: boolean;
};

export type AdminAnnouncementReading = {
  voluntario_id: string;
  voluntario_nome: string;
  voluntario_email: string;
  lido_em: string;
};

export type AdminListResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ListAdminAnnouncementsParams = {
  fixado?: boolean;
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

export function listAdminAnnouncements(params: ListAdminAnnouncementsParams = {}) {
  return apiGet<AdminListResponse<AdminAnnouncement>>('/admin/comunicados', params, { headers: authHeaders() });
}
export function createAdminAnnouncement(payload: AdminAnnouncementPayload) {
  return apiPost<{ data: AdminAnnouncement; message: string }>('/admin/comunicados', payload, { headers: authHeaders() });
}
export function updateAdminAnnouncement(id: string, payload: AdminAnnouncementPayload) {
  return apiPatch<{ data: AdminAnnouncement; message: string }>('/admin/comunicados/' + id, payload, { headers: authHeaders() });
}
export function deleteAdminAnnouncement(id: string) {
  return apiDelete<{ message: string }>('/admin/comunicados/' + id, { headers: authHeaders() });
}
export function listAdminAnnouncementReadings(id: string) {
  return apiGet<{ data: AdminAnnouncementReading[] }>('/admin/comunicados/' + id + '/leituras', undefined, { headers: authHeaders() });
}
