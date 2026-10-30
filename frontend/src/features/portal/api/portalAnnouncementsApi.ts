import { ApiError, apiGet, apiPatch } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type PortalAnnouncement = {
  id: string;
  titulo: string;
  corpo: string;
  fixado: boolean;
  publicado: boolean;
  criado_em: string;
  atualizado_em: string;
  lido_em: string | null;
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão de voluntário não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listPortalAnnouncements() {
  return apiGet<{ data: PortalAnnouncement[] }>('/portal/comunicados', undefined, { headers: authHeaders() });
}
export function markPortalAnnouncementRead(id: string) {
  return apiPatch<{ message: string }>('/portal/comunicados/' + id + '/lido', {}, { headers: authHeaders() });
}
