import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Download, FileText, FileUp, Search, UploadCloud, XCircle } from 'lucide-react';

import { downloadPortalMaterial, listPortalMaterials, type PortalMaterial } from '@/features/portal/api/portalMaterialsApi';
import { createPortalUpload, downloadPortalUpload, listPortalUploads, type PortalUpload } from '@/features/portal/api/portalUploadsApi';
import type { UploadType } from '@/features/admin/api/adminUploadsApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/csv', 'text/plain']);
const maxFileBytes = 10 * 1024 * 1024;
const uploadTypeOptions: Array<{ value: UploadType; label: string }> = [
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'documento', label: 'Documento' },
  { value: 'imagem', label: 'Imagem autorizada' },
  { value: 'termo', label: 'Termo' },
  { value: 'outro', label: 'Outro' },
];
const statusLabel = { pendente: 'Em análise', aprovado: 'Aprovado', rejeitado: 'Rejeitado', excluido: 'Excluído' } as const;
const statusIcon = { pendente: Clock3, aprovado: CheckCircle2, rejeitado: XCircle, excluido: AlertTriangle } as const;

function formatDate(value: string) { return new Date(value).toLocaleDateString('pt-BR'); }
function formatSize(value: string | number | null) {
  const bytes = Number(value || 0);
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}
function typeLabel(type: string) {
  const labels: Record<string, string> = { documento: 'Documento', imagem: 'Imagem', video: 'Vídeo', link: 'Link', comprovante: 'Comprovante', termo: 'Termo', outro: 'Outro' };
  return labels[type] || type;
}
function materialUrl(material: PortalMaterial) { return material.arquivo_url || material.link_externo || '#'; }
function isInternalMaterialFile(material: PortalMaterial) { return Boolean(material.arquivo_url?.startsWith('/uploads/materials/')); }
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function MateriaisPortal() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadType, setUploadType] = useState<UploadType>('comprovante');
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<PortalMaterial[]>([]);
  const [uploads, setUploads] = useState<PortalUpload[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(true);
  const [isUploadsLoading, setIsUploadsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadUploads = useCallback(async () => {
    setIsUploadsLoading(true);
    try {
      const response = await listPortalUploads();
      setUploads(response.data);
    } catch {
      setUploadError('Não foi possível carregar seus uploads.');
    } finally {
      setIsUploadsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    listPortalMaterials().then((response) => { if (isMounted) setMaterials(response.data); }).catch(() => { if (isMounted) setMaterialsError('Não foi possível carregar os materiais.'); }).finally(() => { if (isMounted) setIsMaterialsLoading(false); });
    void loadUploads();
    return () => { isMounted = false; };
  }, [loadUploads]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMaterials = materials.filter((material) => !normalizedSearch || [material.titulo, material.descricao || '', material.tipo].some((value) => value.toLowerCase().includes(normalizedSearch)));
  const titleError = submitted && title.trim().length < 3 ? 'Informe um título com pelo menos 3 caracteres.' : '';
  const fileError = submitted && !selectedFile ? 'Selecione um arquivo para envio.' : selectedFile && !allowedTypes.has(selectedFile.type) ? 'Formato não permitido.' : selectedFile && selectedFile.size > maxFileBytes ? 'O arquivo deve ter no máximo 10MB.' : '';
  const descriptionError = submitted && description.trim().length > 0 && description.trim().length < 10 ? 'Use pelo menos 10 caracteres ou deixe em branco.' : '';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSuccess(false);
    setUploadError('');
    if (file && !title.trim()) setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 120));
  };

  const openMaterial = async (material: PortalMaterial) => {
    if (isInternalMaterialFile(material)) {
      try { await downloadPortalMaterial(material); }
      catch { setMaterialsError('Não foi possível baixar o material.'); }
      return;
    }
    window.open(materialUrl(material), '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setSuccess(false);
    setUploadError('');
    if (!selectedFile || title.trim().length < 3 || fileError || descriptionError) return;
    setIsSubmitting(true);
    try {
      const data = await readFileAsDataUrl(selectedFile);
      await createPortalUpload({ titulo: title.trim(), descricao: description.trim(), tipo: uploadType, fileName: selectedFile.name, mimeType: selectedFile.type, data });
      setSuccess(true);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setUploadType('comprovante');
      setSubmitted(false);
      await loadUploads();
    } catch {
      setUploadError('Não foi possível enviar o arquivo. Confira formato, tamanho e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-8">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Repositório interno</p><h1 className="mt-2 text-3xl font-extrabold text-slate-950 md:text-4xl">Materiais e uploads</h1><p className="mt-2 max-w-3xl text-slate-600">Acesse materiais publicados pela administração e envie arquivos para análise em um único lugar.</p></div>

      <section className="rounded-xl border border-dashed border-cyan-300 bg-cyan-50/70 p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="rounded-xl bg-white p-3 text-cyan-700 shadow-sm"><UploadCloud className="h-6 w-6" /></span><div><h2 className="text-2xl font-extrabold text-slate-950">Enviar novo arquivo</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Envie comprovantes, relatórios, fotos autorizadas ou documentos solicitados pela coordenação. A aprovação final será feita pela administração.</p></div></div><button className="inline-flex w-fit items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition hover:bg-cyan-800" type="button" onClick={() => { setUploadModalOpen(true); setSubmitted(false); setSuccess(false); setUploadError(''); }}><FileUp className="h-4 w-4" />Selecionar arquivo</button></div></section>

      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-xl"><DialogHeader><DialogTitle className="text-2xl font-extrabold text-slate-950">Enviar arquivo para análise</DialogTitle><DialogDescription>Formatos permitidos: PDF, JPG, PNG, WEBP, DOCX, XLSX, CSV e TXT até 10MB.</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-5"><label className="block"><span className="text-sm font-semibold text-slate-700">Título</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-700" />{titleError && <p className="mt-2 text-xs font-semibold text-rose-600">{titleError}</p>}</label><label className="block"><span className="text-sm font-semibold text-slate-700">Tipo de arquivo</span><select value={uploadType} onChange={(event) => setUploadType(event.target.value as UploadType)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-700">{uploadTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="block"><span className="text-sm font-semibold text-slate-700">Arquivo</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv,.txt" onChange={handleFileChange} className="mt-2 w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />{selectedFile && <p className="mt-2 text-xs font-medium text-slate-600">Selecionado: {selectedFile.name} · {formatSize(selectedFile.size)}</p>}{fileError && <p className="mt-2 text-xs font-semibold text-rose-600">{fileError}</p>}</label><label className="block"><span className="text-sm font-semibold text-slate-700">Descrição</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-700" placeholder="Ex.: Comprovante da ação realizada no centro." />{descriptionError && <p className="mt-2 text-xs font-semibold text-rose-600">{descriptionError}</p>}</label>{uploadError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{uploadError}</div>}{success && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Arquivo enviado para análise.</div>}<DialogFooter><button type="button" onClick={() => setUploadModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold !text-white disabled:opacity-60"><FileUp className="h-4 w-4" />{isSubmitting ? 'Enviando...' : 'Enviar para análise'}</button></DialogFooter></form></DialogContent></Dialog>

      <div className="grid gap-8 xl:grid-cols-[1.35fr_0.9fr]"><section className="space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-extrabold text-slate-950">Materiais disponíveis</h2><p className="mt-1 text-sm text-slate-500">Arquivos de apoio para as ações e treinamentos.</p></div><label className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"><Search className="h-5 w-5 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar por título, categoria ou tipo" type="search" /></label></div>{materialsError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{materialsError}</div>}{isMaterialsLoading && <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">Carregando materiais...</div>}<div className="grid gap-4 md:grid-cols-2">{!isMaterialsLoading && filteredMaterials.map((material) => <article key={material.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><FileText className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{typeLabel(material.tipo)}</span></div><h3 className="mt-4 text-lg font-extrabold text-slate-950">{material.titulo}</h3><p className="mt-2 text-sm text-slate-500">Atualizado em {formatDate(material.atualizado_em)}</p>{material.descricao && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{material.descricao}</p>}<button type="button" onClick={() => void openMaterial(material)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-cyan-800"><Download className="h-4 w-4" />Abrir material</button></article>)}</div>{filteredMaterials.length === 0 && !isMaterialsLoading && <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm"><Search className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 text-lg font-extrabold text-slate-950">Nenhum material encontrado</h3><button type="button" onClick={() => setSearchTerm('')} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Limpar busca</button></div>}</section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-2xl font-extrabold text-slate-950">Envios recentes</h2><p className="mt-1 text-sm text-slate-500">Acompanhe o status do que você enviou.</p></div>{isUploadsLoading && <div className="px-5 py-10 text-center text-sm text-slate-500">Carregando envios...</div>}{!isUploadsLoading && uploads.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhum arquivo enviado ainda.</div>}<div className="divide-y divide-slate-100">{!isUploadsLoading && uploads.map((upload) => { const Icon = statusIcon[upload.status]; return <article key={upload.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-start"><div><h3 className="font-semibold text-slate-950">{upload.titulo}</h3><p className="mt-1 text-sm text-slate-500">Enviado em {formatDate(upload.criado_em)} · {typeLabel(upload.tipo)} · {formatSize(upload.tamanho_bytes)}</p>{upload.motivo_rejeicao && <p className="mt-2 text-sm text-rose-600">{upload.motivo_rejeicao}</p>}</div><div className="flex flex-wrap gap-2"><span className="flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"><Icon className="h-4 w-4" />{statusLabel[upload.status]}</span><button type="button" onClick={() => void downloadPortalUpload(upload)} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50">Baixar</button></div></article>; })}</div></section></div>
    </section>
  );
}
