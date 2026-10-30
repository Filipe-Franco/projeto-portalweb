import { AppError } from '../../../utils/AppError.js';
import { findPublishedEventById, listPortalEvents, upsertPresence } from './events.repository.js';

const PRESENCE_STATUSES = ['confirmado', 'ausente', 'cancelado'] as const;
type PresenceStatus = typeof PRESENCE_STATUSES[number];

type PresencePayload = { status?: unknown; observacao?: unknown };

function normalizePresenceStatus(value: unknown): PresenceStatus {
  const normalized = String(value || '').trim().toLowerCase();
  const aliases: Record<string, PresenceStatus> = {
    confirmado: 'confirmado',
    confirmed: 'confirmado',
    sim: 'confirmado',
    maybe: 'ausente',
    talvez: 'ausente',
    ausente: 'ausente',
    declined: 'cancelado',
    nao: 'cancelado',
    não: 'cancelado',
    cancelado: 'cancelado',
  };
  const status = aliases[normalized];
  if (!status) throw new AppError('Status de presença inválido.', 422, 'INVALID_PRESENCE_STATUS');
  return status;
}

export async function listVolunteerEvents(volunteerId: string) {
  return { data: await listPortalEvents(volunteerId) };
}

export async function setVolunteerPresence(eventId: string, volunteerId: string, payload: PresencePayload) {
  const event = await findPublishedEventById(eventId);
  if (!event) throw new AppError('Evento não encontrado.', 404, 'EVENT_NOT_FOUND');
  const status = normalizePresenceStatus(payload.status);
  const observacao = String(payload.observacao || '').trim().slice(0, 1000) || null;
  const data = await upsertPresence({ eventId, volunteerId, status, observacao });
  return { data, message: 'Presença atualizada.' };
}
