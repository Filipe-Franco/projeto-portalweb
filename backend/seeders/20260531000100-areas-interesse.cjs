'use strict';

const areasInteresse = [
  'Acolhimento nas ruas',
  'Preparação de alimentos',
  'Distribuição de refeições',
  'Triagem de doações',
  'Logística e transporte',
  'Comunicação e redes sociais',
  'Captação de doações',
  'Organização de eventos',
  'Apoio administrativo',
  'Fotografia e registros',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `
        INSERT INTO areas_interesse (nome, ativo)
        VALUES ${areasInteresse.map((_, index) => `(:nome${index}, TRUE)`).join(', ')}
        ON CONFLICT (nome) DO UPDATE SET ativo = EXCLUDED.ativo;
      `,
      {
        replacements: Object.fromEntries(
          areasInteresse.map((nome, index) => [`nome${index}`, nome]),
        ),
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
        DELETE FROM areas_interesse
        WHERE nome IN (:nomes);
      `,
      {
        replacements: {
          nomes: areasInteresse,
        },
      },
    );
  },
};
