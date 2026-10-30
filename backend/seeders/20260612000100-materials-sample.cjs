"use strict";

const materialItems = [
  {
    titulo: 'Manual de abordagem humanizada',
    descricao: 'Orientações práticas para acolhimento, escuta e cuidado durante as ações.',
    tipo: 'documento',
    arquivo_url: 'https://example.com/materiais/manual-abordagem-humanizada.pdf',
    link_externo: null,
    tamanho_bytes: 1250000,
    publicado: true,
  },
  {
    titulo: 'Lista de contatos de apoio',
    descricao: 'Contatos úteis para apoio operacional e encaminhamentos durante as ações.',
    tipo: 'documento',
    arquivo_url: 'https://example.com/materiais/contatos-apoio.xlsx',
    link_externo: null,
    tamanho_bytes: 320000,
    publicado: true,
  },
  {
    titulo: 'Treinamento introdutório para voluntários',
    descricao: 'Vídeo de orientação para novos voluntários aprovados.',
    tipo: 'video',
    arquivo_url: null,
    link_externo: 'https://example.com/treinamento/voluntarios',
    tamanho_bytes: null,
    publicado: true,
  },
  {
    titulo: 'Modelo de relatório de ação',
    descricao: 'Modelo interno para registro de atividades após uma ação.',
    tipo: 'documento',
    arquivo_url: 'https://example.com/materiais/modelo-relatorio.docx',
    link_externo: null,
    tamanho_bytes: 210000,
    publicado: false,
  },
];

module.exports = {
  async up(queryInterface) {
    for (const item of materialItems) {
      await queryInterface.sequelize.query(
        [
          'INSERT INTO materiais (titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes, publicado)',
          'SELECT :titulo, :descricao, :tipo::tipo_material, :arquivo_url, :link_externo, :tamanho_bytes, :publicado',
          'WHERE NOT EXISTS (SELECT 1 FROM materiais WHERE titulo = :titulo);',
        ].join('\n'),
        { replacements: item },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DELETE FROM materiais WHERE titulo IN (:titles);',
      { replacements: { titles: materialItems.map((item) => item.titulo) } },
    );
  },
};
