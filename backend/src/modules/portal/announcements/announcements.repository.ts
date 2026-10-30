import { QueryTypes } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type PortalAnnouncementRow = {
  id: string;
  titulo: string;
  corpo: string;
  fixado: boolean;
  publicado: boolean;
  criado_em: Date;
  atualizado_em: Date;
  lido_em: Date | null;
};

export async function listPortalAnnouncements(volunteerId: string): Promise<PortalAnnouncementRow[]> {
  return sequelize.query<PortalAnnouncementRow>(
    `
      SELECT c.id, c.titulo, c.corpo, c.fixado, c.publicado, c.criado_em, c.atualizado_em, cl.lido_em
      FROM comunicados c
      LEFT JOIN comunicado_leituras cl ON cl.comunicado_id = c.id AND cl.voluntario_id = :volunteerId
      WHERE c.publicado = TRUE
      ORDER BY c.fixado DESC, c.criado_em DESC;
    `,
    { replacements: { volunteerId }, type: QueryTypes.SELECT },
  );
}

export async function findPublishedAnnouncementById(id: string): Promise<{ id: string } | null> {
  const [row] = await sequelize.query<{ id: string }>('SELECT id FROM comunicados WHERE id = :id AND publicado = TRUE LIMIT 1;', { replacements: { id }, type: QueryTypes.SELECT });
  return row || null;
}

export async function markAnnouncementRead(id: string, volunteerId: string) {
  await sequelize.query(
    `
      INSERT INTO comunicado_leituras (comunicado_id, voluntario_id)
      VALUES (:id, :volunteerId)
      ON CONFLICT (comunicado_id, voluntario_id) DO UPDATE
      SET lido_em = EXCLUDED.lido_em;
    `,
    { replacements: { id, volunteerId } },
  );
}
