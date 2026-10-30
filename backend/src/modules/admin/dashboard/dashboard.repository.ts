import { QueryTypes } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type DashboardMetricsRow = {
  voluntarios_pendentes: string;
  voluntarios_total: string;
  eventos_mes: string;
  doacoes_mes: string;
  doacoes_dinheiro_mes: string | null;
  imagens_pendentes: string;
  uploads_pendentes: string;
  comunicados_rascunho: string;
};

export type PendingVolunteerRow = { id: string; nome: string; email: string; telefone: string | null; criado_em: string };
export type NextEventRow = { id: string; titulo: string; data_inicio: string; local: string | null; publico: boolean; publicado: boolean };
export type OperationalPendingRow = { key: string; label: string; value: string; href: string; status: string };

export async function getDashboardMetrics() {
  const rows = await sequelize.query<DashboardMetricsRow>(
    `SELECT
      (SELECT COUNT(*) FROM voluntarios WHERE status = 'pendente') AS voluntarios_pendentes,
      (SELECT COUNT(*) FROM voluntarios) AS voluntarios_total,
      (SELECT COUNT(*) FROM eventos WHERE data_inicio >= date_trunc('month', NOW()) AND data_inicio < date_trunc('month', NOW()) + INTERVAL '1 month') AS eventos_mes,
      (SELECT COUNT(*) FROM doacoes WHERE data_recebido >= date_trunc('month', NOW())::date AND data_recebido < (date_trunc('month', NOW()) + INTERVAL '1 month')::date) AS doacoes_mes,
      (SELECT COALESCE(SUM(quantidade), 0) FROM doacoes WHERE tipo = 'dinheiro' AND data_recebido >= date_trunc('month', NOW())::date AND data_recebido < (date_trunc('month', NOW()) + INTERVAL '1 month')::date) AS doacoes_dinheiro_mes,
      (SELECT COUNT(*) FROM galeria WHERE status = 'pendente') AS imagens_pendentes,
      (SELECT COUNT(*) FROM uploads_voluntarios WHERE status = 'pendente') AS uploads_pendentes,
      (SELECT COUNT(*) FROM comunicados WHERE publicado = FALSE) AS comunicados_rascunho;`,
    { type: QueryTypes.SELECT },
  );
  return rows[0];
}

export async function listPendingVolunteers() {
  return sequelize.query<PendingVolunteerRow>(
    `SELECT id, nome, email, telefone, criado_em
       FROM voluntarios
      WHERE status = 'pendente'
      ORDER BY criado_em ASC
      LIMIT 5;`,
    { type: QueryTypes.SELECT },
  );
}

export async function listNextEvents() {
  return sequelize.query<NextEventRow>(
    `SELECT id, titulo, data_inicio, local, publico, publicado
       FROM eventos
      WHERE data_inicio >= NOW()
      ORDER BY data_inicio ASC
      LIMIT 5;`,
    { type: QueryTypes.SELECT },
  );
}
