import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminEventType = 'fixo_semanal' | 'especial' | 'avulso';

export type AdminEvent = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: AdminEventType;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  imagem_url: string | null;
  recorrente: boolean;
  dia_semana: number | null;
  publico: boolean;
  publicado: boolean;
  admin_id: string | null;
  criado_em: string;
  atualizado_em: string;
  confirmados: string;
  presentes: string;
  ausentes: string;
  cancelados: string;
};

export type AdminEventPayload = {
  titulo: string;
  descricao: string;
  tipo: AdminEventType;
  data_inicio: string;
  data_fim: string;
  local: string;
  imagem_url: string;
  recorrente: boolean;
  dia_semana: number | null;
  publico: boolean;
  publicado: boolean;
};

export type AdminEventAttendance = {
  id: string;
  voluntario_id: string;
  voluntario_nome: string;
  voluntario_email: string;
  status: string;
  observacao: string | null;
  atualizado_em: string;
};

export type AdminListResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ListAdminEventsParams = {
  tipo?: AdminEventType;
  publico?: boolean;
  publicado?: boolean;
  q?: string;
  start?: string;
  end?: string;
  page?: number;
  limit?: number;
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listAdminEvents(params: ListAdminEventsParams = {}) {
  return apiGet<AdminListResponse<AdminEvent>>('/admin/eventos', params, { headers: authHeaders() });
}
export function createAdminEvent(payload: AdminEventPayload) {
  return apiPost<{ data: AdminEvent; message: string }>('/admin/eventos', payload, { headers: authHeaders() });
}
export function updateAdminEvent(id: string, payload: AdminEventPayload) {
  return apiPatch<{ data: AdminEvent; message: string }>('/admin/eventos/' + id, payload, { headers: authHeaders() });
}
export function deleteAdminEvent(id: string) {
  return apiDelete<{ message: string }>('/admin/eventos/' + id, { headers: authHeaders() });
}
export function listAdminEventAttendances(id: string) {
  return apiGet<{ data: AdminEventAttendance[] }>('/admin/eventos/' + id + '/presencas', undefined, { headers: authHeaders() });
}
