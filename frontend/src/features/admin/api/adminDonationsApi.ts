import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';

export type DonationType = 'alimento' | 'roupa' | 'dinheiro' | 'outros';

export type AdminDonation = {
  id: string;
  tipo: DonationType;
  descricao: string | null;
  quantidade: string | null;
  unidade: string | null;
  doador_nome: string | null;
  data_recebido: string;
  admin_id: string | null;
  criado_em: string;
};

export type AdminDonationLocation = {
  id: string;
  nome: string;
  endereco: string;
  horario: string | null;
  tipo: DonationType;
  ativo: boolean;
  exibir_home: boolean;
  ordem_home: number;
  criado_em: string;
  atualizado_em: string;
};

export type AdminDonationSummary = {
  monthDonations: number;
  foodAmount: number;
  moneyAmount: number;
  moneyCount: number;
  activeLocations: number;
  homeLocations: number;
};

export type AdminListResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminDonationPayload = {
  tipo: DonationType;
  descricao: string;
  quantidade: string;
  unidade: string;
  doador_nome: string;
  data_recebido: string;
};

export type AdminDonationLocationPayload = {
  nome: string;
  endereco: string;
  horario: string;
  tipo: DonationType;
  ativo: boolean;
  exibir_home: boolean;
  ordem_home: number;
};

export type ListAdminDonationsParams = {
  tipo?: DonationType;
  q?: string;
  page?: number;
  limit?: number;
};

export type ListAdminDonationLocationsParams = ListAdminDonationsParams & {
  ativo?: boolean;
};

function authHeaders() {
  const token = getAuthToken();

  if (!token) {
    throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  }

  return { Authorization: 'Bearer ' + token };
}

export function listAdminDonations(params: ListAdminDonationsParams = {}) {
  return apiGet<AdminListResponse<AdminDonation>>('/admin/doacoes', params, {
    headers: authHeaders(),
  });
}

export function getAdminDonationSummary() {
  return apiGet<{ data: AdminDonationSummary }>('/admin/doacoes/resumo', undefined, {
    headers: authHeaders(),
  });
}

export function createAdminDonation(payload: AdminDonationPayload) {
  return apiPost<{ data: AdminDonation; message: string }>('/admin/doacoes', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminDonation(id: string, payload: AdminDonationPayload) {
  return apiPatch<{ data: AdminDonation; message: string }>('/admin/doacoes/' + id, payload, {
    headers: authHeaders(),
  });
}

export function deleteAdminDonation(id: string) {
  return apiDelete<{ message: string }>('/admin/doacoes/' + id, {
    headers: authHeaders(),
  });
}

export function listAdminDonationLocations(params: ListAdminDonationLocationsParams = {}) {
  return apiGet<AdminListResponse<AdminDonationLocation>>('/admin/locais-doacao', params, {
    headers: authHeaders(),
  });
}

export function createAdminDonationLocation(payload: AdminDonationLocationPayload) {
  return apiPost<{ data: AdminDonationLocation; message: string }>('/admin/locais-doacao', payload, {
    headers: authHeaders(),
  });
}

export function updateAdminDonationLocation(id: string, payload: AdminDonationLocationPayload) {
  return apiPatch<{ data: AdminDonationLocation; message: string }>('/admin/locais-doacao/' + id, payload, {
    headers: authHeaders(),
  });
}

export function deleteAdminDonationLocation(id: string) {
  return apiDelete<{ message: string }>('/admin/locais-doacao/' + id, {
    headers: authHeaders(),
  });
}
