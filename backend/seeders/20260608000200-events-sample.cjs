'use strict';

const eventItems = [
  {
    titulo: 'Ação pública de acolhimento',
    descricao: 'Distribuição de refeições, água e itens de higiene na região central.',
    tipo: 'avulso',
    data_inicio: '2026-06-14T22:00:00.000Z',
    data_fim: '2026-06-15T01:00:00.000Z',
    local: 'Centro de São Leopoldo',
    imagem_url: null,
    recorrente: false,
    dia_semana: null,
    publico: true,
    publicado: true,
  },
  {
    titulo: 'Triagem interna de doações',
    descricao: 'Separação de roupas, cobertores e alimentos para as próximas ações.',
    tipo: 'especial',
    data_inicio: '2026-06-18T22:30:00.000Z',
    data_fim: '2026-06-19T00:00:00.000Z',
    local: 'Sede operacional',
    imagem_url: null,
    recorrente: false,
    dia_semana: null,
    publico: false,
    publicado: true,
  },
  {
    titulo: 'Saída semanal dos voluntários',
    descricao: 'Ação semanal de acolhimento e alimentação para pessoas em situação de rua.',
    tipo: 'fixo_semanal',
    data_inicio: '2026-06-21T22:00:00.000Z',
    data_fim: '2026-06-22T01:00:00.000Z',
    local: 'Praça do Imigrante',
    imagem_url: null,
    recorrente: true,
    dia_semana: 0,
    publico: true,
    publicado: true,
  },
  {
    titulo: 'Reunião de coordenação',
    descricao: 'Alinhamento interno de responsáveis por áreas.',
    tipo: 'avulso',
    data_inicio: '2026-06-25T22:30:00.000Z',
    data_fim: '2026-06-26T00:00:00.000Z',
    local: 'Sala de reuniões',
    imagem_url: null,
    recorrente: false,
    dia_semana: null,
    publico: false,
    publicado: false,
  },
];


module.exports = {
  async up(queryInterface) {
    for (const item of eventItems) {
      await queryInterface.sequelize.query(
        [
          'INSERT INTO eventos (titulo, descricao, tipo, data_inicio, data_fim, local, imagem_url, recorrente, dia_semana, publico, publicado)',
          'SELECT :titulo, :descricao, :tipo::tipo_evento, :data_inicio, :data_fim, :local, :imagem_url, :recorrente, :dia_semana, :publico, :publicado',
          'WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE titulo = :titulo AND data_inicio = :data_inicio::timestamptz);',
        ].join('\n'),
        { replacements: item },
      );
    }
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM eventos WHERE titulo IN (:titles);', { replacements: { titles: eventItems.map((item) => item.titulo) } });
  },
};
