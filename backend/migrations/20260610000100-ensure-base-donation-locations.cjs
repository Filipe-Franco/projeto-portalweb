'use strict';

const baseLocations = [
  {
    nome: 'Base Anjos da Madrugada',
    endereco: 'Rua Central, 120 - Centro',
    horario: 'Segunda a sexta, 9h às 18h',
    tipo: 'outros',
    ativo: true,
    exibir_home: true,
    ordem_home: 1,
  },
  {
    nome: 'Centro Comunitário Parceiro',
    endereco: 'Av. Brasil, 450 - Bairro Centro',
    horario: 'Sábados, 9h às 12h',
    tipo: 'alimento',
    ativo: true,
    exibir_home: true,
    ordem_home: 2,
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const item of baseLocations) {
      await queryInterface.sequelize.query(
        [
          'INSERT INTO locais_doacao (nome, endereco, horario, tipo, ativo, exibir_home, ordem_home)',
          'SELECT :nome, :endereco, :horario, :tipo::tipo_doacao, :ativo, :exibir_home, :ordem_home',
          'WHERE NOT EXISTS (SELECT 1 FROM locais_doacao WHERE nome = :nome);',
          '',
          'UPDATE locais_doacao',
          'SET endereco = :endereco,',
          '    horario = :horario,',
          '    tipo = :tipo::tipo_doacao,',
          '    ativo = :ativo,',
          '    exibir_home = :exibir_home,',
          '    ordem_home = :ordem_home,',
          '    atualizado_em = NOW()',
          'WHERE nome = :nome;',
        ].join('\n'),
        { replacements: item },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DELETE FROM locais_doacao WHERE nome IN (:names);',
      { replacements: { names: baseLocations.map((item) => item.nome) } },
    );
  },
};
