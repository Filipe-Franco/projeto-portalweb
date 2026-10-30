import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Download, Edit3, Eye, FileText, FileUp, Link as LinkIcon, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  createAdminMaterial,
  deleteAdminMaterial,
  downloadAdminMaterial,
  listAdminMaterials,
  updateAdminMaterial,
  uploadAdminMaterialFile,
  type AdminMaterial,
  type AdminMaterialPayload,
  type AdminMaterialType,
} from '@/features/admin/api/adminMaterialsApi';
import { UploadsAdmin } from '@/features/admin/pages/UploadsAdmin';

type TypeFilter = AdminMaterialType | 'todos';
type PublishedFilter = 'todos' | 'true' | 'false';
type FormState = { titulo: string; descricao: string; tipo: AdminMaterialType; arquivo_url: string; link_externo: string; tamanho_bytes: string; publicado: boolean };

const PAGE_SIZE = 10;
const emptyForm: FormState = { titulo: '', descricao: '', tipo: 'documento', arquivo_url: '', link_externo: '', tamanho_bytes: '', publicado: true };
const typeOptions: Array<{ label: string; value: TypeFilter }> = [
  { label: 'Todos', value: 'todos' }, { label: 'Documento', value: 'documento' }, { label: 'Imagem', value: 'imagem' }, { label: 'Vídeo', value: 'video' }, { label: 'Link', value: 'link' }, { label: 'Outro', value: 'outro' },
];
function apiErrorMessage(error: unknown) { return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.'; }
function typeLabel(type: string) { return typeOptions.find((item) => item.value === type)?.label || type; }
function formatDate(value: string) { return new Date(value).toLocaleDateString('pt-BR'); }
function formatSize(value: string | null) { if (!value) return '-'; const bytes = Number(value); if (!Number.isFinite(bytes)) return value; if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`; if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`; return `${bytes} B`; }
function materialUrl(item: AdminMaterial) { return item.arquivo_url || item.link_externo || '#'; }
function isInternalMaterialFile(item: AdminMaterial) { return Boolean(item.arquivo_url?.startsWith('/uploads/materials/')); }
function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}
function toForm(item: AdminMaterial): FormState { return { titulo: item.titulo, descricao: item.descricao || '', tipo: item.tipo, arquivo_url: item.arquivo_url || '', link_externo: item.link_externo || '', tamanho_bytes: item.tamanho_bytes || '', publicado: item.publicado }; }
function toPayload(form: FormState): AdminMaterialPayload { return { titulo: form.titulo.trim(), descricao: form.descricao.trim(), tipo: form.tipo, arquivo_url: form.arquivo_url.trim(), link_externo: form.link_externo.trim(), tamanho_bytes: form.tamanho_bytes.trim(), publicado: form.publicado }; }

export function MateriaisAdmin() {
  const location = useLocation();
  const activeTab = location.pathname.startsWith('/admin/uploads') ? 'uploads' : 'materiais';
  const [items, setItems] = useState<AdminMaterial[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState<AdminMaterial | null>(null);
  const [editingItem, setEditingItem] = useState<AdminMaterial | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminMaterial | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true); setErrorMessage('');
    try {
      const response = await listAdminMaterials({ q: query.trim() || undefined, tipo: typeFilter === 'todos' ? undefined : typeFilter, publicado: publishedFilter === 'todos' ? undefined : publishedFilter === 'true', page: currentPage, limit: PAGE_SIZE });
      setItems(response.data); setTotalPages(Math.max(1, response.meta.totalPages || 1));
    } catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsLoading(false); }
  }, [currentPage, publishedFilter, query, typeFilter]);

  useEffect(() => { setCurrentPage(1); }, [publishedFilter, query, typeFilter]);
  useEffect(() => { const timeout = window.setTimeout(() => void loadItems(), 250); return () => window.clearTimeout(timeout); }, [loadItems]);

  const metrics = useMemo(() => ({ published: items.filter((item) => item.publicado).length, drafts: items.filter((item) => !item.publicado).length, links: items.filter((item) => item.link_externo).length, files: items.filter((item) => item.arquivo_url).length }), [items]);
  const openEditor = (item?: AdminMaterial) => { setEditingItem(item || null); setFormState(item ? toForm(item) : emptyForm); setIsEditorOpen(true); setSuccessMessage(''); setErrorMessage(''); };
  const closeEditor = () => { setIsEditorOpen(false); setEditingItem(null); setFormState(emptyForm); };
  const resetFilters = () => { setQuery(''); setTypeFilter('todos'); setPublishedFilter('todos'); setCurrentPage(1); };

  const handleMaterialFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsFileUploading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const data = await readFileAsDataUrl(file);
      const response = await uploadAdminMaterialFile({ fileName: file.name, mimeType: file.type, data });
      setFormState((current) => ({
        ...current,
        titulo: current.titulo || file.name.replace(new RegExp('\.[^.]+$'), '').slice(0, 120),
        tipo: response.data.tipo,
        arquivo_url: response.data.path,
        link_externo: '',
        tamanho_bytes: String(response.data.tamanhoBytes),
      }));
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsFileUploading(false);
      event.target.value = '';
    }
  };

  const openMaterial = async (item: AdminMaterial) => {
    if (isInternalMaterialFile(item)) {
      try { await downloadAdminMaterial(item); }
      catch (error) { setErrorMessage(apiErrorMessage(error)); }
      return;
    }
    window.open(materialUrl(item), '_blank', 'noopener,noreferrer');
  };

  const submitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsActionLoading(true); setSuccessMessage(''); setErrorMessage('');
    try { const response = editingItem ? await updateAdminMaterial(editingItem.id, toPayload(formState)) : await createAdminMaterial(toPayload(formState)); setSuccessMessage(response.message); closeEditor(); await loadItems(); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsActionLoading(false); }
  };
  const tabClass = (tab: 'materiais' | 'uploads') => 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ' + (activeTab === tab ? 'bg-cyan-700 text-white' : 'text-slate-700 hover:bg-slate-50');

  const runDelete = async () => {
    if (!deleteItem) return;
    setIsActionLoading(true); setSuccessMessage(''); setErrorMessage('');
    try { const response = await deleteAdminMaterial(deleteItem.id); setSuccessMessage(response.message); setDeleteItem(null); await loadItems(); }
    catch (error) { setErrorMessage(apiErrorMessage(error)); }
    finally { setIsActionLoading(false); }
  };

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Repositório interno" title="Materiais e uploads" description="Gerencie a biblioteca publicada para voluntários e revise arquivos enviados para aprovação." actions={activeTab === 'materiais' ? <button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Novo material</button> : null} />
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><Link to="/admin/materiais" className={tabClass('materiais')}><FileText className="h-4 w-4" />Biblioteca</Link><Link to="/admin/uploads" className={tabClass('uploads')}><FileUp className="h-4 w-4" />Uploads recebidos</Link></div>
      {activeTab === 'materiais' ? <>
      <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Publicados" value={metrics.published} icon={FileText} /><MetricCard label="Rascunhos" value={metrics.drafts} icon={Edit3} tone="amber" /><MetricCard label="Links" value={metrics.links} icon={LinkIcon} tone="emerald" /><MetricCard label="Arquivos" value={metrics.files} icon={Download} tone="slate" /></div>
      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-xl font-bold text-slate-950">Biblioteca de materiais</h2><p className="mt-1 text-sm text-slate-500">Materiais publicados aparecem em /portal/materiais para voluntários.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><ToolbarSearch placeholder="Buscar material" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={() => void loadItems()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button></div></div><div className="mt-5 grid gap-3 md:grid-cols-3"><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={publishedFilter} onChange={(event) => setPublishedFilter(event.target.value as PublishedFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="todos">Todos</option><option value="true">Publicado</option><option value="false">Rascunho</option></select><button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button></div></div>{isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando materiais...</div> : null}{!isLoading && items.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Material</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Origem</th><th className="px-5 py-3">Tamanho</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Atualizado</th><th className="px-5 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-lg bg-cyan-50 p-2 text-cyan-700"><FileText className="h-4 w-4" /></span><div><p className="font-semibold text-slate-950">{item.titulo}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{item.descricao || materialUrl(item)}</p></div></div></td><td className="px-5 py-4 text-slate-600">{typeLabel(item.tipo)}</td><td className="px-5 py-4"><StatusBadge>{item.link_externo ? 'Link externo' : 'Arquivo'}</StatusBadge></td><td className="px-5 py-4 text-slate-600">{formatSize(item.tamanho_bytes)}</td><td className="px-5 py-4"><StatusBadge>{item.publicado ? 'Publicado' : 'Rascunho'}</StatusBadge></td><td className="px-5 py-4 text-slate-600">{formatDate(item.atualizado_em)}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedItem(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Visualizar"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => void openMaterial(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Abrir material"><Download className="h-4 w-4" /></button><button type="button" onClick={() => openEditor(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteItem(item)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div> : null}{!isLoading && items.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum material encontrado.</div> : null}{!isLoading && totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-600"><span>Página {currentPage} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Anterior</button><button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Próxima</button></div></div> : null}</div>
      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">{selectedItem ? <><DialogHeader><DialogTitle>{selectedItem.titulo}</DialogTitle><DialogDescription>{typeLabel(selectedItem.tipo)} · {selectedItem.publicado ? 'Publicado' : 'Rascunho'}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm"><p><span className="text-slate-500">URL:</span> <a href={materialUrl(selectedItem)} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:underline">{materialUrl(selectedItem)}</a></p><p><span className="text-slate-500">Tamanho:</span> {formatSize(selectedItem.tamanho_bytes)}</p></div><p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">{selectedItem.descricao || 'Sem descrição.'}</p></> : null}</DialogContent></Dialog>
      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl"><DialogHeader><DialogTitle>{editingItem ? 'Editar material' : 'Novo material'}</DialogTitle><DialogDescription>Envie um arquivo, informe uma URL de arquivo ou cadastre um link externo.</DialogDescription></DialogHeader><form onSubmit={submitItem} className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Título<input required value={formState.titulo} onChange={(e) => setFormState((c) => ({ ...c, titulo: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Tipo<select value={formState.tipo} onChange={(e) => setFormState((c) => ({ ...c, tipo: e.target.value as AdminMaterialType }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="documento">Documento</option><option value="imagem">Imagem</option><option value="video">Vídeo</option><option value="link">Link</option><option value="outro">Outro</option></select></label><label className="space-y-2 text-sm font-medium text-slate-700">Tamanho em bytes<input inputMode="numeric" value={formState.tamanho_bytes} onChange={(e) => setFormState((c) => ({ ...c, tamanho_bytes: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Enviar arquivo para o portal<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv,.txt" disabled={isFileUploading} onChange={(e) => void handleMaterialFileChange(e)} className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60" />{isFileUploading ? <span className="text-xs font-semibold text-cyan-700">Enviando arquivo...</span> : null}</label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">URL do arquivo<input value={formState.arquivo_url} onChange={(e) => setFormState((c) => ({ ...c, arquivo_url: e.target.value }))} placeholder="https://.../arquivo.pdf" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Link externo<input value={formState.link_externo} onChange={(e) => setFormState((c) => ({ ...c, link_externo: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Descrição<textarea value={formState.descricao} onChange={(e) => setFormState((c) => ({ ...c, descricao: e.target.value }))} rows={4} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={formState.publicado} onChange={(e) => setFormState((c) => ({ ...c, publicado: e.target.checked }))} /> Publicado no portal</label><DialogFooter className="sm:col-span-2"><button type="button" disabled={isActionLoading || isFileUploading} onClick={closeEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading || isFileUploading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /> Excluir material</DialogTitle><DialogDescription>Esta ação remove o material da biblioteca dos voluntários.</DialogDescription></DialogHeader><p className="text-sm text-slate-700">Excluir definitivamente {deleteItem?.titulo}?</p><DialogFooter><button type="button" disabled={isActionLoading || isFileUploading} onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading || isFileUploading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter></DialogContent></Dialog>
      </> : <UploadsAdmin embedded />}
    </section>
  );
}
