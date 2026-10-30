'use strict';

const announcementItems = [
  {
    titulo: 'Orientações para a próxima saída',
    corpo: 'Chegue com 15 minutos de antecedência, leve documento e avise a coordenação caso precise alterar sua presença.',
    fixado: true,
    publicado: true,
  },
  {
    titulo: 'Campanha de cobertores',
    corpo: 'Estamos organizando uma campanha especial de cobertores. Voluntários podem ajudar na triagem e divulgação.',
    fixado: false,
    publicado: true,
  },
  {
    titulo: 'Treinamento de abordagem',
    corpo: 'Rascunho do convite para capacitação interna de novos voluntários.',
    fixado: false,
    publicado: false,
  },
];

module.exports = {
  async up(queryInterface) {
    for (const item of announcementItems) {
      await queryInterface.sequelize.query(
        [
          'INSERT INTO comunicados (titulo, corpo, fixado, publicado)',
          'SELECT :titulo, :corpo, :fixado, :publicado',
          'WHERE NOT EXISTS (SELECT 1 FROM comunicados WHERE titulo = :titulo);',
        ].join('\n'),
        { replacements: item },
      );
    }
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM comunicados WHERE titulo IN (:titles);', { replacements: { titles: announcementItems.map((item) => item.titulo) } });
  },
};
