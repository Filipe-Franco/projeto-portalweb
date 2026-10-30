import { ApiError, apiDelete, apiGet, apiPatch } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';
import { env } from '@/shared/config/env';

export type UploadStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'excluido';
export type UploadType = 'documento' | 'imagem' | 'comprovante' | 'termo' | 'outro';

export type AdminUpload = {
  id: string;
  voluntario_id: string;
  voluntario_nome?: string | null;
  voluntario_email?: string | null;
  titulo: string;
  descricao: string | null;
  tipo: UploadType;
  arquivo_nome: string | null;
  mime_type: string | null;
  tamanho_bytes: string | number | null;
  status: UploadStatus;
  motivo_rejeicao: string | null;
  motivo_exclusao: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AdminUploadsResponse = { data: AdminUpload[]; meta: { page: number; limit: number; total: number; totalPages: number } };

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão administrativa não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listAdminUploads(params: { status?: UploadStatus | 'todos'; tipo?: UploadType | 'todos'; q?: string; page?: number; limit?: number } = {}) {
  const query = { ...params, status: params.status === 'todos' ? undefined : params.status, tipo: params.tipo === 'todos' ? undefined : params.tipo };
  return apiGet<AdminUploadsResponse>('/admin/uploads', query, { headers: authHeaders() });
}

export function updateAdminUploadStatus(id: string, status: UploadStatus, motivo?: string) {
  return apiPatch<{ data: AdminUpload; message: string }>('/admin/uploads/' + id + '/status', { status, motivo }, { headers: authHeaders() });
}

export function deleteAdminUpload(id: string, motivo?: string) {
  return apiDelete<{ data: AdminUpload; message: string }>('/admin/uploads/' + id, { headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo }) });
}

export async function downloadAdminUpload(upload: AdminUpload) {
  const response = await fetch(env.apiBaseUrl + '/admin/uploads/' + upload.id + '/download', { headers: authHeaders() });
  if (!response.ok) throw new ApiError('Não foi possível baixar o arquivo.', response.status);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = upload.arquivo_nome || upload.titulo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
