import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit3, Eye, Plus, RefreshCw, Search, Trash2, UserRoundCheck, UsersRound } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import {
  createAdminTeamMember,
  deleteAdminTeamMember,
  listAdminTeam,
  updateAdminTeamMember,
  type AdminTeamMember,
  type AdminTeamPayload,
} from '@/features/admin/api/adminTeamApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

type ActiveFilter = 'todos' | 'true' | 'false';

type TeamFormState = {
  nome: string;
  cargo: string;
  bio: string;
  foto_url: string;
  ordem: number;
  ativo: boolean;
  exibir_portal: boolean;
};

const activeOptions: Array<{ label: string; value: ActiveFilter }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' },
];

const PAGE_SIZE = 10;

const emptyForm: TeamFormState = {
  nome: '',
  cargo: '',
  bio: '',
  foto_url: '',
  ordem: 1,
  ativo: true,
  exibir_portal: false,
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function itemToForm(item: AdminTeamMember): TeamFormState {
  return {
    nome: item.nome,
    cargo: item.cargo || '',
    bio: item.bio || '',
    foto_url: item.foto_url || '',
    ordem: item.ordem,
    ativo: item.ativo,
    exibir_portal: item.exibir_portal,
  };
}

function formToPayload(form: TeamFormState): AdminTeamPayload {
  return {
    nome: form.nome.trim(),
    cargo: form.cargo.trim(),
    bio: form.bio.trim(),
    foto_url: form.foto_url.trim(),
    ordem: Number(form.ordem) || 0,
    ativo: form.ativo,
    exibir_portal: form.exibir_portal,
  };
}

export function EquipeAdmin() {
  const [items, setItems] = useState<AdminTeamMember[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('todos');
  const [selectedItem, setSelectedItem] = useState<AdminTeamMember | null>(null);
  const [editorItem, setEditorItem] = useState<AdminTeamMember | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminTeamMember | null>(null);
  const [formState, setFormState] = useState<TeamFormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editorErrorMessage, setEditorErrorMessage] = useState('');

  const loadTeam = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setEditorErrorMessage('');

    try {
      const response = await listAdminTeam({
        q: query.trim() || undefined,
        ativo: activeFilter === 'todos' ? undefined : activeFilter === 'true',
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
  }, [activeFilter, query, currentPage]);


  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadTeam();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadTeam]);

  const metrics = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.ativo).length,
    inactive: items.filter((item) => !item.ativo).length,
    withPhoto: items.filter((item) => item.foto_url).length,
    portal: items.filter((item) => item.ativo && item.exibir_portal).length,
  }), [items]);

  const resetFilters = () => {
    setQuery('');
    setActiveFilter('todos');
    setCurrentPage(1);
  };

  const openEditor = (item?: AdminTeamMember) => {
    setEditorItem(item ?? null);
    setFormState(item ? itemToForm(item) : { ...emptyForm, ordem: items.length + 1 });
    setIsEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
    setEditorErrorMessage('');
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditorItem(null);
    setFormState(emptyForm);
    setEditorErrorMessage('');
  };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    setEditorErrorMessage('');

    try {
      const payload = formToPayload(formState);
      const response = editorItem
        ? await updateAdminTeamMember(editorItem.id, payload)
        : await createAdminTeamMember(payload);

      setSuccessMessage(response.message);
      closeEditor();
      await loadTeam();
    } catch (error) {
      const message = apiErrorMessage(error);
      setEditorErrorMessage(message);
      setErrorMessage(message);
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
    setEditorErrorMessage('');

    try {
      const response = await deleteAdminTeamMember(deleteItem.id);
      setSuccessMessage(response.message);
      setDeleteItem(null);
      await loadTeam();
    } catch (error) {
      const message = apiErrorMessage(error);
      setEditorErrorMessage(message);
      setErrorMessage(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Portal público"
        title="Equipe"
        description="Gerencie os membros da página Sobre e escolha até 2 para a coordenação do Portal."
        actions={<button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Novo membro</button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Membros" value={metrics.total} icon={UsersRound} />
        <MetricCard label="Ativos" value={metrics.active} icon={UserRoundCheck} tone="emerald" />
        <MetricCard label="Inativos" value={metrics.inactive} icon={UsersRound} tone="amber" />
        <MetricCard label="Coordenação" value={`${metrics.portal}/2`} icon={UserRoundCheck} tone="cyan" />
      </div>

      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Membros cadastrados</h2>
              <p className="mt-1 text-sm text-slate-500">Somente membros ativos aparecem no portal público; marque até 2 para a coordenação do Portal do Voluntário.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ToolbarSearch placeholder="Buscar membro" value={query} onChange={(event) => setQuery(event.target.value)} />
              <button type="button" onClick={() => void loadTeam()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {activeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:col-span-2">Limpar filtros</button>
          </div>
        </div>

        {isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando equipe...</div> : null}

        {!isLoading && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Ordem</th><th className="px-5 py-3">Membro</th><th className="px-5 py-3">Cargo</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Portal</th><th className="px-5 py-3">Atualizado</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-slate-600">{item.ordem}</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-3">{item.foto_url ? <img src={item.foto_url} alt={item.nome} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700"><UsersRound className="h-5 w-5" /></div>}<div><p className="font-semibold text-slate-950">{item.nome}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{item.bio || 'Sem bio'}</p></div></div></td>
                    <td className="px-5 py-4 text-slate-600">{item.cargo || '-'}</td>
                    <td className="px-5 py-4"><StatusBadge>{item.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></td>
                    <td className="px-5 py-4"><StatusBadge tone={item.exibir_portal ? 'success' : 'neutral'}>{item.exibir_portal ? 'Coordenação' : 'Não'}</StatusBadge></td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(item.atualizado_em)}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedItem(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Visualizar"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openEditor(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteItem(item)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum membro encontrado.</div> : null}

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
          {selectedItem ? <><DialogHeader><DialogTitle>{selectedItem.nome}</DialogTitle><DialogDescription>{selectedItem.cargo || 'Membro da equipe'}</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-[8rem_1fr]">{selectedItem.foto_url ? <img src={selectedItem.foto_url} alt={selectedItem.nome} className="h-28 w-28 rounded-lg object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"><UsersRound className="h-8 w-8" /></div>}<div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700"><p><span className="text-slate-500">Status:</span> {selectedItem.ativo ? 'Ativo' : 'Inativo'}</p><p><span className="text-slate-500">Portal:</span> {selectedItem.exibir_portal ? 'Exibe na coordenação' : 'Não exibe na coordenação'}</p><p><span className="text-slate-500">Ordem:</span> {selectedItem.ordem}</p><p className="mt-3 whitespace-pre-wrap">{selectedItem.bio || 'Sem bio cadastrada.'}</p></div></div></> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editorItem ? 'Editar membro' : 'Novo membro'}</DialogTitle><DialogDescription>Defina os dados exibidos na página pública Sobre e marque se este membro aparece na coordenação do Portal.</DialogDescription></DialogHeader>
          {editorErrorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{editorErrorMessage}</div> : null}
          <form onSubmit={submitEditor} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Nome<input required value={formState.nome} onChange={(event) => setFormState((current) => ({ ...current, nome: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">Cargo<input value={formState.cargo} onChange={(event) => setFormState((current) => ({ ...current, cargo: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">Ordem<input type="number" min="0" max="32767" value={formState.ordem} onChange={(event) => setFormState((current) => ({ ...current, ordem: Number(event.target.value) }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">URL da foto<input value={formState.foto_url} onChange={(event) => setFormState((current) => ({ ...current, foto_url: event.target.value }))} placeholder="Opcional" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Bio<textarea value={formState.bio} onChange={(event) => setFormState((current) => ({ ...current, bio: event.target.value }))} rows={5} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={formState.ativo} onChange={(event) => setFormState((current) => ({ ...current, ativo: event.target.checked }))} /> Exibir no portal público</label>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={formState.exibir_portal} onChange={(event) => setFormState((current) => ({ ...current, exibir_portal: event.target.checked }))} /> Exibir na coordenação do Portal do Voluntário</label>
            <p className="text-xs text-slate-500 sm:col-span-2">A coordenação aceita no máximo 2 membros ativos marcados. Use a ordem para controlar a posição dos cards.</p>
            <DialogFooter className="sm:col-span-2"><button type="button" disabled={isActionLoading} onClick={closeEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir membro</DialogTitle><DialogDescription>Esta ação remove o membro do admin e da página pública se estiver ativo.</DialogDescription></DialogHeader>
          <p className="text-sm text-slate-700">Excluir definitivamente {deleteItem?.nome}?</p>
          <DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
