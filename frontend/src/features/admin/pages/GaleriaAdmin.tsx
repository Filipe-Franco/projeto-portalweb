import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, Edit3, Eye, GalleryHorizontalEnd, ImagePlus, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { ApiError } from '@/shared/api/client';
import {
  createAdminGallery,
  deleteAdminGallery,
  listAdminGallery,
  updateAdminGallery,
  uploadAdminGalleryImage,
  type AdminGalleryItem,
  type AdminGalleryPayload,
  type AdminGalleryStatus,
} from '@/features/admin/api/adminGalleryApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

const statusOptions: Array<{ label: string; value: AdminGalleryStatus | 'todos' }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Aprovada', value: 'aprovada' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Rejeitada', value: 'rejeitada' },
];

const PAGE_SIZE = 10;

const privacyOptions = [
  { label: 'Todos', value: 'todos' },
  { label: 'Privacidade confirmada', value: 'true' },
  { label: 'Pendente de privacidade', value: 'false' },
] as const;

type PrivacyFilter = (typeof privacyOptions)[number]['value'];

type GalleryFormState = {
  titulo: string;
  descricao: string;
  imagem_url: string;
  imagem_thumb: string;
  data_acao: string;
  status: AdminGalleryStatus;
  privacidade_ok: boolean;
};

const emptyForm: GalleryFormState = {
  titulo: '',
  descricao: '',
  imagem_url: '',
  imagem_thumb: '',
  data_acao: '',
  status: 'pendente',
  privacidade_ok: false,
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.';
}

function statusLabel(status: AdminGalleryStatus) {
  return statusOptions.find((option) => option.value === status)?.label || status;
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '-';
}

function dateInputValue(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function itemToForm(item: AdminGalleryItem): GalleryFormState {
  return {
    titulo: item.titulo,
    descricao: item.descricao || '',
    imagem_url: item.imagem_url,
    imagem_thumb: item.imagem_thumb || '',
    data_acao: dateInputValue(item.data_acao),
    status: item.status,
    privacidade_ok: item.privacidade_ok,
  };
}

function formToPayload(form: GalleryFormState): AdminGalleryPayload {
  return {
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    imagem_url: form.imagem_url.trim(),
    imagem_thumb: form.imagem_thumb.trim(),
    data_acao: form.data_acao,
    status: form.status,
    privacidade_ok: form.privacidade_ok,
  };
}

export function GaleriaAdmin() {
  const [items, setItems] = useState<AdminGalleryItem[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminGalleryStatus | 'todos'>('todos');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('todos');
  const [selectedItem, setSelectedItem] = useState<AdminGalleryItem | null>(null);
  const [editorItem, setEditorItem] = useState<AdminGalleryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminGalleryItem | null>(null);
  const [formState, setFormState] = useState<GalleryFormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await listAdminGallery({
        q: query.trim() || undefined,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        privacidadeOk: privacyFilter === 'todos' ? undefined : privacyFilter === 'true',
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setItems(response.data);
      setTotalPages(Math.max(1, response.meta.totalPages || 1));
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [privacyFilter, query, statusFilter, currentPage]);


  useEffect(() => {
    setCurrentPage(1);
  }, [privacyFilter, query, statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadGallery();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadGallery]);

  const metrics = useMemo(() => ({
    approved: items.filter((item) => item.status === 'aprovada').length,
    pending: items.filter((item) => item.status === 'pendente').length,
    rejected: items.filter((item) => item.status === 'rejeitada').length,
    privacyPending: items.filter((item) => !item.privacidade_ok).length,
  }), [items]);

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('todos');
    setPrivacyFilter('todos');
    setCurrentPage(1);
  };

  const openEditor = (item?: AdminGalleryItem) => {
    setEditorItem(item ?? null);
    setFormState(item ? itemToForm(item) : emptyForm);
    setIsEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setIsUploadLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
      });
      const response = await uploadAdminGalleryImage({
        fileName: file.name,
        mimeType: file.type,
        data,
      });

      setFormState((current) => ({
        ...current,
        imagem_url: response.data.url,
        imagem_thumb: response.data.url,
      }));
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsUploadLoading(false);
    }
  };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = formToPayload(formState);
      const response = editorItem
        ? await updateAdminGallery(editorItem.id, payload)
        : await createAdminGallery(payload);

      setSuccessMessage(response.message);
      setIsEditorOpen(false);
      setEditorItem(null);
      setFormState(emptyForm);
      await loadGallery();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const runDelete = async () => {
    if (!deleteItem) {
      return;
    }

    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await deleteAdminGallery(deleteItem.id);
      setSuccessMessage(response.message);
      setDeleteItem(null);
      await loadGallery();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Conteúdo visual"
        title="Galeria"
        description="Gerencie imagens publicadas na galeria pública conforme status e privacidade."
        actions={
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nova imagem
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Aprovadas" value={metrics.approved} icon={GalleryHorizontalEnd} />
        <MetricCard label="Pendentes" value={metrics.pending} icon={ImagePlus} tone="amber" />
        <MetricCard label="Rejeitadas" value={metrics.rejected} icon={AlertCircle} tone="rose" />
        <MetricCard label="Privacidade pendente" value={metrics.privacyPending} icon={Eye} tone="slate" />
      </div>

      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Itens cadastrados</h2>
              <p className="mt-1 text-sm text-slate-500">Somente imagens aprovadas com privacidade confirmada aparecem no portal público.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ToolbarSearch placeholder="Buscar imagem" value={query} onChange={(event) => setQuery(event.target.value)} />
              <button type="button" onClick={() => void loadGallery()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdminGalleryStatus | 'todos')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={privacyFilter} onChange={(event) => setPrivacyFilter(event.target.value as PrivacyFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {privacyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button>
          </div>
        </div>

        {isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando imagens...</div> : null}

        {!isLoading && items.length > 0 ? (
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[16/10] bg-slate-100">
                  <img src={item.imagem_thumb || item.imagem_url} alt={item.titulo} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{item.titulo}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.descricao || 'Sem descrição'}</p>
                    </div>
                    <StatusBadge>{statusLabel(item.status)}</StatusBadge>
                  </div>

                  <dl className="grid gap-2 text-sm text-slate-600">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Privacidade</dt>
                      <dd className="font-medium text-slate-800">{item.privacidade_ok ? 'Confirmada' : 'Pendente'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Data da ação</dt>
                      <dd className="font-medium text-slate-800">{formatDate(item.data_acao)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Atualizado</dt>
                      <dd className="font-medium text-slate-800">{formatDate(item.atualizado_em)}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => setSelectedItem(item)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                    <button type="button" onClick={() => openEditor(item)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>
                    <button type="button" onClick={() => setDeleteItem(item)} className="ml-auto rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Remover imagem">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500">
            <Search className="mb-3 h-8 w-8 text-slate-300" />
            Nenhuma imagem encontrada.
          </div>
        ) : null}

        {!isLoading && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
            <span>Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Próxima</button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          {selectedItem ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.titulo}</DialogTitle>
                <DialogDescription>{selectedItem.descricao || 'Sem descrição'}</DialogDescription>
              </DialogHeader>
              <img src={selectedItem.imagem_url} alt={selectedItem.titulo} className="max-h-[420px] w-full rounded-lg object-cover" />
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <p><span className="text-slate-500">Status:</span> {statusLabel(selectedItem.status)}</p>
                <p><span className="text-slate-500">Privacidade:</span> {selectedItem.privacidade_ok ? 'Confirmada' : 'Pendente'}</p>
                <p><span className="text-slate-500">Data da ação:</span> {formatDate(selectedItem.data_acao)}</p>
                <p><span className="text-slate-500">Imagem:</span> {selectedItem.imagem_url}</p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditorOpen}
        onOpenChange={(open) => {
          setIsEditorOpen(open);
          if (!open) {
            setEditorItem(null);
            setFormState(emptyForm);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editorItem ? 'Editar imagem' : 'Nova imagem'}</DialogTitle>
            <DialogDescription>Envie uma imagem ou informe uma URL pública já existente.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitEditor} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Título
              <input required value={formState.titulo} onChange={(event) => setFormState((current) => ({ ...current, titulo: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Descrição
              <input value={formState.descricao} onChange={(event) => setFormState((current) => ({ ...current, descricao: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Subir imagem
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={isUploadLoading || isActionLoading} onChange={(event) => void handleImageUpload(event.target.files?.[0] || null)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-cyan-800 hover:file:bg-cyan-100 disabled:opacity-70" />
              <span className="block text-xs font-normal text-slate-500">{isUploadLoading ? 'Enviando imagem...' : 'Após o envio, a URL abaixo será preenchida automaticamente.'}</span>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              URL da imagem
              <input required value={formState.imagem_url} onChange={(event) => setFormState((current) => ({ ...current, imagem_url: event.target.value }))} placeholder="https://... ou /uploads/gallery/..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              URL da miniatura
              <input value={formState.imagem_thumb} onChange={(event) => setFormState((current) => ({ ...current, imagem_thumb: event.target.value }))} placeholder="Opcional" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Data da ação
              <input type="date" value={formState.data_acao} onChange={(event) => setFormState((current) => ({ ...current, data_acao: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Status
              <select value={formState.status} onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as AdminGalleryStatus }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
                <option value="pendente">Pendente</option>
                <option value="aprovada">Aprovada</option>
                <option value="rejeitada">Rejeitada</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={formState.privacidade_ok} onChange={(event) => setFormState((current) => ({ ...current, privacidade_ok: event.target.checked }))} />
              Privacidade e consentimento confirmados
            </label>

            <DialogFooter className="sm:col-span-2">
              <button type="button" disabled={isActionLoading} onClick={() => setIsEditorOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button>
              <button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">
                {isActionLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir imagem</DialogTitle>
            <DialogDescription>Esta ação remove o registro da galeria. A imagem só deixa de aparecer no público se este registro for removido ou despublicado.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-700">Excluir definitivamente {deleteItem?.titulo}?</p>
          <DialogFooter>
            <button type="button" disabled={isActionLoading} onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button>
            <button type="button" disabled={isActionLoading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">
              {isActionLoading ? 'Excluindo...' : 'Excluir'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
