import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit3, GripVertical, HelpCircle, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { ApiError } from '@/shared/api/client';
import {
  createAdminFaq,
  deleteAdminFaq,
  listAdminFaq,
  updateAdminFaq,
  type AdminFaqCategory,
  type AdminFaqItem,
  type AdminFaqPayload,
} from '@/features/admin/api/adminFaqApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

const categoryOptions: Array<{ label: string; value: AdminFaqCategory | 'todas' }> = [
  { label: 'Todas', value: 'todas' },
  { label: 'Voluntariado', value: 'voluntariado' },
  { label: 'Doações', value: 'doacoes' },
  { label: 'Sobre o projeto', value: 'sobre_projeto' },
];

const PAGE_SIZE = 10;

const statusOptions = [
  { label: 'Todos', value: 'todos' },
  { label: 'Publicado', value: 'true' },
  { label: 'Rascunho', value: 'false' },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];

type FaqFormState = {
  pergunta: string;
  resposta: string;
  categoria: AdminFaqCategory;
  ordem: number;
  publicado: boolean;
};

const emptyForm: FaqFormState = {
  pergunta: '',
  resposta: '',
  categoria: 'voluntariado',
  ordem: 1,
  publicado: true,
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.';
}

function categoryLabel(category: AdminFaqCategory) {
  return categoryOptions.find((option) => option.value === category)?.label || category;
}

function itemToForm(item: AdminFaqItem): FaqFormState {
  return {
    pergunta: item.pergunta,
    resposta: item.resposta,
    categoria: item.categoria,
    ordem: item.ordem,
    publicado: item.publicado,
  };
}

function formToPayload(form: FaqFormState): AdminFaqPayload {
  return {
    pergunta: form.pergunta.trim(),
    resposta: form.resposta.trim(),
    categoria: form.categoria,
    ordem: Number(form.ordem) || 0,
    publicado: form.publicado,
  };
}

export function FAQAdmin() {
  const [items, setItems] = useState<AdminFaqItem[]>([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AdminFaqCategory | 'todas'>('todas');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [editorItem, setEditorItem] = useState<AdminFaqItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminFaqItem | null>(null);
  const [formState, setFormState] = useState<FaqFormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadFaq = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await listAdminFaq({
        q: query.trim() || undefined,
        categoria: categoryFilter === 'todas' ? undefined : categoryFilter,
        publicado: statusFilter === 'todos' ? undefined : statusFilter === 'true',
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
  }, [categoryFilter, query, statusFilter, currentPage]);


  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, query, statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFaq();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadFaq]);

  const metrics = useMemo(() => ({
    total: items.length,
    published: items.filter((item) => item.publicado).length,
    categories: new Set(items.map((item) => item.categoria)).size,
    drafts: items.filter((item) => !item.publicado).length,
  }), [items]);

  const resetFilters = () => {
    setQuery('');
    setCategoryFilter('todas');
    setStatusFilter('todos');
    setCurrentPage(1);
  };

  const openEditor = (item?: AdminFaqItem) => {
    setEditorItem(item ?? null);
    setFormState(item ? itemToForm(item) : { ...emptyForm, ordem: items.length + 1 });
    setIsEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = formToPayload(formState);
      const response = editorItem
        ? await updateAdminFaq(editorItem.id, payload)
        : await createAdminFaq(payload);

      setSuccessMessage(response.message);
      setIsEditorOpen(false);
      setEditorItem(null);
      setFormState(emptyForm);
      await loadFaq();
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
      const response = await deleteAdminFaq(deleteItem.id);
      setSuccessMessage(response.message);
      setDeleteItem(null);
      await loadFaq();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Base pública"
        title="FAQ"
        description="Gerencie perguntas exibidas na página pública de dúvidas frequentes."
        actions={<button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Nova pergunta</button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Perguntas" value={metrics.total} icon={HelpCircle} />
        <MetricCard label="Publicadas" value={metrics.published} icon={HelpCircle} tone="emerald" />
        <MetricCard label="Categorias" value={metrics.categories} icon={GripVertical} tone="slate" />
        <MetricCard label="Rascunhos" value={metrics.drafts} icon={Edit3} tone="amber" />
      </div>

      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Perguntas cadastradas</h2>
              <p className="mt-1 text-sm text-slate-500">Apenas perguntas publicadas aparecem em /faq no portal público.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ToolbarSearch placeholder="Buscar pergunta" value={query} onChange={(event) => setQuery(event.target.value)} />
              <button type="button" onClick={() => void loadFaq()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as AdminFaqCategory | 'todas')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button>
          </div>
        </div>

        {isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando perguntas...</div> : null}

        {!isLoading && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Ordem</th><th className="px-5 py-3">Pergunta</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-slate-600"><GripVertical className="h-4 w-4 text-slate-300" />{item.ordem}</span></td>
                    <td className="px-5 py-4"><p className="font-semibold text-slate-950">{item.pergunta}</p><p className="mt-1 max-w-xl truncate text-xs text-slate-500">{item.resposta}</p></td>
                    <td className="px-5 py-4 text-slate-600">{categoryLabel(item.categoria)}</td>
                    <td className="px-5 py-4"><StatusBadge>{item.publicado ? 'Publicado' : 'Rascunho'}</StatusBadge></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEditor(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteItem(item)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhuma pergunta encontrada.</div> : null}

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

      <Dialog open={isEditorOpen} onOpenChange={(open) => { setIsEditorOpen(open); if (!open) { setEditorItem(null); setFormState(emptyForm); } }}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editorItem ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle><DialogDescription>Defina pergunta, resposta, categoria e publicação.</DialogDescription></DialogHeader>
          <form onSubmit={submitEditor} className="space-y-4">
            <label className="space-y-2 text-sm font-medium text-slate-700">Pergunta<input required value={formState.pergunta} onChange={(event) => setFormState((current) => ({ ...current, pergunta: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">Resposta<textarea required value={formState.resposta} onChange={(event) => setFormState((current) => ({ ...current, resposta: event.target.value }))} rows={5} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">Categoria<select value={formState.categoria} onChange={(event) => setFormState((current) => ({ ...current, categoria: event.target.value as AdminFaqCategory }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="voluntariado">Voluntariado</option><option value="doacoes">Doações</option><option value="sobre_projeto">Sobre o projeto</option></select></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Ordem<input type="number" min="0" max="32767" value={formState.ordem} onChange={(event) => setFormState((current) => ({ ...current, ordem: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={formState.publicado} onChange={(event) => setFormState((current) => ({ ...current, publicado: event.target.checked }))} /> Publicar pergunta</label>
            <DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setIsEditorOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir pergunta</DialogTitle><DialogDescription>Esta ação remove a pergunta do admin e da página pública se estiver publicada.</DialogDescription></DialogHeader>
          <p className="text-sm text-slate-700">Excluir definitivamente {deleteItem?.pergunta}?</p>
          <DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
