'use strict';

const galleryItems = [
  {
    titulo: 'Ação de entrega de alimentos',
    descricao: 'Registro aprovado de ação noturna',
    imagem_url: '/gallery/acao-entrega-alimentos.png',
    imagem_thumb: '/gallery/acao-entrega-alimentos.png',
    data_acao: '2026-05-18',
    status: 'aprovada',
    privacidade_ok: true,
  },
  {
    titulo: 'Registro de voluntariado',
    descricao: 'Equipe em atividade no território',
    imagem_url: '/gallery/registro-voluntariado.png',
    imagem_thumb: '/gallery/registro-voluntariado.png',
    data_acao: '2026-05-12',
    status: 'aprovada',
    privacidade_ok: true,
  },
  {
    titulo: 'Equipe preparando kits',
    descricao: 'Aguardando revisão de privacidade',
    imagem_url: '/gallery/equipe-preparando-kits.png',
    imagem_thumb: '/gallery/equipe-preparando-kits.png',
    data_acao: '2026-05-16',
    status: 'pendente',
    privacidade_ok: false,
  },
];

module.exports = {
  async up(queryInterface) {
    for (const item of galleryItems) {
      await queryInterface.sequelize.query(
        `
          INSERT INTO galeria (
            titulo,
            descricao,
            imagem_url,
            imagem_thumb,
            data_acao,
            status,
            privacidade_ok
          )
          SELECT
            :titulo,
            :descricao,
            :imagem_url,
            :imagem_thumb,
            :data_acao,
            :status::status_imagem,
            :privacidade_ok
          WHERE NOT EXISTS (
            SELECT 1
            FROM galeria
            WHERE imagem_url = :imagem_url
          );
        `,
        { replacements: item },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
        DELETE FROM galeria
        WHERE imagem_url IN (:urls);
      `,
      {
        replacements: {
          urls: galleryItems.map((item) => item.imagem_url),
        },
      },
    );
  },
};
