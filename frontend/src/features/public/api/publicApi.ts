import { apiGet, apiPost, type ApiResponse } from '@/shared/api/client';

export type ContentItem = {
  valor: string;
  tipo: string;
  descricao: string | null;
  atualizado_em: string;
};

export type ContentMap = Record<string, ContentItem>;

export type TeamMember = {
  id: string;
  nome: string;
  cargo: string | null;
  bio: string | null;
  foto_url: string | null;
  ordem: number;
  exibir_portal?: boolean;
};

export type PublicEvent = {
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
};

export type InterestArea = {
  id: number;
  nome: string;
};

export type FaqItem = {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  ordem: number;
};

export type Donation = {
  id: string;
  tipo: string;
  descricao: string | null;
  quantidade: string | null;
  unidade: string | null;
  data_recebido: string;
  criado_em: string;
};

export type DonationLocation = {
  id: string;
  nome: string;
  endereco: string;
  horario: string | null;
  tipo: string;
  ativo: boolean;
  exibir_home: boolean;
  ordem_home: number;
};

export type GalleryItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string;
  imagem_thumb: string | null;
  data_acao: string | null;
  status: string;
};

export type VolunteerApplicationPayload = {
  nomeCompleto: string;
  cidade: string;
  telefone: string;
  email: string;
  confirmarEmail: string;
  intencao: string;
  comoSoube: string;
  areas_interesse: number[];
};

export type VolunteerApplicationResponse = {
  message: string;
  status: string;
  data: {
    id: string;
    nome: string;
    email: string;
    status: string;
    areas_interesse: InterestArea[];
    criado_em: string;
  };
};

export function getContent(query?: { prefix?: string; keys?: string }) {
  return apiGet<ApiResponse<ContentMap>>('/conteudo', query);
}

export function getTeamMembers() {
  return apiGet<ApiResponse<TeamMember[]>>('/equipe');
}

export function getPortalCoordinationMembers() {
  return apiGet<ApiResponse<TeamMember[]>>('/equipe/coordenacao');
}

export function getPublicEvents(limit?: number) {
  return apiGet<ApiResponse<PublicEvent[]>>('/eventos', {
    publico: true,
    limit,
  });
}

export function getInterestAreas() {
  return apiGet<ApiResponse<InterestArea[]>>('/areas-interesse');
}

export function createVolunteerApplication(payload: VolunteerApplicationPayload) {
  return apiPost<VolunteerApplicationResponse>('/voluntarios', payload);
}

export function getFaq() {
  return apiGet<ApiResponse<FaqItem[]>>('/faq');
}

export function getPublicDonations(limit?: number) {
  return apiGet<ApiResponse<Donation[]>>('/doacoes/publico', { limit });
}

export function getDonationLocations(params?: { home?: boolean; limit?: number }) {
  return apiGet<ApiResponse<DonationLocation[]>>('/locais-doacao', params);
}

export function getGalleryItems(limit?: number) {
  return apiGet<ApiResponse<GalleryItem[]>>('/galeria', {
    status: 'aprovada',
    limit,
  });
}
