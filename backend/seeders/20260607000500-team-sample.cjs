'use strict';

const teamItems = [
  {
    nome: 'Coordenação Geral',
    cargo: 'Organização das ações',
    bio: 'Responsável por articular voluntários, parceiros e prioridades das ações sociais do projeto.',
    foto_url: null,
    ordem: 1,
    ativo: true,
  },
  {
    nome: 'Equipe de Voluntariado',
    cargo: 'Acolhimento e integração',
    bio: 'Acompanha novos voluntários e apoia a preparação das equipes para as atividades em campo.',
    foto_url: null,
    ordem: 2,
    ativo: true,
  },
  {
    nome: 'Equipe de Doações',
    cargo: 'Triagem e distribuição',
    bio: 'Organiza doações recebidas e apoia a montagem de kits destinados às ações.',
    foto_url: null,
    ordem: 3,
    ativo: true,
  },
  {
    nome: 'Membro em revisão',
    cargo: 'Cadastro interno',
    bio: 'Registro inativo usado para validar filtros administrativos e regra pública.',
    foto_url: null,
    ordem: 99,
    ativo: false,
  },
];

const insertSql = [
  'INSERT INTO equipe (',
  '  nome,',
  '  cargo,',
  '  bio,',
  '  foto_url,',
  '  ordem,',
  '  ativo',
  ')',
  'SELECT',
  '  :nome,',
  '  :cargo,',
  '  :bio,',
  '  :foto_url,',
  '  :ordem,',
  '  :ativo',
  'WHERE NOT EXISTS (',
  '  SELECT 1',
  '  FROM equipe',
  '  WHERE nome = :nome',
  ');',
].join('\n');

module.exports = {
  async up(queryInterface) {
    for (const item of teamItems) {
      await queryInterface.sequelize.query(insertSql, { replacements: item });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      [
        'DELETE FROM equipe',
        'WHERE nome IN (:names);',
      ].join('\n'),
      {
        replacements: {
          names: teamItems.map((item) => item.nome),
        },
      },
    );
  },
};
