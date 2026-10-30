import { QueryTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';

export type PendingEmailRow = {
  id: string;
  destinatario: string;
  assunto: string;
  corpo: string;
  tentativas: number;
};

export async function listPendingEmails(limit: number, maxAttempts: number): Promise<PendingEmailRow[]> {
  return sequelize.query<PendingEmailRow>(
    `
      SELECT id::text, destinatario, assunto, corpo, tentativas
      FROM notificacoes_email
      WHERE status = 'pendente'
        AND tentativas < :maxAttempts
      ORDER BY criado_em ASC
      LIMIT :limit;
    `,
    { replacements: { limit, maxAttempts }, type: QueryTypes.SELECT },
  );
}

export async function markEmailSent(id: string): Promise<void> {
  await sequelize.query(
    `
      UPDATE notificacoes_email
      SET status = 'enviado',
          enviado_em = NOW(),
          erro_msg = NULL
      WHERE id = :id;
    `,
    { replacements: { id } },
  );
}

export async function markEmailFailed(id: string, errorMessage: string, maxAttempts: number): Promise<void> {
  await sequelize.query(
    `
      UPDATE notificacoes_email
      SET tentativas = tentativas + 1,
          status = CASE WHEN tentativas + 1 >= :maxAttempts THEN 'erro'::status_notificacao ELSE 'pendente'::status_notificacao END,
          erro_msg = :errorMessage
      WHERE id = :id;
    `,
    { replacements: { id, errorMessage: errorMessage.slice(0, 2000), maxAttempts } },
  );
}
