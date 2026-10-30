import { QueryTypes } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type PortalEventRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: Date;
  data_fim: Date | null;
  local: string | null;
  imagem_url: string | null;
  recorrente: boolean;
  dia_semana: number | null;
  publico: boolean;
  publicado: boolean;
  minha_presenca: string | null;
  confirmados: string;
};

export async function listPortalEvents(volunteerId: string): Promise<PortalEventRow[]> {
  return sequelize.query<PortalEventRow>(
    `
      SELECT e.id, e.titulo, e.descricao, e.tipo, e.data_inicio, e.data_fim, e.local, e.imagem_url, e.recorrente, e.dia_semana, e.publico, e.publicado,
        my.status AS minha_presenca,
        COUNT(ep.id) FILTER (WHERE ep.status IN ('confirmado', 'presente'))::text AS confirmados
      FROM eventos e
      LEFT JOIN evento_presencas my ON my.evento_id = e.id AND my.voluntario_id = :volunteerId
      LEFT JOIN evento_presencas ep ON ep.evento_id = e.id
      WHERE e.publicado = TRUE
      GROUP BY e.id, my.status
      ORDER BY e.data_inicio ASC;
    `,
    { replacements: { volunteerId }, type: QueryTypes.SELECT },
  );
}

export async function findPublishedEventById(id: string): Promise<{ id: string } | null> {
  const [row] = await sequelize.query<{ id: string }>(
    'SELECT id FROM eventos WHERE id = :id AND publicado = TRUE LIMIT 1;',
    { replacements: { id }, type: QueryTypes.SELECT },
  );
  return row || null;
}

export async function upsertPresence(input: { eventId: string; volunteerId: string; status: string; observacao: string | null }) {
  const [row] = await sequelize.query<{ evento_id: string; voluntario_id: string; status: string; observacao: string | null; atualizado_em: Date }>(
    `
      INSERT INTO evento_presencas (evento_id, voluntario_id, status, observacao)
      VALUES (:eventId, :volunteerId, :status::status_presenca, :observacao)
      ON CONFLICT (evento_id, voluntario_id) DO UPDATE
      SET status = EXCLUDED.status,
          observacao = EXCLUDED.observacao,
          atualizado_em = NOW()
      RETURNING evento_id, voluntario_id, status, observacao, atualizado_em;
    `,
    { replacements: input, type: QueryTypes.SELECT },
  );
  return row;
}
