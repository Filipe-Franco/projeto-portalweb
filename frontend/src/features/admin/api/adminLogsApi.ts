import { ApiError, apiGet } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type AdminLog = {
  id: string;
  admin_id: string | null;
  admin_nome: string | null;
  admin_email: string | null;
  acao: string;
  entidade: string | null;
  entidade_id: string | null;
  detalhe: unknown;
  ip: string | null;
  user_agent: string | null;
  criado_em: string;
  severidade: 'Info' | 'Aviso' | 'Erro';
};

export type AdminLogsResponse = {
  data: AdminLog[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  metrics: { hoje: number; total: number; avisos: number; recentes: number };
  filters: { entities: string[]; users: Array<{ id: string; nome: string; email: string }> };
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listAdminLogs(params: { q?: string; entidade?: string; adminId?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}) {
  return apiGet<AdminLogsResponse>('/admin/logs', params, { headers: authHeaders() });
}
