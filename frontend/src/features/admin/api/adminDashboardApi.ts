import { ApiError, apiGet } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminDashboardData = {
  metrics: {
    voluntariosPendentes: number;
    voluntariosTotal: number;
    eventosMes: number;
    doacoesMes: number;
    doacoesDinheiroMes: number;
    imagensPendentes: number;
    uploadsPendentes: number;
    comunicadosRascunho: number;
  };
  pendingVolunteers: Array<{ id: string; nome: string; email: string; telefone: string | null; criado_em: string }>;
  nextEvents: Array<{ id: string; titulo: string; data_inicio: string; local: string | null; publico: boolean; publicado: boolean }>;
  operationalPendings: Array<{ key: string; label: string; value: number; href: string; status: string }>;
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function getAdminDashboard() {
  return apiGet<{ data: AdminDashboardData }>('/admin/dashboard', undefined, { headers: authHeaders() });
}
