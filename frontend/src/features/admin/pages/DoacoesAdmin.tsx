import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CircleDollarSign, Edit3, Eye, HeartHandshake, MapPin, PackageCheck, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import {
  createAdminDonation,
  createAdminDonationLocation,
  deleteAdminDonation,
  deleteAdminDonationLocation,
  getAdminDonationSummary,
  listAdminDonationLocations,
  listAdminDonations,
  updateAdminDonation,
  updateAdminDonationLocation,
  type AdminDonation,
  type AdminDonationLocation,
  type AdminDonationLocationPayload,
  type AdminDonationPayload,
  type AdminDonationSummary,
  type DonationType,
} from '@/features/admin/api/adminDonationsApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

type Tab = 'doacoes' | 'locais';
type TypeFilter = DonationType | 'todos';
type ActiveFilter = 'todos' | 'true' | 'false';

type DonationFormState = {
  tipo: DonationType;
  descricao: string;
  quantidade: string;
  unidade: string;
  doador_nome: string;
  data_recebido: string;
};

type LocationFormState = {
  nome: string;
  endereco: string;
  horario: string;
  tipo: DonationType;
  ativo: boolean;
  exibir_home: boolean;
  ordem_home: string;
};

const typeOptions: Array<{ label: string; value: TypeFilter }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Alimentos', value: 'alimento' },
  { label: 'Roupas', value: 'roupa' },
  { label: 'Financeiro', value: 'dinheiro' },
  { label: 'Outros', value: 'outros' },
];

const activeOptions: Array<{ label: string; value: ActiveFilter }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Ativo', value: 'true' },
  { label: 'Inativo', value: 'false' },
];

const PAGE_SIZE = 10;

const emptyDonationForm: DonationFormState = {
  tipo: 'alimento',
  descricao: '',
  quantidade: '',
  unidade: '',
  doador_nome: '',
  data_recebido: new Date().toISOString().slice(0, 10),
};

const emptyLocationForm: LocationFormState = {
  nome: '',
  endereco: '',
  horario: '',
  tipo: 'outros',
  ativo: true,
  exibir_home: false,
  ordem_home: '',
};

const emptySummary: AdminDonationSummary = {
  monthDonations: 0,
  foodAmount: 0,
  moneyAmount: 0,
  moneyCount: 0,
  activeLocations: 0,
  homeLocations: 0,
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.';
}

function typeLabel(type: DonationType) {
  return typeOptions.find((option) => option.value === type)?.label || type;
}

function formatDate(value: string) {
  return new Date(String(value).slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatQuantity(item: AdminDonation) {
  if (!item.quantidade) {
    return '-';
  }

  const quantity = Number(item.quantidade);

  if (item.tipo === 'dinheiro' && Number.isFinite(quantity)) {
    return formatCurrency(quantity);
  }

  const formatted = Number.isFinite(quantity) ? quantity.toLocaleString('pt-BR') : item.quantidade;
  return [formatted, item.unidade].filter(Boolean).join(' ');
}

function donationToForm(item: AdminDonation): DonationFormState {
  return {
    tipo: item.tipo,
    descricao: item.descricao || '',
    quantidade: item.quantidade || '',
    unidade: item.unidade || '',
    doador_nome: item.doador_nome || '',
    data_recebido: String(item.data_recebido).slice(0, 10),
  };
}

function locationToForm(item: AdminDonationLocation): LocationFormState {
  return {
    nome: item.nome,
    endereco: item.endereco,
    horario: item.horario || '',
    tipo: item.tipo,
    ativo: item.ativo,
    exibir_home: item.exibir_home,
    ordem_home: item.ordem_home ? String(item.ordem_home) : '',
  };
}

function donationPayload(form: DonationFormState): AdminDonationPayload {
  return {
    tipo: form.tipo,
    descricao: form.descricao.trim(),
    quantidade: form.quantidade.trim(),
    unidade: form.unidade.trim(),
    doador_nome: form.doador_nome.trim(),
    data_recebido: form.data_recebido,
  };
}

function locationPayload(form: LocationFormState): AdminDonationLocationPayload {
  return {
    nome: form.nome.trim(),
    endereco: form.endereco.trim(),
    horario: form.horario.trim(),
    tipo: form.tipo,
    ativo: form.ativo,
    exibir_home: form.exibir_home,
    ordem_home: Number(form.ordem_home || 0),
  };
}

export function DoacoesAdmin() {
  const [tab, setTab] = useState<Tab>('doacoes');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('todos');
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [locations, setLocations] = useState<AdminDonationLocation[]>([]);
  const [summary, setSummary] = useState<AdminDonationSummary>(emptySummary);
  const [selectedDonation, setSelectedDonation] = useState<AdminDonation | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<AdminDonationLocation | null>(null);
  const [editingDonation, setEditingDonation] = useState<AdminDonation | null>(null);
  const [editingLocation, setEditingLocation] = useState<AdminDonationLocation | null>(null);
  const [deleteDonationItem, setDeleteDonationItem] = useState<AdminDonation | null>(null);
  const [deleteLocationItem, setDeleteLocationItem] = useState<AdminDonationLocation | null>(null);
  const [donationForm, setDonationForm] = useState<DonationFormState>(emptyDonationForm);
  const [locationForm, setLocationForm] = useState<LocationFormState>(emptyLocationForm);
  const [isDonationEditorOpen, setIsDonationEditorOpen] = useState(false);
  const [isLocationEditorOpen, setIsLocationEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [donationsPage, setDonationsPage] = useState(1);
  const [donationsTotalPages, setDonationsTotalPages] = useState(1);
  const [locationsPage, setLocationsPage] = useState(1);
  const [locationsTotalPages, setLocationsTotalPages] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const commonParams = {
        q: query.trim() || undefined,
        tipo: typeFilter === 'todos' ? undefined : typeFilter,
        limit: PAGE_SIZE,
      };

      const [donationsResponse, locationsResponse, summaryResponse] = await Promise.all([
        listAdminDonations({
          ...commonParams,
          page: donationsPage,
        }),
        listAdminDonationLocations({
          ...commonParams,
          page: locationsPage,
          ativo: activeFilter === 'todos' ? undefined : activeFilter === 'true',
        }),
        getAdminDonationSummary(),
      ]);

      setDonations(donationsResponse.data);
      setLocations(locationsResponse.data);
      setSummary(summaryResponse.data);
      setDonationsTotalPages(Math.max(1, donationsResponse.meta.totalPages || 1));
      setLocationsTotalPages(Math.max(1, locationsResponse.meta.totalPages || 1));
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, donationsPage, locationsPage, query, typeFilter]);

  useEffect(() => {
    setDonationsPage(1);
    setLocationsPage(1);
  }, [activeFilter, query, typeFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const metrics = useMemo(() => ({
    monthDonations: summary.monthDonations,
    foodAmount: summary.foodAmount,
    moneyAmount: summary.moneyAmount,
    moneyCount: summary.moneyCount,
    activeLocations: summary.activeLocations,
    homeLocations: summary.homeLocations,
  }), [summary]);

  const currentPage = tab === 'doacoes' ? donationsPage : locationsPage;
  const totalPages = tab === 'doacoes' ? donationsTotalPages : locationsTotalPages;
  const setCurrentPage = tab === 'doacoes' ? setDonationsPage : setLocationsPage;

  const resetFilters = () => {
    setQuery('');
    setTypeFilter('todos');
    setActiveFilter('todos');
    setDonationsPage(1);
    setLocationsPage(1);
  };

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    resetFilters();
  };

  const openDonationEditor = (item?: AdminDonation) => {
    setEditingDonation(item || null);
    setDonationForm(item ? donationToForm(item) : { ...emptyDonationForm, data_recebido: new Date().toISOString().slice(0, 10) });
    setIsDonationEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const openLocationEditor = (item?: AdminDonationLocation) => {
    setEditingLocation(item || null);
    setLocationForm(item ? locationToForm(item) : emptyLocationForm);
    setIsLocationEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const closeDonationEditor = () => {
    setIsDonationEditorOpen(false);
    setEditingDonation(null);
    setDonationForm(emptyDonationForm);
  };

  const closeLocationEditor = () => {
    setIsLocationEditorOpen(false);
    setEditingLocation(null);
    setLocationForm(emptyLocationForm);
  };

  const submitDonation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = editingDonation
        ? await updateAdminDonation(editingDonation.id, donationPayload(donationForm))
        : await createAdminDonation(donationPayload(donationForm));

      setSuccessMessage(response.message);
      closeDonationEditor();
      setTab('doacoes');
      setDonationsPage(1);
      await loadData();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const submitLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = editingLocation
        ? await updateAdminDonationLocation(editingLocation.id, locationPayload(locationForm))
        : await createAdminDonationLocation(locationPayload(locationForm));

      setSuccessMessage(response.message);
      closeLocationEditor();
      setTab('locais');
      setLocationsPage(1);
      await loadData();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const runDeleteDonation = async () => {
    if (!deleteDonationItem) {
      return;
    }

    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await deleteAdminDonation(deleteDonationItem.id);
      setSuccessMessage(response.message);
      setDeleteDonationItem(null);
      await loadData();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const runDeleteLocation = async () => {
    if (!deleteLocationItem) {
      return;
    }

    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await deleteAdminDonationLocation(deleteLocationItem.id);
      setSuccessMessage(response.message);
      setDeleteLocationItem(null);
      await loadData();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Arrecadação"
        title="Doações"
        description="Registre doações recebidas e gerencie os pontos de entrega exibidos no portal público."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openLocationEditor()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <MapPin className="h-4 w-4" />Novo local
            </button>
            <button type="button" onClick={() => openDonationEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              <Plus className="h-4 w-4" />Nova doação
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Doações no mês" value={metrics.monthDonations} icon={HeartHandshake} />
        <MetricCard label="Financeiro" value={formatCurrency(metrics.moneyAmount)} detail={metrics.moneyCount ? metrics.moneyCount + ' doação(ões)' : 'Sem lançamentos'} icon={CircleDollarSign} tone="emerald" />
        <MetricCard label="Alimentos" value={metrics.foodAmount ? metrics.foodAmount.toLocaleString('pt-BR') : '-'} icon={PackageCheck} tone="amber" />
        <MetricCard label="Locais ativos" value={metrics.activeLocations} icon={MapPin} tone="cyan" />
        <MetricCard label="Na home" value={metrics.homeLocations} icon={MapPin} tone="slate" />
      </div>

      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Controle de doações</h2>
              <p className="mt-1 text-sm text-slate-500">Locais ativos aparecem em /doacoes. A home exibe os 2 primeiros locais ativos marcados para home.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ToolbarSearch placeholder={tab === 'doacoes' ? 'Buscar doação' : 'Buscar local'} value={query} onChange={(event) => setQuery(event.target.value)} />
              <button type="button" onClick={() => void loadData()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" />Atualizar
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => switchTab('doacoes')} className={'rounded-md px-3 py-2 text-sm font-semibold ' + (tab === 'doacoes' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-600 hover:text-slate-950')}>Doações</button>
              <button type="button" onClick={() => switchTab('locais')} className={'rounded-md px-3 py-2 text-sm font-semibold ' + (tab === 'locais' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-600 hover:text-slate-950')}>Locais</button>
            </div>
            <div className="grid flex-1 gap-3 md:grid-cols-3 lg:max-w-2xl">
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {tab === 'locais' ? (
                <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
                  {activeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">Status: registrada</div>
              )}
              <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button>
            </div>
          </div>
        </div>

        {isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando registros...</div> : null}

        {!isLoading && tab === 'doacoes' && donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Descrição</th><th className="px-5 py-3">Quantidade</th><th className="px-5 py-3">Origem</th><th className="px-5 py-3">Data</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-950">{typeLabel(donation.tipo)}</td>
                    <td className="px-5 py-4 text-slate-600">{donation.descricao || '-'}</td>
                    <td className="px-5 py-4 text-slate-600">{formatQuantity(donation)}</td>
                    <td className="px-5 py-4 text-slate-600">{donation.doador_nome || '-'}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(donation.data_recebido)}</td>
                    <td className="px-5 py-4"><StatusBadge>Registrada</StatusBadge></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedDonation(donation)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Ver doação"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openDonationEditor(donation)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar doação"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteDonationItem(donation)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir doação"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && tab === 'locais' && locations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Local</th><th className="px-5 py-3">Endereço</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Horário</th><th className="px-5 py-3">Home</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-950">{location.nome}</td>
                    <td className="px-5 py-4 text-slate-600">{location.endereco}</td>
                    <td className="px-5 py-4 text-slate-600">{typeLabel(location.tipo)}</td>
                    <td className="px-5 py-4 text-slate-600">{location.horario || '-'}</td>
                    <td className="px-5 py-4"><StatusBadge>{location.exibir_home ? 'Home #' + (location.ordem_home || 0) : 'Não'}</StatusBadge></td>
                    <td className="px-5 py-4"><StatusBadge>{location.ativo ? 'Ativo' : 'Inativo'}</StatusBadge></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedLocation(location)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Ver local"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openLocationEditor(location)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar local"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteLocationItem(location)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir local"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && (tab === 'doacoes' ? donations : locations).length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum registro encontrado.</div> : null}

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

      <Dialog open={Boolean(selectedDonation)} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-xl">
          {selectedDonation ? <><DialogHeader><DialogTitle>{typeLabel(selectedDonation.tipo)}</DialogTitle><DialogDescription>{selectedDonation.descricao || 'Doação registrada'}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Quantidade:</span> {formatQuantity(selectedDonation)}</p><p><span className="text-slate-500">Origem:</span> {selectedDonation.doador_nome || '-'}</p><p><span className="text-slate-500">Data:</span> {formatDate(selectedDonation.data_recebido)}</p><p><span className="text-slate-500">Status:</span> Registrada</p></div></> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedLocation)} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-xl">
          {selectedLocation ? <><DialogHeader><DialogTitle>{selectedLocation.nome}</DialogTitle><DialogDescription>{typeLabel(selectedLocation.tipo)}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm"><p><span className="text-slate-500">Endereço:</span> {selectedLocation.endereco}</p><p><span className="text-slate-500">Horário:</span> {selectedLocation.horario || '-'}</p><p><span className="text-slate-500">Status:</span> {selectedLocation.ativo ? 'Ativo' : 'Inativo'}</p><p><span className="text-slate-500">Home:</span> {selectedLocation.exibir_home ? 'Sim, ordem ' + (selectedLocation.ordem_home || 0) : 'Não'}</p></div></> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isDonationEditorOpen} onOpenChange={(open) => { if (!open) closeDonationEditor(); }}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingDonation ? 'Editar doação' : 'Registro de doação'}</DialogTitle><DialogDescription>Registre a entrada de itens, valores ou materiais recebidos.</DialogDescription></DialogHeader>
          <form onSubmit={submitDonation} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">Tipo<select value={donationForm.tipo} onChange={(event) => { const tipo = event.target.value as DonationType; setDonationForm((current) => ({ ...current, tipo, unidade: tipo === 'dinheiro' && !current.unidade ? 'R$' : current.unidade })); }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="alimento">Alimentos</option><option value="roupa">Roupas</option><option value="dinheiro">Financeiro</option><option value="outros">Outros</option></select></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Data<input required type="date" value={donationForm.data_recebido} onChange={(event) => setDonationForm((current) => ({ ...current, data_recebido: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Descrição<input value={donationForm.descricao} onChange={(event) => setDonationForm((current) => ({ ...current, descricao: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Quantidade ou valor<input inputMode="decimal" value={donationForm.quantidade} onChange={(event) => setDonationForm((current) => ({ ...current, quantidade: event.target.value }))} placeholder="Ex: 20 ou 150,00" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Unidade<input value={donationForm.unidade} onChange={(event) => setDonationForm((current) => ({ ...current, unidade: event.target.value }))} placeholder="Ex: kg, un, R$" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Doador/origem<input value={donationForm.doador_nome} onChange={(event) => setDonationForm((current) => ({ ...current, doador_nome: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            </div>
            <DialogFooter><button type="button" disabled={isActionLoading} onClick={closeDonationEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLocationEditorOpen} onOpenChange={(open) => { if (!open) closeLocationEditor(); }}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingLocation ? 'Editar local de doação' : 'Local de entrega/coleta'}</DialogTitle><DialogDescription>Locais ativos ficam disponíveis na página pública de doações. A home usa apenas os 2 primeiros marcados.</DialogDescription></DialogHeader>
          <form onSubmit={submitLocation} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Nome<input required value={locationForm.nome} onChange={(event) => setLocationForm((current) => ({ ...current, nome: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Endereço<input required value={locationForm.endereco} onChange={(event) => setLocationForm((current) => ({ ...current, endereco: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Tipo<select value={locationForm.tipo} onChange={(event) => setLocationForm((current) => ({ ...current, tipo: event.target.value as DonationType }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="outros">Ponto de coleta</option><option value="alimento">Alimentos</option><option value="roupa">Roupas</option><option value="dinheiro">Financeiro</option></select></label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Status<select value={locationForm.ativo ? 'true' : 'false'} onChange={(event) => setLocationForm((current) => ({ ...current, ativo: event.target.value === 'true' }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={locationForm.exibir_home} onChange={(event) => setLocationForm((current) => ({ ...current, exibir_home: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700" />Exibir na home</label>
              <label className="space-y-2 text-sm font-medium text-slate-700">Ordem na home<input type="number" min="0" max="9999" value={locationForm.ordem_home} onChange={(event) => setLocationForm((current) => ({ ...current, ordem_home: event.target.value }))} placeholder="Ex: 1" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Horário<input value={locationForm.horario} onChange={(event) => setLocationForm((current) => ({ ...current, horario: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            </div>
            <DialogFooter><button type="button" disabled={isActionLoading} onClick={closeLocationEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteDonationItem)} onOpenChange={(open) => !open && setDeleteDonationItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir doação</DialogTitle><DialogDescription>Esta ação remove o registro do histórico administrativo.</DialogDescription></DialogHeader>
          <p className="text-sm text-slate-700">Excluir definitivamente {deleteDonationItem?.descricao || typeLabel(deleteDonationItem?.tipo || 'outros')}?</p>
          <DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteDonationItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDeleteDonation()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteLocationItem)} onOpenChange={(open) => !open && setDeleteLocationItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir local</DialogTitle><DialogDescription>Esta ação remove o local da área administrativa e do portal público se estiver ativo.</DialogDescription></DialogHeader>
          <p className="text-sm text-slate-700">Excluir definitivamente {deleteLocationItem?.nome}?</p>
          <DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteLocationItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDeleteLocation()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
