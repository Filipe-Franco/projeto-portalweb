import { ApiError, apiGet, apiPost } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';
import { env } from '@/shared/config/env';
import type { UploadStatus, UploadType } from '@/features/admin/api/adminUploadsApi';

export type PortalUpload = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: UploadType;
  arquivo_nome: string | null;
  mime_type: string | null;
  tamanho_bytes: string | number | null;
  status: UploadStatus;
  motivo_rejeicao: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type PortalUploadPayload = { titulo: string; descricao: string; tipo: UploadType; fileName: string; mimeType: string; data: string };

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão do portal não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listPortalUploads() {
  return apiGet<{ data: PortalUpload[] }>('/portal/uploads', undefined, { headers: authHeaders() });
}

export function createPortalUpload(payload: PortalUploadPayload) {
  return apiPost<{ data: PortalUpload; message: string }>('/portal/uploads', payload, { headers: authHeaders() });
}

export async function downloadPortalUpload(upload: PortalUpload) {
  const response = await fetch(env.apiBaseUrl + '/portal/uploads/' + upload.id + '/download', { headers: authHeaders() });
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
