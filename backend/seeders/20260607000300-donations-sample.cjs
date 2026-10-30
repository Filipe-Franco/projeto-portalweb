'use strict';

const donationItems = [
  {
    tipo: 'alimento',
    descricao: 'Arroz e feijão para montagem de kits',
    quantidade: 45,
    unidade: 'kg',
    doador_nome: 'Campanha comunitária',
    data_recebido: '2026-06-01',
  },
  {
    tipo: 'roupa',
    descricao: 'Casacos e roupas de inverno em bom estado',
    quantidade: 32,
    unidade: 'un',
    doador_nome: 'Doação espontânea',
    data_recebido: '2026-06-02',
  },
  {
    tipo: 'dinheiro',
    descricao: 'Contribuição financeira para compra de alimentos',
    quantidade: 250,
    unidade: 'R$',
    doador_nome: 'PIX',
    data_recebido: '2026-06-03',
  },
  {
    tipo: 'outros',
    descricao: 'Itens de higiene pessoal',
    quantidade: 18,
    unidade: 'kits',
    doador_nome: 'Parceiro local',
    data_recebido: '2026-06-04',
  },
];

const locationItems = [
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
  {
    nome: 'Ponto de coleta em revisão',
    endereco: 'Rua das Flores, 88 - Bairro Norte',
    horario: 'Pausado temporariamente',
    tipo: 'outros',
    ativo: false,
    exibir_home: false,
    ordem_home: 0,
  },
];

const insertDonationSql = [
  'INSERT INTO doacoes (',
  '  tipo,',
  '  descricao,',
  '  quantidade,',
  '  unidade,',
  '  doador_nome,',
  '  data_recebido',
  ')',
  'SELECT',
  '  :tipo::tipo_doacao,',
  '  :descricao,',
  '  :quantidade,',
  '  :unidade,',
  '  :doador_nome,',
  '  :data_recebido',
  'WHERE NOT EXISTS (',
  '  SELECT 1',
  '  FROM doacoes',
  '  WHERE descricao = :descricao',
  '    AND data_recebido = :data_recebido::date',
  ');',
].join('\n');

const insertLocationSql = [
  'INSERT INTO locais_doacao (',
  '  nome,',
  '  endereco,',
  '  horario,',
  '  tipo,',
  '  ativo,',
  '  exibir_home,',
  '  ordem_home',
  ')',
  'SELECT',
  '  :nome,',
  '  :endereco,',
  '  :horario,',
  '  :tipo::tipo_doacao,',
  '  :ativo,',
  '  :exibir_home,',
  '  :ordem_home',
  'WHERE NOT EXISTS (',
  '  SELECT 1',
  '  FROM locais_doacao',
  '  WHERE nome = :nome',
  ');',
].join('\n');

module.exports = {
  async up(queryInterface) {
    for (const item of donationItems) {
      await queryInterface.sequelize.query(insertDonationSql, { replacements: item });
    }

    for (const item of locationItems) {
      await queryInterface.sequelize.query(insertLocationSql, { replacements: item });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      [
        'DELETE FROM doacoes',
        'WHERE descricao IN (:descriptions);',
      ].join('\n'),
      {
        replacements: {
          descriptions: donationItems.map((item) => item.descricao),
        },
      },
    );

    await queryInterface.sequelize.query(
      [
        'DELETE FROM locais_doacao',
        'WHERE nome IN (:names);',
      ].join('\n'),
      {
        replacements: {
          names: locationItems.map((item) => item.nome),
        },
      },
    );
  },
};
