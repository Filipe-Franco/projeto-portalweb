import { AppError } from '../../../utils/AppError.js';
import {
  countDonationLocations,
  countDonations,
  createAdminLog,
  createDonation,
  createDonationLocation,
  deleteDonation,
  deleteDonationLocation,
  findDonationById,
  findDonationLocationById,
  getDonationSummary,
  listDonationLocations,
  listDonations,
  sequelize,
  updateDonation,
  updateDonationLocation,
  type DonationType,
} from './donations.repository.js';

const DONATION_TYPES: DonationType[] = ['alimento', 'roupa', 'dinheiro', 'outros'];
const TYPE_ALIASES: Record<string, DonationType> = {
  alimento: 'alimento',
  alimentos: 'alimento',
  food: 'alimento',
  roupa: 'roupa',
  roupas: 'roupa',
  vestuario: 'roupa',
  vestuário: 'roupa',
  dinheiro: 'dinheiro',
  financeiro: 'dinheiro',
  pix: 'dinheiro',
  valor: 'dinheiro',
  outros: 'outros',
  outro: 'outros',
  fixo: 'outros',
  'ponto de coleta': 'outros',
};

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ListDonationsQuery = {
  tipo?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
};

type ListDonationLocationsQuery = ListDonationsQuery & {
  ativo?: unknown;
};

type DonationPayload = {
  tipo?: unknown;
  descricao?: unknown;
  quantidade?: unknown;
  unidade?: unknown;
  valor?: unknown;
  doador_nome?: unknown;
  doadorNome?: unknown;
  origem?: unknown;
  data_recebido?: unknown;
  dataRecebido?: unknown;
  data?: unknown;
};

type DonationLocationPayload = {
  nome?: unknown;
  endereco?: unknown;
  horario?: unknown;
  tipo?: unknown;
  ativo?: unknown;
  status?: unknown;
  exibir_home?: unknown;
  exibirHome?: unknown;
  ordem_home?: unknown;
  ordemHome?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function parseDonationType(value: unknown): DonationType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  const aliased = TYPE_ALIASES[normalized] || normalized;

  if (!DONATION_TYPES.includes(aliased as DonationType)) {
    throw new AppError('Tipo de doação inválido.', 422, 'INVALID_DONATION_TYPE');
  }

  return aliased as DonationType;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'sim', 'ativo', 'publicado'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'nao', 'não', 'inativo', 'rascunho'].includes(normalized)) {
    return false;
  }

  throw new AppError('Valor booleano inválido.', 422, 'INVALID_BOOLEAN');
}

function normalizeHomeOrder(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9999) {
    throw new AppError('A ordem na home deve ser um número inteiro entre 0 e 9999.', 422, 'INVALID_HOME_ORDER');
  }

  return parsed;
}

function normalizeDate(value: unknown): string {
  const raw = String(value || '').trim();

  if (!raw) {
    return new Date().toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError('A data deve estar no formato YYYY-MM-DD.', 422, 'INVALID_DATE');
  }

  const date = new Date(raw + 'T00:00:00.000Z');

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new AppError('Informe uma data válida.', 422, 'INVALID_DATE');
  }

  return raw;
}

function normalizeNullableText(value: unknown, max: number, fieldLabel: string): string | null {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (text.length > max) {
    throw new AppError(fieldLabel + ' deve ter no máximo ' + max + ' caracteres.', 422, 'INVALID_TEXT_LENGTH');
  }

  return text;
}

function normalizeQuantity(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let normalized = String(value)
    .trim()
    .replace(/[^\d,.-]/g, '');

  if (!normalized) {
    return null;
  }

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? /\./g : /,/g;
    normalized = normalized.replace(thousandsSeparator, '');
    normalized = decimalSeparator === ',' ? normalized.replace(',', '.') : normalized;
  } else if (lastComma > -1) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,(?=\d{3}(\D|$))/g, '');
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99999999.99) {
    throw new AppError('A quantidade deve ser um número positivo válido.', 422, 'INVALID_QUANTITY');
  }

  return parsed;
}

function normalizeDonationPayload(payload: DonationPayload, adminId: string) {
  const tipo = parseDonationType(payload.tipo) || 'outros';
  const descricao = normalizeNullableText(payload.descricao, 300, 'A descrição');
  const quantidade = normalizeQuantity(payload.quantidade ?? payload.valor);
  const unidade = normalizeNullableText(payload.unidade, 30, 'A unidade');
  const doadorNome = normalizeNullableText(payload.doador_nome ?? payload.doadorNome ?? payload.origem, 120, 'O nome do doador/origem');
  const dataRecebido = normalizeDate(payload.data_recebido ?? payload.dataRecebido ?? payload.data);

  if (!descricao && quantidade === null && !doadorNome) {
    throw new AppError('Informe ao menos uma descrição, quantidade ou origem da doação.', 422, 'INVALID_DONATION');
  }

  return {
    tipo,
    descricao,
    quantidade,
    unidade,
    doadorNome,
    dataRecebido,
    adminId,
  };
}

function normalizeDonationLocationPayload(payload: DonationLocationPayload) {
  const nome = String(payload.nome || '').trim();
  const endereco = String(payload.endereco || '').trim();
  const horario = normalizeNullableText(payload.horario, 200, 'O horário');
  const tipo = parseDonationType(payload.tipo) || 'outros';
  const ativo = parseBoolean(payload.ativo ?? payload.status) ?? true;
  const exibirHome = parseBoolean(payload.exibir_home ?? payload.exibirHome) ?? false;
  const ordemHome = normalizeHomeOrder(payload.ordem_home ?? payload.ordemHome);

  if (!nome || nome.length < 3) {
    throw new AppError('Informe um nome com pelo menos 3 caracteres.', 422, 'INVALID_LOCATION_NAME');
  }

  if (nome.length > 200) {
    throw new AppError('O nome deve ter no máximo 200 caracteres.', 422, 'INVALID_LOCATION_NAME');
  }

  if (!endereco || endereco.length < 5) {
    throw new AppError('Informe um endereço com pelo menos 5 caracteres.', 422, 'INVALID_LOCATION_ADDRESS');
  }

  if (endereco.length > 5000) {
    throw new AppError('O endereço deve ter no máximo 5000 caracteres.', 422, 'INVALID_LOCATION_ADDRESS');
  }

  return {
    nome,
    endereco,
    horario,
    tipo,
    ativo,
    exibirHome,
    ordemHome,
  };
}

export async function listAdminDonations(query: ListDonationsQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const tipo = parseDonationType(query.tipo);
  const q = normalizeSearch(query.q);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listDonations({ tipo, q, limit, offset }),
    countDonations({ tipo, q }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminDonationSummary() {
  const summary = await getDonationSummary();

  return {
    data: {
      monthDonations: Number(summary.month_donations || 0),
      foodAmount: Number(summary.food_amount || 0),
      moneyAmount: Number(summary.money_amount || 0),
      moneyCount: Number(summary.money_count || 0),
      activeLocations: Number(summary.active_locations || 0),
      homeLocations: Number(summary.home_locations || 0),
    },
  };
}

export async function getAdminDonation(id: string) {
  const donation = await findDonationById(id);

  if (!donation) {
    throw new AppError('Doação não encontrada.', 404, 'DONATION_NOT_FOUND');
  }

  return donation;
}

export async function createAdminDonation(payload: DonationPayload, adminId: string, meta: RequestMeta) {
  const donation = normalizeDonationPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    const created = await createDonation(donation, transaction);

    await createAdminLog({
      adminId,
      action: 'doacao.criar',
      entity: 'doacoes',
      entityId: created.id,
      detail: { tipo: created.tipo, dataRecebido: created.data_recebido },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, transaction);

    return { data: created, message: 'Doação registrada.' };
  });
}

export async function updateAdminDonation(id: string, payload: DonationPayload, adminId: string, meta: RequestMeta) {
  const donation = normalizeDonationPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    const current = await findDonationById(id, transaction);

    if (!current) {
      throw new AppError('Doação não encontrada.', 404, 'DONATION_NOT_FOUND');
    }

    const updated = await updateDonation(id, donation, transaction);

    if (!updated) {
      throw new AppError('Doação não encontrada.', 404, 'DONATION_NOT_FOUND');
    }

    await createAdminLog({
      adminId,
      action: 'doacao.editar',
      entity: 'doacoes',
      entityId: updated.id,
      detail: { previousTipo: current.tipo, previousDataRecebido: current.data_recebido },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, transaction);

    return { data: updated, message: 'Doação atualizada.' };
  });
}

export async function deleteAdminDonation(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findDonationById(id, transaction);

    if (!current) {
      throw new AppError('Doação não encontrada.', 404, 'DONATION_NOT_FOUND');
    }

    await createAdminLog({
      adminId,
      action: 'doacao.excluir',
      entity: 'doacoes',
      entityId: current.id,
      detail: { tipo: current.tipo, descricao: current.descricao },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, transaction);

    await deleteDonation(id, transaction);

    return { message: 'Doação excluída.' };
  });
}

export async function listAdminDonationLocations(query: ListDonationLocationsQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const tipo = parseDonationType(query.tipo);
  const ativo = parseBoolean(query.ativo);
  const q = normalizeSearch(query.q);
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listDonationLocations({ tipo, ativo, q, limit, offset }),
    countDonationLocations({ tipo, ativo, q }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminDonationLocation(id: string) {
  const location = await findDonationLocationById(id);

  if (!location) {
    throw new AppError('Local de doação não encontrado.', 404, 'DONATION_LOCATION_NOT_FOUND');
  }

  return location;
}

export async function createAdminDonationLocation(payload: DonationLocationPayload, adminId: string, meta: RequestMeta) {
  const location = normalizeDonationLocationPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const created = await createDonationLocation(location, transaction);

    await createAdminLog({
      adminId,
      action: 'local_doacao.criar',
      entity: 'locais_doacao',
      entityId: created.id,
      detail: { tipo: created.tipo, ativo: created.ativo, exibirHome: created.exibir_home, ordemHome: created.ordem_home },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, transaction);

    return { data: created, message: 'Local de doação criado.' };
  });
}

export async function updateAdminDonationLocation(id: string, payload: DonationLocationPayload, adminId: string, meta: RequestMeta) {
  const location = normalizeDonationLocationPayload(payload);

  return sequelize.transaction(async (transaction) => {
    const current = await findDonationLocationById(id, transaction);

    if (!current) {
      throw new AppError('Local de doação não encontrado.', 404, 'DONATION_LOCATION_NOT_FOUND');
    }

    const updated = await updateDonationLocation(id, location, transaction);

    if (!updated) {
      throw new AppError('Local de doação não encontrado.', 404, 'DONATION_LOCATION_NOT_FOUND');
    }

    await createAdminLog({
      adminId,
      action: 'local_doacao.editar',
      entity: 'locais_doacao',
      entityId: updated.id,
      detail: { previousTipo: current.tipo, previousAtivo: current.ativo, previousExibirHome: current.exibir_home, previousOrdemHome: current.ordem_home },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, transaction);

    return { data: updated, message: 'Local de doação atualizado.' };
  });
}

export async function deleteAdminDonationLocation(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findDonationLocationById(id, transaction);

    if (!current) {
      throw new AppError('Local de doação não encontrado.', 404, 'DONATION_LOCATION_NOT_FOUND');
    }

    await createAdminLog({
      adminId,
      action: 'local_doacao.excluir',
      entity: 'locais_doacao',
      entityId: current.id,
      detail: { nome: current.nome, tipo: current.tipo },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, transaction);

    await deleteDonationLocation(id, transaction);

    return { message: 'Local de doação excluído.' };
  });
}
