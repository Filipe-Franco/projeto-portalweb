import { ApiError, apiGet } from '@/shared/api/client';
import { getAuthToken } from '@/features/auth/authSession';
import { env } from '@/shared/config/env';

export type PortalMaterial = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  arquivo_url: string | null;
  link_externo: string | null;
  tamanho_bytes: string | null;
  publicado: boolean;
  criado_em: string;
  atualizado_em: string;
};

function authHeaders() {
  const token = getAuthToken();
  if (!token) throw new ApiError('Sessão de voluntário não encontrada. Faça login novamente.', 401, 'MISSING_SESSION');
  return { Authorization: 'Bearer ' + token };
}

export function listPortalMaterials() {
  return apiGet<{ data: PortalMaterial[] }>('/portal/materiais', undefined, { headers: authHeaders() });
}

export async function downloadPortalMaterial(material: PortalMaterial) {
  const response = await fetch(env.apiBaseUrl + '/portal/materiais/' + material.id + '/download', { headers: authHeaders() });
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
