'use strict';

const faqItems = [
  {
    pergunta: 'Como posso me tornar voluntário?',
    resposta: 'Preencha o cadastro público na página Seja Voluntário. A equipe administrativa revisa as informações e, após aprovação, libera o acesso ao portal do voluntário.',
    categoria: 'voluntariado',
    ordem: 1,
    publicado: true,
  },
  {
    pergunta: 'Preciso ter experiência prévia para participar?',
    resposta: 'Não. O mais importante é ter disponibilidade, responsabilidade e vontade de colaborar. A equipe orienta novos voluntários antes da participação nas ações.',
    categoria: 'voluntariado',
    ordem: 2,
    publicado: true,
  },
  {
    pergunta: 'Com que frequência posso participar das ações?',
    resposta: 'A participação pode ser combinada conforme a disponibilidade de cada voluntário e a agenda das ações. O portal do voluntário ajuda a acompanhar comunicados e oportunidades.',
    categoria: 'voluntariado',
    ordem: 3,
    publicado: true,
  },
  {
    pergunta: 'Como posso fazer uma doação?',
    resposta: 'Você pode contribuir por meio dos canais informados na página de doações ou entregar itens em um local de doação ativo cadastrado no portal.',
    categoria: 'doacoes',
    ordem: 1,
    publicado: true,
  },
  {
    pergunta: 'Quais itens costumam ser aceitos?',
    resposta: 'Em geral, são aceitos alimentos não perecíveis, roupas em bom estado, cobertores, calçados e itens de higiene. Antes de entregar grandes volumes, recomendamos confirmar a necessidade atual com a equipe.',
    categoria: 'doacoes',
    ordem: 2,
    publicado: true,
  },
  {
    pergunta: 'Onde posso entregar minha doação?',
    resposta: 'Consulte a página de doações para ver os locais ativos, endereços e horários de recebimento. Essa lista é mantida pelo painel administrativo.',
    categoria: 'doacoes',
    ordem: 3,
    publicado: true,
  },
  {
    pergunta: 'Onde o projeto atua?',
    resposta: 'O projeto atua em ações de apoio social organizadas pela equipe, com foco em pessoas em situação de vulnerabilidade e comunidades atendidas pelas iniciativas cadastradas no portal.',
    categoria: 'sobre_projeto',
    ordem: 1,
    publicado: true,
  },
  {
    pergunta: 'Como o projeto é mantido?',
    resposta: 'O projeto é mantido por doações, parcerias e pelo trabalho voluntário. As informações públicas do portal são atualizadas a partir dos cadastros feitos no painel administrativo.',
    categoria: 'sobre_projeto',
    ordem: 2,
    publicado: true,
  },
  {
    pergunta: 'Esta pergunta é um rascunho de validação?',
    resposta: 'Este registro fica disponível apenas no painel administrativo para validar filtro de status e não deve aparecer no portal público.',
    categoria: 'sobre_projeto',
    ordem: 99,
    publicado: false,
  },
];

const insertSql = [
  'INSERT INTO faq (',
  '  pergunta,',
  '  resposta,',
  '  categoria,',
  '  ordem,',
  '  publicado',
  ')',
  'SELECT',
  '  :pergunta,',
  '  :resposta,',
  '  :categoria::categoria_faq,',
  '  :ordem,',
  '  :publicado',
  'WHERE NOT EXISTS (',
  '  SELECT 1',
  '  FROM faq',
  '  WHERE pergunta = :pergunta',
  ');',
].join('\n');

const deleteSql = [
  'DELETE FROM faq',
  'WHERE pergunta IN (:perguntas);',
].join('\n');

module.exports = {
  async up(queryInterface) {
    for (const item of faqItems) {
      await queryInterface.sequelize.query(insertSql, { replacements: item });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(deleteSql, {
      replacements: {
        perguntas: faqItems.map((item) => item.pergunta),
      },
    });
  },
};
