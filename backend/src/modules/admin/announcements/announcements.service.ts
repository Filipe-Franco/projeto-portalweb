import { AppError } from '../../../utils/AppError.js';
import { countAnnouncements, createAdminLog, createAnnouncement, deleteAnnouncement, findAnnouncementById, listAnnouncementReadings, listAnnouncements, sequelize, updateAnnouncement } from './announcements.repository.js';

type RequestMeta = { ip?: string | null; userAgent?: string | null };
type ListAnnouncementsQuery = { fixado?: unknown; publicado?: unknown; q?: unknown; page?: unknown; limit?: unknown };
type AnnouncementPayload = { titulo?: unknown; corpo?: unknown; conteudo?: unknown; fixado?: unknown; publicado?: unknown };

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
  if (['true', '1', 'sim', 'publicado', 'fixado'].includes(normalized)) return true;
  if (['false', '0', 'nao', 'não', 'rascunho', 'normal'].includes(normalized)) return false;
  throw new AppError('Valor booleano inválido.', 422, 'INVALID_BOOLEAN');
}

function normalizeAnnouncementPayload(payload: AnnouncementPayload, adminId: string) {
  const titulo = String(payload.titulo || '').trim();
  const corpo = String(payload.corpo ?? payload.conteudo ?? '').trim();

  if (!titulo || titulo.length < 3) throw new AppError('Informe um título com pelo menos 3 caracteres.', 422, 'INVALID_ANNOUNCEMENT_TITLE');
  if (titulo.length > 200) throw new AppError('O título deve ter no máximo 200 caracteres.', 422, 'INVALID_ANNOUNCEMENT_TITLE');
  if (!corpo || corpo.length < 5) throw new AppError('Informe o conteúdo do comunicado.', 422, 'INVALID_ANNOUNCEMENT_BODY');
  if (corpo.length > 20000) throw new AppError('O conteúdo deve ter no máximo 20000 caracteres.', 422, 'INVALID_ANNOUNCEMENT_BODY');

  return {
    titulo,
    corpo,
    fixado: parseBoolean(payload.fixado) ?? false,
    publicado: parseBoolean(payload.publicado) ?? true,
    adminId,
  };
}

export async function listAdminAnnouncements(query: ListAnnouncementsQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const filters = {
    fixado: parseBoolean(query.fixado),
    publicado: parseBoolean(query.publicado),
    q: normalizeSearch(query.q),
  };
  const offset = (page - 1) * limit;
  const [data, total] = await Promise.all([
    listAnnouncements({ ...filters, limit, offset }),
    countAnnouncements(filters),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getAdminAnnouncement(id: string) {
  const item = await findAnnouncementById(id);
  if (!item) throw new AppError('Comunicado não encontrado.', 404, 'ANNOUNCEMENT_NOT_FOUND');
  return item;
}

export async function createAdminAnnouncement(payload: AnnouncementPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeAnnouncementPayload(payload, adminId);
  return sequelize.transaction(async (transaction) => {
    const created = await createAnnouncement(input, transaction);
    await createAdminLog({ adminId, action: 'comunicado.criar', entity: 'comunicados', entityId: created.id, detail: { titulo: created.titulo, publicado: created.publicado }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    return { data: created, message: 'Comunicado criado.' };
  });
}

export async function updateAdminAnnouncement(id: string, payload: AnnouncementPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeAnnouncementPayload(payload, adminId);
  return sequelize.transaction(async (transaction) => {
    const current = await findAnnouncementById(id, transaction);
    if (!current) throw new AppError('Comunicado não encontrado.', 404, 'ANNOUNCEMENT_NOT_FOUND');
    const updated = await updateAnnouncement(id, input, transaction);
    if (!updated) throw new AppError('Comunicado não encontrado.', 404, 'ANNOUNCEMENT_NOT_FOUND');
    await createAdminLog({ adminId, action: 'comunicado.editar', entity: 'comunicados', entityId: updated.id, detail: { previousTitulo: current.titulo, titulo: updated.titulo }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    return { data: updated, message: 'Comunicado atualizado.' };
  });
}

export async function deleteAdminAnnouncement(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findAnnouncementById(id, transaction);
    if (!current) throw new AppError('Comunicado não encontrado.', 404, 'ANNOUNCEMENT_NOT_FOUND');
    await createAdminLog({ adminId, action: 'comunicado.excluir', entity: 'comunicados', entityId: current.id, detail: { titulo: current.titulo }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    await deleteAnnouncement(id, transaction);
    return { message: 'Comunicado excluído.' };
  });
}

export async function listAdminAnnouncementReadings(id: string) {
  const item = await findAnnouncementById(id);
  if (!item) throw new AppError('Comunicado não encontrado.', 404, 'ANNOUNCEMENT_NOT_FOUND');
  return { data: await listAnnouncementReadings(id) };
}
