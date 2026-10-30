'use strict';

const contentItems = [
  {
    chave: 'pix_chave',
    valor: 'pix@anjosdamadrugada.org.br',
    tipo: 'texto',
    descricao: 'Chave PIX exibida na página de doações',
  },
  {
    chave: 'pix_nome_recebedor',
    valor: 'MITRA DA DIOCESE DE NOVO HAMBURGO',
    tipo: 'texto',
    descricao: 'Nome do recebedor exibido nos dados bancários',
  },
  {
    chave: 'sobre_intro',
    valor: 'O Anjos da Madrugada nasceu do desejo de fazer a diferença na vida das pessoas em situação de vulnerabilidade. Em ações organizadas por voluntários, levamos alimento, cuidado e presença para quem mais precisa.',
    tipo: 'texto',
    descricao: 'Texto introdutório da página Sobre',
  },
  {
    chave: 'sobre_missao',
    valor: 'Nossa missão é promover dignidade, esperança e acolhimento humano, unindo assistência material, escuta respeitosa e trabalho voluntário comprometido com a transformação social.',
    tipo: 'texto',
    descricao: 'Texto de missão da página Sobre',
  },
  {
    chave: 'footer_contato_email',
    valor: 'contato@anjosdamadrugada.org.br',
    tipo: 'texto',
    descricao: 'E-mail institucional para uso em blocos públicos futuros',
  },
];

const upsertSql = [
  'INSERT INTO conteudo (',
  '  chave,',
  '  valor,',
  '  tipo,',
  '  descricao',
  ')',
  'VALUES (',
  '  :chave,',
  '  :valor,',
  '  :tipo::tipo_conteudo,',
  '  :descricao',
  ')',
  'ON CONFLICT (chave) DO UPDATE',
  'SET valor = EXCLUDED.valor,',
  '    tipo = EXCLUDED.tipo,',
  '    descricao = EXCLUDED.descricao,',
  '    atualizado_em = NOW();',
].join('\n');

module.exports = {
  async up(queryInterface) {
    for (const item of contentItems) {
      await queryInterface.sequelize.query(upsertSql, { replacements: item });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      [
        'DELETE FROM conteudo',
        'WHERE chave IN (:keys);',
      ].join('\n'),
      {
        replacements: {
          keys: contentItems.map((item) => item.chave),
        },
      },
    );
  },
};
