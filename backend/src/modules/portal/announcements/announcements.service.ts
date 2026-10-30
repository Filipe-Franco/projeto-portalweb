import { AppError } from '../../../utils/AppError.js';
import { findPublishedAnnouncementById, listPortalAnnouncements, markAnnouncementRead } from './announcements.repository.js';

export async function listVolunteerAnnouncements(volunteerId: string) {
  return { data: await listPortalAnnouncements(volunteerId) };
}

export async function markVolunteerAnnouncementRead(id: string, volunteerId: string) {
  const item = await findPublishedAnnouncementById(id);
  if (!item) throw new AppError('Comunicado não encontrado.', 404, 'ANNOUNCEMENT_NOT_FOUND');
  await markAnnouncementRead(id, volunteerId);
  return { message: 'Leitura registrada.' };
}
