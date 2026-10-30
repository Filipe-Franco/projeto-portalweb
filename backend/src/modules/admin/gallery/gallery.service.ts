import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import {
  countGallery,
  createAdminLog,
  createGallery,
  deleteGallery,
  findGalleryById,
  listGallery,
  sequelize,
  updateGallery,
  type GalleryStatus,
} from './gallery.repository.js';

const GALLERY_STATUSES: GalleryStatus[] = ['pendente', 'aprovada', 'rejeitada'];

type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ListGalleryQuery = {
  status?: unknown;
  privacidade_ok?: unknown;
  privacidadeOk?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
};

type GalleryUploadPayload = {
  fileName?: unknown;
  mimeType?: unknown;
  data?: unknown;
};

type GalleryPayload = {
  titulo?: unknown;
  descricao?: unknown;
  imagem_url?: unknown;
  imagemUrl?: unknown;
  imagem_thumb?: unknown;
  imagemThumb?: unknown;
  data_acao?: unknown;
  dataAcao?: unknown;
  status?: unknown;
  privacidade_ok?: unknown;
  privacidadeOk?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function normalizeNullableText(value: unknown, max: number, fieldLabel: string): string | null {
  const text = String(value || '').trim();

  if (!text) {
    return null;
  }

  if (text.length > max) {
    throw new AppError(fieldLabel + ' deve ter no máximo ' + max + ' caracteres.', 422, 'INVALID_TEXT_LENGTH');
  }

  return text;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'sim', 'aprovada', 'publicado'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'nao', 'não', 'pendente', 'rascunho'].includes(normalized)) {
    return false;
  }

  throw new AppError('Valor booleano inválido.', 422, 'INVALID_BOOLEAN');
}

function parseGalleryStatus(value: unknown): GalleryStatus | undefined {
  if (!value) {
    return undefined;
  }

  const status = String(value).trim().toLowerCase() as GalleryStatus;

  if (!GALLERY_STATUSES.includes(status)) {
    throw new AppError('Status de galeria inválido.', 422, 'INVALID_GALLERY_STATUS');
  }

  return status;
}

function normalizeDate(value: unknown): string | null {
  const raw = String(value || '').trim();

  if (!raw) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError('A data deve estar no formato YYYY-MM-DD.', 422, 'INVALID_DATE');
  }

  const date = new Date(raw + 'T00:00:00.000Z');

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new AppError('Informe uma data válida.', 422, 'INVALID_DATE');
  }

  return raw;
}

function normalizeGalleryPayload(payload: GalleryPayload, adminId: string) {
  const titulo = String(payload.titulo || '').trim();
  const imagemUrl = String(payload.imagem_url || payload.imagemUrl || '').trim();
  const status = parseGalleryStatus(payload.status) || 'pendente';
  const privacidadeOk = parseBoolean(payload.privacidade_ok ?? payload.privacidadeOk) ?? false;

  if (!titulo || titulo.length < 3) {
    throw new AppError('Informe um título com pelo menos 3 caracteres.', 422, 'INVALID_TITLE');
  }

  if (titulo.length > 200) {
    throw new AppError('O título deve ter no máximo 200 caracteres.', 422, 'INVALID_TITLE');
  }

  if (!imagemUrl) {
    throw new AppError('Informe a URL da imagem.', 422, 'INVALID_IMAGE_URL');
  }

  if (status === 'aprovada' && !privacidadeOk) {
    throw new AppError('Para aprovar uma imagem, confirme a privacidade.', 422, 'GALLERY_PRIVACY_REQUIRED');
  }

  return {
    titulo,
    descricao: normalizeNullableText(payload.descricao, 5000, 'A descrição'),
    imagemUrl,
    imagemThumb: normalizeNullableText(payload.imagem_thumb ?? payload.imagemThumb, 5000, 'A miniatura'),
    dataAcao: normalizeDate(payload.data_acao ?? payload.dataAcao),
    status,
    privacidadeOk,
    adminId,
  };
}

export async function listAdminGallery(query: ListGalleryQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const filters = {
    status: parseGalleryStatus(query.status),
    privacidadeOk: parseBoolean(query.privacidade_ok ?? query.privacidadeOk),
    q: normalizeSearch(query.q),
  };
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    listGallery({ ...filters, limit, offset }),
    countGallery(filters),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminGallery(id: string) {
  const item = await findGalleryById(id);

  if (!item) {
    throw new AppError('Imagem da galeria não encontrada.', 404, 'GALLERY_NOT_FOUND');
  }

  return item;
}

export async function createAdminGallery(payload: GalleryPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeGalleryPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    const created = await createGallery(input, transaction);

    await createAdminLog(
      {
        adminId,
        action: 'galeria.criar',
        entity: 'galeria',
        entityId: created.id,
        detail: { status: created.status, privacidadeOk: created.privacidade_ok },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return { data: created, message: 'Imagem da galeria criada.' };
  });
}

export async function updateAdminGallery(id: string, payload: GalleryPayload, adminId: string, meta: RequestMeta) {
  const input = normalizeGalleryPayload(payload, adminId);

  return sequelize.transaction(async (transaction) => {
    const current = await findGalleryById(id, transaction);

    if (!current) {
      throw new AppError('Imagem da galeria não encontrada.', 404, 'GALLERY_NOT_FOUND');
    }

    const updated = await updateGallery(id, input, transaction);

    if (!updated) {
      throw new AppError('Imagem da galeria não encontrada.', 404, 'GALLERY_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'galeria.editar',
        entity: 'galeria',
        entityId: id,
        detail: { previousStatus: current.status, status: updated.status },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    return { data: updated, message: 'Imagem da galeria atualizada.' };
  });
}

export async function deleteAdminGallery(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findGalleryById(id, transaction);

    if (!current) {
      throw new AppError('Imagem da galeria não encontrada.', 404, 'GALLERY_NOT_FOUND');
    }

    await createAdminLog(
      {
        adminId,
        action: 'galeria.excluir',
        entity: 'galeria',
        entityId: id,
        detail: { titulo: current.titulo, status: current.status },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
      transaction,
    );

    await deleteGallery(id, transaction);

    return { message: 'Imagem da galeria excluída.' };
  });
}


const GALLERY_UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function normalizeUploadPayload(payload: GalleryUploadPayload) {
  const mimeType = String(payload.mimeType || '').trim().toLowerCase();
  const data = String(payload.data || '').trim();
  const extension = GALLERY_UPLOAD_TYPES[mimeType];

  if (!extension) {
    throw new AppError('Envie uma imagem JPG, PNG, WEBP ou GIF.', 422, 'INVALID_GALLERY_UPLOAD_TYPE');
  }

  if (!data) {
    throw new AppError('Arquivo de imagem não informado.', 422, 'INVALID_GALLERY_UPLOAD_FILE');
  }

  const base64 = data.includes(',') ? data.split(',').pop() || '' : data;
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) {
    throw new AppError('Conteúdo da imagem inválido.', 422, 'INVALID_GALLERY_UPLOAD_FILE');
  }

  const buffer = Buffer.from(base64, 'base64');

  if (!buffer.length) {
    throw new AppError('Arquivo de imagem inválido.', 422, 'INVALID_GALLERY_UPLOAD_FILE');
  }

  const maxBytes = env.maxUploadMb * 1024 * 1024;

  if (buffer.length > maxBytes) {
    throw new AppError('A imagem deve ter no máximo ' + env.maxUploadMb + 'MB.', 413, 'GALLERY_UPLOAD_TOO_LARGE');
  }

  if (!hasValidGallerySignature(buffer, extension)) {
    throw new AppError('Assinatura da imagem não confere com o formato informado.', 422, 'GALLERY_UPLOAD_SIGNATURE_MISMATCH');
  }

  return { buffer, extension };
}

function hasValidGallerySignature(buffer: Buffer, extension: string) {
  if (extension === 'jpg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === 'webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (extension === 'gif') {
    const signature = buffer.subarray(0, 6).toString('ascii');
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  return false;
}

export async function uploadAdminGalleryImage(payload: GalleryUploadPayload, baseUrl: string) {
  const upload = normalizeUploadPayload(payload);
  const folder = path.join(env.uploadDir, 'gallery');
  const fileName = crypto.randomUUID() + '.' + upload.extension;
  const filePath = path.join(folder, fileName);

  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(filePath, upload.buffer, { mode: 0o644 });

  const publicPath = '/uploads/gallery/' + fileName;

  return {
    data: {
      url: baseUrl.replace(/\/$/, '') + publicPath,
      path: publicPath,
    },
    message: 'Imagem enviada.',
  };
}
