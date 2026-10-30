import { AppError } from '../../../utils/AppError.js';
import {
  countEvents,
  createAdminLog,
  createEvent,
  deleteEvent,
  findEventById,
  listEventAttendances,
  listEvents,
  sequelize,
  updateEvent,
  type EventType,
} from './events.repository.js';

const EVENT_TYPES: EventType[] = ['fixo_semanal', 'especial', 'avulso'];
const TYPE_ALIASES: Record<string, EventType> = {
  fixo_semanal: 'fixo_semanal',
  semanal: 'fixo_semanal',
  recorrente: 'fixo_semanal',
  especial: 'especial',
  campanha: 'especial',
  avulso: 'avulso',
  reuniao: 'avulso',
  reunião: 'avulso',
};

type RequestMeta = { ip?: string | null; userAgent?: string | null };
type ListEventsQuery = { tipo?: unknown; publico?: unknown; publicado?: unknown; q?: unknown; start?: unknown; end?: unknown; page?: unknown; limit?: unknown };
type EventPayload = {
  titulo?: unknown;
  descricao?: unknown;
  tipo?: unknown;
  data_inicio?: unknown;
  dataInicio?: unknown;
  data_fim?: unknown;
  dataFim?: unknown;
  local?: unknown;
  imagem_url?: unknown;
  imagemUrl?: unknown;
  recorrente?: unknown;
  dia_semana?: unknown;
  diaSemana?: unknown;
  publico?: unknown;
  publicado?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'sim', 'publicado', 'publico', 'público'].includes(normalized)) return true;
  if (['false', '0', 'nao', 'não', 'rascunho', 'interno'].includes(normalized)) return false;
  throw new AppError('Valor booleano inválido.', 422, 'INVALID_BOOLEAN');
}

function parseEventType(value: unknown): EventType | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  const type = TYPE_ALIASES[normalized] || normalized;
  if (!EVENT_TYPES.includes(type as EventType)) throw new AppError('Tipo de evento inválido.', 422, 'INVALID_EVENT_TYPE');
  return type as EventType;
}

function normalizeNullableText(value: unknown, max: number, label: string): string | null {
  const text = String(value || '').trim();
  if (!text) return null;
  if (text.length > max) throw new AppError(label + ' deve ter no máximo ' + max + ' caracteres.', 422, 'INVALID_TEXT_LENGTH');
  return text;
}

function normalizeDateTime(value: unknown, fieldLabel: string): string {
  const raw = String(value || '').trim();
  if (!raw) throw new AppError(fieldLabel + ' é obrigatória.', 422, 'INVALID_EVENT_DATE');
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new AppError(fieldLabel + ' deve ser uma data/hora válida.', 422, 'INVALID_EVENT_DATE');
  return date.toISOString();
}

function normalizeOptionalDateTime(value: unknown, fieldLabel: string): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return normalizeDateTime(raw, fieldLabel);
}

function normalizeDayOfWeek(value: unknown, recorrente: boolean): number | null {
  if (!recorrente) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    throw new AppError('Informe o dia da semana para evento recorrente.', 422, 'INVALID_WEEKDAY');
  }
  return parsed;
}

function normalizeEventPayload(payload: EventPayload, adminId: string) {
  const titulo = String(payload.titulo || '').trim();
  if (!titulo || titulo.length < 3) throw new AppError('Informe um título com pelo menos 3 caracteres.', 422, 'INVALID_EVENT_TITLE');
  if (titulo.length > 200) throw new AppError('O título deve ter no máximo 200 caracteres.', 422, 'INVALID_EVENT_TITLE');

  const dataInicio = normalizeDateTime(payload.data_inicio ?? payload.dataInicio, 'A data de início');
  const dataFim = normalizeOptionalDateTime(payload.data_fim ?? payload.dataFim, 'A data de fim');
  if (dataFim && new Date(dataFim) < new Date(dataInicio)) {
    throw new AppError('A data de fim não pode ser anterior ao início.', 422, 'INVALID_EVENT_END_DATE');
  }

  const recorrente = parseBoolean(payload.recorrente) ?? false;

  return {
    titulo,
    descricao: normalizeNullableText(payload.descricao, 5000, 'A descrição'),
    tipo: parseEventType(payload.tipo) || 'avulso',
    dataInicio,
    dataFim,
    local: normalizeNullableText(payload.local, 255, 'O local'),
    imagemUrl: normalizeNullableText(payload.imagem_url ?? payload.imagemUrl, 2000, 'A URL da imagem'),
    recorrente,
    diaSemana: normalizeDayOfWeek(payload.dia_semana ?? payload.diaSemana, recorrente),
    publico: parseBoolean(payload.publico) ?? true,
    publicado: parseBoolean(payload.publicado) ?? false,
    adminId,
  };
}

export async function listAdminEvents(query: ListEventsQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const filters = {
    tipo: parseEventType(query.tipo),
    publico: parseBoolean(query.publico),
    publicado: parseBoolean(query.publicado),
    q: normalizeSearch(query.q),
    start: query.start ? normalizeDateTime(query.start, 'A data inicial') : undefined,
    end: query.end ? normalizeDateTime(query.end, 'A data final') : undefined,
  };
  const offset = (page - 1) * limit;
  const [data, total] = await Promise.all([
    listEvents({ ...filters, limit, offset }),
    countEvents(filters),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getAdminEvent(id: string) {
  const event = await findEventById(id);
  if (!event) throw new AppError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND');
  return event;
}

export async function createAdminEvent(payload: EventPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeEventPayload(payload, adminId);
  return sequelize.transaction(async (transaction) => {
    const created = await createEvent(input, transaction);
    await createAdminLog({ adminId, action: 'evento.criar', entity: 'eventos', entityId: created.id, detail: { titulo: created.titulo, publico: created.publico, publicado: created.publicado }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    return { data: created, message: 'Evento criado.' };
  });
}

export async function updateAdminEvent(id: string, payload: EventPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeEventPayload(payload, adminId);
  return sequelize.transaction(async (transaction) => {
    const current = await findEventById(id, transaction);
    if (!current) throw new AppError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND');
    const updated = await updateEvent(id, input, transaction);
    if (!updated) throw new AppError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND');
    await createAdminLog({ adminId, action: 'evento.editar', entity: 'eventos', entityId: updated.id, detail: { previousTitulo: current.titulo, titulo: updated.titulo }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    return { data: updated, message: 'Evento atualizado.' };
  });
}

export async function deleteAdminEvent(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findEventById(id, transaction);
    if (!current) throw new AppError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND');
    await createAdminLog({ adminId, action: 'evento.excluir', entity: 'eventos', entityId: current.id, detail: { titulo: current.titulo }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    await deleteEvent(id, transaction);
    return { message: 'Evento excluído.' };
  });
}

export async function listAdminEventAttendances(id: string) {
  const event = await findEventById(id);
  if (!event) throw new AppError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND');
  return { data: await listEventAttendances(id) };
}
