import type { ParsedQs } from 'qs';
import { UniqueConstraintError } from 'sequelize';

import { sequelize } from '../../config/database.js';
import { AppError } from '../../utils/AppError.js';
import {
  attachVolunteerAreas,
  createVolunteer,
  emailExistsInAdminsOrVolunteers,
  findActiveDonationLocations,
  findActiveInterestAreas,
  findHomeDonationLocations,
  findActiveTeamMembers,
  findPortalCoordinationMembers,
  findContent,
  findGalleryItems,
  findInterestAreasByIds,
  findPublicDonations,
  findPublicEvents,
  findPublishedFaq,
  type ContentRow,
  type InterestAreaRow,
} from './public.repository.js';

const MAX_MESSAGE_LENGTH = 500;
const VALID_GALLERY_STATUS = new Set(['aprovada', 'pendente', 'rejeitada']);

type UnknownRecord = Record<string, unknown>;

type VolunteerPayload = UnknownRecord & {
  nome?: unknown;
  nomeCompleto?: unknown;
  email?: unknown;
  confirmarEmail?: unknown;
  confirmar_email?: unknown;
  telefone?: unknown;
  mensagem?: unknown;
  intencao?: unknown;
  cidade?: unknown;
  comoSoube?: unknown;
  como_soube?: unknown;
  areas_interesse?: unknown;
  areasInteresse?: unknown;
  areaIds?: unknown;
};

type NormalizedVolunteerPayload = {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string | null;
  areasInteresse: number[];
};

type ContentResponse = Record<
  string,
  {
    valor: string;
    tipo: string;
    descricao: string | null;
    atualizado_em: Date;
  }
>;

function queryValue(value: string | ParsedQs | (string | ParsedQs)[] | undefined): string {
  if (Array.isArray(value)) {
    return String(value[0] || '');
  }

  return typeof value === 'string' ? value : '';
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAreaIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0 && id <= 32767,
  );
}

function normalizeLimit(value: unknown, fallback: number | null = null, max = 100): number | null {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(Array.isArray(value) ? value[0] : value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError('O parâmetro limit deve ser um inteiro positivo.', 422, 'INVALID_LIMIT');
  }

  return Math.min(parsed, max);
}

function parseKeys(value: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function buildVolunteerMessage(payload: VolunteerPayload): string {
  const message = String(payload.mensagem || payload.intencao || '').trim();
  const cidade = String(payload.cidade || '').trim();
  const comoSoube = String(payload.comoSoube || payload.como_soube || '').trim();

  const parts = [
    message,
    cidade ? `Cidade: ${cidade}` : '',
    comoSoube ? `Como soube: ${comoSoube}` : '',
  ].filter(Boolean);

  return parts.join('\n').slice(0, MAX_MESSAGE_LENGTH);
}

function normalizeVolunteerPayload(payload: VolunteerPayload): NormalizedVolunteerPayload {
  const nome = String(payload.nome || payload.nomeCompleto || '').trim();
  const email = normalizeEmail(payload.email);
  const confirmarEmail = normalizeEmail(payload.confirmarEmail || payload.confirmar_email);
  const telefone = String(payload.telefone || '').trim();
  const mensagem = buildVolunteerMessage(payload);
  const areasInteresse = normalizeAreaIds(
    payload.areas_interesse || payload.areasInteresse || payload.areaIds,
  );

  if (!nome || nome.length < 3) {
    throw new AppError('Informe um nome com pelo menos 3 caracteres.', 422, 'INVALID_NAME');
  }

  if (!validateEmail(email)) {
    throw new AppError('Informe um e-mail válido.', 422, 'INVALID_EMAIL');
  }

  if (confirmarEmail && confirmarEmail !== email) {
    throw new AppError('A confirmação de e-mail não confere.', 422, 'EMAIL_CONFIRMATION_MISMATCH');
  }

  if (!telefone) {
    throw new AppError('Informe um telefone para contato.', 422, 'INVALID_PHONE');
  }

  if (mensagem.length > MAX_MESSAGE_LENGTH) {
    throw new AppError('A mensagem deve ter no máximo 500 caracteres.', 422, 'INVALID_MESSAGE');
  }

  return {
    nome,
    email,
    telefone,
    mensagem: mensagem || null,
    areasInteresse,
  };
}

export async function listContent(query: ParsedQs): Promise<ContentResponse> {
  const prefix = queryValue(query.prefix).trim();
  const keys = parseKeys(queryValue(query.keys));
  const rows = await findContent({ prefix, keys });

  return rows.reduce<ContentResponse>((acc, row: ContentRow) => {
    acc[row.chave] = {
      valor: row.valor,
      tipo: row.tipo,
      descricao: row.descricao,
      atualizado_em: row.atualizado_em,
    };
    return acc;
  }, {});
}

export async function listTeamMembers() {
  return findActiveTeamMembers();
}

export async function listPortalCoordination() {
  return findPortalCoordinationMembers();
}

export async function listPublicEvents(query: ParsedQs) {
  const publico = query.publico === undefined ? true : queryValue(query.publico) === 'true';
  const limit = normalizeLimit(query.limit, null, 50);

  return findPublicEvents({ onlyPublic: publico, limit });
}

export async function listInterestAreas(): Promise<InterestAreaRow[]> {
  return findActiveInterestAreas();
}

export async function createVolunteerApplication(payload: VolunteerPayload) {
  const volunteer = normalizeVolunteerPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const emailAlreadyExists = await emailExistsInAdminsOrVolunteers(volunteer.email, transaction);

    if (emailAlreadyExists) {
      throw new AppError('Já existe uma conta ou cadastro com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const validAreas = await findInterestAreasByIds(volunteer.areasInteresse, transaction);

    if (validAreas.length !== volunteer.areasInteresse.length) {
      throw new AppError('Uma ou mais áreas de interesse são inválidas.', 422, 'INVALID_INTEREST_AREAS');
    }

    try {
      const createdVolunteer = await createVolunteer(
        {
          nome: volunteer.nome,
          email: volunteer.email,
          telefone: volunteer.telefone,
          mensagem: volunteer.mensagem,
        },
        transaction,
      );

      await attachVolunteerAreas(createdVolunteer.id, volunteer.areasInteresse, transaction);

      return {
        message: 'Cadastro recebido! Nossa equipe entrará em contato em breve.',
        status: createdVolunteer.status,
        data: {
          id: createdVolunteer.id,
          nome: createdVolunteer.nome,
          email: createdVolunteer.email,
          status: createdVolunteer.status,
          areas_interesse: validAreas,
          criado_em: createdVolunteer.criado_em,
        },
      };
    } catch (error) {
      if (error instanceof UniqueConstraintError || (error as { parent?: { code?: string } })?.parent?.code === '23505') {
        throw new AppError('Já existe uma conta ou cadastro com este e-mail.', 409, 'EMAIL_ALREADY_EXISTS');
      }

      throw error;
    }
  });
}

export async function listFaq() {
  return findPublishedFaq();
}

export async function listPublicDonations(query: ParsedQs) {
  const limit = normalizeLimit(query.limit, null, 100);
  return findPublicDonations({ limit });
}

export async function listDonationLocations(query: ParsedQs) {
  const onlyHome = queryValue(query.home).trim() === 'true';

  if (onlyHome) {
    const limit = normalizeLimit(query.limit, 2, 10) || 2;
    return findHomeDonationLocations({ limit });
  }

  return findActiveDonationLocations();
}

export async function listGallery(query: ParsedQs) {
  const status = queryValue(query.status || 'aprovada').trim();
  const limit = normalizeLimit(query.limit, null, 100);

  if (!VALID_GALLERY_STATUS.has(status)) {
    throw new AppError('Status de galeria inválido.', 422, 'INVALID_GALLERY_STATUS');
  }

  return findGalleryItems({ status, limit });
}
