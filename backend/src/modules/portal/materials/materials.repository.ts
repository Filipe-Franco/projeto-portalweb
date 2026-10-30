import { QueryTypes } from 'sequelize';

import { sequelize } from '../../../config/database.js';

export type PortalMaterialRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  arquivo_url: string | null;
  link_externo: string | null;
  tamanho_bytes: string | null;
  publicado: boolean;
  criado_em: Date;
  atualizado_em: Date;
};

export async function listPublishedMaterials(): Promise<PortalMaterialRow[]> {
  return sequelize.query<PortalMaterialRow>(
    `
      SELECT id, titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes::text, publicado, criado_em, atualizado_em
      FROM materiais
      WHERE publicado = TRUE
      ORDER BY atualizado_em DESC, criado_em DESC;
    `,
    { type: QueryTypes.SELECT },
  );
}

export async function findPublishedMaterialById(id: string): Promise<PortalMaterialRow | null> {
  const [row] = await sequelize.query<PortalMaterialRow>(
    'SELECT id, titulo, descricao, tipo, arquivo_url, link_externo, tamanho_bytes::text, publicado, criado_em, atualizado_em FROM materiais WHERE id = :id AND publicado = TRUE LIMIT 1;',
    { replacements: { id }, type: QueryTypes.SELECT },
  );
  return row || null;
}
