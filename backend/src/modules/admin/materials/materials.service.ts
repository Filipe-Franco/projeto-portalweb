import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { countMaterials, createAdminLog, createMaterial, deleteMaterial, findMaterialById, listMaterials, sequelize, updateMaterial, type MaterialType } from './materials.repository.js';

const MATERIAL_TYPES: MaterialType[] = ['documento', 'imagem', 'video', 'link', 'outro'];
const TYPE_ALIASES: Record<string, MaterialType> = {
  documento: 'documento',
  pdf: 'documento',
  planilha: 'documento',
  imagem: 'imagem',
  foto: 'imagem',
  video: 'video',
  vídeo: 'video',
  link: 'link',
  url: 'link',
  outro: 'outro',
  outros: 'outro',
};

type RequestMeta = { ip?: string | null; userAgent?: string | null };
type ListMaterialsQuery = { tipo?: unknown; publicado?: unknown; q?: unknown; page?: unknown; limit?: unknown };
type MaterialPayload = {
  titulo?: unknown;
  descricao?: unknown;
  tipo?: unknown;
  arquivo_url?: unknown;
  arquivoUrl?: unknown;
  link_externo?: unknown;
  linkExterno?: unknown;
  tamanho_bytes?: unknown;
  tamanhoBytes?: unknown;
  publicado?: unknown;
};

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function normalizeSearch(value: unknown): string | undefined {
  const q = String(value || '').trim();
  return q || undefined;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'sim', 'publicado'].includes(normalized)) return true;
  if (['false', '0', 'nao', 'não', 'rascunho'].includes(normalized)) return false;
  throw new AppError('Valor booleano inválido.', 422, 'INVALID_BOOLEAN');
}

function parseMaterialType(value: unknown): MaterialType | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  const type = TYPE_ALIASES[normalized] || normalized;
  if (!MATERIAL_TYPES.includes(type as MaterialType)) throw new AppError('Tipo de material inválido.', 422, 'INVALID_MATERIAL_TYPE');
  return type as MaterialType;
}

function normalizeNullableText(value: unknown, max: number, label: string): string | null {
  const text = String(value || '').trim();
  if (!text) return null;
  if (text.length > max) throw new AppError(label + ' deve ter no máximo ' + max + ' caracteres.', 422, 'INVALID_TEXT_LENGTH');
  return text;
}

function normalizeUrl(value: unknown, max: number, label: string): string | null {
  const text = normalizeNullableText(value, max, label);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new AppError(label + ' deve ser uma URL http ou https válida.', 422, 'INVALID_URL');
  }
  return text;
}

function normalizeSize(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999999999) {
    throw new AppError('O tamanho deve ser um inteiro positivo válido.', 422, 'INVALID_MATERIAL_SIZE');
  }
  return parsed;
}

type MaterialUploadPayload = { fileName?: unknown; mimeType?: unknown; data?: unknown };

const MATERIAL_UPLOAD_TYPES: Record<string, { ext: string; type: MaterialType }> = {
  'application/pdf': { ext: 'pdf', type: 'documento' },
  'image/jpeg': { ext: 'jpg', type: 'imagem' },
  'image/png': { ext: 'png', type: 'imagem' },
  'image/webp': { ext: 'webp', type: 'imagem' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', type: 'documento' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', type: 'documento' },
  'text/csv': { ext: 'csv', type: 'documento' },
  'application/csv': { ext: 'csv', type: 'documento' },
  'text/plain': { ext: 'txt', type: 'documento' },
};

function hasValidMaterialSignature(buffer: Buffer, extension: string) {
  if (extension === 'pdf') return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  if (extension === 'jpg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === 'webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (extension === 'docx' || extension === 'xlsx') return buffer.subarray(0, 2).toString('ascii') === 'PK';
  if (extension === 'csv' || extension === 'txt') return !buffer.includes(0);
  return false;
}

function normalizeMaterialFilePath(value: unknown): string | null {
  const text = normalizeNullableText(value, 2000, 'A URL do arquivo');
  if (!text) return null;
  if (/^\/uploads\/materials\/[a-f0-9-]{36}\.[a-z0-9]+$/i.test(text)) return text;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new AppError('A URL do arquivo deve ser uma URL http/https válida ou um arquivo enviado pelo admin.', 422, 'INVALID_URL');
  }
  return text;
}

function normalizeMaterialUploadPayload(payload: MaterialUploadPayload) {
  const mimeType = String(payload.mimeType || '').trim().toLowerCase();
  const data = String(payload.data || '').trim();
  const allowed = MATERIAL_UPLOAD_TYPES[mimeType];
  if (!allowed) throw new AppError('Envie PDF, JPG, PNG, WEBP, DOCX, XLSX, CSV ou TXT.', 422, 'INVALID_MATERIAL_UPLOAD_TYPE');
  if (!data) throw new AppError('Arquivo não informado.', 422, 'INVALID_MATERIAL_UPLOAD_FILE');
  const base64 = data.includes(',') ? data.split(',').pop() || '' : data;
  if (!new RegExp('^[A-Za-z0-9+/=\r\n]+$').test(base64)) throw new AppError('Conteudo do arquivo invalido.', 422, 'INVALID_MATERIAL_UPLOAD_FILE');
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw new AppError('Arquivo inválido.', 422, 'INVALID_MATERIAL_UPLOAD_FILE');
  const maxBytes = env.maxUploadMb * 1024 * 1024;
  if (buffer.length > maxBytes) throw new AppError('O arquivo deve ter no máximo ' + env.maxUploadMb + 'MB.', 413, 'MATERIAL_UPLOAD_TOO_LARGE');
  if (!hasValidMaterialSignature(buffer, allowed.ext)) throw new AppError('Assinatura do arquivo não confere com o formato informado.', 422, 'MATERIAL_UPLOAD_SIGNATURE_MISMATCH');
  const originalName = path.basename(String(payload.fileName || 'material.' + allowed.ext)).replace(/[^a-zA-Z0-9._ -]/g, '').slice(0, 180);
  return { buffer, extension: allowed.ext, tipo: allowed.type, tamanhoBytes: buffer.length, originalName: originalName || 'material.' + allowed.ext };
}

function resolveMaterialUploadPath(arquivoUrl: string) {
  const fileName = path.basename(String(arquivoUrl || ''));
  if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(fileName)) throw new AppError('Arquivo inválido.', 404, 'MATERIAL_FILE_NOT_FOUND');
  const folder = path.resolve(env.uploadDir, 'materials');
  const filePath = path.resolve(folder, fileName);
  if (!filePath.startsWith(folder + path.sep)) throw new AppError('Arquivo inválido.', 404, 'MATERIAL_FILE_NOT_FOUND');
  return { filePath, fileName };
}

function normalizePayload(payload: MaterialPayload, adminId: string) {
  const titulo = String(payload.titulo || '').trim();
  if (!titulo || titulo.length < 3) throw new AppError('Informe um título com pelo menos 3 caracteres.', 422, 'INVALID_MATERIAL_TITLE');
  if (titulo.length > 200) throw new AppError('O título deve ter no máximo 200 caracteres.', 422, 'INVALID_MATERIAL_TITLE');

  const arquivoUrl = normalizeMaterialFilePath(payload.arquivo_url ?? payload.arquivoUrl);
  const linkExterno = normalizeUrl(payload.link_externo ?? payload.linkExterno, 2000, 'O link externo');

  if (!arquivoUrl && !linkExterno) {
    throw new AppError('Informe uma URL de arquivo ou link externo.', 422, 'INVALID_MATERIAL_SOURCE');
  }

  return {
    titulo,
    descricao: normalizeNullableText(payload.descricao, 5000, 'A descrição'),
    tipo: parseMaterialType(payload.tipo) || (linkExterno && !arquivoUrl ? 'link' : 'documento'),
    arquivoUrl,
    linkExterno,
    tamanhoBytes: normalizeSize(payload.tamanho_bytes ?? payload.tamanhoBytes),
    publicado: parseBoolean(payload.publicado) ?? true,
    adminId,
  };
}

export async function listAdminMaterials(query: ListMaterialsQuery) {
  const page = parsePositiveInt(query.page, 1, 10000);
  const limit = parsePositiveInt(query.limit, 20, 100);
  const filters = { tipo: parseMaterialType(query.tipo), publicado: parseBoolean(query.publicado), q: normalizeSearch(query.q) };
  const offset = (page - 1) * limit;
  const [data, total] = await Promise.all([
    listMaterials({ ...filters, limit, offset }),
    countMaterials(filters),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getAdminMaterial(id: string) {
  const item = await findMaterialById(id);
  if (!item) throw new AppError('Material não encontrado.', 404, 'MATERIAL_NOT_FOUND');
  return item;
}

export async function uploadAdminMaterialFile(payload: MaterialUploadPayload) {
  const upload = normalizeMaterialUploadPayload(payload);
  const folder = path.resolve(env.uploadDir, 'materials');
  const fileName = crypto.randomUUID() + '.' + upload.extension;
  const filePath = path.join(folder, fileName);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(filePath, upload.buffer, { mode: 0o600 });
  return {
    data: {
      path: '/uploads/materials/' + fileName,
      fileName: upload.originalName,
      mimeType: String(payload.mimeType || '').trim().toLowerCase(),
      tamanhoBytes: upload.tamanhoBytes,
      tipo: upload.tipo,
    },
    message: 'Arquivo enviado.',
  };
}

export async function getAdminMaterialDownload(id: string) {
  const item = await findMaterialById(id);
  if (!item) throw new AppError('Material não encontrado.', 404, 'MATERIAL_NOT_FOUND');
  if (!item.arquivo_url || !item.arquivo_url.startsWith('/uploads/materials/')) throw new AppError('Este material não possui arquivo interno.', 404, 'MATERIAL_FILE_NOT_FOUND');
  return resolveMaterialUploadPath(item.arquivo_url);
}

export async function createAdminMaterial(payload: MaterialPayload, adminId: string, meta: RequestMeta) {
  const input = normalizePayload(payload, adminId);
  return sequelize.transaction(async (transaction) => {
    const created = await createMaterial(input, transaction);
    await createAdminLog({ adminId, action: 'material.criar', entity: 'materiais', entityId: created.id, detail: { titulo: created.titulo, publicado: created.publicado }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    return { data: created, message: 'Material criado.' };
  });
}

export async function updateAdminMaterial(id: string, payload: MaterialPayload, adminId: string, meta: RequestMeta) {
  const input = normalizePayload(payload, adminId);
  return sequelize.transaction(async (transaction) => {
    const current = await findMaterialById(id, transaction);
    if (!current) throw new AppError('Material não encontrado.', 404, 'MATERIAL_NOT_FOUND');
    const updated = await updateMaterial(id, input, transaction);
    if (!updated) throw new AppError('Material não encontrado.', 404, 'MATERIAL_NOT_FOUND');
    await createAdminLog({ adminId, action: 'material.editar', entity: 'materiais', entityId: updated.id, detail: { previousTitulo: current.titulo, titulo: updated.titulo }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    return { data: updated, message: 'Material atualizado.' };
  });
}

export async function deleteAdminMaterial(id: string, adminId: string, meta: RequestMeta) {
  return sequelize.transaction(async (transaction) => {
    const current = await findMaterialById(id, transaction);
    if (!current) throw new AppError('Material não encontrado.', 404, 'MATERIAL_NOT_FOUND');
    await createAdminLog({ adminId, action: 'material.excluir', entity: 'materiais', entityId: current.id, detail: { titulo: current.titulo }, ip: meta.ip, userAgent: meta.userAgent }, transaction);
    await deleteMaterial(id, transaction);
    return { message: 'Material excluído.' };
  });
}
