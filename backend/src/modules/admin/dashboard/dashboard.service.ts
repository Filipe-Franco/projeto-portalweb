import { getDashboardMetrics, listNextEvents, listPendingVolunteers } from './dashboard.repository.js';

function toNumber(value: unknown) {
  return Number(value || 0);
}

export async function getAdminDashboard() {
  const [metricsRow, pendingVolunteers, nextEvents] = await Promise.all([
    getDashboardMetrics(),
    listPendingVolunteers(),
    listNextEvents(),
  ]);

  const metrics = {
    voluntariosPendentes: toNumber(metricsRow?.voluntarios_pendentes),
    voluntariosTotal: toNumber(metricsRow?.voluntarios_total),
    eventosMes: toNumber(metricsRow?.eventos_mes),
    doacoesMes: toNumber(metricsRow?.doacoes_mes),
    doacoesDinheiroMes: toNumber(metricsRow?.doacoes_dinheiro_mes),
    imagensPendentes: toNumber(metricsRow?.imagens_pendentes),
    uploadsPendentes: toNumber(metricsRow?.uploads_pendentes),
    comunicadosRascunho: toNumber(metricsRow?.comunicados_rascunho),
  };

  return {
    data: {
      metrics,
      pendingVolunteers,
      nextEvents,
      operationalPendings: [
        { key: 'uploads', label: metrics.uploadsPendentes + ' upload(s) aguardando aprovação', value: metrics.uploadsPendentes, href: '/admin/uploads', status: 'Pendente' },
        { key: 'galeria', label: metrics.imagensPendentes + ' imagem(ns) aguardando revisão', value: metrics.imagensPendentes, href: '/admin/galeria', status: 'Pendente' },
        { key: 'comunicados', label: metrics.comunicadosRascunho + ' comunicado(s) em rascunho', value: metrics.comunicadosRascunho, href: '/admin/comunicados', status: 'Rascunho' },
      ],
    },
  };
}
