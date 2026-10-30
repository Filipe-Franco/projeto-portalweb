import { ApiError, apiGet, apiPatch } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type PortalPresenceStatus = 'confirmado' | 'ausente' | 'cancelado';

export type PortalEvent = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  imagem_url: string | null;
  recorrente: boolean;
  dia_semana: number | null;
  publico: boolean;
  publicado: boolean;
  minha_presenca: PortalPresenceStatus | null;
  confirmados: string;
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão de voluntário não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listPortalEvents() {
  return apiGet<{ data: PortalEvent[] }>('/portal/eventos', undefined, { headers: authHeaders() });
}
export function setPortalEventPresence(id: string, status: PortalPresenceStatus) {
  return apiPatch<{ message: string }>('/portal/eventos/' + id + '/presenca', { status }, { headers: authHeaders() });
}
